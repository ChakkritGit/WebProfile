'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink border-brand hover:bg-transparent hover:text-brand-strong hover:border-line-strong',
  secondary: 'bg-surface text-ink hover:border-line-strong hover:text-brand-strong',
  outline: 'bg-transparent text-ink hover:border-line-strong hover:text-brand-strong',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-2',
  danger: 'bg-[#d11f1f] text-white border-[#d11f1f]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-[0.95rem] gap-2.5',
}

const base =
  'inline-flex items-center justify-center border border-line font-display font-medium uppercase tracking-[0.08em] ' +
  'transition-colors duration-150 ' +
  'whitespace-nowrap select-none disabled:pointer-events-none ' +
  // A flat grey reads as "not available" far more clearly than a faded version
  // of the enabled colour.
  'disabled:border-line-soft disabled:bg-surface-2 disabled:text-muted'

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    base,
    sizes[size],
    variants[variant],
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Shows a spinner and disables the button. */
  loading?: boolean
  loadingLabel?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classes(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4 shrink-0" label={loadingLabel} />}
      {children}
    </button>
  )
}

interface ButtonLinkProps {
  href: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
  /** Set for links leaving the site — adds target/rel and skips locale routing. */
  external?: boolean
  download?: boolean
  'aria-label'?: string
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  external,
  download,
  ...rest
}: ButtonLinkProps) {
  const cls = classes(variant, size, className)

  if (external || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a
        href={href}
        className={cls}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...(download ? { download: '' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  )
}
