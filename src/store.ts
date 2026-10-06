import { useCallback, useEffect, useRef, useState } from 'react'
import type { ActivitySnapshot, OfficeSnapshot, RuntimeSnapshot, TaskBoardSnapshot } from './types.ts'

export interface CaveStore {
  office: OfficeSnapshot | undefined
  activity: ActivitySnapshot | undefined
  tasks: TaskBoardSnapshot | undefined
  runtime: RuntimeSnapshot | undefined
  lastUpdated: number | undefined
}

export type ConnectionStatus = 'connecting' | 'live' | 'polling' | 'error'

interface CaveStoreState extends CaveStore {
  status: ConnectionStatus
}

const BC_NAME = 'cave-sync'
const LEADER_KEY = 'cave-sync-leader'
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

function getToken(): string {
  const match = document.cookie.match(/ruang_session=([^;]+)/)
  return match ? `?token=${encodeURIComponent(match[1])}` : ''
}

function useStore(): CaveStoreState {
  const [state, setState] = useState<CaveStoreState>({
    office: undefined,
    activity: undefined,
    tasks: undefined,
    runtime: undefined,
    lastUpdated: undefined,
    status: 'connecting',
  })

  const esRef = useRef<EventSource | null>(null)
  const bcRef = useRef<BroadcastChannel | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryDelayRef = useRef(RECONNECT_BASE_MS)
  const isLeaderRef = useRef(false)
  const mountedRef = useRef(true)

  const setSlice = useCallback(<K extends keyof CaveStore>(key: K, value: CaveStore[K]) => {
    setState((prev) => ({ ...prev, [key]: value, lastUpdated: Date.now() }))
  }, [])

  const clearRetry = useCallback(() => {
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null }
  }, [])

  const broadcastState = useCallback((slice: Partial<CaveStore>) => {
    try {
      bcRef.current?.postMessage({ ...slice, ts: Date.now() })
    } catch {
      // BroadcastChannel not available
    }
  }, [])

  const becomeLeader = useCallback(() => {
    if (isLeaderRef.current) return
    isLeaderRef.current = true
    try {
      localStorage.setItem(LEADER_KEY, String(Date.now()))
    } catch {
      // localStorage not available
    }
  }, [])

  const connectSSE = useCallback(() => {
    if (!mountedRef.current) return
    clearRetry()

    const url = `/api/events${getToken()}`
    let es: EventSource
    try {
      es = new EventSource(url)
    } catch {
      setState((prev) => ({ ...prev, status: 'error' }))
      return
    }
    esRef.current = es

    es.onopen = () => {
      if (!mountedRef.current) return
      retryDelayRef.current = RECONNECT_BASE_MS
      setState((prev) => ({ ...prev, status: 'live' }))
      if (!isLeaderRef.current) becomeLeader()
    }

    es.onerror = () => {
      if (!mountedRef.current) return
      es.close()
      esRef.current = null
      setState((prev) => prev.status === 'live' ? { ...prev, status: 'polling' } : prev)
      const delay = retryDelayRef.current
      retryDelayRef.current = Math.min(delay * 2, RECONNECT_MAX_MS)
      retryRef.current = setTimeout(() => { if (mountedRef.current) connectSSE() }, delay)
    }

    es.addEventListener('heartbeat', () => {
      if (!mountedRef.current) return
      setState((prev) => ({ ...prev, lastUpdated: Date.now() }))
    })

    es.addEventListener('office', (e) => {
      try {
        const data = JSON.parse(e.data) as OfficeSnapshot
        setSlice('office', data)
        broadcastState({ office: data })
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener('activity', (e) => {
      try {
        const data = JSON.parse(e.data) as ActivitySnapshot
        setSlice('activity', data)
        broadcastState({ activity: data })
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener('tasks', (e) => {
      try {
        const data = JSON.parse(e.data) as TaskBoardSnapshot
        setSlice('tasks', data)
        broadcastState({ tasks: data })
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener('runtime', (e) => {
      try {
        const data = JSON.parse(e.data) as RuntimeSnapshot
        setSlice('runtime', data)
        broadcastState({ runtime: data })
      } catch {
        // ignore parse errors
      }
    })
  }, [broadcastState, becomeLeader, clearRetry, setSlice])

  useEffect(() => {
    mountedRef.current = true

    // Set up BroadcastChannel for cross-tab sync
    try {
      bcRef.current = new BroadcastChannel(BC_NAME)
      bcRef.current.onmessage = (e) => {
        const { office, activity, tasks, runtime, ts } = e.data
        if (!ts) return
        setState((prev) => ({
          ...prev,
          ...(office !== undefined ? { office } : {}),
          ...(activity !== undefined ? { activity } : {}),
          ...(tasks !== undefined ? { tasks } : {}),
          ...(runtime !== undefined ? { runtime } : {}),
          lastUpdated: ts,
        }))
      }
    } catch {
      // BroadcastChannel not available
    }

    // Leader election: only the oldest tab connects SSE
    const checkLeader = () => {
      try {
        const stored = localStorage.getItem(LEADER_KEY)
        const age = stored ? Date.now() - Number(stored) : Infinity
        if (age < 0) return // Our stamp
        isLeaderRef.current = false
      } catch {
        isLeaderRef.current = false
      }
    }
    checkLeader()
    if (!isLeaderRef.current) {
      setState((prev) => ({ ...prev, status: 'polling' }))
      return () => {}
    }

    connectSSE()

    return () => {
      mountedRef.current = false
      clearRetry()
      esRef.current?.close()
      bcRef.current?.close()
      if (isLeaderRef.current) {
        try { localStorage.removeItem(LEADER_KEY) } catch { /* ignore */ }
      }
    }
  }, [connectSSE, clearRetry])

  return state
}

export function useCaveStore() {
  return useStore()
}
