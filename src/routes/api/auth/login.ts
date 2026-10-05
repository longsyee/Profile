import { createFileRoute } from '@tanstack/react-router'
import { createAdminSession, createSessionCookie, isSameOriginRequest, verifyPassword } from '../../../server/auth'
import { ensureDatabaseSchema, getDatabase, isDatabaseConfigured } from '../../../server/database'

// This limiter is intentionally bounded and process-local. Production deployments
// with multiple app instances should enforce the same policy at a shared edge.
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = positiveInteger(process.env.LOGIN_RATE_LIMIT_ATTEMPTS, 10)
const MAX_BUCKETS = 10_000
const attempts = new Map<string, { count: number; resetAt: number }>()

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function clientKeys(request: Request, email: string) {
  // The account key applies across addresses, even if a client forges its forwarded address.
  // Trust forwarded addresses only when the ingress overwrites the header.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded && forwarded.length <= 128 ? forwarded : 'unknown-address'
  return [`address:${address}`, `account:${email.toLowerCase()}`]
}

function checkRateLimit(key: string) {
  const now = Date.now()
  for (const [bucket, value] of attempts) if (value.resetAt <= now) attempts.delete(bucket)
  let current = attempts.get(key)
  if (!current) {
    if (attempts.size >= MAX_BUCKETS) return false
    current = { count: 0, resetAt: now + WINDOW_MS }
    attempts.set(key, current)
  }
  if (current.count >= MAX_ATTEMPTS) return false
  current.count += 1
  return true
}

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
          if (!clientKeys(request, email).every(checkRateLimit)) {
            return Response.json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, {
              status: 429,
              headers: { 'Retry-After': String(Math.ceil(WINDOW_MS / 1000)) },
            })
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
