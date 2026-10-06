import type { AddressInfo } from 'node:net'
import express from 'express'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccessStore, issueToken } from './access.js'
import { installEvents } from './events.js'

const app = express()
app.disable('x-powered-by')

const accessStore = new AccessStore()
installEvents(app, accessStore)

let close: () => void
let base: string

beforeEach(async () => {
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  close = () => server.close()
})

afterEach(() => close())

describe('GET /api/events', () => {
  it('returns SSE headers without access code', async () => {
    const response = await fetch(`${base}/api/events`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
    expect(response.headers.get('Connection')).toBe('keep-alive')
    response.body?.cancel()
  })

  it('sends a heartbeat event without access code', async () => {
    const response = await fetch(`${base}/api/events`)
    expect(response.ok).toBe(true)
    const reader = response.body?.getReader()
    expect(reader).toBeDefined()
    if (!reader) return

    const decoder = new TextDecoder()
    let heartbeatFound = false

    await new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => resolve(), 3000)
      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) { resolve(); return }
          const text = decoder.decode(value, { stream: true })
          if (text.includes('event: heartbeat')) {
            heartbeatFound = true
            clearTimeout(timeoutId)
            resolve()
            return
          }
          read()
        })
      }
      read()
    })
    reader.cancel()
    expect(heartbeatFound).toBe(true)
  })

  it('rejects without token when access is enabled', async () => {
    await accessStore.set('long-access-code-here')
    const response = await fetch(`${base}/api/events`)
    expect(response.status).toBe(401)
    const body = await response.json() as { error?: string }
    expect(body.error).toContain('locked')
    await accessStore.clear()
  })

  it('accepts with valid token when access is enabled', async () => {
    const file = await accessStore.set('long-access-code-here')
    const token = issueToken(file, false)
    const response = await fetch(`${base}/api/events?token=${encodeURIComponent(token)}`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    response.body?.cancel()
    await accessStore.clear()
  })
})
