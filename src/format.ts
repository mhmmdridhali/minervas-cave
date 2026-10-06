const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const whole = new Intl.NumberFormat('en')

export function formatCompact(value: number): string { return compact.format(value) }
export function formatNumber(value: number): string { return whole.format(value) }

export function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const time = Date.parse(iso)
  return Number.isFinite(time) ? new Date(time).toLocaleTimeString() : iso
}

export function formatDateTime(value: string | undefined): string {
  if (!value) return '—'
  const time = Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toLocaleString() : value
}

export function formatRelative(iso: string | undefined): string {
  if (!iso) return '—'
  const time = Date.parse(iso)
  if (Number.isFinite(time)) {
    const d = new Date(time)
    const now = Date.now()
    const diff = now - d.getTime()
    if (diff < 60_000) return 'baru saja'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} mnt lalu`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam lalu`
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }
  return iso
}

/** Hermes Kanban board order (plugins/kanban dashboard), followed by less common states. */
export const TASK_STATUS_ORDER = ['triage', 'todo', 'scheduled', 'ready', 'running', 'blocked', 'review', 'done', 'archived']
export const CORE_TASK_STATUSES = ['todo', 'ready', 'running', 'review', 'done']

export function orderedStatuses(statuses: Iterable<string>, includeCore = false): string[] {
  const set = new Set([...statuses].map((status) => status.toLowerCase()))
  if (includeCore) CORE_TASK_STATUSES.forEach((status) => set.add(status))
  const known = TASK_STATUS_ORDER.filter((status) => set.has(status))
  const extra = [...set].filter((status) => !TASK_STATUS_ORDER.includes(status)).sort()
  return [...known, ...extra]
}

export function statusTone(status: string): 'good' | 'unknown' | 'muted' | 'bad' | 'info' {
  switch (status.toLowerCase()) {
    case 'running': case 'active': case 'ok': return 'good'
    case 'review': case 'ready': case 'scheduled': return 'info'
    case 'blocked': case 'failed': case 'error': return 'bad'
    case 'done': case 'archived': case 'completed': case 'disabled': return 'muted'
    default: return 'unknown'
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Display name for an agent: its Hermes profile name as-is. */
export function agentLabel(profile: string | undefined): string {
  return profile ?? 'Hermes'
}
