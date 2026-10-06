import { useState } from 'react'
import { officeStateBadge } from '../office-state.ts'
import { agentLook } from '../agents.ts'
import { usePolling } from '../polling.ts'
import type { CalendarSnapshot, OfficeStation } from '../types.ts'

const STATE_COLORS: Record<string, string> = {
  working: 'var(--success, #22C55E)',
  idle: 'var(--warning, #F59E0B)',
  offline: 'var(--muted, #64748B)',
  unknown: 'var(--muted, #64748B)',
}

function PulseRing({ state }: { state: string }) {
  const color = STATE_COLORS[state.toLowerCase()] ?? STATE_COLORS.unknown
  return (
    <span
      className="station-pulse-ring"
      style={{ '--pulse-color': color } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}

function StationCard({ station, onSelect, cronCount, isExpanded, onToggle }: {
  station: OfficeStation
  onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void
  cronCount: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const badge = officeStateBadge(station.state)
  const colors = agentLook(station.id)
  const busy = ['Working', 'Reviewing', 'Collaborating'].includes(station.state)

  return (
    <div className={`office2d-station-card state-${station.state.toLowerCase()}${isExpanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className="station-card-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <PulseRing state={station.state} />
        <span className="station-name">{station.name}</span>
      </button>
      <div
        className="station-character"
        style={{ '--hair': colors.hair, '--skin': colors.skin, '--shirt': colors.shirt, '--pants': colors.pants } as React.CSSProperties}
        onClick={(event) => onSelect(station, event.currentTarget)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(station, event.currentTarget) } }}
        aria-label={`${station.name}. ${station.state}.${station.activity ? ` ${station.activity}.` : ''} Open station details.`}
      >
        <span className="character-head" />
        <span className="character-body" />
      </div>
      <div className="station-info">
        <span className="station-role">{station.role}</span>
        <span className={`badge ${badge.tone}`}>{station.state}</span>
      </div>
      {busy && station.activity && (
        <div className="station-activity">{station.activity}</div>
      )}
      {isExpanded && (
        <div className="detail-panel">
          <dl style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
            <div><dt style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task</dt><dd style={{ margin: '2px 0 0' }}>{station.currentTask || 'No task'}</dd></div>
            <div><dt style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</dt><dd style={{ margin: '2px 0 0' }}>{station.recentActivity || 'No recent activity'}</dd></div>
            <div><dt style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Heartbeat</dt><dd style={{ margin: '2px 0 0' }}>{station.freshness || 'Unknown'}</dd></div>
            <div><dt style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cron Jobs</dt><dd style={{ margin: '2px 0 0' }}>{cronCount} active</dd></div>
          </dl>
        </div>
      )}
    </div>
  )
}

export function Office2DGrid({ stations, onSelect }: { stations: OfficeStation[]; onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void }) {
  const officePolling = usePolling<{ stations: OfficeStation[] }>('/api/office', 10_000)
  const calendarPolling = usePolling<CalendarSnapshot>('/api/calendar', 30_000)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const currentStations = officePolling.status === 'ready' ? officePolling.data.stations : stations

  const cronCounts: Record<string, number> = {}
  if (calendarPolling.status === 'ready' && calendarPolling.data?.jobs?.data) {
    for (const job of calendarPolling.data.jobs.data) {
      if (job.agent) {
        cronCounts[job.agent] = (cronCounts[job.agent] ?? 0) + 1
      }
    }
  }

  const stationNames = currentStations.map(s => s.id).join(', ')

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div
      className="office-2d-grid"
      role="img"
      aria-label={`Kantor virtual ${currentStations.length} stasiun: ${stationNames}`}
    >
      <div className="office-2d-header">
        <h2>Virtual Office</h2>
        <span className="office-2d-count">{currentStations.length} stations</span>
      </div>
      <div className="office-2d-stations">
        {currentStations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            onSelect={onSelect}
            cronCount={cronCounts[station.id] ?? 0}
            isExpanded={expandedId === station.id}
            onToggle={() => toggleExpanded(station.id)}
          />
        ))}
      </div>
    </div>
  )
}
