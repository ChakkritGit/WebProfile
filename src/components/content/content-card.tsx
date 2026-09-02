import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Badge, toneFor } from '@/components/ui/badge'
import { TechIcon } from '@/components/brand/tech-icons'
import { ArrowRightIcon, ClockIcon, EyeIcon } from '@/components/icons'
import { formatDate } from '@/lib/utils'
import type { PostRecord, ProjectRecord } from '@/lib/content-types'
import { cn } from '@/lib/utils'

const ACCENTS = ['bg-mint-soft', 'bg-sun-soft', 'bg-violet-soft', 'bg-sky-soft', 'bg-brand-soft']

function CoverArt({ record, index }: { record: { coverImage: string | null; title: string }; index: number }) {
  if (record.coverImage) {
    return (
      <Image
        src={record.coverImage}
        alt=""
        width={640}
        height={360}
        className="size-full object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    )
  }
  // No cover uploaded → a generated initial tile keeps the grid rhythm intact.
  return (
    <div className={cn('grid size-full place-items-center', ACCENTS[index % ACCENTS.length])}>
      <span className="font-display text-ink/25 text-6xl font-extrabold select-none">
        {record.title.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

export async function PostCard({
  post,
  index = 0,
  locale,
}: {
  post: PostRecord
  index?: number
  locale: string
}) {
  const t = await getTranslations('common')

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="sticker sticker-hover bg-surface group flex h-full flex-col overflow-hidden no-underline"
    >
      <div className="border-line relative aspect-[16/9] overflow-hidden border-b-2">
        <CoverArt record={post} index={index} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {post.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} tone={toneFor(tag)}>
              {tag}
            </Badge>
          ))}
        </div>

        <h3 className="text-lg leading-snug font-bold sm:text-xl">{post.title}</h3>

        {post.summary && (
          <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{post.summary}</p>
        )}

        <div className="text-muted mt-auto flex items-center gap-3 pt-4 text-xs">
          <time dateTime={post.publishedAt ?? undefined}>
            {formatDate(post.publishedAt, locale)}
          </time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {t('minuteRead', { minutes: post.readingMinutes })}
          </span>
          {post.views > 0 && (
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="size-3.5" />
              {post.views}
            </span>
          )}
          <ArrowRightIcon className="text-brand ms-auto size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

export async function ProjectCard({
  project,
  index = 0,
}: {
  project: ProjectRecord
  index?: number
}) {
  const t = await getTranslations('projects')
  const tCommon = await getTranslations('common')

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="sticker sticker-hover bg-surface group flex h-full flex-col overflow-hidden no-underline"
    >
      <div className="border-line relative aspect-[16/10] overflow-hidden border-b-2">
        <CoverArt record={project} index={index} />
        {project.year && (
          <span className="border-line bg-paper font-display absolute end-3 top-3 rounded-full border-2 px-2.5 py-1 text-xs font-bold">
            {project.year}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg leading-snug font-bold sm:text-xl">{project.title}</h3>

        {project.role && (
          <p className="text-brand font-display mt-1 text-xs font-semibold">
            {t('roleLabel')}: {project.role}
          </p>
        )}

        {project.summary && (
          <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{project.summary}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((tech) => (
            <Badge
              key={tech}
              tone={toneFor(tech)}
              icon={<TechIcon name={tech} className="size-3.5 shrink-0" />}
            >
              {tech}
            </Badge>
          ))}
          {project.stack.length > 4 && <Badge>+{project.stack.length - 4}</Badge>}
        </div>

        <div className="text-brand font-display mt-auto flex items-center gap-2 pt-4 text-sm font-semibold">
          <span>{tCommon('viewProject')}</span>
          <ArrowRightIcon className="ms-auto size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
