export type AuditEvent = {
  event: string
  at: string
  actor?: string
  [key: string]: unknown
}

const KEY = 'evzone_admin_audit_events'

export function getAuditEvents(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AuditEvent[]) : []
  } catch {
    return []
  }
}

export function pushAuditEvent(evt: AuditEvent) {
  const events = getAuditEvents()
  events.unshift(evt)
  localStorage.setItem(KEY, JSON.stringify(events.slice(0, 500))) // keep last 500
}

export function clearAuditEvents() {
  localStorage.removeItem(KEY)
}
