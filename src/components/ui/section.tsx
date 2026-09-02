import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/motion/reveal'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>
}

export function Section({
  children,
  className,
  contentClassName,
  id,
}: {
  children: ReactNode
  /** Applied to the <section> — backgrounds, borders, vertical padding. */
  className?: string
  /**
   * Applied to the inner container. Layout classes for the children belong
   * here: the section's only child is the container, so a `space-y-*` passed
   * through `className` silently does nothing.
   */
  contentClassName?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('py-14 sm:py-20', className)}>
      <Container className={contentClassName}>{children}</Container>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <Reveal className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-brand font-display mb-2 text-sm font-bold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {description && <p className="text-muted mt-3 text-base sm:text-lg">{description}</p>}
      </div>
      {action}
    </Reveal>
  )
}

/** Top-of-page header used by every non-home route. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="border-line-soft paper-grain bg-paper-alt relative overflow-hidden border-b">
      <Container className="relative z-10 py-12 sm:py-16">
        <Reveal>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
          {description && (
            <p className="text-muted mt-4 max-w-2xl text-lg text-pretty">{description}</p>
          )}
          {children}
        </Reveal>
      </Container>
    </div>
  )
}
