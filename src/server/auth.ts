import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { ensureDatabaseSchema, getDatabase } from './database'

const scryptAsync = promisify(scrypt)
const COOKIE_NAME = 'edwin_admin'
const SESSION_DAYS = 14

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  for (const item of cookieHeader.split(';')) {
    const [key, ...value] = item.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password, salt, 64) as Buffer
  return `scrypt$${salt}$${key.toString('hex')}`
}

export async function verifyPassword(password: string, encoded: string | null | undefined) {
  const parts = encoded?.split('$')
  if (!parts || parts.length !== 3 || parts[0] !== 'scrypt') {
    await scryptAsync(password, 'edwin-portfolio-dummy-salt', 64)
    return false
  }
  const expected = Buffer.from(parts[2], 'hex')
  if (expected.length !== 64) return false
  const actual = await scryptAsync(password, parts[1], expected.length) as Buffer
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function createSessionCookie(token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export async function createAdminSession(adminId: number | string) {
  await ensureDatabaseSchema()
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await getDatabase().query(
    'INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash, adminId, expires],
  )
  return { token, maxAge: SESSION_DAYS * 24 * 60 * 60 }
}

export async function getAdminSession(request: Request) {
  const token = readCookie(request, COOKIE_NAME)
  if (!token) return null
  await ensureDatabaseSchema()
  const result = await getDatabase().query<{ id: number; email: string }>(
    `SELECT admin_users.id, admin_users.email
     FROM admin_sessions
     JOIN admin_users ON admin_users.id = admin_sessions.admin_id
     WHERE admin_sessions.token_hash = $1 AND admin_sessions.expires_at > now()`,
    [hashToken(token)],
  )
  return result.rows[0] ?? null
}

export async function deleteAdminSession(request: Request) {
  const token = readCookie(request, COOKIE_NAME)
  if (token) {
    await ensureDatabaseSchema()
    await getDatabase().query('DELETE FROM admin_sessions WHERE token_hash = $1', [hashToken(token)])
  }
  return createSessionCookie('', 0)
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}
