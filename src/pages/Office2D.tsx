import { useCallback, useRef, useState } from 'react'
import { agentLook } from '../agents.ts'
import { officeStateBadge } from '../office-state.ts'
import { usePolling } from '../polling.ts'
import type { CalendarSnapshot, OfficeSnapshot, OfficeStation } from '../types.ts'

const STATION_ORDER = ['minerva', 'builder', 'content', 'leadengineering', 'tracker', 'opencode']

const STATUS_COLORS: Record<string, string> = {
  Working: 'var(--success)',
  Idle: 'var(--warning)',
  Offline: 'var(--muted)',
  Unknown: 'var(--muted)',
}

function InitialsAvatar({ stationId, size = 40 }: { stationId: string; size?: number }) {
  const look = agentLook(stationId)
  const initials = stationId.slice(0, 2).toUpperCase()
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="20" fill={look.shirt} />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fill="var(--bg)" fontSize="14" fontWeight="600" fontFamily="var(--font-display)">{initials}</text>
    </svg>
  )
}

function StatusDot({ state }: { state: string }) {
  const color = STATUS_COLORS[state] ?? STATUS_COLORS.Unknown
  return (
    <span
      className="status-dot"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  )
}

function SkeletonCard() {
  return (
    <div className="station-card skeleton-card" aria-hidden="true">
      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
        <div className="skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton-line" style={{ width: '40%' }} />
        </div>
      </div>
      <div className="skeleton-line" style={{ width: '80%', marginTop: 'var(--space-sm)' }} />
      <div className="skeleton-line" style={{ width: '50%' }} />
    </div>
  )
}

interface DetailPanelProps {
  station: OfficeStation
  cronCount: number
}

function DetailPanel({ station, cronCount }: DetailPanelProps) {
  return (
    <div className="detail-panel" role="region" aria-label={`${station.name} details`}>
      <div style={{ display: 'grid', gap: 'var(--space-xs)', fontSize: '13px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Task</span>
          <p style={{ margin: '4px 0 0', color: 'var(--text)' }}>{station.currentTask || 'No task'}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</span>
          <p style={{ margin: '4px 0 0', color: 'var(--text)' }}>{station.recentActivity || 'No recent activity'}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Heartbeat</span>
          <p style={{ margin: '4px 0 0', color: 'var(--text)' }}>{station.freshness || 'Unknown'}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</span>
          <p style={{ margin: '4px 0 0', color: 'var(--text)' }}>{station.provenance || 'Unknown'}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cron Jobs</span>
          <p style={{ margin: '4px 0 0', color: 'var(--text)' }}>{cronCount} active</p>
        </div>
      </div>
    </div>
  )
}

interface StationCardProps {
  station: OfficeStation
  cronCount: number
  isExpanded: boolean
  onToggle: () => void
}

function StationCard({ station, cronCount, isExpanded, onToggle }: StationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const badge = officeStateBadge(station.state)

  return (
    <div
      ref={cardRef}
      className={`station-card state-${station.state.toLowerCase()}${isExpanded ? ' expanded' : ''}`}
      role="article"
      aria-expanded={isExpanded}
    >
      <button
        type="button"
        className="station-card-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`detail-${station.id}`}
      >
        <InitialsAvatar stationId={station.id} />
        <div className="station-meta" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <StatusDot state={station.state} />
            <span className="station-name" style={{ fontWeight: 500, fontSize: '15px' }}>{station.name}</span>
          </div>
          <span className="station-role" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{station.role}</span>
        </div>
        <span className={`badge ${badge.tone}`} style={{ flexShrink: 0 }}>{station.state}</span>
      </button>
      <div className="station-card-body" style={{ marginTop: 'var(--space-sm)', fontSize: '13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>LAST HEARTBEAT</span>
          <span style={{ fontSize: '12px' }}>{station.freshness || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>TASK</span>
          <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%', textAlign: 'right' }}>{station.currentTask || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>CRONS</span>
          <span style={{ fontSize: '12px' }}>{cronCount}</span>
        </div>
      </div>
      {isExpanded && <DetailPanel station={station} cronCount={cronCount} />}
    </div>
  )
}

export function Office2D() {
  const officePolling = usePolling<OfficeSnapshot>('/api/office', 10_000)
  const calendarPolling = usePolling<CalendarSnapshot>('/api/calendar', 30_000)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const office = officePolling.status === 'ready' ? officePolling.data : undefined
  const calendar = calendarPolling.status === 'ready' ? calendarPolling.data : undefined

  const cronCountByAgent = useCallback(() => {
    const counts: Record<string, number> = {}
    if (calendar?.jobs?.data) {
      for (const job of calendar.jobs.data) {
        if (job.agent) {
          counts[job.agent] = (counts[job.agent] ?? 0) + 1
        }
      }
    }
    return counts
  }, [calendar])

  const stations = office?.stations ?? []
  const sortedStations = [...stations].sort((a, b) => {
    const aIndex = STATION_ORDER.indexOf(a.id.toLowerCase())
    const bIndex = STATION_ORDER.indexOf(b.id.toLowerCase())
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const cronCounts = cronCountByAgent()

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (officePolling.status === 'pending') {
    return (
      <div style={{ padding: 'var(--space-md)' }}>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 var(--space-xs)' }}>Kantor 2D</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Memuat...</p>
        </div>
        <div className="office-grid">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (officePolling.status === 'failed') {
    return (
      <div style={{ padding: 'var(--space-md)' }}>
        <div className="notice" role="alert">
          Gagal memuat kantor.{' '}
          <button type="button" className="refresh-button" onClick={() => void officePolling.refresh()}>
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 var(--space-xs)' }}>Kantor 2D</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          {office?.summary ? `${office.summary.active} aktif · ${office.summary.idle} idle · ${office.summary.offline} offline` : '6 stasiun'}
        </p>
      </div>
      <div className="office-grid" role="list" aria-label="Stasiun kantor">
        {sortedStations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            cronCount={cronCounts[station.id] ?? 0}
            isExpanded={expandedId === station.id}
            onToggle={() => toggleExpanded(station.id)}
          />
        ))}
      </div>
    </div>
  )
}
