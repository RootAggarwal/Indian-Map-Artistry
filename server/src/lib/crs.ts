/**
 * CRS (Coordinate Reference System) resolution & conversion engine v2.
 *
 * Handles the full survey coordinate pipeline:
 *  - Per-survey CRS resolution (UTM zone + datum / Kalianpur Lambert zones)
 *  - UTM -> WGS84 geographic conversion with datum-aware ellipsoids
 *  - Kalianpur LCC (Conical Orthomorphic / Lambert 1SP) zone conversion
 *  - Automatic zone validation & correction (stored zone vs. coordinates vs. basin)
 *  - Detection of feet-vs-metre eastings, swapped x/y columns and digit errors
 *  - Candidate ranking by minimum distance to the *anchor set*
 *    (union of the project's basin anchor and SI-code hints) — handles
 *    surveys whose SI-code pattern matches a different basin's region
 *  - Validation & warning generation (never silently accepts bad values)
 *
 * All output coordinates are WGS84 (EPSG:4326) lon/lat.
 */

// ────────────────────────────────────────────────────────────────────────────
// Ellipsoid / datum definitions
// ────────────────────────────────────────────────────────────────────────────

export interface Ellipsoid {
  a: number      // semi-major axis (m)
  invF: number   // inverse flattening
}

export const ELLIPSOIDS: Record<string, Ellipsoid> = {
  WGS84: { a: 6378137.0, invF: 298.257223563 },
  // Everest 1830 (Survey of India / ONGC legacy datum)
  EVRST30: { a: 6377276.345, invF: 300.8017 },
  // Kalianpur 1962 ellipsoid (Everest 1830 modified)
  KALIANPUR1962: { a: 6377301.243, invF: 300.8017255 },
  // Kalianpur 1975 ellipsoid
  KALIANPUR1975: { a: 6377299.151, invF: 300.8017255 },
}

export type Datum = "WGS84" | "EVEREST"

// Everest 1830 / Kalianpur -> WGS84 3-parameter shift (metres).
// Widely used value for India; a 3-param shift is adequate at survey scale.
export const EVEREST_TO_WGS84: [number, number, number] = [284.8, -156.5, 173.1]

export const INDIA_BOUNDS = {
  minLon: 68.0,
  maxLon: 97.5,
  minLat: 6.0,
  maxLat: 37.5,
}

// Maximum footprint bbox span (deg) before it is flagged as implausible.
export const MAX_SPAN_DEG = 5.0

// UTM zone EPSG codes (WGS84 datum): EPSG:326zz
export function wgs84UtmEpsg(zone: number): number {
  return 32600 + zone
}

// ────────────────────────────────────────────────────────────────────────────
// Kalianpur "India zone" (Conical Orthomorphic / Lambert 1SP) definitions
// Parameters verified against the EPSG registry (24371-24383).
// ────────────────────────────────────────────────────────────────────────────

export interface KalianpurZoneDef {
  key: string            // IIa, IIb, IIIa, IVa, I, 0
  epsg: number
  lat1: number           // standard parallel (lat_0 = lat_1 for 1SP)
  lon0: number           // central meridian
  x0: number             // false easting
  y0: number             // false northing
  k0: number
  ellps: Ellipsoid
}

export const KALIANPUR_ZONES: Record<string, KalianpurZoneDef> = {
  "I": { key: "I", epsg: 24376, lat1: 32.5, lon0: 68, x0: 2743196.4, y0: 914398.8, k0: 0.99878641, ellps: ELLIPSOIDS.KALIANPUR1962 },
  "IIa": { key: "IIa", epsg: 24377, lat1: 26, lon0: 74, x0: 2743196.4, y0: 914398.8, k0: 0.99878641, ellps: ELLIPSOIDS.KALIANPUR1962 },
  "IIb": { key: "IIb", epsg: 24380, lat1: 26, lon0: 90, x0: 2743195.5, y0: 914398.5, k0: 0.99878641, ellps: ELLIPSOIDS.KALIANPUR1975 },
  "IIIa": { key: "IIIa", epsg: 24381, lat1: 19, lon0: 80, x0: 2743195.5, y0: 914398.5, k0: 0.99878641, ellps: ELLIPSOIDS.KALIANPUR1975 },
  "IVa": { key: "IVa", epsg: 24383, lat1: 12, lon0: 80, x0: 2743195.5, y0: 914398.5, k0: 0.99878641, ellps: ELLIPSOIDS.KALIANPUR1975 },
}

export const KALIANPUR_ALIASES: Record<string, string> = {
  "LAMBERT-I": "I",
  "LAMBERT I": "I",
  "LAMBERT-1": "I",
  "LAMBERT II A": "IIa",
  "LAMBERT-IIA": "IIa",
  "LAMBERT IIA": "IIa",
  "LAMBERT-2A": "IIa",
  "LAMBERT 2A": "IIa",
  "LAMBERT-II": "IIa",
  "LAMBERT II B": "IIb",
  "LAMBERT-IIB": "IIb",
  "LAMBERT IIB": "IIb",
  "LAMBERT-2B": "IIb",
  "LAMBERT III-A": "IIIa",
  "LAMBERT III A": "IIIa",
  "LAMBERT-IIIA": "IIIa",
  "LAMBERT IV-A": "IVa",
  "LAMBERT-IVA": "IVa",
}

// ────────────────────────────────────────────────────────────────────────────
// Low-level math helpers
// ────────────────────────────────────────────────────────────────────────────

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

function geodeticToGeocentric(lat: number, lon: number, h: number, e: Ellipsoid): [number, number, number] {
  const phi = lat * D2R
  const lam = lon * D2R
  const f = 1 / e.invF
  const e2 = f * (2 - f)
  const N = e.a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi))
  const x = (N + h) * Math.cos(phi) * Math.cos(lam)
  const y = (N + h) * Math.cos(phi) * Math.sin(lam)
  const z = (N * (1 - e2) + h) * Math.sin(phi)
  return [x, y, z]
}

