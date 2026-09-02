import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'surface' | 'brand' | 'mint' | 'sun' | 'violet' | 'sky'

const toneClasses: Record<Tone, string> = {
  surface: 'bg-surface',
  brand: 'bg-brand-soft',
  mint: 'bg-mint-soft',
  sun: 'bg-sun-soft',
  violet: 'bg-violet-soft',
  sky: 'bg-sky-soft',
}

interface StickerCardProps {
  as?: ElementType
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
  children: ReactNode
}

/** The signature surface: ink outline + hard offset shadow. */
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
