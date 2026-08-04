import { Router } from "express"
import { z } from "zod"
import { query } from "../db.js"

export const layersRouter = Router()

// POST /api/layers — create a new layer (returns layer id)
layersRouter.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().default(""),
      geometry_type: z.string().optional(),
      crs_original: z.string().default(""),
      style: z.record(z.unknown()).default({}),
      visible: z.boolean().default(true),
      display_order: z.number().int().default(0),
      feature_count: z.number().int().default(0),
      extent: z.record(z.unknown()).nullable().default(null),
    })
    const body = schema.parse(req.body)
    const r = await query(
      `INSERT INTO layers (name, description, geometry_type, crs_original, style, visible, display_order, feature_count, extent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       RETURNING id, created_at`,
      [
        body.name, body.description, body.geometry_type ?? null,
        body.crs_original, JSON.stringify(body.style),
        body.visible, body.display_order, body.feature_count,
        body.extent ? JSON.stringify(body.extent) : null,
      ],
    )
    res.status(201).json(r.rows[0])
  } catch (err) {
    next(err)
  }
})

// GET /api/layers/batch/features?ids=1,4,7 — bulk fetch features for multiple layers
layersRouter.get("/batch/features", async (req, res, next) => {
  try {
    const idsParam = z.string().min(1).parse(req.query.ids)
    const ids = idsParam.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0)
    if (ids.length === 0) { res.json({ layers: {} }); return }
    const r = await query(
      `SELECT layer_id, id, ST_AsGeoJSON(geometry, 9) AS geojson, properties
       FROM layer_features WHERE layer_id = ANY($1::int[]) ORDER BY layer_id, id`,
      [ids],
    )
    const layers: Record<string, { type: "FeatureCollection"; features: any[] }> = {}
    for (const id of ids) layers[String(id)] = { type: "FeatureCollection", features: [] }
    for (const row of r.rows as any[]) {
      const key = String(row.layer_id)
      layers[key].features.push({
        type: "Feature",
        geometry: JSON.parse(row.geojson),
        properties: { ...(row.properties ?? {}), _feature_id: row.id },
      })
    }
    res.json({ layers })
  } catch (err) {
    next(err)
  }
})

// GET /api/layers — list all layers (metadata only, no features)
layersRouter.get("/", async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT id, project_id, name, description, geometry_type, crs_original,
              style, visible, display_order, feature_count, extent,
              created_at, updated_at
       FROM layers ORDER BY display_order ASC, id ASC`,
    )
    res.json(r.rows)
  } catch (err) {
    next(err)
  }
})

// GET /api/layers/:id — single layer
layersRouter.get("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().parse(req.params.id)
    const r = await query(
      `SELECT id, project_id, name, description, geometry_type, crs_original,
              style, visible, display_order, feature_count, extent,
              created_at, updated_at
       FROM layers WHERE id = $1`,
      [id],
    )
    if (!r.rows.length) { res.status(404).json({ error: "Layer not found" }); return }
    res.json(r.rows[0])
  } catch (err) {
    next(err)
  }
})

// PUT /api/layers/:id — update layer metadata
layersRouter.put("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().parse(req.params.id)
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      style: z.record(z.unknown()).optional(),
      visible: z.boolean().optional(),
      display_order: z.number().int().optional(),
      feature_count: z.number().int().optional(),
      extent: z.record(z.unknown()).nullable().optional(),
    })
    const body = schema.parse(req.body)
    const sets: string[] = []
    const vals: any[] = []
    let idx = 1

    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue
      if (k === "style" || k === "extent") {
        sets.push(`${k} = $${idx++}::jsonb`)
        vals.push(v !== null ? JSON.stringify(v) : null)
      } else {
        sets.push(`${k} = $${idx++}`)
        vals.push(v)
      }
    }
    if (!sets.length) { res.status(400).json({ error: "No fields to update" }); return }
    sets.push(`updated_at = NOW()`)
    vals.push(id)
    await query(
      `UPDATE layers SET ${sets.join(", ")} WHERE id = $${idx}`,
      vals,
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/layers/:id — delete layer and its features (CASCADE)
layersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().parse(req.params.id)
    await query("DELETE FROM layers WHERE id = $1", [id])
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// PUT /api/layers/reorder — batch update display_order
layersRouter.put("/reorder/batch", async (req, res, next) => {
  try {
    const schema = z.array(z.object({ id: z.number().int(), display_order: z.number().int() }))
    const items = schema.parse(req.body)
    for (const item of items) {
      await query("UPDATE layers SET display_order = $1, updated_at = NOW() WHERE id = $2", [item.display_order, item.id])
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/layers/:id/features — bulk insert features from GeoJSON FeatureCollection
layersRouter.post("/:id/features", async (req, res, next) => {
  try {
    const layerId = z.coerce.number().parse(req.params.id)
    const schema = z.object({
      features: z.array(z.object({
        type: z.literal("Feature"),
        geometry: z.any(),
        properties: z.record(z.unknown()).default({}),
      })),
    })
    const body = schema.parse(req.body)

    if (!body.features.length) {
      res.status(400).json({ error: "No features provided" })
      return
    }

    let inserted = 0
    for (const feature of body.features) {
      const geojson = JSON.stringify(feature.geometry)
      const props = JSON.stringify(feature.properties ?? {})
      await query(
        `INSERT INTO layer_features (layer_id, geometry, properties)
         VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3::jsonb)`,
        [layerId, geojson, props],
      )
      inserted++
    }

    // Update layer metadata
    const gType = body.features[0].geometry?.type ?? "Unknown"
    const extentQuery = await query(
      `SELECT ST_Extent(geometry) AS extent_ext, COUNT(*) AS cnt
       FROM layer_features WHERE layer_id = $1`,
      [layerId],
    )
    let extent = null
    if (extentQuery.rows[0]?.extent_ext) {
      const ex = extentQuery.rows[0].extent_ext.replace("BOX(", "").replace(")", "")
      const [xmin, ymin, xmax, ymax] = ex.split(/[ ,]+/).map(Number)
      extent = { xmin, ymin, xmax, ymax }
    }
    await query(
      `UPDATE layers SET feature_count = $1, geometry_type = $2, extent = $3::jsonb, updated_at = NOW()
       WHERE id = $4`,
      [extentQuery.rows[0]?.cnt ?? inserted, gType, extent ? JSON.stringify(extent) : null, layerId],
    )

    res.status(201).json({ inserted, geometry_type: gType, extent })
  } catch (err) {
    next(err)
  }
})

// GET /api/layers/:id/features — get features as GeoJSON FeatureCollection
layersRouter.get("/:id/features", async (req, res, next) => {
  try {
    const layerId = z.coerce.number().parse(req.params.id)
    const r = await query(
      `SELECT id, ST_AsGeoJSON(geometry, 9) AS geojson, properties
       FROM layer_features WHERE layer_id = $1 ORDER BY id`,
      [layerId],
    )
    const features = r.rows.map((row) => ({
      type: "Feature" as const,
      geometry: JSON.parse(row.geojson),
      properties: { ...(row.properties ?? {}), _feature_id: row.id },
    }))
    res.json({ type: "FeatureCollection", features })
  } catch (err) {
    next(err)
  }
})
