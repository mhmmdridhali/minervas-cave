import { lazy, Suspense, useState, type CSSProperties } from 'react'
import { agentLook } from '../agents.ts'
import { formatRelative } from '../format.ts'
import { officeStateBadge } from '../office-state.ts'
import { usePolling } from '../polling.ts'
import type { ActivitySnapshot, ChannelSnapshot, DashboardSnapshot, OfficeSnapshot, OfficeStation } from '../types.ts'
import type { Page } from '../routes.ts'
import { LoadingState } from '../ui.tsx'

const Office3DScene = lazy(() => import('./Office3D.tsx'))
const Office2D = lazy(() => import('./Office2D.tsx').then((m) => ({ default: m.Office2D })))

type OfficeView = '3d' | '2d' | 'summary'

export function PixelCharacter({ agent }: { agent: string }) {
  const look = agentLook(agent)
  const style = { '--hair': look.hair, '--skin': look.skin, '--shirt': look.shirt, '--pants': look.pants } as CSSProperties
  return (
    <span className="pixel-character" style={style} aria-hidden="true">
      <span className="character-hair"/>
      <span className="character-head"><i/><b/></span>
      <span className="character-torso"/>
      <span className="character-arm left"/>
      <span className="character-arm right"/>
      <span className="character-leg left"/>
      <span className="character-leg right"/>
    </span>
  )
}

export function OfficeDetail({ station, onClose }: { station: OfficeStation; onClose: () => void }) {
  const badge = officeStateBadge(station.state)
  return (
    <div className="office-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="office-detail" role="dialog" aria-modal="true" aria-labelledby="office-detail-title">
        <button className="office-close" onClick={onClose} aria-label={`Close ${station.name} details`}>Close</button>
        <div className="detail-head">
          <div className="detail-avatar"><PixelCharacter agent={station.id}/></div>
          <div>
            <h2 id="office-detail-title">{station.name}</h2>
            <span className={`badge ${badge.tone}`}>{station.state}</span>
          </div>
        </div>
        <dl className="office-detail-grid">
          <div><dt>Agent type</dt><dd>{station.role}</dd></div>
          <div><dt>Current room</dt><dd>{station.room} / {station.roomPosition}</dd></div>
          <div><dt>Current task</dt><dd>{station.currentTask}</dd></div>
          <div><dt>Recent activity</dt><dd>{station.recentActivity}</dd></div>
          <div><dt>Source / provenance</dt><dd>{station.provenance}</dd></div>
          <div><dt>Freshness</dt><dd>{station.freshness}</dd></div>
        </dl>
      </section>
    </div>
  )
}

function SyncBadge({ office }: { office: OfficeSnapshot | undefined }) {
  const summary = office?.summary
  const fetched = office?.fetchedAt
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '6px 12px',
      fontSize: '11px',
      fontFamily: 'ui-monospace, monospace',
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: summary ? 'var(--success)' : 'var(--muted)',
      }}/>
      <span style={{ color: 'var(--muted)' }}>
        {summary ? `${summary.active}/${summary.declared} aktif` : 'Menyambung...'}
        {fetched && <span style={{ marginLeft: '8px' }}>· {formatRelative(fetched)}</span>}
      </span>
    </div>
  )
}

function StationCard({ station }: { station: OfficeStation }) {
  const badge = officeStateBadge(station.state)
  return (
    <article style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px',
      display: 'grid',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{station.name}</h3>
        <span className={`badge ${badge.tone}`} style={{ fontSize: '10px' }}>{station.state}</span>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '11px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {station.currentTask || station.activity || '—'}
      </p>
      <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
        {station.freshness}
      </div>
    </article>
  )
}

function SummaryTab({ office, activity, channels }: { office: OfficeSnapshot | undefined; activity: ActivitySnapshot | undefined; channels: ChannelSnapshot | undefined }) {
  const stations = office?.stations ?? []

  return (
    <div style={{ padding: '20px', display: 'grid', gap: '24px' }}>
      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '14px', letterSpacing: '-.02em' }}>6 Station</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {stations.slice(0, 6).map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
          {stations.length === 0 && (
            <p style={{ color: 'var(--muted)', gridColumn: '1 / -1' }}>Tidak ada station.</p>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '14px', letterSpacing: '-.02em' }}>Live Activity</h2>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          {activity?.sessions && activity.sessions.data.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {activity.sessions.data.slice(0, 5).map((session, i) => (
                <div key={session.id ?? i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.title}
                    </p>
                    {session.preview && session.preview !== session.title && (
                      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.preview}
                      </p>
                    )}
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: '11px', flexShrink: 0, marginLeft: '12px' }}>
                    {session.lastActive}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Tidak ada aktivitas.</p>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '14px', letterSpacing: '-.02em' }}>Channels</h2>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          {channels?.channels && channels.channels.data.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {channels.channels.data.map((channel) => (
                  <div key={channel.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: channel.status === 'Connected' ? 'var(--success)' : 'var(--muted)',
                    }}/>
                    <span style={{ fontSize: '13px' }}>{channel.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 500, color: 'var(--success)' }}>
                  {channels.channels.data.filter((c) => c.status === 'Connected').length}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>terhubung</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Tidak ada channel.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function Office({ dashboard: _dashboard, dashboardPending: _dashboardPending = false, onNavigate: _onNavigate }: { dashboard?: DashboardSnapshot | null; dashboardPending?: boolean; onNavigate?: (page: Page) => void } = {}) {
  const officeSnapshot = usePolling<OfficeSnapshot>('/api/office', 10_000)
  const activitySnapshot = usePolling<ActivitySnapshot>('/api/activity', 15_000)
  const channelsSnapshot = usePolling<ChannelSnapshot>('/api/channels', 30_000)

  const office = officeSnapshot.status === 'ready' ? officeSnapshot.data : undefined
  const activity = activitySnapshot.status === 'ready' ? activitySnapshot.data : undefined
  const channels = channelsSnapshot.status === 'ready' ? channelsSnapshot.data : undefined

  const [view, setView] = useState<OfficeView>(() => {
    if (typeof window !== 'undefined' && !webglAvailable()) return '2d'
    return '2d'
  })
  const [webgl] = useState(() => webglAvailable())

  const tabs: { id: OfficeView; label: string; disabled?: boolean }[] = [
    { id: '3d', label: 'Kantor 3D', disabled: !webgl },
    { id: '2d', label: 'Kantor 2D' },
    { id: 'summary', label: 'Ringkasan' },
  ]

  return (
    <section style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-.04em', margin: 0 }}>Office</h1>
          <SyncBadge office={office} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => !tab.disabled && setView(tab.id)}
              disabled={tab.disabled}
              aria-pressed={view === tab.id}
              style={{
                background: view === tab.id ? 'var(--active-bg)' : 'transparent',
                border: '1px solid',
                borderColor: view === tab.id ? 'var(--success)' : 'var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                color: view === tab.id ? 'var(--success)' : 'var(--muted)',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                font: '11px ui-monospace, monospace',
                letterSpacing: '.06em',
                padding: '8px 14px',
                opacity: tab.disabled ? 0.45 : 1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main>
        {officeSnapshot.status === 'pending' ? (
          <LoadingState message="Memuat office..." />
        ) : view === 'summary' ? (
          <SummaryTab office={office} activity={activity} channels={channels} />
        ) : view === '3d' ? (
          <Suspense fallback={<LoadingState message="Memuat tampilan 3D..." />}>
            <Office3DScene stations={office?.stations ?? []} onSelect={() => {}} />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingState message="Memuat tampilan 2D..." />}>
            <Office2D />
          </Suspense>
        )}
      </main>
    </section>
  )
}