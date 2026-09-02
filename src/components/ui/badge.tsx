import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'brand' | 'mint' | 'sun' | 'violet' | 'sky'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-soft',
  brand: 'bg-brand-soft text-ink',
  mint: 'bg-mint-soft text-ink',
  sun: 'bg-sun-soft text-ink',
  violet: 'bg-violet-soft text-ink',
  sky: 'bg-sky-soft text-ink',
}

/** Deterministic tone per label so a given tag keeps the same colour everywhere. */
const cycle: Tone[] = ['mint', 'sun', 'violet', 'sky', 'brand']
export function toneFor(label: string): Tone {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  return cycle[hash % cycle.length]
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-1',
        'font-display text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
