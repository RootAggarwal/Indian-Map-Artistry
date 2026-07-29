import { Router } from "express"
import { z } from "zod"
import { query } from "../db.js"

export const surveysRouter = Router()

function parsePgArray(val: unknown): string[] {
  if (Array.isArray(val)) return val
  if (typeof val !== "string") return []
  const s = val.trim()
  if (!s.startsWith("{") || !s.endsWith("}")) return []
  const inner = s.slice(1, -1)
  if (!inner) return []
  const result: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (ch === '"') {
      inQ = !inQ
    } else if (ch === "," && !inQ) {
      result.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result.map((x) => x.trim())
}

surveysRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        r.id, r.project_id, r.si_code, r.project_year, r.type_of_processing,
        r.quantum_skm, r.quantum_slkm, r.processing_bin, r.record_length,
        r.sampling_interval, r.fold, r.azimuth, r.spheroid, r.utm_zone,
        r.projection, r.project_timeline, r.centroid_lat, r.centroid_lon,
        r.bbox_min_lon, r.bbox_min_lat, r.bbox_max_lon, r.bbox_max_lat,
        r.corners, r.is_mapped, r.geometry_status, r.geometry_notes,
        r.flagged_for_review,
        json_build_object(
          'project_id', p.project_id,
          'project_name', p.project_name,
          'basin', p.basin,
          'project_type', p.project_type,
          'data_dimension', p.data_dimension
        ) AS projects
      FROM processing_records r
      JOIN projects p ON p.project_id = r.project_id
      ORDER BY r.project_year DESC NULLS LAST, r.project_id ASC
    `)
    res.json(
      rows.map((row: any) => ({
        ...row,
        geometry_notes: parsePgArray(row.geometry_notes),
        projects: typeof row.projects === "string" ? JSON.parse(row.projects) : row.projects,
      })),
    )
  } catch (err) {
    next(err)
  }
})

const draftSchema = z.object({
  project_name: z.string().trim().min(2).max(200),
  basin: z.string().trim().max(120).nullable().optional(),
  project_type: z.string().trim().max(120).nullable().optional(),
  data_dimension: z.string().trim().max(16).nullable().optional(),
  si_code: z.string().trim().max(64).nullable().optional(),
  project_year: z.string().trim().max(32).nullable().optional(),
  type_of_processing: z.string().trim().max(120).nullable().optional(),
  quantum_skm: z.number().finite().nullable().optional(),
  quantum_slkm: z.number().finite().nullable().optional(),
  processing_bin: z.string().trim().max(64).nullable().optional(),
  utm_zone: z.string().trim().max(32).nullable().optional(),
  min_lon: z.number().finite().nullable().optional(),
  min_lat: z.number().finite().nullable().optional(),
  max_lon: z.number().finite().nullable().optional(),
  max_lat: z.number().finite().nullable().optional(),
})

const INDIA = { minLon: 68.1, maxLon: 97.42, minLat: 6.45, maxLat: 37.1 }
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

surveysRouter.post("/", async (req, res, next) => {
  try {
    const input = z.object({ drafts: z.array(draftSchema).min(1).max(500) }).parse(req.body)

    const { rows: [maxRow] } = await query(
      `SELECT COALESCE(MAX(project_id), 0) + 1 AS next_id FROM projects`,
    )
    let nextId = Number(maxRow?.next_id ?? 1)

    const projects: any[] = []
    const records: any[] = []

    for (const d of input.drafts) {
      const projectId = nextId++
      projects.push({
        project_id: projectId,
        project_name: d.project_name,
        basin: d.basin || null,
        project_type: d.project_type || null,
        data_dimension: d.data_dimension || null,
      })

      const notes: string[] = []
      let bbox: any = null
      if (d.min_lon != null && d.min_lat != null && d.max_lon != null && d.max_lat != null) {
        const raw = {
          minLon: Math.min(d.min_lon, d.max_lon),
          maxLon: Math.max(d.min_lon, d.max_lon),
          minLat: Math.min(d.min_lat, d.max_lat),
          maxLat: Math.max(d.min_lat, d.max_lat),
        }
        bbox = {
          minLon: clamp(raw.minLon, INDIA.minLon, INDIA.maxLon),
          maxLon: clamp(raw.maxLon, INDIA.minLon, INDIA.maxLon),
          minLat: clamp(raw.minLat, INDIA.minLat, INDIA.maxLat),
          maxLat: clamp(raw.maxLat, INDIA.minLat, INDIA.maxLat),
        }
        if (
          bbox.minLon !== raw.minLon || bbox.maxLon !== raw.maxLon ||
          bbox.minLat !== raw.minLat || bbox.maxLat !== raw.maxLat
        ) {
          notes.push("Extent clipped to the Indian national boundary.")
        }
        notes.push("Footprint squared to an axis-aligned box.")
      }

      records.push({
        project_id: projectId,
        si_code: d.si_code || null,
        project_year: d.project_year || null,
        type_of_processing: d.type_of_processing || null,
        quantum_skm: d.quantum_skm ?? null,
        quantum_slkm: d.quantum_slkm ?? null,
        processing_bin: d.processing_bin || null,
        utm_zone: d.utm_zone || null,
        bbox_min_lon: bbox?.minLon ?? null,
        bbox_min_lat: bbox?.minLat ?? null,
        bbox_max_lon: bbox?.maxLon ?? null,
        bbox_max_lat: bbox?.maxLat ?? null,
        centroid_lon: bbox ? (bbox.minLon + bbox.maxLon) / 2 : null,
        centroid_lat: bbox ? (bbox.minLat + bbox.maxLat) / 2 : null,
        corners: bbox
          ? [
              { lon: bbox.minLon, lat: bbox.minLat, corner: 1, is_assumed: true },
              { lon: bbox.maxLon, lat: bbox.minLat, corner: 2, is_assumed: true },
              { lon: bbox.maxLon, lat: bbox.maxLat, corner: 3, is_assumed: true },
              { lon: bbox.minLon, lat: bbox.maxLat, corner: 4, is_assumed: true },
            ]
          : [],
        is_mapped: Boolean(bbox),
        geometry_status: bbox ? "BOXED" : "UNMAPPED",
        geometry_notes: notes,
        flagged_for_review: !bbox,
      })
    }

    const pCols = ["project_id", "project_name", "basin", "project_type", "data_dimension"]
    const pPlaceholders = projects
      .map((_, i) => {
        const off = i * pCols.length
        return `($${off + 1}, $${off + 2}, $${off + 3}, $${off + 4}, $${off + 5})`
      })
      .join(", ")
    const pParams = projects.flatMap((p: any) => [
      p.project_id, p.project_name, p.basin, p.project_type, p.data_dimension,
    ])
    await query(`INSERT INTO projects (${pCols.join(", ")}) VALUES ${pPlaceholders}`, pParams)

    const rCols = [
      "project_id", "si_code", "project_year", "type_of_processing",
      "quantum_skm", "quantum_slkm", "processing_bin", "utm_zone",
      "bbox_min_lon", "bbox_min_lat", "bbox_max_lon", "bbox_max_lat",
      "centroid_lon", "centroid_lat", "corners", "is_mapped",
      "geometry_status", "geometry_notes", "flagged_for_review",
    ]
    const rPlaceholders = records
      .map((_, i) => {
        const off = i * rCols.length
        return `(${rCols.map((_, j) => `$${off + j + 1}`).join(", ")})`
      })
      .join(", ")
    const rParams = records.flatMap((r: any) => [
      r.project_id, r.si_code, r.project_year, r.type_of_processing,
      r.quantum_skm, r.quantum_slkm, r.processing_bin, r.utm_zone,
      r.bbox_min_lon, r.bbox_min_lat, r.bbox_max_lon, r.bbox_max_lat,
      r.centroid_lon, r.centroid_lat, JSON.stringify(r.corners), r.is_mapped,
      r.geometry_status, r.geometry_notes, r.flagged_for_review,
    ])
    await query(
      `INSERT INTO processing_records (${rCols.join(", ")}) VALUES ${rPlaceholders}`,
      rParams,
    )

    const projectIds = projects.map((p: any) => p.project_id)

    res.status(201).json({
      inserted: records.length,
      mapped: records.filter((r: any) => r.is_mapped).length,
      project_ids: projectIds,
    })
  } catch (err) {
    next(err)
  }
})

surveysRouter.delete("/rollback", async (req, res, next) => {
  try {
    const ids = z.array(z.number().int().positive()).min(1).max(500).parse(req.body)
    await query("DELETE FROM processing_records WHERE project_id = ANY($1::int[])", [ids])
    await query("DELETE FROM projects WHERE project_id = ANY($1::int[])", [ids])
    res.json({ removed: ids.length })
  } catch (err) {
    next(err)
  }
})

surveysRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const { rows } = await query<{ project_id: number }>(
      "SELECT project_id FROM processing_records WHERE id = $1",
      [id],
    )
    if (!rows.length) {
      res.status(404).json({ error: "Survey not found" })
      return
    }
    const projectId = rows[0].project_id
    await query("DELETE FROM processing_records WHERE id = $1", [id])
    await query("DELETE FROM projects WHERE project_id = $1", [projectId])
    res.json({ removed: id })
  } catch (err) {
    next(err)
  }
})

const updateSchema = z.object({
  si_code: z.string().trim().max(64).nullable().optional(),
  project_year: z.string().trim().max(32).nullable().optional(),
  type_of_processing: z.string().trim().max(120).nullable().optional(),
  quantum_skm: z.number().finite().nullable().optional(),
  quantum_slkm: z.number().finite().nullable().optional(),
  processing_bin: z.string().trim().max(64).nullable().optional(),
  utm_zone: z.string().trim().max(32).nullable().optional(),
  project_name: z.string().trim().max(200).optional(),
  basin: z.string().trim().max(120).nullable().optional(),
  project_type: z.string().trim().max(120).nullable().optional(),
  data_dimension: z.string().trim().max(16).nullable().optional(),
})

surveysRouter.put("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const body = updateSchema.parse(req.body)

    const { rows: [rec] } = await query<{ project_id: number }>(
      "SELECT project_id FROM processing_records WHERE id = $1",
      [id],
    )
    if (!rec) {
      res.status(404).json({ error: "Survey not found" })
      return
    }

    if (body.project_name != null || body.basin != null || body.project_type != null || body.data_dimension != null) {
      const pSets: string[] = []
      const pParams: any[] = []
      let pi = 1
      for (const [col, val] of Object.entries({ project_name: body.project_name, basin: body.basin, project_type: body.project_type, data_dimension: body.data_dimension })) {
        if (val !== undefined) {
          pSets.push(`${col} = $${pi++}`)
          pParams.push(val)
        }
      }
      if (pSets.length) {
        pParams.push(rec.project_id)
        await query(`UPDATE projects SET ${pSets.join(", ")} WHERE project_id = $${pi}`, pParams)
      }
    }

    const rSets: string[] = []
    const rParams: any[] = []
    let ri = 1
    for (const [col, val] of Object.entries({
      si_code: body.si_code, project_year: body.project_year,
      type_of_processing: body.type_of_processing, quantum_skm: body.quantum_skm,
      quantum_slkm: body.quantum_slkm, processing_bin: body.processing_bin,
      utm_zone: body.utm_zone,
    })) {
      if (val !== undefined) {
        rSets.push(`${col} = $${ri++}`)
        rParams.push(val)
      }
    }
    if (rSets.length) {
      rParams.push(id)
      await query(`UPDATE processing_records SET ${rSets.join(", ")} WHERE id = $${ri}`, rParams)
    }

    res.json({ updated: id })
  } catch (err) {
    next(err)
  }
})
