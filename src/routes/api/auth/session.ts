import { createFileRoute } from '@tanstack/react-router'
import { getAdminSession } from '../../../server/auth'
import { ensureDatabaseSchema, isDatabaseConfigured } from '../../../server/database'

export const Route = createFileRoute('/api/auth/session')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isDatabaseConfigured()) {
          return Response.json({ configured: false, authenticated: false })
        }
        try {
          await ensureDatabaseSchema()
          const admin = await getAdminSession(request)
          return Response.json({ configured: true, authenticated: Boolean(admin) })
        } catch {
          return Response.json({ configured: true, authenticated: false, error: 'The database connection is unavailable.' }, { status: 503 })
        }
      },
    },
  },
})
