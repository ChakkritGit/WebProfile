'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { plain } from '@/lib/assistant-client'
import { isTon, TON_EVENT, TON_HASH } from '@/lib/easter-egg'
import { useRouter } from '@/i18n/navigation'
import { useAssistant } from './use-assistant'
import type { Engine } from './engine/engine'

/** What the chat needs from whoever it speaks for: the globe's engine, or the paper scroll. */
export type Actor = Pick<Engine, 'setAct' | 'wave' | 'anchor'>

/**
 * The screen Mr. Worldwide shows when you click him: a native modal dialog
 * (focus stays inside, Esc closes, focus returns to him). The globe projects it
 * as an amber terminal; the paper scroll unrolls it as a sheet of paper
 * (`variant="paper"`). Either way he acts the conversation out while it runs.
 */
export function HologramChat({
  open,
  onClose,
  engine,
  variant = 'hologram',
}: {
  open: boolean
  onClose(): void
  engine: Actor | null
  variant?: 'hologram' | 'paper'
}) {
  const t = useTranslations('assistant')
  const locale = useLocale()
  const lang = locale === 'th' ? 'th' : 'en'
  const { messages, status, error, send, retry, items } = useAssistant(lang)
  const dialog = useRef<HTMLDialogElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const router = useRouter()
  // The terminal's prompt and cursor belong to the hologram, not to paper.
  const prompt = variant === 'paper' ? '' : '> '

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      // Projected above him: centred on his head, kept inside the viewport.
      const x = engine?.anchor().x ?? innerWidth / 2
      d.style.setProperty('--mw-x', `${Math.round(x)}px`)
      d.showModal()
      // Straight to the question: showModal would otherwise focus the first control, the close button.
      input.current?.focus()
    }
    if (!open && d.open) d.close()
  }, [open, engine])

  // He acts out the conversation: thinking while he waits, talking while the
  // answer arrives, pointing when he has something to recommend.
  useEffect(() => {
    if (!engine) return
    const last = messages.at(-1)
    if (status === 'thinking') engine.setAct('search') // flicking through the site's files
    else if (status === 'talking') engine.setAct('talk')
    else if (open && last?.role === 'assistant' && last.cards?.length) engine.setAct('point')
    else engine.setAct(null)
  }, [engine, status, messages, open])

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [messages])

  const submit = (text: string) => {
    setDraft('')
    if (isTon(text)) {
      // The easter egg, not a question: close, and let the hero play it - or
      // go home and play it there.
      dialog.current?.close()
      if (dispatchEvent(new Event(TON_EVENT, { cancelable: true }))) router.push(`/${TON_HASH}`)
      return
    }
    send(text)
  }
  const errorText = error && t(`err_${error.code}` as 'err_quota', { s: error.retryAfter ?? 60 })

  return (
    <dialog
      ref={dialog}
      className={variant === 'paper' ? 'mw-screen mw-paper' : 'mw-screen'}
      aria-label={t('title')}
      onClose={() => {
        onClose()
        engine?.setAct(null)
        engine?.wave()
      }}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close()
      }}
    >
      <div className="mw-screen-head">
        <span className="mw-dot" aria-hidden /> {t('title')}
        <button type="button" className="mw-close" onClick={() => dialog.current?.close()} aria-label={t('close')}>
          ×
        </button>
      </div>
      <div ref={log} className="mw-log" aria-live="polite">
        <p className="mw-him">
          {prompt}
          {t('greeting')}
        </p>
        {messages.length === 0 && (
          <div className="mw-chips">
            {(['suggest1', 'suggest2', 'suggest3'] as const).map((k) => (
              <button key={k} type="button" onClick={() => submit(t(k))}>
                {t(k)}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'mw-me' : 'mw-him'}>
            {m.role === 'assistant' ? prompt : ''}
            {(m.role === 'assistant' ? plain(m.content) : m.content) || (status === 'thinking' && i === messages.length - 1 ? '…' : '')}
            {m.cards?.map((id) => {
              const it = items.get(id)
              if (!it) return null
              return (
                <a key={id} href={it.url} className="mw-card">
                  {it.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a small cover from our own bucket or a link
                    <img src={it.cover} alt="" loading="lazy" />
                  ) : (
                    <span className="mw-card-blank" aria-hidden />
                  )}
                  <span>
                    <b>{it.title}</b>
                    <small>
                      {t(it.kind)} · {t('minutes', { n: it.minutes })}
                    </small>
                  </span>
                </a>
              )
            })}
          </div>
        ))}
        {errorText && (
          <p className="mw-him mw-err">
            {prompt}
            {errorText}{' '}
            {error!.code !== 'quota' && error!.code !== 'rate_limited' && (
              <button type="button" onClick={retry}>
                {t('retry')}
              </button>
            )}
          </p>
        )}
      </div>
      <form
        className="mw-input"
        onSubmit={(e) => {
          e.preventDefault()
          submit(draft)
        }}
      >
        {variant !== 'paper' && <span aria-hidden>▌</span>}
        <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={t('placeholder')} aria-label={t('placeholder')} />
        <button type="submit" disabled={!draft.trim()}>
          {t('send')}
        </button>
      </form>
    </dialog>
  )
}
