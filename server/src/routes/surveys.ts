import { Router } from "express"
import { z } from "zod"
import { query, withTransaction } from "../db.js"
import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import { reprojectRecord } from "../lib/reproject.js"
import { cornersToWkt } from "../lib/crs.js"

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
        r.projection, r.project_timeline,         r.centroid_lat, r.centroid_lon,
        r.bbox_min_lon, r.bbox_min_lat, r.bbox_max_lon, r.bbox_max_lat,
        r.corners, r.is_mapped, r.geometry_status, r.geometry_notes,
        r.flagged_for_review,
        r.source_crs, r.source_epsg, r.conversion_status, r.validation_issues,
        r.g1_x, r.g1_y, r.g1_il, r.g1_xl,
        r.g2_x, r.g2_y, r.g2_il, r.g2_xl,
        r.g3_x, r.g3_y, r.g3_il, r.g3_xl,
        r.g4_x, r.g4_y, r.g4_il, r.g4_xl,
        ST_AsGeoJSON(
          COALESCE(
            r.footprint,
            r.centroid_geom
          )
        ) AS footprint_geojson,
        ST_AsGeoJSON(r.centroid_geom) AS centroid_geojson,
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
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    res.json(
      rows.map((row: any) => ({
        ...row,
        footprint_geojson: row.footprint_geojson ? JSON.parse(row.footprint_geojson) : null,
        centroid_geojson: row.centroid_geojson ? JSON.parse(row.centroid_geojson) : null,
        geometry_notes: parsePgArray(row.geometry_notes),
        validation_issues: parsePgArray(row.validation_issues),
        projects: typeof row.projects === "string" ? JSON.parse(row.projects) : row.projects,
      })),
    )
  } catch (err) {
    next(err)
  }
})

