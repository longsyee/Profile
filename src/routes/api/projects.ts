import { createFileRoute } from '@tanstack/react-router'
import { getAdminSession, isSameOriginRequest } from '../../server/auth'
import { ensureDatabaseSchema, getDatabase, isDatabaseConfigured } from '../../server/database'

type ProjectInput = {
  title?: unknown
  category?: unknown
  description?: unknown
  image_url?: unknown
  live_url?: unknown
  source_url?: unknown
  published?: unknown
  sort_order?: unknown
}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function optionalUrl(value: unknown) {
  const candidate = text(value, 2048)
  if (!candidate) return null
  if (candidate.startsWith('/uploads/')) return candidate
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function normalizeProject(body: ProjectInput) {
  const title = text(body.title, 120)
  const category = text(body.category, 80)
  const description = text(body.description, 1000)
  const imageUrl = optionalUrl(body.image_url)
  const liveUrl = optionalUrl(body.live_url)
  const sourceUrl = optionalUrl(body.source_url)
  const sortOrder = Number.isInteger(body.sort_order) ? Number(body.sort_order) : 0
  if (!title || !category || !description) return null
  if ((body.image_url && !imageUrl) || (body.live_url && !liveUrl) || (body.source_url && !sourceUrl)) return null
  return {
    title,
    category,
    description,
    image_url: imageUrl,
    live_url: liveUrl,
    source_url: sourceUrl,
    published: body.published !== false,
    sort_order: Math.min(9999, Math.max(-9999, sortOrder)),
  }
}

export const Route = createFileRoute('/api/projects')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isDatabaseConfigured()) return Response.json({ configured: false, projects: [] })
        try {
          await ensureDatabaseSchema()
          const wantsAll = new URL(request.url).searchParams.get('all') === '1'
          const admin = wantsAll ? await getAdminSession(request) : null
          const query = admin
            ? 'SELECT id, title, category, description, image_url, live_url, source_url, published, sort_order FROM portfolio_projects ORDER BY sort_order, id'
            : 'SELECT id, title, category, description, image_url, live_url, source_url, published, sort_order FROM portfolio_projects WHERE published = true ORDER BY sort_order, id'
          const result = await getDatabase().query(query)
          return Response.json({ configured: true, projects: result.rows })
        } catch {
          return Response.json({ error: 'Could not load projects.' }, { status: 503 })
        }
      },

      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        try {
          if (!await getAdminSession(request)) return Response.json({ error: 'Sign in to manage projects.' }, { status: 401 })
          const input = normalizeProject(await request.json() as ProjectInput)
          if (!input) return Response.json({ error: 'Add a title, category, and description, and check each URL.' }, { status: 400 })
          const result = await getDatabase().query(
            `INSERT INTO portfolio_projects (title, category, description, image_url, live_url, source_url, published, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, title, category, description, image_url, live_url, source_url, published, sort_order`,
            [input.title, input.category, input.description, input.image_url, input.live_url, input.source_url, input.published, input.sort_order],
          )
          return Response.json({ project: result.rows[0] }, { status: 201 })
        } catch (error) {
          const status = error instanceof Error && error.message.includes('DATABASE_URL') ? 503 : 500
          return Response.json({ error: status === 503 ? 'The admin database is not configured.' : 'Could not save this project.' }, { status })
        }
      },

      PATCH: async ({ request }) => {
        if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        try {
          if (!await getAdminSession(request)) return Response.json({ error: 'Sign in to manage projects.' }, { status: 401 })
          const body = await request.json() as ProjectInput & { id?: unknown }
          const id = Number(body.id)
          const input = normalizeProject(body)
          if (!Number.isSafeInteger(id) || id < 1 || !input) {
            return Response.json({ error: 'Check the project details and try again.' }, { status: 400 })
          }
          const result = await getDatabase().query(
            `UPDATE portfolio_projects SET title=$1, category=$2, description=$3, image_url=$4, live_url=$5,
             source_url=$6, published=$7, sort_order=$8, updated_at=now() WHERE id=$9
             RETURNING id, title, category, description, image_url, live_url, source_url, published, sort_order`,
            [input.title, input.category, input.description, input.image_url, input.live_url, input.source_url, input.published, input.sort_order, id],
          )
          if (!result.rowCount) return Response.json({ error: 'That project no longer exists.' }, { status: 404 })
          return Response.json({ project: result.rows[0] })
        } catch {
          return Response.json({ error: 'Could not update this project.' }, { status: 500 })
        }
      },

      DELETE: async ({ request }) => {
        if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        try {
          if (!await getAdminSession(request)) return Response.json({ error: 'Sign in to manage projects.' }, { status: 401 })
          const body = await request.json() as { id?: unknown }
          const id = Number(body.id)
          if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: 'Choose a valid project.' }, { status: 400 })
          const result = await getDatabase().query('DELETE FROM portfolio_projects WHERE id=$1', [id])
          if (!result.rowCount) return Response.json({ error: 'That project no longer exists.' }, { status: 404 })
          return Response.json({ deleted: true })
        } catch {
          return Response.json({ error: 'Could not delete this project.' }, { status: 500 })
        }
      },
    },
  },
})