function geocentricToGeodetic(x: number, y: number, z: number, e: Ellipsoid): [number, number] {
  const f = 1 / e.invF
  const e2 = f * (2 - f)
  const p = Math.hypot(x, y)
  let lon = Math.atan2(y, x)
  let lat = Math.atan2(z, p * (1 - e2))
  for (let i = 0; i < 8; i++) {
    const N = e.a / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat))
    const h = p / Math.cos(lat) - N
    const latNew = Math.atan2(z, p * (1 - e2 * N / (N + h)))
    if (Math.abs(latNew - lat) < 1e-12) { lat = latNew; break }
    lat = latNew
  }
  return [lat * R2D, lon * R2D]
}

/** Apply 3-parameter datum shift (geocentric translation) between ellipsoids. */
export function datumShift(lat: number, lon: number, from: Ellipsoid, to: Ellipsoid, tx: number, ty: number, tz: number): [number, number] {
  const [x, y, z] = geodeticToGeocentric(lat, lon, 0, from)
  return geocentricToGeodetic(x + tx, y + ty, z + tz, to)
}

/**
 * Inverse Transverse Mercator (UTM -> geodetic) on a given ellipsoid.
 * Returns [lat, lon] in degrees.
 */
export function utmToGeodetic(easting: number, northing: number, zone: number, ellps: Ellipsoid): [number, number] {
  const k0 = 0.9996
  const a = ellps.a
  const f = 1 / ellps.invF
  const e = Math.sqrt(2 * f - f * f)
  const e2 = e * e
  const ep2 = e2 / (1 - e2)

  let x = easting - 500000
  let y = northing
  if (y >= 10000000) y = y - 10000000

  const m = y / k0
  const mu = m / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256))
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const j1 = 3 * e1 / 2 - 27 * e1 ** 3 / 32
  const j2 = 21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32
  const j3 = 151 * e1 ** 3 / 96
  const j4 = 1097 * e1 ** 4 / 512
  const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu)

  const sinfp = Math.sin(fp)
  const cosfp = Math.cos(fp)
  const tanfp = sinfp / cosfp
  const n2 = ep2 * cosfp * cosfp
  const c1 = 1 + n2
  const nu = a / Math.sqrt(1 - e2 * sinfp * sinfp)
  const rho = nu * (1 - e2) / (1 - e2 * sinfp * sinfp)
  const d = x / (nu * k0)

  const lat = fp - (nu * tanfp / rho) * (
    d * d / 2
    - (5 + 3 * tanfp * tanfp + 10 * c1 - 4 * c1 * c1 - 9 * n2) * d ** 4 / 24
    + (61 + 90 * tanfp * tanfp + 298 * c1 + 45 * tanfp ** 4) * d ** 6 / 720
  )
  const lon = (
    d
    - (1 + 2 * tanfp * tanfp + c1) * d ** 3 / 6
    + (5 - 2 * c1 + 28 * tanfp * tanfp - 3 * c1 * c1 + 8 * n2 + 24 * tanfp ** 4) * d ** 5 / 120
  ) / cosfp + ((zone - 1) * 6 - 180 + 3) * D2R

  return [lat * R2D, lon * R2D]
}

/** Inverse Lambert 1SP (grid -> geodetic, degrees). */
export function lcc1spToGeodetic(x: number, y: number, def: KalianpurZoneDef): [number, number] {
  const e = def.ellps
  const f = 1 / e.invF
  const e2 = f * (2 - f)
  const ecc = Math.sqrt(e2)

  const tFromLat = (phiDeg: number): number => {
    const phi = phiDeg * D2R
    return Math.tan(Math.PI / 4 - phi / 2) / Math.pow((1 - ecc * Math.sin(phi)) / (1 + ecc * Math.sin(phi)), ecc / 2)
  }
  const latFromT = (tVal: number): number => {
    let phi = Math.PI / 2 - 2 * Math.atan(tVal)
    for (let i = 0; i < 12; i++) {
      const phiNew = Math.PI / 2 - 2 * Math.atan(tVal * Math.pow((1 - ecc * Math.sin(phi)) / (1 + ecc * Math.sin(phi)), ecc / 2))
      if (Math.abs(phiNew - phi) < 1e-12) { phi = phiNew; break }
      phi = phiNew
    }
    return phi * R2D
  }

  const phi1 = def.lat1 * D2R
  const n = Math.sin(phi1)
  const m1 = Math.cos(phi1) / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1))
  const t1 = tFromLat(def.lat1)
  const F = m1 / (n * Math.pow(t1, n))
  const r0 = e.a * F * Math.pow(t1, n)

  const dx = x - def.x0
  const dy = y - def.y0
  const r = Math.sign(n) * Math.sqrt(dx * dx + (r0 - dy) ** 2)
  let dl: number
  if (Math.abs(dx) < 1e-10) {
    dl = 0
  } else {
    const theta = Math.atan2(dx, r0 - dy)
    dl = theta / n
  }
  const tVal = Math.pow(r / (e.a * F), 1 / n)
  const lat = latFromT(tVal)
  const lon = def.lon0 + dl * R2D
  return [lat, lon]
}

// ────────────────────────────────────────────────────────────────────────────
// Projection-string parsing
// ────────────────────────────────────────────────────────────────────────────

export type ProjectionKind = "UTM" | "KALIANPUR" | "NOPROJ" | "OTHER"

export interface ResolvedCrs {
  kind: ProjectionKind
  zone: number | null            // UTM zone (1-60)
  datum: Datum
  epsg: number | null            // source EPSG code
  label: string                  // human readable CRS label
  kalianpurKey: string | null    // e.g. "IIa" | "IIb" | null (generic Lambert)
  notes: string[]
}

export function normalizeZoneStr(zone: string | null | undefined): number | null {
  if (!zone) return null
  const m = String(zone).match(/(\d{1,2})/)
  if (!m) return null
  const z = parseInt(m[1], 10)
  return z >= 1 && z <= 60 ? z : null
}

export function normalizeSpheroid(spheroid: string | null | undefined): Datum {
  const s = (spheroid ?? "").toUpperCase()
  if (s.includes("EVEREST") || s.includes("EVRST") || s.includes("KALIANPUR")) return "EVEREST"
  return "WGS84"
}

/**
 * Parse the free-text `projection` column. Handles the wide variety of
 * labels found in the source dataset: "UTM 43N", "UTM44N", "UTM-44",
 * "44N", "42R", "UTM CYL", "UTM IIA", "Lambert II A", "LAMBERT-2A",
 * "LAMBERT SINGLE PARALLEL", "91M", "NULL3", etc.
 */
