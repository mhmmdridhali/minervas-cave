import type { ConnectionStatus } from '../store.ts'

interface SyncBadgeProps {
  status: ConnectionStatus
  lastUpdated: number | undefined
}

function timeSince(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60) return `${secs}dtk`
  const mins = Math.floor(secs / 60)
  return `${mins}m`
}

export function SyncBadge({ status, lastUpdated }: SyncBadgeProps) {
  if (status === 'live') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <circle cx="4" cy="4" r="4" fill="var(--success)" />
        </svg>
        Live{lastUpdated ? ` · ${timeSince(lastUpdated)}` : ''}
      </span>
    )
  }
  if (status === 'polling') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <circle cx="4" cy="4" r="4" fill="var(--warning)" />
        </svg>
        Polling 10s{lastUpdated ? ` · ${timeSince(lastUpdated)}` : ''}
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="4" fill="var(--muted)" />
      </svg>
      Offline
    </span>
  )
}
