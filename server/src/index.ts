import express from "express"
import cors from "cors"
import { query } from "./db.js"
import { router } from "./routes/index.js"

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.disable("etag")
app.set("etag", false)

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }))
app.use(express.json({ limit: "5mb" }))

app.use("/api", router)

app.use((err: any, req: any, res: any, next: any) => {
  console.error("[server] unhandled error:", err?.message ?? err)
  if (res.headersSent) return next(err)
  res.status(err?.statusCode || 500).json({
    error: err?.message || "Internal server error",
  })
})

async function migrate() {
  try {
    await query("CREATE EXTENSION IF NOT EXISTS postgis")
    await query(`
      ALTER TABLE processing_records
        ADD COLUMN IF NOT EXISTS footprint geometry(Polygon, 4326),
        ADD COLUMN IF NOT EXISTS centroid_geom geometry(Point, 4326)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_pr_footprint
        ON processing_records USING GIST (footprint)
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS interpretation_polygons (
        id SERIAL PRIMARY KEY,
        si_code TEXT NOT NULL,
        processing_type TEXT,
        project_year TEXT,
        geometry geometry(Polygon, 4326) NOT NULL,
        properties JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ip_si_code
        ON interpretation_polygons (si_code)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ip_geometry
        ON interpretation_polygons USING GIST (geometry)
    `)

    console.log("[migrate] PostGIS schema ready")
  } catch (err) {
    console.warn("[migrate] PostGIS migration skipped:", (err as Error).message)
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("[server] UNHANDLED REJECTION:", reason)
})
process.on("uncaughtException", (err) => {
  console.error("[server] UNCAUGHT EXCEPTION:", err)
})

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`)
  })
})