export function parseProjection(projection: string | null | undefined, datum: Datum): ResolvedCrs {
  const notes: string[] = []
  const raw = (projection ?? "").trim().toUpperCase()
  if (!raw || ["NULL", "NULL3", "NULL4", "NOPROJ", ""].includes(raw)) {
    return { kind: "NOPROJ", zone: null, datum, epsg: null, label: "None", kalianpurKey: null, notes }
  }

  // Kalianpur Lambert zones ("Lambert II A", "LAMBERT-2A", "LAMBERT-IIB", ...)
  const norm = raw.replace(/\s+/g, " ").replace(/-+\s*/g, "-").replace(/\s*-/g, "-")
  const normNoDots = norm.replace(/\./g, "")
  // Longest aliases first so "LAMBERT-IIB" is not swallowed by "LAMBERT-II"
  const aliases = Object.entries(KALIANPUR_ALIASES).sort((a, b) => b[0].length - a[0].length)
  for (const [alias, key] of aliases) {
    const aliasN = alias.replace(/\./g, "")
    if (norm.includes(alias) || normNoDots.includes(aliasN)) {
      const def = KALIANPUR_ZONES[key]
      notes.push(`Kalianpur "India zone ${key}" Lambert grid detected from projection label`)
      return { kind: "KALIANPUR", zone: null, datum: "EVEREST", epsg: def.epsg, label: `Kalianpur ${def.ellps === ELLIPSOIDS.KALIANPUR1962 ? "1962" : "1975"} / India zone ${key}`, kalianpurKey: key, notes }
    }
  }
  // "91M", "Lamber_26_90" style: India zone IIb style grids used for NE India
  if (/^(91M|LAMBER|LAMBERT)/i.test(norm)) {
    const is26_90 = norm.includes("26") && (norm.includes("90") || norm.includes("IIB") || norm.includes("II B"))
    if (is26_90 || /^91M$/i.test(norm)) {
      const def = KALIANPUR_ZONES["IIb"]
      notes.push(`Kalianpur "India zone IIb" Lambert grid detected (label "${projection}")`)
      return { kind: "KALIANPUR", zone: null, datum: "EVEREST", epsg: def.epsg, label: `Kalianpur 1975 / India zone IIb`, kalianpurKey: "IIb", notes }
    }
    // Generic Lambert label ("LAMBERT SINGLE PARALLEL", "LAMBERT", ...):
    // candidate zone resolved later by scoring across all India zones.
    notes.push(`Generic Lambert grid "${projection}" — all Kalianpur India zones tried, zone chosen by validation score`)
    return { kind: "KALIANPUR", zone: null, datum: "EVEREST", epsg: null, label: `Kalianpur Lambert (zone unresolved)`, kalianpurKey: null, notes }
  }

  // UTM detection
  const isUtm = raw.includes("UTM") || raw.includes("CYL") || /^\d{1,2}[NR]$/.test(raw)
  if (!isUtm) {
    return { kind: "OTHER", zone: null, datum, epsg: null, label: raw, kalianpurKey: null, notes: [`Unrecognised projection "${projection}"`] }
  }

  let zone: number | null = null
  const mN = raw.match(/(\d{1,2})\s*[NR]\b/)
  const mU = raw.match(/UTM[^\d]{0,4}(\d{1,2})/)
  const mB = raw.match(/\b(4[2-6])\b/)
  if (mN) zone = parseInt(mN[1], 10)
  else if (mU) zone = parseInt(mU[1], 10)
  else if (mB) zone = parseInt(mB[1], 10)

  if (zone !== null && (zone < 1 || zone > 60)) {
    return { kind: "OTHER", zone: null, datum, epsg: null, label: raw, kalianpurKey: null, notes: [`Zone ${zone} out of UTM range in "${projection}"`] }
  }
  if (zone === null) {
    notes.push(`UTM projection without explicit zone ("${projection}")`)
    return { kind: "UTM", zone: null, datum, epsg: null, label: `UTM (zone unknown)`, kalianpurKey: null, notes }
  }

  const epsg = datum === "WGS84" ? wgs84UtmEpsg(zone) : null // Everest UTM handled via custom transform
  notes.push(`Projection label "${projection}" -> UTM zone ${zone}N`)
  return { kind: "UTM", zone, datum, epsg, label: datum === "WGS84" ? `EPSG:${epsg} (WGS84 / UTM ${zone}N)` : `Everest 1830 / UTM ${zone}N (custom towgs84)`, kalianpurKey: null, notes }
}

// ────────────────────────────────────────────────────────────────────────────
// Basin knowledge for validation (anchor set: basin anchors + SI-code hints)
// ────────────────────────────────────────────────────────────────────────────

export interface Anchor { lat: number; lon: number; name: string }

const BASIN_ANCHORS: Record<string, Anchor> = {
  "WOB": { lat: 19.4, lon: 71.9, name: "Western Offshore Basin (Mumbai)" },
  "B&S ASSET": { lat: 19.4, lon: 72.0, name: "Bombay & Saurashtra offshore" },
  "B&S": { lat: 19.4, lon: 72.0, name: "Bombay & Saurashtra offshore" },
  "WON": { lat: 23.2, lon: 72.5, name: "Western Onshore (Gujarat)" },
  "CAMBAY": { lat: 22.3, lon: 72.9, name: "Cambay basin" },
  "CAMBAY ASSET": { lat: 22.3, lon: 72.9, name: "Cambay basin" },
  "CGS": { lat: 23.3, lon: 72.6, name: "Cambay basin (CGS)" },
  "ESSENTIAL-GEOPIC": { lat: 23.1, lon: 72.6, name: "Bawla (Gujarat)" },
  "MBA": { lat: 22.6, lon: 88.2, name: "Bengal basin" },
  // Cauvery anchor placed at the coast/offshore centre (11.5N 80.0E):
  // the inland (10.8N 79.0E) position biased zone selection toward
  // inland interpretations of offshore surveys (CY/M-series).
  "CAUVERY": { lat: 11.5, lon: 80.0, name: "Cauvery basin" },
  "KG": { lat: 16.4, lon: 82.0, name: "Krishna-Godavari basin" },
  "KG BASIN": { lat: 16.4, lon: 82.0, name: "Krishna-Godavari basin" },
  "KG-PG": { lat: 16.8, lon: 81.9, name: "Krishna-Godavari basin (PG)" },
  "KAKINADA ASSET": { lat: 16.8, lon: 82.2, name: "Kakinada (KG basin)" },
  "JAISALMER": { lat: 27.2, lon: 71.4, name: "Jaisalmer basin" },
  "A&AA": { lat: 26.6, lon: 94.0, name: "Assam & Assam-Arakan basin" },
  "A&AABASIN": { lat: 26.6, lon: 94.0, name: "Assam & Assam-Arakan basin" },
  "ANDAMAN": { lat: 12.5, lon: 92.8, name: "Andaman offshore" },
  "OVL": { lat: 21.5, lon: 96.0, name: "Myanmar (OVL)" },
  "FRONTIER": { lat: 23.9, lon: 79.9, name: "Frontier basin (Vindhyan)" },
  "OERC(URANIUM EXP.)": { lat: 23.9, lon: 79.9, name: "Son valley (OERC)" },
  "HIMALAYAN FOOTHILLS": { lat: 31.0, lon: 77.4, name: "Himalayan foothills" },
}

