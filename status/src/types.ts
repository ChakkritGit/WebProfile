export type CheckId = 'portfolio' | 'assistant' | 'ai' | 'expenses' | 'reminders' | 'whiteboard' | 'rooms'
export interface Result {
  id: CheckId
  ok: boolean
  ms: number
}
export interface Service {
  status: 'up' | 'slow' | 'down' | 'unknown'
  fails: number
  since: number
  ms: number
  checkedAt: number
}
export interface Incident {
  id: CheckId
  start: number
  end?: number
}
export interface State {
  v: 1
  services: Partial<Record<CheckId, Service>>
  /** Per Bangkok day: [ok, total] check counts. */
  days: Partial<Record<CheckId, Record<string, [ok: number, total: number]>>>
  incidents: Incident[]
  lastRun: number
}
export interface Env {
  STATUS: KVNamespace
  STATUS_SECRET: string
  HEALTH_TOKEN: string
  SUPABASE_FUNCTION_URL: string
}
