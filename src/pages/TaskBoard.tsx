import { useEffect, useRef, useState } from 'react'
import { formatDateTime, statusTone } from '../format.ts'
import { usePolling } from '../polling.ts'
import { loadSnapshot, type RequestState } from '../request-state.ts'
import type { Task, TaskBoardSnapshot, TaskDetailSnapshot } from '../types.ts'
import { EmptyState, SearchInput, SourceStatus, Unavailable } from '../ui.tsx'

const UNASSIGNED = '(tanpa assignee)'

function initials(name: string): string {
  return name.split(/[\s_-]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function Avatar({ name }: { name: string }) {
  const label = name === UNASSIGNED ? '?' : initials(name)
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill={`hsl(${hue}, 55%, 35%)`} stroke="none"/>
      <text x="16" y="21" textAnchor="middle" fill="white" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">{label}</text>
    </svg>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', marginTop: '14px' }}>
      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '16px', width: '80%', marginBottom: '10px' }}/>
      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '12px', width: '50%' }}/>
    </div>
  )
}

function SkeletonBoard() {
  return (
    <div className="board">
      {['todo', 'running', 'review', 'done'].map((status) => (
        <article key={status} className="column" style={{ borderTop: '3px solid var(--muted)', background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', minWidth: '220px' }}>
          <header className="column-head">
            <span style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{status}</span>
            <span style={{ background: 'var(--border)', borderRadius: '9px', padding: '2px 8px', fontSize: '11px', color: 'var(--muted)' }}>—</span>
          </header>
          <SkeletonCard />
          <SkeletonCard />
        </article>
      ))}
    </div>
  )
}

export function TaskDetailDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const [state, setState] = useState<RequestState<TaskDetailSnapshot>>({ status: 'pending' })
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!task.id) return
    let active = true
    setState({ status: 'pending' })
    const boardParam = task.board ? `?board=${encodeURIComponent(task.board)}` : ''
    void loadSnapshot<TaskDetailSnapshot>(`/api/tasks/${encodeURIComponent(task.id)}${boardParam}`).then((next) => { if (active) setState(next) })
    return () => { active = false }
  }, [task.id, task.board])

  const detail = state.status === 'ready' && state.data.task.availability === 'available' ? state.data.task.data : null
  const status = detail?.status ?? task.status

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
      <section className="office-detail task-detail" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onKeyDown={onKeyDown}>
        <button className="office-close" ref={closeRef} onClick={onClose} aria-label="Tutup detail tugas">Tutup</button>
        <h2 id="task-detail-title">{detail?.title ?? task.title}</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <span className={`badge ${statusTone(status)}`}>{status}</span>
          <span style={{ background: 'var(--border)', borderRadius: '10px', padding: '3px 8px', fontSize: '10px', fontFamily: 'ui-monospace, monospace' }}>{detail?.assignee ?? task.assignee ?? UNASSIGNED}</span>
          {(detail?.priority ?? task.priority) && <span style={{ background: 'var(--warning)', color: 'var(--bg)', borderRadius: '10px', padding: '3px 8px', fontSize: '10px', fontFamily: 'ui-monospace, monospace' }}>P{detail?.priority ?? task.priority}</span>}
        </div>
        {state.status === 'pending' && <p style={{ color: 'var(--muted)', marginTop: '16px' }}>Memuat detail...</p>}
        {state.status === 'failed' && <p style={{ color: 'var(--danger)', marginTop: '16px' }}>Tidak dapat memuat detail tugas.</p>}
        {detail && (
          <>
            <dl className="office-detail-grid task-grid" style={{ marginTop: '18px' }}>
              <Field label="Board" value={task.board} />
              <Field label="Dibuat" value={detail.createdAt ? `${formatDateTime(detail.createdAt)}` : null} />
              <Field label="Workspace" value={detail.workspace} />
              <Field label="Branch" value={detail.branch} />
              <Field label="Model" value={detail.model} />
              <Field label="Tenant" value={detail.tenant} />
              <Field label="Skills" value={detail.skills.join(', ')} />
            </dl>
            {detail.body && (
              <section className="task-section">
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Deskripsi</h3>
                <pre className="task-text">{detail.body}</pre>
              </section>
            )}
            {detail.runs.length > 0 && (
              <section className="task-section">
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Runs ({detail.runs.length})</h3>
                <table className="log-table">
                  <thead>
                    <tr><th>Run</th><th>Profile</th><th>Status</th><th>Mulai</th><th>Selesai</th></tr>
                  </thead>
                  <tbody>
                    {detail.runs.map((run) => (
                      <tr key={run.id}>
                        <td>#{run.id}</td>
                        <td>{run.profile ?? '—'}</td>
                        <td>
                          <span className={`badge ${statusTone(run.outcome ?? run.status ?? '')}`}>{run.outcome ?? run.status ?? '—'}</span>
                          {run.error && <div style={{ color: 'var(--danger)', fontSize: '12px' }}>{run.error}</div>}
                        </td>
                        <td>{formatDateTime(run.startedAt)}</td>
                        <td>{formatDateTime(run.endedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {detail.comments.length > 0 && (
              <section className="task-section">
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Komentar ({detail.comments.length})</h3>
                <ul className="task-timeline">
                  {detail.comments.map((comment, index) => (
                    <li key={index}>
                      <b>{comment.author}</b>
                      <small style={{ color: 'var(--muted)' }}>{formatDateTime(comment.createdAt)}</small>
                      <p>{comment.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {detail.events.length > 0 && (
              <section className="task-section">
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Aktivitas ({detail.events.length})</h3>
                <ul className="task-timeline">
                  {[...detail.events].reverse().map((event, index) => (
                    <li key={index}>
                      <b>{event.kind}</b>
                      <small style={{ color: 'var(--muted)' }}>{formatDateTime(event.createdAt)}{event.runId ? ` · run #${event.runId}` : ''}</small>
                      {event.detail && <code style={{ display: 'block', marginTop: '4px' }}>{event.detail}</code>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export function TaskBoard() {
  const snapshot = usePolling<TaskBoardSnapshot>('/api/tasks', 10_000)
  const [query, setQuery] = useState('')
  const [assignee, setAssignee] = useState('all')
  const [board, setBoard] = useState('all')
  const [openTask, setOpenTask] = useState<Task | undefined>()
  const trigger = useRef<HTMLButtonElement | null>(null)
  const closeTask = () => { setOpenTask(undefined); trigger.current?.focus() }

  const data = snapshot.status === 'ready' ? snapshot.data : undefined
  const tasks = data?.tasks
  const all = tasks?.data ?? []
  const boards = data?.boards ?? []

  const needle = query.trim().toLowerCase()
  const visible = all.filter((task) => {
    const matchAssignee = assignee === 'all' || (task.assignee ?? UNASSIGNED) === assignee
    const matchBoard = board === 'all' || task.board === board
    const matchSearch = !needle || `${task.title} ${task.id ?? ''} ${task.assignee ?? ''}`.toLowerCase().includes(needle)
    return matchAssignee && matchBoard && matchSearch
  })

  const columns = ['todo', 'running', 'review', 'done']

  const statusColor: Record<string, string> = {
    todo: 'var(--muted)',
    running: 'var(--success)',
    review: 'var(--warning)',
    done: 'var(--info)',
  }

  if (snapshot.status === 'pending') {
    return (
      <>
        <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Task Board</h1>
        <SkeletonBoard />
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Task Board</h1>
      <SourceStatus source={tasks} fetchedAt={data?.fetchedAt} request={snapshot} />
      <Unavailable source={tasks} request={snapshot} />
      {snapshot.status === 'failed' && (
        <div style={{ background: 'var(--danger)', color: 'var(--bg)', padding: '14px 18px', marginBottom: '18px', borderRadius: 'var(--radius-md)' }} role="alert">
          <strong>Masalah:</strong> Tidak dapat memuat data task board.{' '}
          <button type="button" className="refresh-button" onClick={snapshot.refresh} style={{ marginLeft: '12px' }}>Muat Ulang</button>
        </div>
      )}
      {tasks?.availability === 'available' && all.length === 0 && (
        <EmptyState title="Tidak ada tugas">Belum ada tugas di board.</EmptyState>
      )}
      {tasks?.availability === 'available' && all.length > 0 && (
        <>
          <div className="toolbar">
            <SearchInput value={query} onChange={setQuery} label="Cari tugas" />
            <label className="select-label">
              Assignee
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text)', padding: '8px 10px' }}>
                <option value="all">Semua</option>
                {[...new Set(all.map((t) => t.assignee ?? UNASSIGNED))].sort().map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            {boards.length > 0 && (
              <label className="select-label">
                Board
                <select value={board} onChange={(e) => setBoard(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text)', padding: '8px 10px' }}>
                  <option value="all">Semua board</option>
                  {boards.map((b) => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </select>
              </label>
            )}
            <span className="toolbar-count">{visible.length} ditampilkan</span>
          </div>
          <section className="board" aria-label="Kanban board">
            {columns.map((status) => {
              const items = visible.filter((task) => task.status === status).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
              return (
                <article key={status} style={{ borderTop: `3px solid ${statusColor[status] || 'var(--muted)'}`, background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', minWidth: '220px' }} aria-label={`Kolom ${status}`}>
                  <header className="column-head">
                    <span style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{status}</span>
                    <span className="column-count">{items.length}</span>
                  </header>
                  {items.length === 0 ? (
                    <p className="column-empty">Tidak ada tugas di kolom ini</p>
                  ) : (
                    items.map((task) => (
                      <button
                        type="button"
                        key={`${task.board ?? ''}-${task.status}-${task.id ?? task.title}`}
                        className="task-card"
                        onClick={(event) => { trigger.current = event.currentTarget; setOpenTask(task) }}
                        aria-label={`${task.title}. ${task.status}. Buka Detail.`}
                        style={{ background: 'transparent', borderLeft: 0, borderRight: 0, borderBottom: 0, color: 'inherit', cursor: 'pointer', font: 'inherit', textAlign: 'left', width: '100%', padding: '14px 0 0', display: 'grid', gap: '10px' }}
                      >
                        <strong style={{ fontSize: '15px', fontWeight: 500, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.title}</strong>
                        <div className="task-meta" style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <Avatar name={task.assignee ?? UNASSIGNED} />
                          {task.priority && (
                            <span style={{ background: 'var(--warning)', color: 'var(--bg)', borderRadius: '10px', padding: '3px 8px', fontSize: '10px', fontFamily: 'ui-monospace, monospace' }}>P{task.priority}</span>
                          )}
                          {task.board && (
                            <span style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '3px 8px', fontSize: '10px', color: 'var(--muted)' }}>{task.board}</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </article>
              )
            })}
          </section>
        </>
      )}
      {openTask && (
        <TaskDetailDialog
          key={`${openTask.board ?? ''}-${openTask.id ?? openTask.title}`}
          task={openTask}
          onClose={closeTask}
        />
      )}
    </>
  )
}