// si-code prefix / keyword hints. These apply to the si_code string and are
// used *in addition to* the basin anchor — the final score for a candidate is
// its minimum distance to the whole anchor set. That way a survey whose
// si-code pattern matches a different region (e.g. "G1" in Kakinada, "R67"
// blocks duplicated across basins) is still scored against the correct
// region without breaking surveys that genuinely match their basin.
const SI_HINTS: Array<{ re: RegExp; anchor: Anchor }> = [
  { re: /^R\d|^RJ|^RFB|RADJ|SIR/i, anchor: { lat: 27.2, lon: 71.4, name: "Rajasthan (Jaisalmer)" } },
  { re: /^UP|^GV|GANGA/i, anchor: { lat: 26.0, lon: 79.5, name: "Ganga valley" } },
  { re: /^TR/i, anchor: { lat: 23.6, lon: 91.7, name: "Tripura" } },
  { re: /^M\d|^CY|NANNILAM|CAUVERY|KUTHALAM|RAMANATHAPURAM/i, anchor: { lat: 11.5, lon: 80.0, name: "Cauvery basin" } },
  { re: /^KG|^GS\d|^AP\d|MANDAPETA|KAKINADA|GODAVARI|NAGAYA/i, anchor: { lat: 16.4, lon: 82.0, name: "Krishna-Godavari basin" } },
  { re: /^G\d|^CB|BAWLA|GANDHAR|KADI|MEHSANA|BROACH|SADRA|LIMBODARA|KHAMBHAT|TADKESHWAR/i, anchor: { lat: 23.2, lon: 72.5, name: "Gujarat onshore" } },
  { re: /^A\d/i, anchor: { lat: 26.6, lon: 94.0, name: "Assam & Assam-Arakan basin" } },
  { re: /^B\d|^D\d|MUMBAI|HEERA|BASSEIN|MUKTA|PANNA|TAPTI|SSWMH|EPCG|KS\d/i, anchor: { lat: 19.4, lon: 71.9, name: "Mumbai offshore (WOB)" } },
  { re: /^HP\d|KANGRA|MANDI|NAHAN|HIMALAYA/i, anchor: { lat: 31.5, lon: 76.9, name: "Himachal foothills" } },
  { re: /^MP\d|VINDHYAN|SATPURA|SON|DAMOH|JABERA|HATTA|NOHTA/i, anchor: { lat: 23.9, lon: 79.9, name: "Vindhyan / Satpura (MP)" } },
  { re: /^WB\d|^MB\d|BENGAL|BANASKANDI|BANAKANTHA/i, anchor: { lat: 22.6, lon: 88.2, name: "Bengal basin" } },
  { re: /^JK|POONCH|RAJOURI/i, anchor: { lat: 33.3, lon: 74.3, name: "Jammu & Kashmir foothills" } },
  { re: /^AN\b|ANDAMAN/i, anchor: { lat: 12.5, lon: 92.8, name: "Andaman" } },
]

/**
 * Anchor set for a survey: the project basin anchor (if a known basin is
 * recorded) plus the first matching si-code hint. Candidates are ranked by
 * the minimum haversine distance to this set.
 */
export function collectAnchors(basin: string | null | undefined, siCode: string | null | undefined): Anchor[] {
  const out: Anchor[] = []
  const b = (basin ?? "").trim().toUpperCase()
  if (b && BASIN_ANCHORS[b]) out.push(BASIN_ANCHORS[b])
  const si = (siCode ?? "").trim()
  for (const hint of SI_HINTS) {
    if (hint.re.test(si)) {
      if (!out.some((a) => a.name === hint.anchor.name)) out.push(hint.anchor)
      break
    }
  }
  return out
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * D2R
  const dLon = (lon2 - lon1) * D2R
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(dLon / 2) ** 2
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ────────────────────────────────────────────────────────────────────────────

export interface LatLon { lon: number; lat: number }

export function polygonAreaKm2(pts: LatLon[]): number {
  if (pts.length < 3) return 0
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const y1 = p1.lat * D2R, y2 = p2.lat * D2R
    const x1 = p1.lon * D2R, x2 = p2.lon * D2R
    area += (x2 - x1) * (2 + Math.sin(y1) + Math.sin(y2))
  }
  return Math.abs(area * 6371.0088 * 6371.0088 / 2)
}

/** True if the corner order is likely a self-intersecting bowtie. */
export function isSelfIntersecting(pts: LatLon[]): boolean {
  const seg = (p1: LatLon, p2: LatLon) => ({ p1, p2 })
  const ccw = (a: LatLon, b: LatLon, c: LatLon) =>
    (c.lat - a.lat) * (b.lon - a.lon) > (b.lat - a.lat) * (c.lon - a.lon)
  const intersect = (s1: { p1: LatLon; p2: LatLon }, s2: { p1: LatLon; p2: LatLon }) =>
    ccw(s1.p1, s1.p2, s2.p1) !== ccw(s1.p1, s1.p2, s2.p2) &&
    ccw(s2.p1, s2.p2, s1.p1) !== ccw(s2.p1, s2.p2, s1.p2)
  const segs = pts.map((p, i) => seg(p, pts[(i + 1) % pts.length]))
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      if (j === i + 1 || (i === 0 && j === segs.length - 1)) continue
      if (intersect(segs[i], segs[j])) return true
    }
  }
  return false
}

