export type CheckId = 'portfolio' | 'assistant' | 'ai' | 'expenses' | 'reminders' | 'whiteboard' | 'rooms' | 'music' | 'musicauth' | 'musicsync'
export type FailureReason = 'http-error' | 'timeout' | 'network' | 'invalid-response' | 'unhealthy' | 'heartbeat-stale'
export interface Result {
  id: CheckId
  ok: boolean
  ms: number
  reason?: FailureReason
  httpStatus?: number
}
export interface Service {
  status: 'up' | 'slow' | 'down' | 'unknown'
  fails: number
  since: number
  ms: number
  reason?: FailureReason
  httpStatus?: number
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
  /** The whiteboard rooms Worker, bound directly: a Worker cannot fetch another of the account's workers.dev URLs. */
  MUSIC_SYNC: Fetcher
  ROOMS: Fetcher
  STATUS_SECRET: string
  HEALTH_TOKEN: string
  SUPABASE_FUNCTION_URL: string
}
