import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'surface' | 'brand' | 'mint' | 'sun' | 'violet' | 'sky'

const toneClasses: Record<Tone, string> = {
  surface: 'bg-surface',
  brand: 'bg-brand-soft',
  // The cartoon set had a candy colour for each of these. Here there is one
  // accent, so the rest are the same quiet panel.
  mint: 'bg-surface-2',
  sun: 'bg-surface-2',
  violet: 'bg-surface-2',
  sky: 'bg-surface-2',
}

interface StickerCardProps {
  as?: ElementType
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
  children: ReactNode
}

/** A panel: 1px rule, square corners; `interactive` turns the rule blue on hover. */
export function StickerCard({
  as: Tag = 'div',
  tone = 'surface',
  size = 'md',
  interactive = false,
  className,
  children,
}: StickerCardProps) {
  return (
    <Tag
      className={cn(
        size === 'sm' ? 'sticker-sm' : size === 'lg' ? 'sticker-lg' : 'sticker',
        toneClasses[tone],
        interactive && 'sticker-hover',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
