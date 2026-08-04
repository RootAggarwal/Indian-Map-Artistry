import { Router } from "express"
import { z } from "zod"
import { query } from "../db.js"

export const interpretationRouter = Router()

const SELECT = `
  SELECT id, si_code, name, description, color, opacity, visible,
    processing_type, project_year,
    ST_AsGeoJSON(geometry) AS geometry_geojson,
    properties, created_at, updated_at
  FROM interpretation_polygons
`

function parseRow(r: any) {
  return {
    ...r,
    geometry_geojson: r.geometry_geojson ? JSON.parse(r.geometry_geojson) : null,
    properties: typeof r.properties === "string" ? JSON.parse(r.properties) : r.properties,
  }
}

interpretationRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`${SELECT} ORDER BY created_at DESC`)
    res.json(rows.map(parseRow))
  } catch (err) {
    next(err)
  }
})

interpretationRouter.get("/:id/surveys", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const { rows } = await query(
      `SELECT r.id, p.project_name, r.si_code, r.project_year, p.basin,
              r.flagged_for_review AS status, r.type_of_processing AS processing_type,
              ST_AsGeoJSON(COALESCE(r.footprint, r.centroid_geom)) AS footprint_geojson
         FROM processing_records r
         JOIN projects p ON p.project_id = r.project_id
         JOIN interpretation_polygons ip ON ST_Intersects(COALESCE(r.footprint, r.centroid_geom), ip.geometry)
        WHERE ip.id = $1
        ORDER BY r.project_year DESC NULLS LAST, p.project_name`,
      [id],
    )
    const surveys = rows.map((r: any) => ({
      ...r,
      footprint_geojson: r.footprint_geojson ? JSON.parse(r.footprint_geojson) : null,
    }))
    res.json({ id, surveys })
  } catch (err) {
    next(err)
  }
})

interpretationRouter.get("/:siCode", async (req, res, next) => {
  try {
    const siCode = z.string().parse(req.params.siCode)
    const { rows } = await query(`${SELECT} WHERE si_code = $1 ORDER BY created_at DESC`, [siCode])
    res.json(rows.map(parseRow))
  } catch (err) {
    next(err)
  }
})

const geometrySchema = z
  .string()
  .or(z.object({ type: z.string(), coordinates: z.unknown() }).passthrough())

const polygonSchema = z.object({
  si_code: z.string().min(1).max(256).nullable().optional(),
  name: z.string().max(256).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  opacity: z.number().min(0).max(1).nullable().optional(),
  visible: z.boolean().nullable().optional(),
  processing_type: z.string().nullable().optional(),
  project_year: z.string().nullable().optional(),
  geometry: geometrySchema,
  properties: z.record(z.unknown()).nullable().optional(),
})

interpretationRouter.post("/", async (req, res, next) => {
  try {
    const bodies = z.array(polygonSchema).min(1).max(1000).parse(req.body)
    const inserted: number[] = []
    for (const p of bodies) {
      const geojson = typeof p.geometry === "string" ? p.geometry : JSON.stringify(p.geometry)
      const { rows } = await query(
        `INSERT INTO interpretation_polygons
          (si_code, name, description, color, opacity, visible, processing_type, project_year, geometry, properties)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_GeomFromGeoJSON($9), 4326), $10)
         RETURNING id`,
        [
          p.si_code ?? null,
          p.name ?? null,
          p.description ?? null,
          p.color ?? "#f97316",
          p.opacity ?? 0.4,
          p.visible ?? true,
          p.processing_type ?? null,
          p.project_year ?? null,
          geojson,
          p.properties ? JSON.stringify(p.properties) : "{}",
        ],
      )
      if (rows.length) inserted.push(rows[0].id)
    }
    res.status(201).json({ inserted: inserted.length, ids: inserted })
  } catch (err) {
    next(err)
  }
})

const patchSchema = polygonSchema.partial()

interpretationRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const p = patchSchema.parse(req.body)

    const sets: string[] = []
    const values: unknown[] = []
    const add = (col: string, v: unknown) => {
      values.push(v)
      sets.push(`${col} = $${values.length}`)
    }
    if (p.si_code !== undefined) add("si_code", p.si_code ?? null)
    if (p.name !== undefined) add("name", p.name ?? null)
    if (p.description !== undefined) add("description", p.description ?? null)
    if (p.color !== undefined) add("color", p.color ?? null)
    if (p.opacity !== undefined) add("opacity", p.opacity ?? null)
    if (p.visible !== undefined) add("visible", p.visible ?? null)
    if (p.processing_type !== undefined) add("processing_type", p.processing_type ?? null)
    if (p.project_year !== undefined) add("project_year", p.project_year ?? null)
    if (p.geometry !== undefined) {
      const geojson = typeof p.geometry === "string" ? p.geometry : JSON.stringify(p.geometry)
      values.push(geojson)
      sets.push(`geometry = ST_SetSRID(ST_GeomFromGeoJSON($${values.length}), 4326)`)
    }
    if (p.properties !== undefined) {
      values.push(JSON.stringify(p.properties ?? "{}"))
      sets.push(`properties = $${values.length}`)
    }
    if (sets.length === 0) {
      res.status(400).json({ error: "No fields to update" })
      return
    }
    values.push(id)
    sets.push(`updated_at = now()`)
    const { rows } = await query(
      `UPDATE interpretation_polygons SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values,
    )
    if (rows.length === 0) {
      res.status(404).json({ error: "Interpretation not found" })
      return
    }
    res.json({ id: rows[0].id })
  } catch (err) {
    next(err)
  }
})

interpretationRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const { rowCount } = await query("DELETE FROM interpretation_polygons WHERE id = $1", [id])
    if (!rowCount) {
      res.status(404).json({ error: "Interpretation not found" })
      return
    }
    res.json({ deleted: id })
  } catch (err) {
    next(err)
  }
})
