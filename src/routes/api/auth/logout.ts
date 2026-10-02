import { createFileRoute } from '@tanstack/react-router'
import { createSessionCookie, deleteAdminSession, isSameOriginRequest } from '../../../server/auth'
import { isDatabaseConfigured } from '../../../server/database'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        }
        try {
          const cookie = isDatabaseConfigured()
            ? await deleteAdminSession(request)
            : createSessionCookie('', 0)
          return Response.json({ authenticated: false }, { headers: { 'Set-Cookie': cookie } })
        } catch {
          return Response.json({ error: 'Could not end the session.' }, { status: 503 })
        }
      },
    },
  },
})
