import { useEffect, useState } from 'react'
import { usePolling } from '../polling.ts'
import type { DashboardSnapshot, RuntimeSnapshot } from '../types.ts'
import { PageTitle } from '../ui.tsx'

function useCountUp(target: number, duration = 600, enabled = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return }
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, enabled])
  return value
}

function KpiTile({ label, value, detail, accent = false }: { label: string; value: number; detail?: string; accent?: boolean }) {
  const counted = useCountUp(value)
  return <div className={`stat-tile${accent ? ' accent' : ''}`}><span>{label}</span><strong>{counted}</strong>{detail && <small>{detail}</small>}</div>
}

const AGENT_ROLES = ['minerva', 'builder', 'content', 'leadengineering', 'tracker', 'opencode'] as const

function agentLabel(id: string): string {
  const labels: Record<string, string> = { minerva: 'Minerva', builder: 'Builder', content: 'Content', leadengineering: 'Lead Engineering', tracker: 'Tracker', opencode: 'OpenCode' }
  return labels[id] ?? id
}

function statusColor(state: string): string {
  if (state === 'Working' || state === 'Running') return 'var(--success)'
  if (state === 'Idle') return 'var(--warning)'
  if (state === 'Offline') return 'var(--danger)'
  return 'var(--muted)'
}

function PulseDot({ color }: { color: string }) {
  return <span className="pulse-dot" style={{ background: color }} aria-hidden="true"/>
}

export function Dashboard() {
  const dashboard = usePolling<DashboardSnapshot>('/api/dashboard', 15_000)
  const runtime = usePolling<RuntimeSnapshot>('/api/runtime', 30_000)

  const dash = dashboard.status === 'ready' ? dashboard.data : null
  const rt = runtime.status === 'ready' ? runtime.data : null

  const loading = dashboard.status === 'pending' || runtime.status === 'pending'
  const error = dashboard.status === 'failed' || runtime.status === 'failed'

  if (loading) {
    return (
      <>
        <PageTitle eyebrow="DASHBOARD" title="Mission Control" />
        <div className="dash-bento">
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-tile" style={{ minHeight: 128 }}><span className="skeleton-span" /><strong className="skeleton-strong" /></div>
            <div className="stat-tile" style={{ minHeight: 128 }}><span className="skeleton-span" /><strong className="skeleton-strong" /></div>
            <div className="stat-tile" style={{ minHeight: 128 }}><span className="skeleton-span" /><strong className="skeleton-strong" /></div>
            <div className="stat-tile" style={{ minHeight: 128 }}><span className="skeleton-span" /><strong className="skeleton-strong" /></div>
          </div>
          <div className="dash-row">
            <div className="card dash-card">
              <div className="skeleton-lines" />
              <div className="skeleton-lines short" />
            </div>
            <div className="card dash-card">
              <div className="skeleton-lines" />
              <div className="skeleton-lines short" />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageTitle eyebrow="DASHBOARD" title="Mission Control" />
        <div className="file-notice" role="alert">
          <strong>Masalah.</strong> Data tidak dapat dimuat.
          <button type="button" className="refresh-button" onClick={() => { void dashboard.refresh(); void runtime.refresh() }}>Muat Ulang</button>
        </div>
      </>
    )
  }

  const tasks = dash?.tasks ?? { total: 0, byStatus: {} as Record<string, number>, assigned: 0 }
  const totalTasks = tasks.total ?? 0
  const runningTasks = tasks.byStatus?.running ?? 0
  const doneTasks = tasks.byStatus?.done ?? 0

  const office = dash?.office ?? { gatewaysReachable: 0, gatewaysDeclared: 0, active: 0, idle: 0, offline: 0, unknown: 0, declared: 0 }
  const agentsOnline = office.active

  const gatewayRunning = rt?.profiles.availability === 'available' ? rt.profiles.data.filter(p => p.gateway === 'Running').length : 0
  const gatewayTotal = rt?.profiles.availability === 'available' ? rt.profiles.data.length : 0

  const calendarNext = dash?.calendar ?? { nextRun: undefined }
  const nextRunTime = calendarNext.nextRun

  const cronJobs = dash?.calendar ?? { active: 0, paused: 0 }

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const todayIdx = (new Date().getDay() + 6) % 7
  const weekChips = weekDays.map((day, idx) => ({ day, time: idx === todayIdx ? nextRunTime : undefined }))

  return (
    <>
      <PageTitle eyebrow="DASHBOARD" title="Mission Control" />
      <div className="dash-bento">
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }} role="list" aria-label="KPI tiles">
          <KpiTile label="Total Tasks" value={totalTasks} detail={`${tasks.assigned} assigned`} />
          <KpiTile label="Running" value={runningTasks} accent />
          <KpiTile label="Done" value={doneTasks} detail="completed" />
          <KpiTile label="Agents Online" value={agentsOnline} detail={`${office.idle} idle · ${office.offline} offline`} />
        </div>

        <div className="dash-row">
          <div className="card dash-card">
            <p className="eyebrow">GATEWAY STATUS</p>
            <div className="gateway-badge">
              <PulseDot color={gatewayRunning > 0 ? 'var(--success)' : 'var(--danger)'} />
              <span>{gatewayRunning > 0 ? `${gatewayRunning} of ${gatewayTotal} running` : 'No gateways running'}</span>
            </div>
            {rt?.profiles.availability === 'available' && (
              <div className="gateway-profiles">
                {rt.profiles.data.map(p => <span key={p.name} className="chip">{p.name}</span>)}
              </div>
            )}
          </div>

          <div className="card dash-card">
            <p className="eyebrow">CRON JADSCHEDULE</p>
            <div className="mini-cron-bar" role="list" aria-label="Weekly cron schedule">
              {weekChips.map(({ day, time }) => (
                <span key={day} className="cron-chip" role="listitem">{day}{time && <b>{time}</b>}</span>
              ))}
            </div>
            <p className="dash-meta">{cronJobs.active} active · {cronJobs.paused} paused</p>
          </div>
        </div>

        <div className="dash-row">
          <div className="card dash-card wide">
            <p className="eyebrow">AGENT ROLES</p>
            <div className="agent-role-grid">
              {AGENT_ROLES.map(id => {
                const state = 'Unknown'
                const color = statusColor(state)
                return (
                  <div key={id} className="agent-role-item">
                    <PulseDot color={color} />
                    <span className="agent-role-name">{agentLabel(id)}</span>
                    <span className="agent-role-state" style={{ color }}>{state}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="dash-footer">
        <button type="button" className="refresh-button" onClick={() => { void dashboard.refresh(); void runtime.refresh() }} aria-label="Refresh dashboard">Muat Ulang</button>
        <span className="dash-sync">{dash?.fetchedAt ? `Updated ${new Date(dash.fetchedAt).toLocaleTimeString()}` : 'Connecting...'}</span>
      </div>
    </>
  )
}