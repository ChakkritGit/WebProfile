'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StickerCard } from '@/components/ui/sticker-card'
import { Button } from '@/components/ui/button'
import { MailIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface Errors {
  name?: string
  email?: string
  message?: string
}

/**
 * Composes a mailto: draft rather than posting to a server.
 *
 * A real inbox needs either a third-party mail service or a backend with
 * spam protection; handing the message to the visitor's own mail client keeps
 * the site free of both, and the address is already public in the footer.
 */
export function ContactForm({ email }: { email: string }) {
  const t = useTranslations('contact')
  const [values, setValues] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  const field = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const next: Errors = {}
    if (!values.name.trim()) next.name = t('formErrorName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = t('formErrorEmail')
    if (!values.message.trim()) next.message = t('formErrorMessage')

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const subject = `[Portfolio] ${values.name.trim()}`
    const body = `${values.message.trim()}\n\n— ${values.name.trim()} <${values.email.trim()}>`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  const inputClass = (invalid?: string) =>
    cn(
      'w-full rounded-xl border-2 bg-paper px-4 py-3 text-base outline-none transition-colors',
      'placeholder:text-muted/70',
      invalid ? 'border-[#e0362f]' : 'border-line-soft focus:border-line',
    )

  return (
    <StickerCard size="lg" className="p-6 sm:p-8">
      <h2 className="text-2xl">{t('formTitle')}</h2>
      <p className="text-muted mt-2 text-sm">{t('formHint')}</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="cf-name" className="font-display mb-1.5 block text-sm font-semibold">
            {t('formName')}
          </label>
          <input
            id="cf-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'cf-name-error' : undefined}
            className={inputClass(errors.name)}
            {...field('name')}
          />
          {errors.name && (
            <p id="cf-name-error" className="mt-1.5 text-sm text-[#e0362f]">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-email" className="font-display mb-1.5 block text-sm font-semibold">
            {t('formEmail')}
          </label>
          <input
            id="cf-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'cf-email-error' : undefined}
            className={inputClass(errors.email)}
            {...field('email')}
          />
          {errors.email && (
            <p id="cf-email-error" className="mt-1.5 text-sm text-[#e0362f]">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-message" className="font-display mb-1.5 block text-sm font-semibold">
            {t('formMessage')}
          </label>
          <textarea
            id="cf-message"
            rows={6}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'cf-message-error' : undefined}
            className={cn(inputClass(errors.message), 'resize-y')}
            {...field('message')}
          />
          {errors.message && (
            <p id="cf-message-error" className="mt-1.5 text-sm text-[#e0362f]">
              {errors.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full">
          <MailIcon className="size-4" />
          {t('formSubmit')}
        </Button>

        <p aria-live="polite" className="text-center text-sm">
          {sent && <span className="text-mint font-semibold">{t('formSuccess')}</span>}
        </p>
      </form>
    </StickerCard>
  )
}
