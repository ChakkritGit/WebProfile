import { Link } from '@/i18n/navigation'
import { Badge, toneFor } from '@/components/ui/badge'
import { TechIcon } from '@/components/brand/tech-icons'
import { tagSlug } from '@/lib/search'
import { cn } from '@/lib/utils'

/**
 * A tag/tech chip that navigates to everything sharing that topic.
 *
 * Note this must never be rendered inside another anchor - nested links are
 * invalid HTML. Cards that are themselves links render plain `Badge` instead.
 */
export function TagLink({ tag, className }: { tag: string; className?: string }) {
  return (
    <Link
      href={`/topics/${tagSlug(tag)}`}
      // top-aligned, not on the baseline: a badge's baseline is its first item's,
      // which for an iconned tag is the icon's foot, so those rode higher
      className={cn('inline-flex align-top', className)}
      title={tag}
    >
      <Badge
        tone={toneFor(tag)}
        icon={<TechIcon name={tag} className="size-3.5 shrink-0" />}
        className="cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
      >
        {tag}
      </Badge>
    </Link>
  )
}