/**
 * Reorder ring points by angle around the bbox centre to produce a valid
 * (non-self-intersecting) ring. Used to fix bowtie corner orders.
 */
export function orderRing<T extends LatLon>(pts: T[]): T[] {
  if (pts.length < 3) return pts
  const lons = pts.map((p) => p.lon)
  const lats = pts.map((p) => p.lat)
  const cLon = (Math.min(...lons) + Math.max(...lons)) / 2
  const cLat = (Math.min(...lats) + Math.max(...lats)) / 2
  return [...pts].sort((a, b) => {
    const angA = Math.atan2(a.lat - cLat, a.lon - cLon)
    const angB = Math.atan2(b.lat - cLat, b.lon - cLon)
    return angA - angB
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Survey conversion pipeline
// ────────────────────────────────────────────────────────────────────────────

export interface RawCorner {
  x: number | null
  y: number | null
  il: number | null
  xl: number | null
  corner: number
}

export interface SurveyInput {
  g: RawCorner[]
  utmZone: string | null
  projection: string | null
  spheroid: string | null
  basin: string | null
  siCode: string | null
}

export type ConversionStatus = "CONVERTED" | "CONVERTED_WITH_WARNINGS" | "UNMAPPED" | "MANUAL_REVIEW"

export interface ConvertedCorner {
  lon: number
  lat: number
  il: number | null
  xl: number | null
  easting: number | null
  northing: number | null
  corner: number
  is_assumed: boolean
}

export interface ConversionResult {
  corners: ConvertedCorner[]
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number } | null
  centroid: { lon: number; lat: number } | null
  crs: ResolvedCrs
  sourceCrs: string
  sourceEpsg: number | null
  status: ConversionStatus
  issues: string[]
  notes: string[]
  usedFeet: boolean
  swappedXY: boolean
  reordered: boolean
  anchorsUsed: string[]
  bestAnchor: string | null
  anchorDistKm: number | null
  corrections: string[]
}

function median(vals: number[]): number {
  if (!vals.length) return NaN
  const s = [...vals].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Detect order-of-magnitude digit-entry errors (a single corner 10x or 100x
 * too large/small vs. the rest). The /10 direction is checked against the
 * median of the *lower* half of the sorted values, the x10 direction against
 * the median of the *upper* half — so a polluted median (e.g. two corners
 * both 10x off, which would sit inside the upper half) cannot cause a
 * 10x-up misfix on the correct values.
 * Returns a map from index -> corrected value.
 */
function detectDigitFixes(vals: number[]): Map<number, number> {
  const fixes = new Map<number, number>()
  if (vals.length < 3) return fixes
  const sorted = [...vals].sort((a, b) => a - b)
  const lo = sorted.slice(0, Math.floor(sorted.length / 2))
  const hi = sorted.slice(Math.ceil(sorted.length / 2))
  const loRef = median(lo)
  const hiRef = median(hi)
  // The upper-half median is only a trustworthy reference for x10 fixes when
  // it is consistent with the lower half (hi/lo < 3). If the halves differ
  // by an order of magnitude, the upper half is itself the outlier cluster
  // (e.g. two corners both 10x too large), and must not be used as a ref —
  // otherwise the correct small values would get wrongly multiplied by 10.
  const hiRefUsable = Number.isFinite(loRef) && loRef > 0 && Number.isFinite(hiRef) && hiRef / loRef < 3
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i]
    if (!Number.isFinite(v) || v <= 0) continue
    if (Number.isFinite(loRef) && loRef > 0) {
      const ratio = v / loRef
      if (ratio > 5) {
        for (const f of [100, 10]) {
          const cand = v / f
          if (cand / loRef >= 0.8 && cand / loRef <= 1.25) { fixes.set(i, cand); break }
        }
      }
    }
    if (!fixes.has(i) && hiRefUsable) {
      const ratio = v / hiRef
      if (ratio < 0.2) {
        for (const f of [100, 10]) {
          const cand = v * f
          if (cand / hiRef >= 0.8 && cand / hiRef <= 1.25) { fixes.set(i, cand); break }
        }
      }
    }
  }
  return fixes
}

const FEET = 0.3048
const FEET_E_RANGE: [number, number] = [50000, 1000000]

interface Cand {
  zone: number | null      // UTM zone
  key: string | null       // Kalianpur zone key
  datum: Datum
  source: string           // "projection" | "utm_zone" | "auto" | "kalianpur"
  weight: number
}

interface Eval {
  cand: Cand
  swap: boolean
  feet: boolean
  pts: LatLon[]
  score: number      // min distance (km) to anchor set; Infinity if no anchor
  inIndia: boolean
  bestAnchor: string | null
}

/**
 * Fully convert a survey's raw corner coordinates (G1-G4) to WGS84.
 * Determines the CRS per survey, applies datum-aware conversion, detects
 * feet/mislabel/swap/digit-error issues, validates and reports warnings.
 */
export function convertSurvey(input: SurveyInput): ConversionResult {
  const issues: string[] = []
  const notes: string[] = []
  const corrections: string[] = []
  const baseline = input.g.filter((c) => c.x != null && c.y != null).map((c) => ({ x: c.x!, y: c.y!, corner: c.corner, il: c.il ?? null, xl: c.xl ?? null }))

  if (!baseline.length) {
    return {
      corners: [], bbox: null, centroid: null,
      crs: { kind: "NOPROJ", zone: null, datum: "WGS84", epsg: null, label: "None", kalianpurKey: null, notes: [] },
      sourceCrs: "None", sourceEpsg: null,
      status: "UNMAPPED", issues: ["No corner coordinates stored"], notes: [],
      usedFeet: false, swappedXY: false, reordered: false,
      anchorsUsed: [], bestAnchor: null, anchorDistKm: null, corrections,
    }
  }

  const datum = normalizeSpheroid(input.spheroid)
  const parsed = parseProjection(input.projection, datum)
  const anchors = collectAnchors(input.basin, input.siCode)
  for (const a of anchors) notes.push(`Validation anchor: ${a.name} (${a.lat}, ${a.lon})`)

  const xs0 = baseline.map((p) => p.x)
  const ys0 = baseline.map((p) => p.y)

  // ── Detect & correct digit-entry errors (robust vs lower/upper medians) ──
  const fixX = detectDigitFixes(xs0)
  const fixY = detectDigitFixes(ys0)
  const xs = [...xs0]
  const ys = [...ys0]
  for (const [idx, to] of fixX) {
    corrections.push(`Corner ${baseline[idx].corner} X: value ${xs0[idx]} corrected to ${to} (obvious digit error)`)
    issues.push(`Corner ${baseline[idx].corner} X digit error corrected (${xs0[idx]} -> ${to})`)
    xs[idx] = to
  }
  for (const [idx, to] of fixY) {
    corrections.push(`Corner ${baseline[idx].corner} Y: value ${ys0[idx]} corrected to ${to} (obvious digit error)`)
    issues.push(`Corner ${baseline[idx].corner} Y digit error corrected (${ys0[idx]} -> ${to})`)
    ys[idx] = to
  }

  // ── Candidate CRS list ────────────────────────────────────────────────────
  const candidates: Cand[] = []
  const pushCand = (c: Cand) => {
    const dup = candidates.some((x) => x.zone === c.zone && x.key === c.key && x.datum === c.datum)
    if (!dup) candidates.push(c)
  }

  if (parsed.kind === "KALIANPUR") {
    for (const key of Object.keys(KALIANPUR_ZONES)) {
      const weight = parsed.kalianpurKey ? (key === parsed.kalianpurKey ? 100 : 50) : 50
      pushCand({ zone: null, key, datum: "EVEREST", source: "kalianpur", weight })
    }
  } else {
    if (parsed.kind === "UTM" && parsed.zone) pushCand({ zone: parsed.zone, key: null, datum, source: "projection", weight: 100 })
    const stored = normalizeZoneStr(input.utmZone)
    if (stored) pushCand({ zone: stored, key: null, datum, source: "utm_zone", weight: 90 })
  }
  // Geo-valid UTM range for India (42-46) as fallback — always included, even
  // for Lambert-labeled surveys whose coordinates are actually UTM (e.g. G375)
  for (let z = 42; z <= 46; z++) pushCand({ zone: z, key: null, datum, source: "auto", weight: 10 })
  // Kalianpur India zones as low-weight fallback (catches surveys whose
  // UTM label is wrong but whose values are Kalianpur grids)
  for (const key of Object.keys(KALIANPUR_ZONES)) {
    pushCand({ zone: null, key, datum: "EVEREST", source: "kalianpur", weight: 5 })
  }

  // ── Evaluate every (candidate x swap x feet) variant ─────────────────────
  const medXRaw = median(xs)
  const evals: Eval[] = []
  for (const cand of candidates) {
    for (const swap of [false, true]) {
      const vx = swap ? ys : xs
      const vy = swap ? xs : ys
      const feetAllowed = median(vx) > FEET_E_RANGE[0] && median(vx) < FEET_E_RANGE[1]
      for (const feet of [false, true]) {
        if (feet && !feetAllowed) continue
        const ex = feet ? vx.map((v) => v * FEET) : vx
        const ey = vy
        const res = evaluateCand(ex, ey, cand, anchors)
        if (res) evals.push({ cand, swap, feet, ...res })
      }
    }
  }

  // ── Feet participation rule ──────────────────────────────────────────────
  // Both metre and feet interpretations are often plausible; the feet
  // interpretation is only admitted when it is *clearly* better than the
  // best metre interpretation (otherwise e.g. CY-UDWHP's metre eastings,
  // which fall in the feet-looking range, get wrongly converted).
  const nonFeetBest = Math.min(...evals.filter((e) => e.inIndia && !e.feet).map((e) => e.score), Infinity)
  const feetAdmitted = (e: Eval): boolean =>
    !Number.isFinite(nonFeetBest) || e.score < 0.8 * nonFeetBest
  // ── Swap participation rule ─────────────────────────────────────────────
  // The swapped-column interpretation is only admitted when it is clearly
  // better than the best unswapped one (otherwise e.g. A308's Kalianpur
  // values, whose y-column looks like a plausible UTM easting, get swapped
  // onto a wrong UTM zone).
  const nonSwapBest = Math.min(...evals.filter((e) => e.inIndia && !e.swap).map((e) => e.score), Infinity)
  const swapAdmitted = (e: Eval): boolean =>
    !Number.isFinite(nonSwapBest) || e.score < 0.75 * nonSwapBest
  const usable = evals.filter((e) => {
    if (!e.inIndia) return false
    if (e.feet && !feetAdmitted(e)) return false
    if (e.swap && !swapAdmitted(e)) return false
    return true
  })

  const ranked = usable.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    if (b.cand.weight !== a.cand.weight) return b.cand.weight - a.cand.weight
    if (a.swap !== b.swap) return a.swap ? 1 : -1
    if (a.feet !== b.feet) return a.feet ? 1 : -1
    return 0
  })

  const chosen: Eval | null = ranked[0] ?? null
  const usedFeet = chosen?.feet ?? false
  const swappedXY = chosen?.swap ?? false

  if (!chosen) {
    const allOutside = evals.length > 0 && evals.every((e) => !e.inIndia)
    issues.push(allOutside
      ? "No candidate CRS places this survey within India — coordinates likely not UTM or projection unknown"
      : "No usable CRS found")
    return {
      corners: [], bbox: null, centroid: null,
      crs: parsed, sourceCrs: parsed.label, sourceEpsg: parsed.epsg,
      status: "MANUAL_REVIEW", issues, notes,
      usedFeet, swappedXY, reordered: false,
      anchorsUsed: anchors.map((a) => a.name), bestAnchor: null, anchorDistKm: null, corrections,
    }
  }

  // Warn when even the best candidate is far from every known region
  if (chosen.score > 700) {
    issues.push(`Converted centroid is ${Math.round(chosen.score)} km from nearest known region (${chosen.bestAnchor ?? "no anchor"}) — zone assignment uncertain`)
  }

  // ── Post-selection analysis ──────────────────────────────────────────────
  const pts = chosen.pts
  if (usedFeet) {
    corrections.push(`Eastings converted from feet to metres (×0.3048)`)
    issues.push(`Eastings were in feet — converted to metres before UTM transform`)
  }
  if (swappedXY) {
    corrections.push(`x/y coordinate columns swapped (easting/northing reversed)`)
    issues.push(`Reversed coordinate order detected — x/y columns swapped before conversion`)
  }
  if (!chosen.cand.key && parsed.kind === "UTM" && chosen.cand.source !== "projection" && chosen.cand.source !== "utm_zone") {
    const used = chosen.cand.zone ? `${chosen.cand.zone}N` : chosen.cand.source
    corrections.push(`UTM zone corrected from "${input.projection ?? "?"}" / stored "${input.utmZone ?? "?"}" to ${used} (${chosen.cand.source})`)
    issues.push(`UTM zone mismatch: projection label "${input.projection ?? "?"}" / stored "${input.utmZone ?? "?"}" vs validated zone ${chosen.cand.zone}N`)
  }
  if (!chosen.cand.key && chosen.cand.source === "auto") {
    notes.push(`UTM zone determined from coordinates (${chosen.cand.zone}N)`)
  }
  if (chosen.cand.key && chosen.cand.source === "kalianpur" && parsed.kind !== "KALIANPUR") {
    corrections.push(`Data recognised as Kalianpur "India zone ${chosen.cand.key}" grid (${chosen.cand.weight === 5 ? "label did not match" : "zone corrected"})`)
    issues.push(`Projection "${input.projection ?? "?"}" but coordinates match Kalianpur "India zone ${chosen.cand.key}" Lambert grid — converted as Kalianpur`)
  }
  if (parsed.kind === "KALIANPUR" && chosen.cand.key && parsed.kalianpurKey && parsed.kalianpurKey !== chosen.cand.key) {
    corrections.push(`Kalianpur zone corrected from "${input.projection ?? "?"}" to India zone ${chosen.cand.key} by validation score`)
    issues.push(`Kalianpur Lambert zone mismatch: label "${input.projection ?? "?"}" vs validated zone ${chosen.cand.key}`)
  }
  if (parsed.kind === "KALIANPUR" && chosen.cand.key && !parsed.kalianpurKey) {
    notes.push(`Generic Lambert label resolved to Kalianpur "India zone ${chosen.cand.key}" by validation score`)
  }
  if (chosen.cand.datum === "EVEREST") {
    notes.push(`Everest 1830 datum shift applied (towgs84=${EVEREST_TO_WGS84.join(",")})`)
  }

  // ── Convert each corner ───────────────────────────────────────────────────
  const corners: ConvertedCorner[] = []
  for (let i = 0; i < baseline.length; i++) {
    const c = baseline[i]
    let x = xs[i]
    let y = ys[i]
    if (swappedXY) { const t = x; x = y; y = t }
    if (usedFeet) x = x * FEET
    let lat: number, lon: number
    if (chosen.cand.key) {
      const def = KALIANPUR_ZONES[chosen.cand.key]
      const [gLat, gLon] = lcc1spToGeodetic(x, y, def)
      const [sLat, sLon] = datumShift(gLat, gLon, def.ellps, ELLIPSOIDS.WGS84, ...EVEREST_TO_WGS84)
      lat = sLat; lon = sLon
    } else {
      const [gLat, gLon] = utmToGeodetic(x, y, chosen.cand.zone!, chosen.cand.datum === "WGS84" ? ELLIPSOIDS.WGS84 : ELLIPSOIDS.EVRST30)
      let [sLat, sLon] = [gLat, gLon]
      if (chosen.cand.datum === "EVEREST") {
        const shifted = datumShift(gLat, gLon, ELLIPSOIDS.EVRST30, ELLIPSOIDS.WGS84, ...EVEREST_TO_WGS84)
        sLat = shifted[0]; sLon = shifted[1]
      }
      lat = sLat; lon = sLon
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      issues.push(`Corner G${c.corner}: conversion produced non-finite coordinates (x=${x}, y=${y})`)
      continue
    }
    corners.push({
      lon: round8(lon), lat: round8(lat),
      il: c.il, xl: c.xl,
      easting: round4(x), northing: round4(y),
      corner: c.corner, is_assumed: false,
    })
  }

  if (corners.length < 2) {
    issues.push(`Only ${corners.length} valid corner(s) after conversion — cannot build a footprint`)
    return {
      corners, bbox: null, centroid: null,
      crs: parsed, sourceCrs: parsed.label, sourceEpsg: parsed.epsg,
      status: "MANUAL_REVIEW", issues, notes,
      usedFeet, swappedXY, reordered: false,
      anchorsUsed: anchors.map((a) => a.name), bestAnchor: chosen.bestAnchor, anchorDistKm: chosen.score, corrections,
    }
  }

  // Reorder bowtie rings
  let reordered = false
  // Drop exact duplicate corners first — duplicated g-points (e.g. g3 = g1)
  // break ring validation even when the ring is otherwise simple.
  const distinctCorners: ConvertedCorner[] = []
  for (const c of corners) {
    if (!distinctCorners.some((d) => d.lon === c.lon && d.lat === c.lat)) {
      distinctCorners.push(c)
    } else {
      corrections.push(`Corner G${c.corner} duplicates another corner — removed from footprint ring`)
      issues.push(`Duplicate corner G${c.corner} (same coordinates as another corner) — dropped from footprint ring`)
    }
  }
  if (distinctCorners.length !== corners.length) {
    corners.splice(0, corners.length, ...distinctCorners)
  }
  if (corners.length > 2 && isSelfIntersecting(corners)) {
    corners.splice(0, corners.length, ...orderRing(corners))
    reordered = true
    corrections.push(`Corner order reordered around footprint centre to remove self-intersection`)
    issues.push(`Corner order produced a self-intersecting (bowtie) polygon — reordered for a valid ring`)
  }

  const lons = corners.map((c) => c.lon)
  const lats = corners.map((c) => c.lat)
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)

  // India-bounds check
  if (minLon < INDIA_BOUNDS.minLon || maxLon > INDIA_BOUNDS.maxLon ||
      minLat < INDIA_BOUNDS.minLat || maxLat > INDIA_BOUNDS.maxLat) {
    issues.push(`Converted footprint lies outside India bounds: lon=[${minLon.toFixed(3)},${maxLon.toFixed(3)}] lat=[${minLat.toFixed(3)},${maxLat.toFixed(3)}]`)
  }

  // Implausible span check
  const spanLon = maxLon - minLon
  const spanLat = maxLat - minLat
  if (spanLon > MAX_SPAN_DEG || spanLat > MAX_SPAN_DEG) {
    issues.push(`Footprint spans ${spanLon.toFixed(1)}° lon × ${spanLat.toFixed(1)}° lat (> ${MAX_SPAN_DEG}°) — implausibly large, verify corner values`)
  }

  // Out-of-zone easting check (UTM)
  if (!chosen.cand.key && chosen.cand.zone) {
    const central = (chosen.cand.zone - 1) * 6 - 180 + 3
    const maxOffset = 420000
    for (const c of corners) {
      if (c.easting != null && Math.abs(c.easting - 500000) > maxOffset) {
        issues.push(`Corner G${c.corner} easting ${c.easting} is >${Math.round(maxOffset / 1000)} km from UTM zone ${chosen.cand.zone}N central meridian — out-of-zone coordinate`)
      }
    }
  }

  // Degenerate geometry checks
  const uniquePts = dedupe(corners.map((c) => `${c.lon.toFixed(6)},${c.lat.toFixed(6)}`))
  if (uniquePts.length < 3) {
    issues.push(`Footprint is degenerate (${uniquePts.length} distinct point(s)) — survey renders as a point/line`)
  }

  const area = polygonAreaKm2(corners)
  if (area > 0 && area < 0.5) {
    issues.push(`Footprint area unusually small (${area.toFixed(2)} km²) — verify corner values`)
  }

  const bbox = { minLon, maxLon, minLat, maxLat }
  const centroid = { lon: (minLon + maxLon) / 2, lat: (minLat + maxLat) / 2 }

  const crs: ResolvedCrs = chosen.cand.key
    ? { kind: "KALIANPUR", zone: null, datum: "EVEREST", epsg: KALIANPUR_ZONES[chosen.cand.key].epsg, label: `Kalianpur / India zone ${chosen.cand.key} (EPSG:${KALIANPUR_ZONES[chosen.cand.key].epsg})`, kalianpurKey: chosen.cand.key, notes: [] }
    : {
        kind: "UTM", zone: chosen.cand.zone, datum: chosen.cand.datum,
        epsg: chosen.cand.datum === "WGS84" && chosen.cand.zone ? wgs84UtmEpsg(chosen.cand.zone) : null,
        label: chosen.cand.datum === "WGS84" && chosen.cand.zone
          ? `WGS84 / UTM ${chosen.cand.zone}N (EPSG:${wgs84UtmEpsg(chosen.cand.zone)})`
          : `Everest 1830 / UTM ${chosen.cand.zone}N (custom towgs84)`,
        kalianpurKey: null, notes: [],
      }

  const status: ConversionStatus = issues.length ? "CONVERTED_WITH_WARNINGS" : "CONVERTED"
  notes.push(`Converted ${corners.length} corner(s) from ${crs.label} to WGS84 (EPSG:4326)`)

  return {
    corners, bbox, centroid, crs,
    sourceCrs: crs.label, sourceEpsg: crs.epsg,
    status, issues, notes, usedFeet, swappedXY, reordered,
    anchorsUsed: anchors.map((a) => a.name), bestAnchor: chosen.bestAnchor, anchorDistKm: chosen.score,
    corrections,
  }
}

