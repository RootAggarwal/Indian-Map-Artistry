import pg from "pg"

const { Pool, types } = pg

types.setTypeParser(114, JSON.parse)
types.setTypeParser(3802, JSON.parse)

function createPool() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/geopic"

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  return new Pool({ connectionString })
}

let _pool: pg.Pool | undefined

export function getPool(): pg.Pool {
  if (!_pool) _pool = createPool()
  return _pool
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    return await client.query<T>(text, params)
  } finally {
    client.release()
  }
}
