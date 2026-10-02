import { CHECKS, runChecks } from './checks'
import { handle } from './page'
import { apply, emptyState } from './state'
import type { Env, State } from './types'

const nameOf = (id: string) => CHECKS.find((c) => c.id === id)?.name ?? id

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const prev = (await env.STATUS.get<State>('state', 'json')) ?? emptyState()
    const results = await runChecks(env, controller.scheduledTime)
    const { state, alerts } = apply(prev, results, Date.now())
    // The only KV write of the run: the free tier allows 1000 a day, a 5-minute cron needs 288.
    await env.STATUS.put('state', JSON.stringify(state))
    for (const a of alerts) {
      const name = nameOf(a.id)
      const alert = a.kind === 'down' ? { title: `${name} ล่ม`, body: 'ตรวจไม่ผ่าน 2 ครั้งติดกัน' } : { title: `${name} กลับมาแล้ว`, body: `ล่มไปประมาณ ${a.minutes} นาที` }
      // The state is saved already, so a failed alert is logged and never thrown.
      try {
        const r = await fetch(env.SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'x-status-secret': env.STATUS_SECRET, 'content-type': 'application/json' },
          body: JSON.stringify({ alert }),
        })
        if (!r.ok) console.error('alert failed', a.id, r.status)
      } catch (e) {
        console.error('alert failed', a.id, (e as Error).message)
      }
    }
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    return handle(req, (await env.STATUS.get<State>('state', 'json')) ?? emptyState(), Date.now())
  },
}