function evaluateCand(
  xs: number[], ys: number[],
  cand: Cand,
  anchors: Anchor[],
): { pts: LatLon[]; score: number; inIndia: boolean; bestAnchor: string | null } | null {
  const pts: LatLon[] = []
  if (cand.key) {
    const def = KALIANPUR_ZONES[cand.key]
    for (let i = 0; i < xs.length; i++) {
      let [lat, lon] = lcc1spToGeodetic(xs[i], ys[i], def)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      const [sLat, sLon] = datumShift(lat, lon, def.ellps, ELLIPSOIDS.WGS84, ...EVEREST_TO_WGS84)
      pts.push({ lon: sLon, lat: sLat })
    }
  } else {
    if (!cand.zone) return null
    const ellps = cand.datum === "WGS84" ? ELLIPSOIDS.WGS84 : ELLIPSOIDS.EVRST30
    for (let i = 0; i < xs.length; i++) {
      const [gLat, gLon] = utmToGeodetic(xs[i], ys[i], cand.zone, ellps)
      let [lat, lon] = [gLat, gLon]
      if (cand.datum === "EVEREST") {
        const [sLat, sLon] = datumShift(gLat, gLon, ELLIPSOIDS.EVRST30, ELLIPSOIDS.WGS84, ...EVEREST_TO_WGS84)
        lat = sLat; lon = sLon
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      pts.push({ lon, lat })
    }
  }

  const lons = pts.map((p) => p.lon)
  const lats = pts.map((p) => p.lat)
  const inIndia = Math.min(...lons) >= INDIA_BOUNDS.minLon && Math.max(...lons) <= INDIA_BOUNDS.maxLon &&
    Math.min(...lats) >= INDIA_BOUNDS.minLat && Math.max(...lats) <= INDIA_BOUNDS.maxLat
  if (!inIndia) return { pts, score: Infinity, inIndia: false, bestAnchor: null }

  const cLon = (Math.min(...lons) + Math.max(...lons)) / 2
  const cLat = (Math.min(...lats) + Math.max(...lats)) / 2
  let best: { d: number; name: string } | null = null
  for (const a of anchors) {
    const d = haversineKm(cLat, cLon, a.lat, a.lon)
    if (!best || d < best.d) best = { d, name: a.name }
  }
  return { pts, score: best ? best.d : Infinity, inIndia: true, bestAnchor: best ? best.name : null }
}

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

function round8(v: number): number { return Math.round(v * 1e8) / 1e8 }
function round4(v: number): number { return Math.round(v * 1e4) / 1e4 }

// ────────────────────────────────────────────────────────────────────────────
// WKT / GeoJSON builders
// ────────────────────────────────────────────────────────────────────────────

export function cornersToWkt(corners: ConvertedCorner[]): string {
  if (corners.length < 2) return ""
  if (corners.length === 2) {
    return `LINESTRING(${corners.map((c) => `${c.lon} ${c.lat}`).join(", ")})`
  }
  const ring = corners.map((c) => `${c.lon} ${c.lat}`).join(", ")
  return `POLYGON((${ring}, ${corners[0].lon} ${corners[0].lat}))`
}
