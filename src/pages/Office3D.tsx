import { Component, lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { OfficeStation } from '../types.ts'

const Office3DScene = lazy(() => import('../scene3d/Office3DScene').then(m => ({ default: m.Office3DScene as ComponentType<any> })))
const Office2DGrid = lazy(() => import('../scene3d/Office2DGrid').then(m => ({ default: m.Office2DGrid as ComponentType<any> })))

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function SceneSkeleton() {
  return (
    <div className="office-3d-skeleton" aria-label="Loading 3D office..." role="status">
      <div className="skeleton-pulse" />
      <span>Loading 3D office...</span>
    </div>
  )
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

interface Office3DProps {
  stations: OfficeStation[]
  onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void
}

export default function Office3D({ stations, onSelect }: Office3DProps) {
  const [visible, setVisible] = useState(true)
  const glRef = useRef<WebGLRenderingContext | null>(null)

  const shouldUse2D = !webglAvailable() || prefersReducedMotion()

  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleSelect = (station: OfficeStation, trigger: HTMLElement | null) => {
    onSelect(station, trigger)
  }

  if (shouldUse2D) {
    return (
      <Suspense fallback={<SceneSkeleton />}>
        <Office2DGrid stations={stations} onSelect={handleSelect} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<SceneSkeleton />}>
      {visible ? (
        <SceneBoundary
          fallback={
            <div className="office-3d-unavailable" role="alert">
              <h2>Tampilan 3D tidak tersedia</h2>
              <p>Perangkat ini tidak mendukung WebGL. Silakan gunakan tampilan 2D.</p>
              <button type="button" className="refresh-button" onClick={() => window.location.hash = '#/office-2d'}>
                Buka Kantor 2D
              </button>
            </div>
          }
        >
          <Office3DScene stations={stations} onSelect={handleSelect} glRef={glRef} />
        </SceneBoundary>
      ) : (
        <div className="office-3d-paused" aria-label="3D office paused - tab not visible" role="status">
          <span>3D office paused</span>
        </div>
      )}
    </Suspense>
  )
}
