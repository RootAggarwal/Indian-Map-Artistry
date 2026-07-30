import { Router } from "express"
import { z } from "zod"
import { query } from "../db.js"

export const interpretationRouter = Router()

interpretationRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, si_code, processing_type, project_year,
        ST_AsGeoJSON(geometry) AS geometry_geojson,
        properties, created_at, updated_at
      FROM interpretation_polygons
      ORDER BY si_code, created_at DESC
    `)
    res.json(rows.map((r: any) => ({
      ...r,
      properties: typeof r.properties === "string" ? JSON.parse(r.properties) : r.properties,
    })))
  } catch (err) {
    next(err)
  }
})

interpretationRouter.get("/:siCode", async (req, res, next) => {
  try {
    const siCode = z.string().parse(req.params.siCode)
    const { rows } = await query(`
      SELECT id, si_code, processing_type, project_year,
        ST_AsGeoJSON(geometry) AS geometry_geojson,
        properties, created_at, updated_at
      FROM interpretation_polygons
      WHERE si_code = $1
      ORDER BY created_at DESC
    `, [siCode])
    res.json(rows.map((r: any) => ({
      ...r,
      properties: typeof r.properties === "string" ? JSON.parse(r.properties) : r.properties,
    })))
  } catch (err) {
    next(err)
  }
})

const polygonSchema = z.object({
  si_code: z.string().min(1).max(256),
  processing_type: z.string().nullable().optional(),
  project_year: z.string().nullable().optional(),
  geometry: z.string(),  // GeoJSON Polygon string
  properties: z.record(z.unknown()).nullable().optional(),
})

interpretationRouter.post("/", async (req, res, next) => {
  try {
    const body = z.array(polygonSchema).min(1).max(1000).parse(req.body)
    const inserted: number[] = []
    for (const p of body) {
      const { rows } = await query(`
        INSERT INTO interpretation_polygons (si_code, processing_type, project_year, geometry, properties)
        VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4), $5)
        RETURNING id
      `, [
        p.si_code,
        p.processing_type ?? null,
        p.project_year ?? null,
        p.geometry,
        p.properties ? JSON.stringify(p.properties) : "{}",
      ])
      if (rows.length) inserted.push(rows[0].id)
    }
    res.json({ inserted: inserted.length })
  } catch (err) {
    next(err)
  }
})
