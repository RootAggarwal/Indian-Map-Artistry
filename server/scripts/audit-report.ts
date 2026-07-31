import { getPool } from "../src/db.js"

const pool = getPool()
const { rows } = await pool.query(`
  SELECT r.id, r.si_code, r.project_year, r.type_of_processing, p.basin,
         r.utm_zone AS resolved_crs, r.source_crs, r.source_epsg, r.target_epsg,
         r.conversion_status, r.validation_issues, r.geometry_status,
         r.is_mapped, r.flagged_for_review, r.centroid_lat, r.centroid_lon,
         r.corners,
         ST_X(r.centroid_geom) AS geom_lon, ST_Y(r.centroid_geom) AS geom_lat,
         CASE WHEN r.footprint IS NOT NULL THEN ST_IsValid(r.footprint) END AS fp_valid,
         ST_NPoints(r.footprint) AS fp_npoints
  FROM processing_records r
  JOIN projects p ON p.project_id = r.project_id
  ORDER BY r.id
`)

const esc = (s: string | null | undefined) => {
  const v = String(s ?? "")
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

const header = [
  "id", "si_code", "basin", "project_year", "type_of_processing",
  "status", "source_crs", "source_epsg", "target_epsg", "resolved_crs",
  "centroid_lon", "centroid_lat", "geom_lon", "geom_lat",
  "is_mapped", "flagged", "fp_valid", "fp_npoints",
  "n_corners", "validation_issues", "geometry_status",
]
const lines = [header.join(",")]

for (const r of rows as any[]) {
  const issues = (Array.isArray(r.validation_issues) ? r.validation_issues : []).join(" | ")
  lines.push([
    r.id, r.si_code, r.basin, r.project_year, r.type_of_processing,
    r.conversion_status, r.source_crs, r.source_epsg, r.target_epsg, r.resolved_crs,
    r.centroid_lon, r.centroid_lat, r.geom_lon, r.geom_lat,
    r.is_mapped, r.flagged_for_review, r.fp_valid, r.fp_npoints,
    Array.isArray(r.corners) ? r.corners.length : 0,
    issues, r.geometry_status,
  ].map(esc).join(","))
}

const { writeFileSync } = await import("node:fs")
writeFileSync(new URL("../../docs/audit-report.csv", import.meta.url), lines.join("\n") + "\n")

const c = (v: string) => (rows as any[]).filter((r) => r.conversion_status === v).length
console.log(`rows=${rows.length} CONVERTED=${c("CONVERTED")} CONVERTED_WITH_WARNINGS=${c("CONVERTED_WITH_WARNINGS")} UNMAPPED=${c("UNMAPPED")} MANUAL_REVIEW=${c("MANUAL_REVIEW")}`)
console.log(`mapped=${(rows as any[]).filter((r) => r.is_mapped).length} flagged=${(rows as any[]).filter((r) => r.flagged_for_review).length}`)
console.log(`invalid_footprints=${(rows as any[]).filter((r) => r.fp_valid === false).length}`)
const srcCounts = new Map<string, number>()
for (const r of rows as any[]) {
  const k = String(r.source_crs ?? "none")
  srcCounts.set(k, (srcCounts.get(k) ?? 0) + 1)
}
console.log("\n--- source CRS distribution ---")
for (const [k, n] of [...srcCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(3)}  ${k}`)

await pool.end()
