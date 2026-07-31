import { reprojectRecord } from "../src/lib/reproject.js"
import { getPool } from "../src/db.js"

interface Row {
  id: number
  si_code: string | null
  projection: string | null
  utm_zone: string | null
  spheroid: string | null
  basin: string | null
  g1_x: string | null; g1_y: string | null; g2_x: string | null; g2_y: string | null
  g3_x: string | null; g3_y: string | null; g4_x: string | null; g4_y: string | null
  g1_il: string | null; g1_xl: string | null; g2_il: string | null; g2_xl: string | null
  g3_il: string | null; g3_xl: string | null; g4_il: string | null; g4_xl: string | null
}

const pool = getPool()
const rows = await pool.query<Row>(`
  SELECT pr.id, pr.si_code, pr.projection, pr.utm_zone, pr.spheroid, p.basin,
         pr.g1_x, pr.g1_y, pr.g2_x, pr.g2_y, pr.g3_x, pr.g3_y, pr.g4_x, pr.g4_y,
         pr.g1_il, pr.g1_xl, pr.g2_il, pr.g2_xl, pr.g3_il, pr.g3_xl, pr.g4_il, pr.g4_xl
  FROM processing_records pr JOIN projects p ON p.project_id = pr.project_id
  ORDER BY pr.id
`)

let updated = 0, unmapped = 0, review = 0, failed = 0
const reviewRows: Array<{ id: number; si: string; issue: string }> = []

for (const r of rows.rows) {
  try {
    const rr = reprojectRecord({
      id: Number(r.id),
      si_code: r.si_code,
      projection: r.projection,
      utm_zone: r.utm_zone,
      spheroid: r.spheroid,
      basin: r.basin,
      g: [1, 2, 3, 4].map((i) => ({
        x: r[`g${i}_x` as "g1_x"] != null ? Number(r[`g${i}_x` as "g1_x"]) : null,
        y: r[`g${i}_y` as "g1_y"] != null ? Number(r[`g${i}_y` as "g1_y"]) : null,
        il: r[`g${i}_il` as "g1_il"] != null ? Number(r[`g${i}_il` as "g1_il"]) : null,
        xl: r[`g${i}_xl` as "g1_xl"] != null ? Number(r[`g${i}_xl` as "g1_xl"]) : null,
        corner: i,
      })),
    })

    if (rr.conversionStatus === "MANUAL_REVIEW") {
      review++
      reviewRows.push({ id: Number(r.id), si: r.si_code ?? "", issue: rr.validationIssues[0] ?? "" })
    }

    await pool.query(
      `UPDATE processing_records SET
         utm_zone = $1,
         corners = $2,
         bbox_min_lon = $3, bbox_min_lat = $4, bbox_max_lon = $5, bbox_max_lat = $6,
         centroid_lon = $7, centroid_lat = $8,
         is_mapped = $9,
         geometry_status = $10,
         geometry_notes = $11,
         source_crs = $12,
         source_epsg = $13,
         target_epsg = 4326,
         conversion_status = $14,
         validation_issues = $15,
         flagged_for_review = $16,
         footprint = ST_GeomFromText($17, 4326),
         centroid_geom = ST_GeomFromText($18, 4326)
       WHERE id = $19`,
      [
        rr.crs || r.utm_zone,
        JSON.stringify(rr.corners),
        rr.bbox?.minLon ?? null, rr.bbox?.minLat ?? null, rr.bbox?.maxLon ?? null, rr.bbox?.maxLat ?? null,
        rr.centroidLon, rr.centroidLat,
        rr.isMapped,
        rr.geometryStatus,
        rr.geometryNotes,
        rr.sourceCrs,
        rr.sourceEpsg,
        rr.conversionStatus,
        rr.validationIssues,
        rr.flagged,
        rr.footprintWkt,
        rr.centroidWkt,
        r.id,
      ],
    )
    if (!rr.isMapped) unmapped++
    updated++
  } catch (err) {
    failed++
    console.error(`[backfill] id=${r.id} error:`, err)
  }
}

console.log(`rows=${rows.rows.length} updated=${updated} unmapped=${unmapped} manual_review=${review} failed=${failed}`)
console.log(`\n--- MANUAL_REVIEW (${reviewRows.length}) ---`)
for (const r of reviewRows) console.log(`id=${r.id} si=${r.si} :: ${r.issue}`)

await pool.end()
