'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ask, type ChatMsg, type ErrorCode } from '@/lib/assistant-client'
import type { AiItem } from '@/lib/ai-index'

const KEY = 'mw-chat-v1'
const ENDPOINT = process.env.NEXT_PUBLIC_ASSISTANT_URL ?? '/api/assistant'
export type Status = 'idle' | 'thinking' | 'talking' | 'error'

const load = (): ChatMsg[] => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as ChatMsg[]
  } catch {
    return []
  }
}

/** The conversation for this tab: kept in sessionStorage, never on a server. */
export function useAssistant(lang: 'th' | 'en') {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<{ code: ErrorCode; retryAfter?: number } | null>(null)
  const [items, setItems] = useState<Map<string, AiItem>>(new Map())
  const current = useRef<AbortController | null>(null)
  const latest = useRef<ChatMsg[]>([])

  useEffect(() => {
    latest.current = messages
  }, [messages])
  useEffect(() => {
    // sessionStorage is only readable in the browser, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(load())
  }, [])
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20)))
    } catch {
      // Private mode: the conversation just will not survive a reload.
    }
  }, [messages])
  useEffect(() => {
    fetch('/ai/index.json')
      .then((r) => r.json())
      .then((d: { items: AiItem[] }) => setItems(new Map(d.items.map((i) => [i.id, i]))))
      .catch(() => {})
  }, [])

  const run = useCallback(
    async (history: ChatMsg[]) => {
      current.current?.abort() // a newer question replaces an unfinished one
      const ctrl = new AbortController()
      current.current = ctrl
      setError(null)
      setStatus('thinking')
      setMessages([...history, { role: 'assistant', content: '' }])
      const r = await ask({
        url: ENDPOINT,
        messages: history,
        lang,
        signal: ctrl.signal,
        onText: (t) => {
          setStatus('talking')
          setMessages((m) => {
            const next = m.slice()
            const last = next.at(-1)!
            next[next.length - 1] = { ...last, content: last.content + t }
            return next
          })
        },
        onCards: (ids) =>
          setMessages((m) => {
            const next = m.slice()
            next[next.length - 1] = { ...next.at(-1)!, cards: ids }
            return next
          }),
      })
      if (ctrl !== current.current) return
      if (r.ok) setStatus('idle')
      else {
        setStatus('error')
        setError({ code: r.code, retryAfter: r.retryAfter })
      }
    },
    [lang],
  )

  // The request is started here, never inside a state updater: React may run an
  // updater twice in development, which would send the question twice.
  const send = useCallback(
    (text: string) => {
      const content = text.trim().slice(0, 1000)
      if (!content) return
      void run([...latest.current.filter((x) => x.content), { role: 'user', content }])
    },
    [run],
  )

  const retry = useCallback(() => {
    const history = latest.current.filter((x) => x.content)
    while (history.length && history.at(-1)!.role === 'assistant') history.pop()
    if (history.length) void run(history)
  }, [run])

  useEffect(() => () => current.current?.abort(), [])
  return { messages, status, error, send, retry, items }
}
