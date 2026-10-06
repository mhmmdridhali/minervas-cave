import type { Request, Response } from 'express'
import { AccessStore } from './access.js'
import { getOffice, getActivity, getTaskBoard, getSnapshot } from './mission-control.js'

const SSE_KEEPALIVE_MS = 15_000

export function installEvents(app: { get: (path: string, handler: (req: Request, res: Response) => void) => void }, accessStore: AccessStore) {
  app.get('/api/events', async (request: Request, response: Response) => {
    const state = await accessStore.state()
    if (state.enabled && state.file) {
      const token = typeof request.query.token === 'string' ? request.query.token : undefined
      if (!tokenValid(state.file, token)) {
        response.status(401).json({ error: 'Minerva\u2019s Cave is locked. Enter the access code.', locked: true })
        return
      }
    }

    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.setHeader('X-Accel-Buffering', 'no')
    response.flushHeaders()

    let closed = false

    const send = (event: string, data: unknown) => {
      if (closed) return
      response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const heartbeat = () => { send('heartbeat', { ts: new Date().toISOString() }) }

    let lastOffice: string | undefined
    let lastActivity: string | undefined
    let lastTasks: string | undefined
    let lastRuntime: string | undefined

    const poll = async () => {
      if (closed) return
      try {
        const [office, activity, tasks, runtime] = await Promise.all([
          getOffice(),
          getActivity(),
          getTaskBoard(),
          getSnapshot(),
        ])

        const officeStr = JSON.stringify(office)
        if (officeStr !== lastOffice) { lastOffice = officeStr; send('office', office) }

        const activityStr = JSON.stringify(activity)
        if (activityStr !== lastActivity) { lastActivity = activityStr; send('activity', activity) }

        const tasksStr = JSON.stringify(tasks)
        if (tasksStr !== lastTasks) { lastTasks = tasksStr; send('tasks', tasks) }

        const runtimeStr = JSON.stringify(runtime)
        if (runtimeStr !== lastRuntime) { lastRuntime = runtimeStr; send('runtime', runtime) }
      } catch {
        // silently ignore poll errors in SSE
      }
    }

    heartbeat()
    void poll()

    const intervalId = setInterval(() => {
      if (!closed) { heartbeat(); void poll() }
    }, SSE_KEEPALIVE_MS)

    request.on('close', () => {
      closed = true
      clearInterval(intervalId)
      response.end()
    })
  })
}

// re-export tokenValid for test
import { tokenValid } from './access.js'
