import { isAdminBackendEnabled, listAdminAuditEvents } from "../services/api/adminApi"

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
    if (!raw) {
      if (isAdminBackendEnabled()) {
        void refreshAuditEvents()
      }
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AuditEvent[]) : []
  } catch {
    return []
  }
}

export async function refreshAuditEvents(): Promise<AuditEvent[]> {
  if (!isAdminBackendEnabled()) {
    return getAuditEvents()
  }

  const items = await listAdminAuditEvents()
  const events = items.map((item) => ({
    event: item.action,
    at: new Date(item.createdAt).toISOString(),
    actor: item.actorId,
    resource: item.resource,
    resourceId: item.resourceId,
  }))
  localStorage.setItem(KEY, JSON.stringify(events))
  return events
}

export function pushAuditEvent(evt: AuditEvent) {
  const events = getAuditEvents()
  events.unshift(evt)
  localStorage.setItem(KEY, JSON.stringify(events.slice(0, 500))) // keep last 500
}

export function clearAuditEvents() {
  localStorage.removeItem(KEY)
}
