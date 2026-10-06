import { useMemo } from 'react'
import { usePolling } from '../polling.ts'
import type { ActivitySnapshot, Session } from '../types.ts'
import { EmptyState, SourceStatus, Unavailable } from '../ui.tsx'

const IDLE_MESSAGES = [
  'Menunggu instruksi...',
  'Siap bekerja',
  'Idle',
  'Tidak ada aktivitas',
  'Diam...',
  'Bosan',
  'Nongkrong',
  'Mikir...',
]

const SOURCE_COLORS: Record<string, string> = {
  chat: 'var(--info)',
  cron: 'var(--warning)',
  tools: 'var(--success)',
  thinking: 'var(--muted)',
}

function getSourceColor(source?: string): string {
  if (!source) return 'var(--muted)'
  for (const key of ['chat', 'cron', 'tools', 'thinking']) {
    if (source.toLowerCase().includes(key)) return SOURCE_COLORS[key]
  }
  return 'var(--muted)'
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function CronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function ToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

function ThinkingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a8 8 0 0 1 8 8c0 2.5-1.5 5-4 6.5V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.5C5.5 15 4 12.5 4 10a8 8 0 0 1 8-8z"/>
      <path d="M10 22h4"/>
    </svg>
  )
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function getIcon(source?: string) {
  if (!source) return <DefaultIcon />
  const s = source.toLowerCase()
  if (s.includes('chat')) return <ChatIcon />
  if (s.includes('cron')) return <CronIcon />
  if (s.includes('tools') || s.includes('tool')) return <ToolsIcon />
  if (s.includes('think')) return <ThinkingIcon />
  return <DefaultIcon />
}

function formatRelative(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return 'baru saja'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function SessionItem({ session, idleMessage }: { session: Session; idleMessage?: string }) {
  const color = getSourceColor(session.source)
  return (
    <article style={{
      display: 'flex',
      gap: '14px',
      padding: '16px 0',
      borderBottom: '1px solid var(--border)',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-2)',
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        flexShrink: 0,
      }}>
        {getIcon(session.source)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {idleMessage || session.title}
          </h3>
          <span style={{ color: 'var(--muted)', fontSize: '11px', flexShrink: 0 }}>{formatRelative(session.lastActive)}</span>
        </div>
        {session.preview && session.preview !== session.title && (
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.preview}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          {session.source && (
            <span style={{
              background: color,
              color: 'var(--bg)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {session.source}
            </span>
          )}
          {session.workspace && (
            <span style={{
              background: 'var(--surface-2)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '10px',
              color: 'var(--muted)',
            }}>
              {session.workspace}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function SkeletonItem() {
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '16px', width: '60%', marginBottom: '8px' }} />
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '12px', width: '40%' }} />
      </div>
    </div>
  )
}

function getIdleMessage(agent: string, index: number): string {
  const seed = [...agent].reduce((a, c) => a + c.charCodeAt(0), 0) + index
  return IDLE_MESSAGES[seed % IDLE_MESSAGES.length]
}

export function Activity() {
  const snapshot = usePolling<ActivitySnapshot>('/api/activity', 15_000)
  const data = snapshot.status === 'ready' ? snapshot.data : undefined
  const sessions = data?.sessions

  const idleCounter = useMemo(() => Math.floor(Date.now() / 5000), [snapshot.status])

  const byDate = useMemo(() => {
    const map = new Map<string, Session[]>()
    const list = sessions?.data ?? []
    for (const session of list.slice(0, 50)) {
      const d = new Date(session.lastActive)
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      const existing = map.get(key) ?? []
      existing.push(session)
      map.set(key, existing)
    }
    return map
  }, [sessions])

  if (snapshot.status === 'pending') {
    return (
      <>
        <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Aktivitas</h1>
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '24px' }}>
          {[...Array(5)].map((_, i) => <SkeletonItem key={i} />)}
        </div>
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Aktivitas</h1>
      <SourceStatus source={sessions} fetchedAt={data?.fetchedAt} request={snapshot} />
      <Unavailable source={sessions} request={snapshot} />
      {snapshot.status === 'failed' && (
        <div style={{ background: 'var(--danger)', color: 'var(--bg)', padding: '14px 18px', marginBottom: '18px', borderRadius: 'var(--radius-md)' }} role="alert">
          <strong>Masalah:</strong> Tidak dapat memuat data aktivitas.{' '}
          <button type="button" className="refresh-button" onClick={snapshot.refresh} style={{ marginLeft: '12px' }}>Muat Ulang</button>
        </div>
      )}
      {sessions?.availability === 'available' && sessions.data.length === 0 && (
        <EmptyState title="Belum ada aktivitas">Tidak ada aktivitas yang tercatat.</EmptyState>
      )}
      {sessions?.availability === 'available' && sessions.data.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '24px' }}>
          {[...byDate.entries()].map(([date, dateSessions]) => (
            <section key={date} style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '13px',
                color: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px',
                marginBottom: '4px',
                position: 'sticky',
                top: 0,
                background: 'var(--bg)',
                zIndex: 1,
              }}>
                {date}
              </h2>
              {dateSessions.map((session, i) => {
                const isIdle = session.active === false || !session.preview
                const idleMsg = isIdle && byDate.size >= 5 ? getIdleMessage(session.actor ?? session.title, idleCounter + i) : undefined
                return <SessionItem key={session.id ?? `${session.title}-${i}`} session={session} idleMessage={idleMsg} />
              })}
            </section>
          ))}
        </div>
      )}
    </>
  )
}