'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { plain } from '@/lib/assistant-client'
import { useAssistant } from './use-assistant'
import type { Engine } from './engine/engine'

/**
 * The screen Mr. Worldwide projects when you click him: a native modal dialog
 * (focus stays inside, Esc closes, focus returns to him), styled as an amber
 * terminal. He acts the conversation out while it runs.
 */
export function HologramChat({ open, onClose, engine }: { open: boolean; onClose(): void; engine: Engine | null }) {
  const t = useTranslations('assistant')
  const locale = useLocale()
  const lang = locale === 'th' ? 'th' : 'en'
  const { messages, status, error, send, retry, items } = useAssistant(lang)
  const dialog = useRef<HTMLDialogElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      // Projected above him: centred on his head, kept inside the viewport.
      const x = engine?.anchor().x ?? innerWidth / 2
      d.style.setProperty('--mw-x', `${Math.round(x)}px`)
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open, engine])

  // He acts out the conversation: thinking while he waits, talking while the
  // answer arrives, pointing when he has something to recommend.
  useEffect(() => {
    if (!engine) return
    const last = messages.at(-1)
    if (status === 'thinking') engine.setAct('think')
    else if (status === 'talking') engine.setAct('talk')
    else if (open && last?.role === 'assistant' && last.cards?.length) engine.setAct('point')
    else engine.setAct(null)
  }, [engine, status, messages, open])

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [messages])

  const submit = (text: string) => {
    send(text)
    setDraft('')
  }
  const errorText = error && t(`err_${error.code}` as 'err_quota', { s: error.retryAfter ?? 60 })

  return (
    <dialog
      ref={dialog}
      className="mw-screen"
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
        <p className="mw-him">&gt; {t('greeting')}</p>
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
            {m.role === 'assistant' ? '> ' : ''}
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
            &gt; {errorText}{' '}
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
        <span aria-hidden>▌</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={t('placeholder')} aria-label={t('placeholder')} />
        <button type="submit" disabled={!draft.trim()}>
          {t('send')}
        </button>
      </form>
    </dialog>
  )
}