const gNum = z.number().finite().nullable().optional()
const draftSchema = z.object({
  project_name: z.string().trim().min(2).max(200),
  basin: z.string().trim().max(120).nullable().optional(),
  project_type: z.string().trim().max(120).nullable().optional(),
  data_dimension: z.string().trim().max(16).nullable().optional(),
  si_code: z.string().trim().max(256).nullable().optional(),
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
  g1_x: gNum, g1_y: gNum, g1_il: gNum, g1_xl: gNum,
  g2_x: gNum, g2_y: gNum, g2_il: gNum, g2_xl: gNum,
  g3_x: gNum, g3_y: gNum, g3_il: gNum, g3_xl: gNum,
  g4_x: gNum, g4_y: gNum, g4_il: gNum, g4_xl: gNum,
  record_length: z.string().trim().max(64).nullable().optional(),
  sampling_interval: z.string().trim().max(64).nullable().optional(),
  fold: z.string().trim().max(64).nullable().optional(),
  azimuth: z.string().trim().max(64).nullable().optional(),
  spheroid: z.string().trim().max(120).nullable().optional(),
  projection: z.string().trim().max(120).nullable().optional(),
  project_timeline: z.string().trim().max(120).nullable().optional(),
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
      let corners: any[] = []
      let conv: {
        sourceCrs: string
        sourceEpsg: number | null
        conversionStatus: string
        validationIssues: string[]
      } = {
        sourceCrs: "WGS 84",
        sourceEpsg: 4326,
        conversionStatus: "UNMAPPED",
        validationIssues: [],
      }
      const g = [d.g1_x, d.g2_x, d.g3_x, d.g4_x].filter((v): v is number => v != null)

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
        corners = [
          { lon: bbox.minLon, lat: bbox.minLat, corner: 1, is_assumed: true },
          { lon: bbox.maxLon, lat: bbox.minLat, corner: 2, is_assumed: true },
          { lon: bbox.maxLon, lat: bbox.maxLat, corner: 3, is_assumed: true },
          { lon: bbox.minLon, lat: bbox.maxLat, corner: 4, is_assumed: true },
        ]
        conv = { sourceCrs: "Geographic (WGS 84)", sourceEpsg: 4326, conversionStatus: "CONVERTED", validationIssues: [] }
      } else if (g.length >= 2) {
        const xs = [d.g1_x, d.g2_x, d.g3_x, d.g4_x].filter((v): v is number => v != null)
        const ys = [d.g1_y, d.g2_y, d.g3_y, d.g4_y].filter((v): v is number => v != null)
        if (xs.length && ys.length) {
          const isProjected = xs.some((v) => Math.abs(v) > 180) || ys.some((v) => Math.abs(v) > 90)
          if (isProjected) {
            const rr = reprojectRecord({
              id: projectId,
              si_code: d.si_code ?? null,
              projection: d.projection ?? null,
              utm_zone: d.utm_zone ?? null,
              spheroid: d.spheroid ?? null,
              basin: d.basin ?? null,
              g: [1, 2, 3, 4].map((i) => ({
                x: (d as any)[`g${i}_x`] ?? null,
                y: (d as any)[`g${i}_y`] ?? null,
                il: (d as any)[`g${i}_il`] ?? null,
                xl: (d as any)[`g${i}_xl`] ?? null,
                corner: i,
              })),
            })
            corners = rr.corners as any[]
            bbox = rr.bbox
            notes.push(...rr.geometryNotes)
            notes.push(...rr.validationIssues)
            conv = {
              sourceCrs: rr.sourceCrs,
              sourceEpsg: rr.sourceEpsg,
              conversionStatus: rr.conversionStatus,
              validationIssues: rr.validationIssues,
            }
          } else {
            const geoPts: { lon: number; lat: number }[] = []
            for (let i = 1; i <= 4; i++) {
              const x = (d as any)[`g${i}_x`]
              const y = (d as any)[`g${i}_y`]
              const il = (d as any)[`g${i}_il`]
              const xl = (d as any)[`g${i}_xl`]
              if (x != null && y != null) {
                const pt = { lon: x, lat: y }
                geoPts.push(pt)
                corners.push({ lon: pt.lon, lat: pt.lat, il: il ?? null, xl: xl ?? null, easting: null, northing: null, corner: i, is_assumed: false })
              }
            }
            if (geoPts.length >= 2) {
              bbox = {
                minLon: clamp(Math.min(...geoPts.map((p) => p.lon)), INDIA.minLon, INDIA.maxLon),
                maxLon: clamp(Math.max(...geoPts.map((p) => p.lon)), INDIA.minLon, INDIA.maxLon),
                minLat: clamp(Math.min(...geoPts.map((p) => p.lat)), INDIA.minLat, INDIA.maxLat),
                maxLat: clamp(Math.max(...geoPts.map((p) => p.lat)), INDIA.minLat, INDIA.maxLat),
              }
              conv = { sourceCrs: "Geographic (WGS 84)", sourceEpsg: 4326, conversionStatus: "CONVERTED", validationIssues: [] }
            }
          }
          if (!notes.length && corners.length) notes.push("Footprint derived from survey corner coordinates.")
        }
      }

      const gRow: any = {}
      for (let i = 1; i <= 4; i++) {
        gRow[`g${i}_x`] = (d as any)[`g${i}_x`] ?? null
        gRow[`g${i}_y`] = (d as any)[`g${i}_y`] ?? null
        gRow[`g${i}_il`] = (d as any)[`g${i}_il`] ?? null
        gRow[`g${i}_xl`] = (d as any)[`g${i}_xl`] ?? null
      }

      const footprintWkt = corners.length >= 3
        ? cornersToWkt(corners as any[])
        : ""
      const centroidWkt = bbox
        ? `POINT(${(bbox.minLon + bbox.maxLon) / 2} ${(bbox.minLat + bbox.maxLat) / 2})`
        : ""

      records.push({
        project_id: projectId,
        si_code: d.si_code || null,
        project_year: d.project_year || null,
        type_of_processing: d.type_of_processing || null,
        quantum_skm: d.quantum_skm ?? null,
        quantum_slkm: d.quantum_slkm ?? null,
        processing_bin: d.processing_bin || null,
        utm_zone: d.utm_zone || null,
        record_length: d.record_length ?? null,
        sampling_interval: d.sampling_interval ?? null,
        fold: d.fold ?? null,
        azimuth: d.azimuth ?? null,
        spheroid: d.spheroid ?? null,
        projection: d.projection ?? null,
        project_timeline: d.project_timeline ?? null,
        bbox_min_lon: bbox?.minLon ?? null,
        bbox_min_lat: bbox?.minLat ?? null,
        bbox_max_lon: bbox?.maxLon ?? null,
        bbox_max_lat: bbox?.maxLat ?? null,
        centroid_lon: bbox ? (bbox.minLon + bbox.maxLon) / 2 : null,
        centroid_lat: bbox ? (bbox.minLat + bbox.maxLat) / 2 : null,
        ...gRow,
        corners,
        is_mapped: Boolean(bbox),
        geometry_status: bbox ? (d.g1_x != null ? "SURVEYED" : "BOXED") : "UNMAPPED",
        geometry_notes: notes,
        flagged_for_review: !bbox || (d.data_dimension === "3D" && !bbox),
        source_crs: conv.sourceCrs,
        source_epsg: conv.sourceEpsg,
        conversion_status: conv.conversionStatus,
        validation_issues: conv.validationIssues,
        footprint_wkt: footprintWkt,
        centroid_wkt: centroidWkt,
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

    const rBaseCols = [
      "project_id", "si_code", "project_year", "type_of_processing",
      "quantum_skm", "quantum_slkm", "processing_bin", "utm_zone",
      "record_length", "sampling_interval", "fold", "azimuth",
      "spheroid", "projection", "project_timeline",
      "bbox_min_lon", "bbox_min_lat", "bbox_max_lon", "bbox_max_lat",
      "centroid_lon", "centroid_lat",
      "g1_x", "g1_y", "g1_il", "g1_xl",
      "g2_x", "g2_y", "g2_il", "g2_xl",
      "g3_x", "g3_y", "g3_il", "g3_xl",
      "g4_x", "g4_y", "g4_il", "g4_xl",
      "corners", "is_mapped",
      "geometry_status", "geometry_notes", "flagged_for_review",
      "source_crs", "source_epsg", "conversion_status", "validation_issues",
    ]
    const pgCols = ["footprint", "centroid_geom"]
    const rCols = [...rBaseCols, ...pgCols]
    const rPlaceholders = records
      .map((_, i) => {
        const off = i * rBaseCols.length
        const base = rBaseCols.map((_, j) => `$${off + j + 1}`).join(", ")
        const fpOff = records.length * rBaseCols.length + i * 2
        const pg = `ST_GeomFromText($${fpOff + 1}, 4326), ST_GeomFromText($${fpOff + 2}, 4326)`
        return `(${base}, ${pg})`
      })
      .join(", ")
    const rParams = records.flatMap((r: any) => [
      r.project_id, r.si_code, r.project_year, r.type_of_processing,
      r.quantum_skm, r.quantum_slkm, r.processing_bin, r.utm_zone,
      r.record_length, r.sampling_interval, r.fold, r.azimuth,
      r.spheroid, r.projection, r.project_timeline,
      r.bbox_min_lon, r.bbox_min_lat, r.bbox_max_lon, r.bbox_max_lat,
      r.centroid_lon, r.centroid_lat,
      r.g1_x, r.g1_y, r.g1_il, r.g1_xl,
      r.g2_x, r.g2_y, r.g2_il, r.g2_xl,
      r.g3_x, r.g3_y, r.g3_il, r.g3_xl,
      r.g4_x, r.g4_y, r.g4_il, r.g4_xl,
      JSON.stringify(r.corners), r.is_mapped,
      r.geometry_status, r.geometry_notes, r.flagged_for_review,
      r.source_crs, r.source_epsg, r.conversion_status, r.validation_issues,
    ])
    // Append WKT params for PostGIS columns
    for (const r of records) {
      rParams.push(r.footprint_wkt || null)
      rParams.push(r.centroid_wkt || null)
    }
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

surveysRouter.delete("/", async (_req, res, next) => {
  try {
    const { rowCount: rCnt } = await query("DELETE FROM processing_records")
    await query("DELETE FROM projects")
    res.json({ removed: rCnt ?? 0 })
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

const cornerSchema = z.object({
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  il: z.number().nullable(),
  xl: z.number().nullable(),
  easting: z.number().nullable(),
  northing: z.number().nullable(),
  corner: z.number().nullable(),
  is_assumed: z.boolean(),
})

const updateSchema = z.object({
  si_code: z.string().trim().max(256).nullable().optional(),
  project_year: z.string().trim().max(32).nullable().optional(),
  type_of_processing: z.string().trim().max(120).nullable().optional(),
  quantum_skm: z.number().finite().nullable().optional(),
  quantum_slkm: z.number().finite().nullable().optional(),
  processing_bin: z.string().trim().max(64).nullable().optional(),
  utm_zone: z.string().trim().max(32).nullable().optional(),
  record_length: z.string().trim().max(64).nullable().optional(),
  sampling_interval: z.string().trim().max(64).nullable().optional(),
  fold: z.string().trim().max(64).nullable().optional(),
  azimuth: z.string().trim().max(64).nullable().optional(),
  spheroid: z.string().trim().max(120).nullable().optional(),
  projection: z.string().trim().max(120).nullable().optional(),
  project_timeline: z.string().trim().max(120).nullable().optional(),
  project_name: z.string().trim().max(200).optional(),
  basin: z.string().trim().max(120).nullable().optional(),
  project_type: z.string().trim().max(120).nullable().optional(),
  data_dimension: z.string().trim().max(16).nullable().optional(),
  corners: z.array(cornerSchema).optional(),
  g1_x: gNum, g1_y: gNum, g1_il: gNum, g1_xl: gNum,
  g2_x: gNum, g2_y: gNum, g2_il: gNum, g2_xl: gNum,
  g3_x: gNum, g3_y: gNum, g3_il: gNum, g3_xl: gNum,
  g4_x: gNum, g4_y: gNum, g4_il: gNum, g4_xl: gNum,
  geometry_status: z.string().trim().max(64).nullable().optional(),
  geometry_notes: z.array(z.string()).optional(),
  flagged_for_review: z.boolean().optional(),
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
      record_length: body.record_length, sampling_interval: body.sampling_interval,
      fold: body.fold, azimuth: body.azimuth,
      spheroid: body.spheroid, projection: body.projection,
      project_timeline: body.project_timeline,
      g1_x: body.g1_x, g1_y: body.g1_y, g1_il: body.g1_il, g1_xl: body.g1_xl,
      g2_x: body.g2_x, g2_y: body.g2_y, g2_il: body.g2_il, g2_xl: body.g2_xl,
      g3_x: body.g3_x, g3_y: body.g3_y, g3_il: body.g3_il, g3_xl: body.g3_xl,
      g4_x: body.g4_x, g4_y: body.g4_y, g4_il: body.g4_il, g4_xl: body.g4_xl,
      geometry_status: body.geometry_status,
      flagged_for_review: body.flagged_for_review,
    })) {
      if (val !== undefined) {
        rSets.push(`${col} = $${ri++}`)
        rParams.push(val)
      }
    }

    if (body.corners !== undefined) {
      rSets.push(`corners = $${ri++}`)
      rParams.push(JSON.stringify(body.corners))
    }

    if (body.geometry_notes !== undefined) {
      rSets.push(`geometry_notes = $${ri++}`)
      rParams.push(body.geometry_notes)
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

surveysRouter.post("/reprocess", async (_req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query(`
        SELECT r.id, r.si_code, r.projection, r.utm_zone, r.spheroid,
          r.g1_x, r.g1_y, r.g2_x, r.g2_y, r.g3_x, r.g3_y, r.g4_x, r.g4_y,
          r.g1_il, r.g1_xl, r.g2_il, r.g2_xl, r.g3_il, r.g3_xl, r.g4_il, r.g4_xl,
          p.basin
        FROM processing_records r
        JOIN projects p ON p.project_id = r.project_id
        WHERE r.g1_x IS NOT NULL OR r.g2_x IS NOT NULL
      `)
      let fixed = 0
      let errors = 0
      for (const rec of rows as any[]) {
        try {
          const rr = reprojectRecord({
            id: Number(rec.id),
            si_code: rec.si_code ?? null,
            projection: rec.projection ?? null,
            utm_zone: rec.utm_zone ?? null,
            spheroid: rec.spheroid ?? null,
            basin: rec.basin ?? null,
            g: [1, 2, 3, 4].map((i) => ({
              x: rec[`g${i}_x`] != null ? Number(rec[`g${i}_x`]) : null,
              y: rec[`g${i}_y`] != null ? Number(rec[`g${i}_y`]) : null,
              il: rec[`g${i}_il`] != null ? Number(rec[`g${i}_il`]) : null,
              xl: rec[`g${i}_xl`] != null ? Number(rec[`g${i}_xl`]) : null,
              corner: i,
            })),
          })
          if (!rr.isMapped) {
            console.warn(`[reprocess] id=${rec.id} could not be mapped, skipping`)
            errors++
            continue
          }
          await client.query(`
            UPDATE processing_records SET
              utm_zone = $1,
              corners = $2,
              bbox_min_lon = $3, bbox_min_lat = $4, bbox_max_lon = $5, bbox_max_lat = $6,
              centroid_lon = $7, centroid_lat = $8,
              is_mapped = $9,
              geometry_status = $10,
              geometry_notes = $11,
              source_crs = $12,
              source_epsg = $13,
              conversion_status = $14,
              validation_issues = $15,
              flagged_for_review = $16,
              footprint = ST_GeomFromText($17, 4326),
              centroid_geom = ST_GeomFromText($18, 4326)
            WHERE id = $19
          `, [
            rr.crs || `UTM zone ${rec.utm_zone}`,
            JSON.stringify(rr.corners),
            rr.bbox?.minLon ?? null, rr.bbox?.minLat ?? null, rr.bbox?.maxLon ?? null, rr.bbox?.maxLat ?? null,
            rr.centroidLon, rr.centroidLat,
            true,
            "SURVEYED",
            rr.geometryNotes,
            rr.sourceCrs,
            rr.sourceEpsg,
            rr.conversionStatus,
            rr.validationIssues,
            rr.flagged,
            rr.footprintWkt || null,
            rr.centroidWkt,
            rec.id,
          ])
          fixed++
        } catch (recErr) {
          console.error(`[reprocess] error processing id=${rec.id}:`, recErr)
          errors++
        }
      }
      return { reprocessed: fixed, errors }
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

surveysRouter.get("/:id/interpretations", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const { rows: recRows } = await query(
      "SELECT footprint FROM processing_records WHERE id = $1",
      [id],
    )
    if (!recRows.length) {
      res.status(404).json({ error: "Survey not found" })
      return
    }
    const footprint = recRows[0].footprint
    if (!footprint) {
      res.json([])
      return
    }
    const { rows } = await query(
      `SELECT id, si_code, name, description, color, opacity, visible,
              processing_type, project_year,
              ST_AsGeoJSON(geometry) AS geometry_geojson,
              properties, created_at, updated_at
       FROM interpretation_polygons
       WHERE ST_Intersects(geometry, $1)
       ORDER BY created_at DESC`,
      [footprint],
    )
    res.json(
      rows.map((r: any) => ({
        ...r,
        geometry_geojson: r.geometry_geojson ? JSON.parse(r.geometry_geojson) : null,
        properties: typeof r.properties === "string" ? JSON.parse(r.properties) : r.properties,
      })),
    )
  } catch (err) {
    next(err)
  }
})

surveysRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const { rows } = await query(`
      SELECT r.*, json_build_object(
        'project_id', p.project_id,
        'project_name', p.project_name,
        'basin', p.basin,
        'project_type', p.project_type,
        'data_dimension', p.data_dimension
      ) AS projects
      FROM processing_records r
      JOIN projects p ON p.project_id = r.project_id
      WHERE r.id = $1
    `, [id])
    if (!rows.length) {
      res.status(404).json({ error: "Survey not found" })
      return
    }
    const rec = rows[0]
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const INK = "#12181f"
    const OCHRE = "#c98a2e"
    const safe = rec.projects?.project_name?.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 60)

    doc.setFillColor(INK)
    doc.rect(0, 0, doc.internal.pageSize.width, 100, "F")
    doc.setTextColor(OCHRE)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("GEOPIC · Seismic Dossier", 40, 44)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor("#efede8")
    doc.text(`${safe || `Project ${rec.project_id}`}  ·  ${rec.si_code ?? "—"}`, 40, 66)
    doc.setDrawColor(OCHRE)
    doc.setLineWidth(0.6)
    doc.line(40, 78, doc.internal.pageSize.width - 40, 78)

    const kv: Record<string, string> = {
      "Project ID": `${rec.project_id}`,
      "SI Code": rec.si_code ?? "—",
      "Project Name": rec.projects?.project_name ?? "—",
      "Basin": rec.projects?.basin ?? "—",
      "Project Type": rec.projects?.project_type ?? "—",
      "Data Dimension": rec.projects?.data_dimension ?? "—",
      "Year of Processing": rec.project_year ?? "—",
      "Type of Processing": rec.type_of_processing ?? "—",
      "Quantum (SKM)": rec.quantum_skm != null ? `${rec.quantum_skm}` : "—",
      "Quantum (SLKM)": rec.quantum_slkm != null ? `${rec.quantum_slkm}` : "—",
      "Processing Bin": rec.processing_bin ?? "—",
      "Record Length": rec.record_length ?? "—",
      "Sampling Interval": rec.sampling_interval ?? "—",
      "Fold": rec.fold ?? "—",
      "Azimuth": rec.azimuth ?? "—",
      "Spheroid": rec.spheroid ?? "—",
      "UTM Zone": rec.utm_zone ?? "—",
      "Projection": rec.projection ?? "—",
      "Timeline": rec.project_timeline ?? "—",
      "Geometry Status": rec.geometry_status ?? "—",
      "Mapped": rec.is_mapped ? "Yes" : "No",
      "Flagged": rec.flagged_for_review ? "Yes" : "No",
      "Centroid": rec.centroid_lat != null ? `${Number(rec.centroid_lat).toFixed(4)}, ${Number(rec.centroid_lon).toFixed(4)}` : "—",
    }

    doc.setFontSize(9)
    doc.setTextColor("#12181f")
    const body = Object.entries(kv).map(([k, v]) => [k, v])
    autoTable(doc, {
      head: [["Attribute", "Value"]],
      body,
      startY: 120,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: INK, textColor: OCHRE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: "#f4f3ef" },
    })

    const corners: any[] = (rec.corners ?? []).map((c: any, i: number) => [
      `G${c.corner ?? i + 1}`,
      c.lat != null ? `${Number(c.lat).toFixed(4)}` : "—",
      c.lon != null ? `${Number(c.lon).toFixed(4)}` : "—",
      c.il != null ? `${c.il}` : "—",
      c.xl != null ? `${c.xl}` : "—",
      c.easting != null ? `${c.easting}` : "—",
      c.northing != null ? `${c.northing}` : "—",
      c.is_assumed ? "assumed" : "surveyed",
    ])
    if (corners.length) {
      autoTable(doc, {
        head: [["Corner", "Lat", "Lon", "IL", "XL", "Easting", "Northing", "Source"]],
        body: corners,
        startY: (doc as any).lastAutoTable.finalY + 14,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: INK, textColor: OCHRE, fontStyle: "bold" },
        alternateRowStyles: { fillColor: "#f4f3ef" },
      })
    }

    const notes: string[] = Array.isArray(rec.geometry_notes) ? rec.geometry_notes : []
    if (notes.length) {
      const y = (doc as any).lastAutoTable.finalY + 16
      doc.setFontSize(8)
      doc.setTextColor(INK)
      doc.setFont("helvetica", "bold")
      doc.text("Cartographic notes", 40, y)
      doc.setFont("helvetica", "normal")
      notes.forEach((n: string, i: number) => doc.text(`  ${i + 1}. ${n}`, 40, y + 12 + i * 10))
    }

    const linkedRows = await query(
      `SELECT id, project_id, si_code, report_type, file_name FROM project_reports WHERE project_id = $1`,
      [rec.project_id],
    )
    const linked = linkedRows.rows
    if (linked.length) {
      const y = (doc as any).lastAutoTable.finalY + 16 + (notes.length ? notes.length * 10 + 6 : 0)
      doc.setFontSize(8)
      doc.setTextColor(INK)
      doc.setFont("helvetica", "bold")
      doc.text("Linked reports", 40, y)
      doc.setFont("helvetica", "normal")
      linked.forEach((r: any, i: number) => doc.text(`  ${i + 1}. ${r.file_name} (${r.report_type ?? "—"})`, 40, y + 12 + i * 10))
    }

    const auditRows = await query(
      `SELECT created_at, action, si_code FROM audit_logs WHERE basin = $1 ORDER BY created_at DESC LIMIT 30`,
      [rec.projects?.basin],
    )
    const auditData = auditRows.rows.map((a: any) => [
      a.created_at instanceof Date ? a.created_at.toISOString().replace("T", " ").slice(0, 19) : String(a.created_at ?? "—"),
      a.action,
      a.si_code ?? "—",
    ])
    if (auditData.length) {
      autoTable(doc, {
        head: [["Timestamp", "Action", "SI Code"]],
        body: auditData,
        startY: Math.max((doc as any).lastAutoTable.finalY + 14, 200),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: INK, textColor: OCHRE, fontStyle: "bold" },
        alternateRowStyles: { fillColor: "#f4f3ef" },
      })
    }

    const pdfBuf = Buffer.from(doc.output("arraybuffer"))
    const filename = `seismic-dossier-${safe || rec.project_id}.pdf`
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuf.length.toString(),
    })
    res.send(pdfBuf)
  } catch (err) {
    console.error("[pdf] generation error:", err)
    next(err)
  }
})
