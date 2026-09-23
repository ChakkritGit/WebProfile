import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { Badge, toneFor } from '@/components/ui/badge'
import { TechIcon } from '@/components/brand/tech-icons'
import { ArrowRightIcon, ClockIcon, EyeIcon } from '@/components/icons'
import { optimisable } from '@/lib/supabase'
import { dayOfMonth, formatDate, formatMonthYear } from '@/lib/utils'
import type { PostRecord, ProjectRecord } from '@/lib/content-types'

function CoverArt({
  record,
  index,
  priority = false,
}: {
  record: { coverImage: string | null; title: string }
  index: number
  priority?: boolean
}) {
  if (record.coverImage) {
    return (
      <Image
        src={record.coverImage}
        alt=""
        width={640}
        height={360}
        // Our own uploads go through the optimiser — a card slot is 640px wide
        // and the originals are ~600KB. Anything else was pasted in as a link to
        // a host outside next.config's remotePatterns, where it answers 400.
        unoptimized={!optimisable(record.coverImage)}
        // The first row of a listing is the LCP element; lazy-loading it is what
        // made it late.
        priority={priority}
        className="size-full object-cover"
        // The card is narrower than the viewport it sits in — one column inside
        // the container's padding, then two, then three — and `100vw` had the
        // browser fetching a step larger than the slot at every width.
        sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 2rem), 368px"
      />
    )
  }
  // No cover uploaded → the initial on the page grid keeps the rhythm intact.
  return (
    <div className="bg-brand-soft relative grid size-full place-items-center">
      <div aria-hidden className="star-grid absolute inset-0" />
      <span className="text-brand-strong relative font-mono text-6xl select-none">
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
  )
}

export async function PostCard({
  post,
  index = 0,
  locale,
  priority = false,
}: {
  post: PostRecord
  index?: number
  locale: string
  /** Set on the cards a listing paints above the fold. */
  priority?: boolean
}) {
  const t = await getTranslations('common')

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="sticker sticker-hover bg-surface group flex h-full flex-col overflow-hidden no-underline"
    >
      <div className="duotone border-line relative aspect-[16/9] overflow-hidden border-b">
        <CoverArt record={post} index={index} priority={priority} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {post.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              tone={toneFor(tag)}
              icon={<TechIcon name={tag} className="size-3.5 shrink-0" />}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <h3 lang={post.locale} className="group-hover:text-brand-strong text-2xl leading-tight transition-colors sm:text-[1.7rem]">
          {post.title}
        </h3>

        {post.summary && (
          <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{post.summary}</p>
        )}

        <div className="text-muted mt-auto flex items-center gap-3 pt-4 font-mono text-[0.7rem] uppercase">
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
          <ArrowRightIcon className="text-brand-strong ms-auto size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

export async function ProjectCard({
  project,
  index = 0,
  priority = false,
}: {
  project: ProjectRecord
  index?: number
  /** Set on the cards a listing paints above the fold. */
  priority?: boolean
}) {
  const t = await getTranslations('projects')
  const tCommon = await getTranslations('common')

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="sticker sticker-hover bg-surface group flex h-full flex-col overflow-hidden no-underline"
    >
      <div className="duotone border-line relative aspect-[16/10] overflow-hidden border-b">
        <CoverArt record={project} index={index} priority={priority} />
        {project.year && (
          <span className="bg-brand text-brand-ink absolute end-0 top-0 z-10 px-2 py-1 font-mono text-xs">
            {project.year}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 lang={project.locale} className="group-hover:text-brand-strong text-2xl leading-tight transition-colors sm:text-[1.7rem]">
          {project.title}
        </h3>

        {project.role && (
          <p className="text-brand-strong mt-1.5 font-mono text-[0.7rem] uppercase">
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

        <div className="text-brand-strong mt-auto flex items-center gap-2 pt-4 font-mono text-xs uppercase">
          <span>{tCommon('viewProject')}</span>
          <ArrowRightIcon className="ms-auto size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

/**
 * An article as one row of a dated list: the day large in mono on the left,
 * the title and summary beside it. The home page's feed, where a grid of
 * covers would make every entry look like a project.
 */
export async function PostRow({ post, locale }: { post: PostRecord; locale: string }) {
  const t = await getTranslations('common')
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group border-line hover:bg-surface grid grid-cols-[4.5rem_1fr] gap-4 border-b py-6 no-underline transition-colors sm:grid-cols-[7rem_1fr] sm:gap-8 sm:px-4"
    >
      <time dateTime={post.publishedAt ?? undefined} className="text-center">
        <span className="text-brand-strong block font-mono text-4xl leading-none sm:text-5xl">
          {dayOfMonth(post.publishedAt)}
        </span>
        <span className="text-muted mt-2 block font-mono text-[0.7rem] uppercase">
          {formatMonthYear(post.publishedAt, locale)}
        </span>
      </time>
      <div className="min-w-0">
        <h3 lang={post.locale} className="group-hover:text-brand-strong text-2xl leading-tight transition-colors sm:text-3xl">
          {post.title}
        </h3>
        {post.summary && (
          <p className="text-muted mt-2 line-clamp-2 leading-relaxed">{post.summary}</p>
        )}
        <div className="text-muted mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] uppercase">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {t('minuteRead', { minutes: post.readingMinutes })}
          </span>
        </div>
      </div>
    </Link>
  )
}
