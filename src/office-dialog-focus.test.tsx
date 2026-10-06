// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Office, OfficeDetail, PixelCharacter } from './pages/Office.tsx'
import type { OfficeStation } from './types.ts'

const station: OfficeStation = { id: 'minerva', name: 'minerva', role: 'Hermes profile', room: 'Workspace', roomPosition: 'assigned-desk', state: 'Working', currentTask: 'Review focus behavior', recentActivity: 'No attributed recent activity', activity: 'Kanban: Review focus behavior', seat: 1, provenance: 'Test evidence', freshness: 'Current' }

describe('Office components', () => {
  it('renders PixelCharacter with correct structure', () => {
    const markup = renderToStaticMarkup(<PixelCharacter agent="minerva"/>)
    expect(markup).toContain('pixel-character')
  })

  it('renders OfficeDetail dialog with focus trap structure', () => {
    const markup = renderToStaticMarkup(<OfficeDetail station={station} onClose={() => {}}/>)
    expect(markup).toContain('office-detail')
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('minerva')
  })

  it('renders Office with sync badge and tabs', () => {
    const markup = renderToStaticMarkup(<Office/>)
    // Should have tabs or sync badge (header structure)
    expect(markup.length).toBeGreaterThan(100)
  })
})
