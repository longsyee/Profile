import { hashPassword } from '../src/server/auth'
import { ensureDatabaseSchema, getDatabase } from '../src/server/database'

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before creating the admin account.')
  if (!email || !email.includes('@') || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD. Use a password with at least 12 characters.')
  }

  await ensureDatabaseSchema()
  const passwordHash = await hashPassword(password)
  await getDatabase().query(
    `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, passwordHash],
  )
  await getDatabase().end()
  console.log(`Admin account ready for ${email}.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Admin account setup failed.')
  process.exitCode = 1
})
