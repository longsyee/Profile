import { Pool } from 'pg'

let pool: Pool | undefined
let schemaSetup: Promise<void> | undefined

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured.')
  pool ??= new Pool({ connectionString, max: 8, idleTimeoutMillis: 30_000 })
  return pool
}

export async function ensureDatabaseSchema() {
  if (!schemaSetup) {
    schemaSetup = getDatabase().query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash CHAR(64) PRIMARY KEY,
        admin_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions (expires_at);

      CREATE TABLE IF NOT EXISTS portfolio_projects (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        live_url TEXT,
        source_url TEXT,
        published BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `).then(() => undefined).catch((error: unknown) => {
      schemaSetup = undefined
      throw error
    })
  }
  await schemaSetup
}
