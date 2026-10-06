import { useEffect, useRef, useState } from 'react'
import { formatDateTime, statusTone } from '../format.ts'
import { usePolling } from '../polling.ts'
import type { CalendarSnapshot, ScheduledJob } from '../types.ts'
import { EmptyState, SourceStatus, Unavailable } from '../ui.tsx'

const AGENT_COLORS: Record<string, string> = {
  minerva: 'var(--info)',
  builder: 'var(--success)',
  content: 'var(--warning)',
  leadengineering: 'var(--danger)',
  tracker: 'var(--muted)',
  opencode: '#a78bfa',
}

function agentColor(agent?: string): string {
  return agent && AGENT_COLORS[agent] ? AGENT_COLORS[agent] : 'var(--muted)'
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const witad = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  return witad.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })
}

function dayName(day: number): string {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  return days[day] ?? ''
}

function toWITA(d: Date): Date {
  return new Date(d.getTime() + 8 * 60 * 60 * 1000)
}

function getDaysOfWeek(base: Date): Date[] {
  const dow = (base.getDay() + 6) % 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function JobChip({ job, onClick }: { job: ScheduledJob; onClick: () => void }) {
  const color = agentColor(job.agent)
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: `2px solid ${color}`,
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        fontSize: '12px',
        fontFamily: 'inherit',
        maxWidth: '140px',
      }}
      aria-label={`${job.name} pada ${formatTime(job.nextRun)}`}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.name}</span>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{formatTime(job.nextRun)}</span>
    </button>
  )
}

function JobModal({ job, onClose }: { job: ScheduledJob; onClose: () => void }) {
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
      <section className="office-detail" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="job-modal-title" onKeyDown={onKeyDown} style={{ width: 'min(560px, 100%)' }}>
        <button className="office-close" ref={closeRef} onClick={onClose} aria-label="Tutup detail job">Tutup</button>
        <h2 id="job-modal-title" style={{ fontSize: '24px', margin: '8px 0 12px' }}>{job.name}</h2>
        <dl style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Jadwal</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px' }}>{job.schedule}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Agent</dt>
            <dd>{job.agent ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Status</dt>
            <dd>
              {job.status && <span className={`badge ${statusTone(job.status)}`}>{job.status}</span>}
              {job.overdue && <span style={{ color: 'var(--danger)', marginLeft: '8px', fontSize: '13px' }}>Overdue</span>}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Next Run (WITA)</dt>
            <dd style={{ color: job.overdue ? 'var(--danger)' : 'var(--text)' }}>{formatDateTime(job.nextRun)}</dd>
          </div>
          {job.lastRun && (
            <div>
              <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Last Run</dt>
              <dd>
                {formatDateTime(job.lastRun)}
                {job.lastRunOk !== undefined && (
                  <span className={`badge ${job.lastRunOk ? 'good' : 'bad'}`} style={{ marginLeft: '8px' }}>
                    {job.lastRunOk ? 'ok' : 'failed'}
                  </span>
                )}
              </dd>
            </div>
          )}
          {job.repeat && (
            <div>
              <dt style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>Repeat</dt>
              <dd>{job.repeat}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '24px' }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', minHeight: '120px' }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '14px', width: '50%', marginBottom: '12px' }} />
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '10px', width: '80%', marginBottom: '6px' }} />
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '10px', width: '60%' }} />
        </div>
      ))}
    </div>
  )
}

function WeekView({ jobs, onSelectJob }: { jobs: ScheduledJob[]; onSelectJob: (job: ScheduledJob) => void }) {
  const today = new Date()
  const weekDays = getDaysOfWeek(today)

  const jobsByDay = new Map<string, ScheduledJob[]>()
  for (const job of jobs) {
    if (job.nextRun) {
      const d = new Date(job.nextRun)
      const key = dateKey(toWITA(d))
      const existing = jobsByDay.get(key) ?? []
      existing.push(job)
      jobsByDay.set(key, existing)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '24px' }}>
      {weekDays.map((day) => {
        const key = dateKey(day)
        const dayJobs = jobsByDay.get(key) ?? []
        const isToday = dateKey(today) === key
        return (
          <div
            key={key}
            style={{
              background: isToday ? 'var(--active-bg)' : 'var(--card)',
              border: `1px solid ${isToday ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              minHeight: '120px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: isToday ? 'var(--success)' : 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                {dayName(day.getDay())}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{day.getDate()}</span>
            </div>
            {dayJobs.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '20px' }}>—</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayJobs.slice(0, 4).map((job) => (
                  <JobChip key={`${job.agent ?? ''}:${job.id ?? job.name}`} job={job} onClick={() => onSelectJob(job)} />
                ))}
                {dayJobs.length > 4 && (
                  <span style={{ color: 'var(--muted)', fontSize: '11px', textAlign: 'center' }}>+{dayJobs.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MonthlyList({ jobs }: { jobs: ScheduledJob[] }) {
  const sorted = [...jobs].sort((a, b) => (a.nextRun ?? '').localeCompare(b.nextRun ?? ''))

  const byDate = new Map<string, ScheduledJob[]>()
  for (const job of sorted) {
    if (job.nextRun) {
      const d = new Date(job.nextRun)
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      const existing = byDate.get(key) ?? []
      existing.push(job)
      byDate.set(key, existing)
    }
  }

  return (
    <section style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-.04em', marginBottom: '16px' }}>Daftar Bulanan</h2>
      {[...byDate.entries()].map(([date, dateJobs]) => (
        <div key={date} style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>{date}</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {dateJobs.map((job) => (
              <div key={`${job.agent ?? ''}:${job.id ?? job.name}`} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: agentColor(job.agent), flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{job.name}</span>
                  {job.agent && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{job.agent}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--warning)', fontSize: '11px', padding: '2px 6px' }}>{job.schedule}</code>
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{formatTime(job.nextRun)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export function Calendar() {
  const snapshot = usePolling<CalendarSnapshot>('/api/calendar', 30_000)
  const data = snapshot.status === 'ready' ? snapshot.data : undefined
  const jobs = data?.jobs

  const [selectedJob, setSelectedJob] = useState<ScheduledJob | undefined>()

  if (snapshot.status === 'pending') {
    return (
      <>
        <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Kalender</h1>
        <SkeletonGrid />
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Kalender</h1>
      <SourceStatus source={jobs} fetchedAt={data?.fetchedAt} request={snapshot} />
      <Unavailable source={jobs} request={snapshot} />
      {snapshot.status === 'failed' && (
        <div style={{ background: 'var(--danger)', color: 'var(--bg)', padding: '14px 18px', marginBottom: '18px', borderRadius: 'var(--radius-md)' }} role="alert">
          <strong>Masalah:</strong> Tidak dapat memuat data kalender.{' '}
          <button type="button" className="refresh-button" onClick={snapshot.refresh} style={{ marginLeft: '12px' }}>Muat Ulang</button>
        </div>
      )}
      {jobs?.availability === 'available' && jobs.data.length === 0 && (
        <EmptyState title="Tidak ada job terjadwal">Belum ada cron job yang terdaftar.</EmptyState>
      )}
      {jobs?.availability === 'available' && jobs.data.length > 0 && (
        <>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
            Waktu dalam WITA (UTC+8). Total {jobs.data.length} job.
          </div>
          <WeekView jobs={jobs.data} onSelectJob={setSelectedJob} />
          <MonthlyList jobs={jobs.data} />
        </>
      )}
      {selectedJob && <JobModal job={selectedJob} onClose={() => setSelectedJob(undefined)} />}
    </>
  )
}