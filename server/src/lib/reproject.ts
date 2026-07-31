import { convertSurvey, cornersToWkt } from "./crs.js"
import type { ConvertedCorner } from "./crs.js"

const CLUSTER_GAP_KM = 100

function haversineKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/**
 * Decide which converted corners may represent a single coherent survey block.
 *
 * Rows that aggregate several surveys in different regions carry corners from
 * each survey, so a naive convex ring turns into a country-sized box (e.g.
 * VN-ONHP-2019/1 spanning 2,300 km). Two rules are applied in order:
 *
 * 1. Grid test — if the (il, xl) pairs of the four corners form the exact
 *    2x2 product {ilA, ilB} x {xlA, xlB}, the corners describe ONE block and
 *    are kept untouched (large but legitimate, e.g. basin-wide CY-UDW rows).
 * 2. Spatial clustering — otherwise corners are linked into groups separated
 *    by >= CLUSTER_GAP_KM; the largest group becomes the footprint. Corners
 *    left out are reported in the notes and the record is flagged.
 *
 * Returns the selected corners (possibly fewer than the input), plus notes
 * and a flag.
 */
export function selectFootprintCorners(
  corners: ConvertedCorner[]
): { selected: ConvertedCorner[]; notes: string[]; dropped: boolean } {
  const notes: string[] = []
  if (corners.length < 2) return { selected: corners, notes, dropped: false }

  const withGrid = corners.filter((c) => c.il != null && c.xl != null)
  if (withGrid.length === corners.length && corners.length === 4) {
    const ils = [...new Set(corners.map((c) => c.il))]
    const xls = [...new Set(corners.map((c) => c.xl))]
    if (ils.length === 2 && xls.length === 2) {
      const combos = new Set(corners.map((c) => `${c.il},${c.xl}`))
      if (combos.size === 4) {
        return { selected: corners, notes, dropped: false }
      }
    }
  }

  // Adaptive gap split: corners whose pairwise distances form two widely
  // separated groups (largest gap > 500 km AND > 4x the closest pair) belong
  // to different surveys/regions. Equidistant large blocks (e.g. basin-wide
  // Cauvery rows, all pairs ~200-320 km) stay together.
  const pairs: { a: number; b: number; d: number }[] = []
  for (let i = 0; i < corners.length; i++) {
    for (let j = i + 1; j < corners.length; j++) {
      pairs.push({ a: i, b: j, d: haversineKm(corners[i], corners[j]) })
    }
  }
  const sorted = [...pairs].sort((x, y) => x.d - y.d)
  const minPair = sorted[0]?.d ?? Infinity
  let largestGap = 0
  let largestGapAt = 0
  for (let k = 1; k < sorted.length; k++) {
    const gap = sorted[k].d - sorted[k - 1].d
    if (gap > largestGap) {
      largestGap = gap
      largestGapAt = k
    }
  }
  const splits = largestGap > 500 && largestGap > 4 * minPair
  if (!splits) {
    return { selected: corners, notes, dropped: false }
  }

  const nearPairs = sorted.slice(0, largestGapAt)
  const used = new Set<number>()
  const clusters: ConvertedCorner[][] = []
  for (const p of nearPairs) {
    const ai = p.a
    const bi = p.b
    const ca = corners[ai]
    const cb = corners[bi]
    let cluster = clusters.find((cl) =>
      cl.some((m) => haversineKm(m, ca) < CLUSTER_GAP_KM || haversineKm(m, cb) < CLUSTER_GAP_KM)
    )
    if (!cluster) {
      cluster = []
      clusters.push(cluster)
    }
    for (const c of [ca, cb]) {
      if (!used.has(c.corner)) {
        used.add(c.corner)
        cluster.push(c)
      }
    }
  }
  const leftover = corners.filter((c) => !used.has(c.corner))
  for (const c of leftover) {
    const cluster = clusters.find((cl) => cl.some((m) => haversineKm(m, c) < CLUSTER_GAP_KM))
    if (cluster) cluster.push(c)
    else clusters.push([c])
  }

  clusters.sort((a, b) => b.length - a.length || bboxSpanKm(a) - bboxSpanKm(b))
  const primary = clusters[0] ?? corners
  const droppedCorners = clusters
    .slice(1)
    .flat()
    .sort((a, b) => a.corner - b.corner)

  if (droppedCorners.length > 0) {
    const labels = droppedCorners.map((c) => `G${c.corner}`).join(", ")
    const gap = Math.max(
      0,
      ...droppedCorners.map((c) => Math.max(0, ...primary.map((m) => haversineKm(m, c))))
    )
    notes.push(
      `Corner(s) ${labels} lie ~${Math.round(gap)} km from the main corner cluster — footprint limited to the main cluster (G${primary.map((c) => c.corner).join("/G")}); verify source data`
    )
  }
  return { selected: primary, notes, dropped: droppedCorners.length > 0 }
}

