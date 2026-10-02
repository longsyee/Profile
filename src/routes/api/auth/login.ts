import { createFileRoute } from '@tanstack/react-router'
import { createAdminSession, createSessionCookie, isSameOriginRequest, verifyPassword } from '../../../server/auth'
import { ensureDatabaseSchema, getDatabase, isDatabaseConfigured } from '../../../server/database'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        }
        if (!isDatabaseConfigured()) {
          return Response.json({ error: 'The admin database is not configured yet.' }, { status: 503 })
        }

        try {
          const body = await request.json() as { email?: unknown; password?: unknown }
          const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
          const password = typeof body.password === 'string' ? body.password : ''
          if (!email || !password || email.length > 254 || password.length > 256) {
            return Response.json({ error: 'Enter a valid email and password.' }, { status: 400 })
          }

          await ensureDatabaseSchema()
          const result = await getDatabase().query<{ id: number; password_hash: string }>(
            'SELECT id, password_hash FROM admin_users WHERE email = $1 LIMIT 1',
            [email],
          )
          const admin = result.rows[0]
          const valid = await verifyPassword(password, admin?.password_hash)
          if (!admin || !valid) {
            return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 })
          }

          const session = await createAdminSession(admin.id)
          return Response.json(
            { authenticated: true },
            { headers: { 'Set-Cookie': createSessionCookie(session.token, session.maxAge) } },
          )
        } catch {
          return Response.json({ error: 'The admin service could not reach its database.' }, { status: 503 })
        }
      },
    },
  },
})
