import { convertSurvey } from "../src/lib/crs.js"
import { getPool } from "../src/db.js"

interface Row {
  id: number
  si_code: string | null
  projection: string | null
  utm_zone: string | null
  spheroid: string | null
  basin: string | null
  g1_x: number | null; g1_y: number | null; g2_x: number | null; g2_y: number | null
  g3_x: number | null; g3_y: number | null; g4_x: number | null; g4_y: number | null
}

const pool = getPool()
const rows = await pool.query<Row>(`
  SELECT pr.id, pr.si_code, pr.projection, pr.utm_zone, pr.spheroid, p.basin,
         pr.g1_x, pr.g1_y, pr.g2_x, pr.g2_y, pr.g3_x, pr.g3_y, pr.g4_x, pr.g4_y
  FROM processing_records pr JOIN projects p ON p.project_id = pr.project_id
  ORDER BY pr.id
`)

let ok = 0, warn = 0, review = 0, unmapped = 0
const reviewRows: Array<{ id: number; si: string; status: string; issue: string }> = []
const farRows: Array<{ id: number; si: string; dist: number; anchor: string | null }> = []

for (const r of rows.rows) {
  const g = [
    { x: r.g1_x == null ? null : Number(r.g1_x), y: r.g1_y == null ? null : Number(r.g1_y), il: null, xl: null, corner: 1 },
    { x: r.g2_x == null ? null : Number(r.g2_x), y: r.g2_y == null ? null : Number(r.g2_y), il: null, xl: null, corner: 2 },
    { x: r.g3_x == null ? null : Number(r.g3_x), y: r.g3_y == null ? null : Number(r.g3_y), il: null, xl: null, corner: 3 },
    { x: r.g4_x == null ? null : Number(r.g4_x), y: r.g4_y == null ? null : Number(r.g4_y), il: null, xl: null, corner: 4 },
  ]
  const res = convertSurvey({ g, utmZone: r.utm_zone, projection: r.projection, spheroid: r.spheroid, basin: r.basin, siCode: r.si_code })
  if (res.status === "UNMAPPED") { unmapped++; continue }
  if (res.status === "MANUAL_REVIEW") {
    review++
    reviewRows.push({ id: r.id, si: r.si_code ?? "", status: res.status, issue: res.issues[0] ?? "" })
    continue
  }
  if (res.status === "CONVERTED") ok++
  else warn++
  if (res.anchorDistKm != null && res.anchorDistKm > 700) {
    farRows.push({ id: r.id, si: r.si_code ?? "", dist: Math.round(res.anchorDistKm), anchor: res.bestAnchor })
  }
}

console.log(`rows=${rows.rows.length} CONVERTED=${ok} CONVERTED_WITH_WARNINGS=${warn} MANUAL_REVIEW=${review} UNMAPPED=${unmapped}`)
console.log(`\n--- MANUAL_REVIEW (${reviewRows.length}) ---`)
for (const r of reviewRows) console.log(`id=${r.id} si=${r.si} :: ${r.issue}`)
console.log(`\n--- >700 km from anchor (${farRows.length}) ---`)
for (const r of farRows) console.log(`id=${r.id} si=${r.si} dist=${r.dist}km anchor=${r.anchor}`)

await pool.end()