function bboxSpanKm(corners: ConvertedCorner[]): number {
  if (corners.length === 0) return 0
  const lons = corners.map((c) => c.lon)
  const lats = corners.map((c) => c.lat)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  return haversineKm({ lon: minLon, lat: minLat }, { lon: maxLon, lat: maxLat })
}
export interface RecordForReproject {
  id: number
  si_code: string | null
  projection: string | null
  utm_zone: string | null
  spheroid: string | null
  basin: string | null
  g: Array<{ x: number | null; y: number | null; il: number | null; xl: number | null; corner: number }>
}

export interface ReprojectResult {
  corners: unknown[]
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number } | null
  centroidLon: number | null
  centroidLat: number | null
  footprintWkt: string | null
  centroidWkt: string | null
  sourceCrs: string
  sourceEpsg: number | null
  crs: string | null
  conversionStatus: string
  validationIssues: string[]
  geometryNotes: string[]
  geometryStatus: string
  isMapped: boolean
  flagged: boolean
}

/**
 * Run a processing-record row through the CRS engine and produce every field
 * needed to persist the result (corners, bbox, footprint, centroid, source
 * CRS metadata, conversion status, validation issues). Shared by the API
 * routes and the full-database backfill script.
 */
export function reprojectRecord(rec: RecordForReproject): ReprojectResult {
  const res = convertSurvey({
    g: rec.g,
    utmZone: rec.utm_zone,
    projection: rec.projection,
    spheroid: rec.spheroid,
    basin: rec.basin,
    siCode: rec.si_code,
  })

  // Limit the footprint to the coherent corner cluster (see selectFootprintCorners).
  const footprintSel = selectFootprintCorners(res.corners)
  const fpCorners = footprintSel.selected

  // 3+ corners -> polygon, 2 -> line, 1 -> point, so degenerate rows still
  // render at the right place instead of falling back to a centroid box.
  const footprintWkt = fpCorners.length >= 3
    ? cornersToWkt(fpCorners)
    : fpCorners.length === 2
      ? `LINESTRING(${fpCorners.map((c) => `${c.lon} ${c.lat}`).join(", ")})`
      : fpCorners.length === 1
        ? `POINT(${fpCorners[0].lon} ${fpCorners[0].lat})`
        : ""
  const fpLons = fpCorners.map((c) => c.lon)
  const fpLats = fpCorners.map((c) => c.lat)
  const hasFp = fpCorners.length >= 3
  // Centroid / bbox follow the selected footprint corners so a record whose
  // corners span several regions does not get a point in the middle of nowhere.
  const centroidLon = fpCorners.length > 0
    ? fpCorners.length >= 2
      ? (Math.min(...fpLons) + Math.max(...fpLons)) / 2
      : fpCorners[0].lon
    : null
  const centroidLat = fpCorners.length > 0
    ? fpCorners.length >= 2
      ? (Math.min(...fpLats) + Math.max(...fpLats)) / 2
      : fpCorners[0].lat
    : null

  // A degenerate bbox (all corners identical) produces an invalid zero-area
  // envelope — drop it so consumers fall back to the centroid point box.
  const fpBbox = fpCorners.length >= 2
    ? {
        minLon: Math.min(...fpLons),
        maxLon: Math.max(...fpLons),
        minLat: Math.min(...fpLats),
        maxLat: Math.max(...fpLats),
      }
    : null
  const bbox = fpBbox && fpBbox.maxLon > fpBbox.minLon && fpBbox.maxLat > fpBbox.minLat
    ? fpBbox
    : null

  const geometryNotes = [...res.notes, ...res.corrections, ...footprintSel.notes]
  if (footprintSel.dropped) {
    geometryNotes.push("Multi-region corners split — footprint limited to the primary cluster; record flagged for review")
  }
  if (!hasFp && res.corners.length >= 2) {
    geometryNotes.push(`Only ${fpCorners.length} distinct corner(s) in the primary cluster — renders as a line`)
  }

  return {
    corners: res.corners as unknown[],
    bbox,
    centroidLon,
    centroidLat,
    footprintWkt: footprintWkt || null,
    centroidWkt: centroidLon != null && centroidLat != null ? `POINT(${centroidLon} ${centroidLat})` : null,
    sourceCrs: res.sourceCrs,
    sourceEpsg: res.sourceEpsg,
    crs: res.crs.label,
    conversionStatus: res.status,
    validationIssues: res.issues,
    geometryNotes,
    geometryStatus: res.corners.length >= 1 ? "SURVEYED" : "UNMAPPED",
    isMapped: fpCorners.length >= 1,
    flagged: res.status === "MANUAL_REVIEW" || footprintSel.dropped,
  }
}
