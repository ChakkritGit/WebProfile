import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'brand' | 'mint' | 'sun' | 'violet' | 'sky'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface text-ink-soft',
  brand: 'bg-brand-soft text-brand-strong',
  mint: 'bg-surface text-ink-soft',
  sun: 'bg-surface text-ink-soft',
  violet: 'bg-surface text-ink-soft',
  sky: 'bg-surface text-ink-soft',
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
  icon,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  /** Leading mark, e.g. a technology logo. */
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border border-line px-2 py-0.5',
        'font-mono text-[0.7rem] tracking-[0.04em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
