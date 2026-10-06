import { useEffect, useMemo, useState } from 'react'
import { usePolling } from '../polling.ts'
import type { KnowledgeSnapshot, Skill } from '../types.ts'
import { EmptyState, SourceStatus, Unavailable } from '../ui.tsx'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function SkillIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

interface CategoryGroup {
  name: string
  skills: Skill[]
}

function CategoryNode({ group, searchOpen, onToggle }: { group: CategoryGroup; searchOpen: boolean; onToggle: () => void }) {
  const isOpen = searchOpen || false
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          background: 'transparent',
          border: 0,
          color: 'var(--text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 0',
          width: '100%',
          font: 'inherit',
          fontSize: '14px',
          fontWeight: 500,
        }}
        aria-expanded={isOpen}
      >
        <ChevronIcon open={isOpen} />
        <TreeIcon />
        <span>{group.name}</span>
        <span style={{ color: 'var(--muted)', fontSize: '12px', marginLeft: 'auto' }}>({group.skills.length})</span>
      </button>
      {isOpen && (
        <div style={{ paddingLeft: '24px', paddingBottom: '8px' }}>
          {group.skills.map((skill) => (
            <SkillLeaf key={skill.name} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}

function SkillLeaf({ skill }: { skill: Skill }) {
  const color = skill.trust === 'high' ? 'var(--success)' : skill.trust === 'medium' ? 'var(--warning)' : 'var(--danger)'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <SkillIcon />
      <span style={{ flex: 1, fontSize: '13px' }}>{skill.name}</span>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} title={`Trust: ${skill.trust}`} />
      {skill.source && (
        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{skill.source}</span>
      )}
    </div>
  )
}

function SkeletonTree() {
  return (
    <div style={{ marginTop: '24px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '14px', width: '40%', marginBottom: '12px' }} />
          <div style={{ paddingLeft: '24px' }}>
            {[...Array(3)].map((_, j) => (
              <div key={j} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', height: '10px', width: `${70 - j * 15}%`, marginBottom: '8px' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewPanel({ skill }: { skill: Skill }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      marginTop: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-.04em', margin: 0 }}>{skill.name}</h3>
        <span style={{
          background: skill.trust === 'high' ? 'var(--success)' : skill.trust === 'medium' ? 'var(--warning)' : 'var(--danger)',
          color: 'var(--bg)',
          borderRadius: '10px',
          padding: '2px 8px',
          fontSize: '10px',
          fontFamily: 'ui-monospace, monospace',
        }}>
          {skill.trust}
        </span>
      </div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '13px' }}>
        <dt style={{ color: 'var(--muted)' }}>Kategori</dt>
        <dd>{skill.category}</dd>
        <dt style={{ color: 'var(--muted)' }}>Source</dt>
        <dd>{skill.source || '—'}</dd>
      </dl>
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
          Skill ini merupakan bagian dari kategori <strong>{skill.category}</strong>.
          Status: <span style={{ color: skill.status === 'enabled' ? 'var(--success)' : 'var(--muted)' }}>{skill.status}</span>.
        </p>
      </div>
    </div>
  )
}

export function Memory({ onOpenFolders: _onOpenFolders }: { onOpenFolders?: () => void } = {}) {
  const snapshot = usePolling<KnowledgeSnapshot>('/api/knowledge', 30_000)
  const data = snapshot.status === 'ready' ? snapshot.data : undefined
  const skills = data?.skills

  const [query, setQuery] = useState('')
  const [, setOpenCategories] = useState<Set<string>>(new Set())
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  const categories = useMemo(() => {
    const map = new Map<string, Skill[]>()
    const list = skills?.data ?? []
    for (const skill of list) {
      const existing = map.get(skill.category) ?? []
      existing.push(skill)
      map.set(skill.category, existing)
    }
    return [...map.entries()].map(([name, skills]) => ({ name, skills })).sort((a, b) => a.name.localeCompare(b.name))
  }, [skills])

  const filteredCategories = useMemo(() => {
    if (!debouncedQuery.trim()) return categories
    const needle = debouncedQuery.toLowerCase()
    return categories
      .map((group) => ({
        ...group,
        skills: group.skills.filter((s) => s.name.toLowerCase().includes(needle)),
      }))
      .filter((g) => g.skills.length > 0)
  }, [categories, debouncedQuery])

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (snapshot.status === 'pending') {
    return (
      <>
        <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Memory</h1>
        <SkeletonTree />
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-.06em', marginBottom: '20px' }}>Memory</h1>
      <SourceStatus source={skills} fetchedAt={data?.fetchedAt} request={snapshot} />
      <Unavailable source={skills} request={snapshot} />
      {snapshot.status === 'failed' && (
        <div style={{ background: 'var(--danger)', color: 'var(--bg)', padding: '14px 18px', marginBottom: '18px', borderRadius: 'var(--radius-md)' }} role="alert">
          <strong>Masalah:</strong> Tidak dapat memuat data knowledge.{' '}
          <button type="button" className="refresh-button" onClick={snapshot.refresh} style={{ marginLeft: '12px' }}>Muat Ulang</button>
        </div>
      )}
      {skills?.availability === 'available' && skills.data.length === 0 && (
        <EmptyState title="Belum ada skill">Tidak ada skill yang tersedia.</EmptyState>
      )}
      {skills?.availability === 'available' && skills.data.length > 0 && (
        <>
          <div className="toolbar" style={{ marginTop: '24px' }}>
            <input
              type="search"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari skill"
              aria-label="Cari skill"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text)', padding: '8px 10px', flex: '1 1 220px', maxWidth: '360px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: selectedSkill ? 'minmax(0, 1fr) 360px' : '1fr', gap: '24px', marginTop: '20px' }}>
            <div>
              {filteredCategories.length === 0 && debouncedQuery && (
                <p style={{ color: 'var(--muted)', padding: '20px 0' }}>Tidak ada skill yang cocok dengan "{debouncedQuery}"</p>
              )}
              {filteredCategories.map((group) => (
                <CategoryNode
                  key={group.name}
                  group={group}
                  searchOpen={Boolean(debouncedQuery)}
                  onToggle={() => {
                    toggleCategory(group.name)
                    if (!selectedSkill && group.skills.length > 0) {
                      setSelectedSkill(group.skills[0])
                    }
                  }}
                />
              ))}
            </div>
            {selectedSkill && (
              <div style={{ position: 'sticky', top: '16px', alignSelf: 'start' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSkill(null)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  aria-label="Tutup preview"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Tutup
                </button>
                <PreviewPanel skill={selectedSkill} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}