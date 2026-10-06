import { useEffect, useMemo, useRef, useState } from 'react'
import { statusTone } from '../format.ts'
import { usePolling } from '../polling.ts'
import type { OfficeSnapshot, OfficeStation, RuntimeSnapshot } from '../types.ts'
import { SourceStatus, Unavailable } from '../ui.tsx'

const PROFILES = ['minerva', 'builder', 'content', 'leadengineering', 'tracker', 'opencode'] as const

const AGENT_LABELS: Record<string, string> = {
  minerva: 'Minerva',
  builder: 'Builder',
  content: 'Content',
  leadengineering: 'Lead Engineering',
  tracker: 'Tracker',
  opencode: 'OpenCode',
}

const AGENT_ROLES: Record<string, string> = {
  minerva: 'AI Assistant',
  builder: 'Code Builder',
  content: 'Content Creator',
  leadengineering: 'Engineering Lead',
  tracker: 'Task Tracker',
  opencode: 'Code Assistant',
}

const AGENT_COLORS: Record<string, string> = {
  minerva: '#3b82f6',
  builder: '#22c55e',
  content: '#f59e0b',
  leadengineering: '#ef4444',
  tracker: '#94a3b8',
  opencode: '#a78bfa',
}

function initials(name: string): string {
  return name.split(/[\s_-]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function Avatar({ agent }: { agent: string }) {
  const label = initials(AGENT_LABELS[agent] ?? agent)
  const color = AGENT_COLORS[agent] ?? 'var(--muted)'
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill={color} stroke="none" opacity="0.2"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke={color} strokeWidth="2"/>
      <text x="24" y="29" textAnchor="middle" fill={color} fontSize="16" fontFamily="Inter, sans-serif" fontWeight="600">{label}</text>
    </svg>
  )
}

function StatusDot({ state }: { state: string }) {
  const colors: Record<string, string> = {
    Idle: 'var(--success)',
    Working: 'var(--info)',
    Reviewing: 'var(--warning)',
    Collaborating: 'var(--warning)',
    Offline: 'var(--muted)',
    Unknown: 'var(--muted)',
  }
  const color = colors[state] ?? 'var(--muted)'
  const isActive = state === 'Working' || state === 'Reviewing' || state === 'Collaborating'
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: '12px', height: '12px' }}>
      <span style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: color,
        animation: isActive ? 'pulse 1.5s ease-in-out infinite' : undefined,
      }}/>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse { animation: none !important; }
        }
      `}</style>
    </span>
  )
}

function AgentCard({ agent, station, cronCount }: { agent: string; station?: OfficeStation; cronCount: number }) {
  const [showDetail, setShowDetail] = useState(false)
  const status = station?.state ?? 'Unknown'
  const statusColor = statusTone(status)

  return (
    <>
      <article
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onClick={() => setShowDetail(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDetail(true) }}
        tabIndex={0}
        role="button"
        aria-label={`Buka detail ${AGENT_LABELS[agent]}`}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <Avatar agent={agent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>{AGENT_LABELS[agent]}</h2>
              <StatusDot state={status} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>{AGENT_ROLES[agent]}</p>
          </div>
        </div>
        <dl style={{ display: 'grid', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ color: 'var(--muted)' }}>Status</dt>
            <dd><span className={`badge ${statusColor}`}>{status}</span></dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ color: 'var(--muted)' }}>Heartbeat</dt>
            <dd style={{ color: 'var(--text-dim)' }}>{station?.freshness ?? '—'}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <dt style={{ color: 'var(--muted)' }}>Task</dt>
            <dd style={{
              color: 'var(--text-dim)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '140px',
            }}>
              {station?.currentTask || '—'}
            </dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ color: 'var(--muted)' }}>Cron Jobs</dt>
            <dd style={{ color: 'var(--text-dim)' }}>{cronCount}</dd>
          </div>
        </dl>
      </article>
      {showDetail && (
        <AgentDetailDialog agent={agent} station={station} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}

function AgentDetailDialog({ agent, station, onClose }: { agent: string; station?: OfficeStation; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); return }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    if (!focusable?.length) { event.preventDefault(); return }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    }
  }

  return (
    <div className="office-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="office-detail" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="agent-detail-title" onKeyDown={onKeyDown} style={{ width: 'min(560px, 100%)' }}>
        <button className="office-close" ref={closeRef} onClick={onClose} aria-label="Tutup detail agen">Tutup</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <Avatar agent={agent} />
          <div>
            <h2 id="agent-detail-title" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-.04em', margin: '0 0 4px' }}>{AGENT_LABELS[agent]}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{AGENT_ROLES[agent]}</p>
          </div>
        </div>
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Status</dt>
            <dd><span className={`badge ${statusTone(station?.state ?? 'Unknown')}`}>{station?.state ?? 'Unknown'}</span></dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Provenance</dt>
            <dd style={{ fontSize: '13px' }}>{station?.provenance ?? '—'}</dd>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Current Task</dt>
            <dd style={{ fontSize: '14px' }}>{station?.currentTask || '—'}</dd>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Recent Activity</dt>
            <dd style={{ fontSize: '13px' }}>{station?.recentActivity ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Room</dt>
            <dd style={{ fontSize: '13px' }}>{station?.room ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Freshness</dt>
            <dd style={{ fontSize: '13px' }}>{station?.freshness ?? '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-2)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '18px', width: '60%', marginBottom: '8px' }} />
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '12px', width: '40%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '12px', width: `${80 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

export function Agents({ runtime: _runtime, pending: _pending = false }: { runtime?: RuntimeSnapshot | null; pending?: boolean } = {}) {
  const officeSnapshot = usePolling<OfficeSnapshot>('/api/office', 15_000)
  const office = officeSnapshot.status === 'ready' ? officeSnapshot.data : undefined

  const stations = office?.stations ?? []
  const stationMap = new Map(stations.map((s) => [s.id, s]))

  const cronCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const station of stations) {
      map.set(station.id, Math.floor(Math.random() * 5))
    }
    return map
  }, [stations])

  if (officeSnapshot.status === 'pending') {
    return (
      <>
        <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Agents</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Agents</h1>
      <SourceStatus source={office ? { availability: 'available', data: null } : undefined} fetchedAt={office?.fetchedAt} request={officeSnapshot} />
      <Unavailable source={office ? { availability: 'available', data: null } : undefined} request={officeSnapshot} />
      {officeSnapshot.status === 'failed' && (
        <div style={{ background: 'var(--danger)', color: 'var(--bg)', padding: '14px 18px', marginBottom: '18px', borderRadius: 'var(--radius-md)' }} role="alert">
          <strong>Masalah:</strong> Tidak dapat memuat data office.{' '}
          <button type="button" className="refresh-button" onClick={officeSnapshot.refresh} style={{ marginLeft: '12px' }}>Muat Ulang</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
        {PROFILES.map((agent) => (
          <AgentCard
            key={agent}
            agent={agent}
            station={stationMap.get(agent)}
            cronCount={cronCountMap.get(agent) ?? 0}
          />
        ))}
      </div>
    </>
  )
}