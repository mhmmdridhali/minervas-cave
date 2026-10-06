import { officeStateBadge } from '../office-state.ts'
import { agentLook } from '../agents.ts'
import type { OfficeStation } from '../types.ts'

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

function StationCard({ station, onSelect }: { station: OfficeStation; onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void }) {
  const badge = officeStateBadge(station.state)
  const colors = agentLook(station.id)
  const busy = ['Working', 'Reviewing', 'Collaborating'].includes(station.state)

  return (
    <button
      type="button"
      className={`office2d-station-card state-${station.state.toLowerCase()}`}
      onClick={(event) => onSelect(station, event.currentTarget)}
      aria-label={`${station.name}. ${station.state}.${station.activity ? ` ${station.activity}.` : ''} Open station details.`}
    >
      <div className="station-card-header">
        <PulseRing state={station.state} />
        <span className="station-name">{station.name}</span>
      </div>
      <div className="station-character" style={{ '--hair': colors.hair, '--skin': colors.skin, '--shirt': colors.shirt, '--pants': colors.pants } as React.CSSProperties}>
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
    </button>
  )
}

export function Office2DGrid({ stations, onSelect }: { stations: OfficeStation[]; onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void }) {
  const stationNames = stations.map(s => s.id).join(', ')

  return (
    <div
      className="office-2d-grid"
      role="img"
      aria-label={`Kantor virtual ${stations.length} stasiun: ${stationNames}`}
    >
      <div className="office-2d-header">
        <h2>Virtual Office</h2>
        <span className="office-2d-count">{stations.length} stations</span>
      </div>
      <div className="office-2d-stations">
        {stations.map((station) => (
          <StationCard key={station.id} station={station} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
