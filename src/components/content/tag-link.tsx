import { Link } from '@/i18n/navigation'
import { Badge, toneFor } from '@/components/ui/badge'
import { tagSlug } from '@/lib/search'

/**
 * A tag/tech chip that navigates to everything sharing that topic.
 *
 * Note this must never be rendered inside another anchor — nested links are
 * invalid HTML. Cards that are themselves links render plain `Badge` instead.
 */
export function TagLink({ tag, className }: { tag: string; className?: string }) {
  return (
    <Link
      href={`/topics/${tagSlug(tag)}`}
      className={className}
      title={tag}
    >
      <Badge
        tone={toneFor(tag)}
        className="cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--shadow)]"
      >
        {tag}
      </Badge>
    </Link>
  )
}

export function TagLinkList({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null
  return (
    <ul className={className ?? 'flex flex-wrap gap-2'}>
      {tags.map((tag) => (
        <li key={tag}>
          <TagLink tag={tag} />
        </li>
      ))}
    </ul>
  )
}
