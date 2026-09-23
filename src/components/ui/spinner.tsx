import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex', className)}>
      {label && <span className="sr-only">{label}</span>}
      <LoaderCircle aria-hidden className="size-full motion-safe:animate-spin" />
    </span>
  )
}
