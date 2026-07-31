import express from "express"
import cors from "cors"
import { query } from "./db.js"
import { router } from "./routes/index.js"

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.disable("etag")
app.set("etag", false)
app.use((req, _res, next) => { console.log(`[request] ${req.method} ${req.url}`); next() })

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
const clientOrigin = process.env.CLIENT_ORIGIN
if (clientOrigin && !allowedOrigins.includes(clientOrigin)) allowedOrigins.push(clientOrigin)
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: "50mb" }))

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

    // Auto-heal missing footprint geometries from bbox or centroid
    await query(`
      UPDATE processing_records
      SET footprint = ST_MakeEnvelope(
        LEAST(bbox_min_lon, bbox_max_lon),
        LEAST(bbox_min_lat, bbox_max_lat),
        GREATEST(bbox_min_lon, bbox_max_lon),
        GREATEST(bbox_min_lat, bbox_max_lat),
        4326
      ),
      is_mapped = true
      WHERE footprint IS NULL
        AND bbox_min_lon IS NOT NULL AND bbox_min_lat IS NOT NULL
        AND bbox_max_lon IS NOT NULL AND bbox_max_lat IS NOT NULL
        AND GREATEST(bbox_min_lon, bbox_max_lon) > LEAST(bbox_min_lon, bbox_max_lon)
        AND GREATEST(bbox_min_lat, bbox_max_lat) > LEAST(bbox_min_lat, bbox_max_lat)
    `)
    await query(`
      UPDATE processing_records
      SET footprint = ST_MakeEnvelope(centroid_lon - 0.05, centroid_lat - 0.05, centroid_lon + 0.05, centroid_lat + 0.05, 4326),
      is_mapped = true
      WHERE footprint IS NULL
        AND centroid_lon IS NOT NULL AND centroid_lat IS NOT NULL
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

    // Layer management tables
    await query(`
      CREATE TABLE IF NOT EXISTS layers (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        geometry_type TEXT,
        crs_original TEXT DEFAULT '',
        style JSONB DEFAULT '{}',
        visible BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        feature_count INTEGER DEFAULT 0,
        extent JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await query(`
      CREATE TABLE IF NOT EXISTS layer_features (
        id BIGSERIAL PRIMARY KEY,
        layer_id INTEGER NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
        geometry geometry(Geometry, 4326) NOT NULL,
        properties JSONB DEFAULT '{}'
      )
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lf_layer_id ON layer_features (layer_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lf_geometry ON layer_features USING GIST (geometry)
    `)

    console.log("[migrate] PostGIS schema ready & footprints populated")
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
