import * as XLSX from "xlsx"

type GeoJSONFC = GeoJSON.FeatureCollection
type GeoJSONF = GeoJSON.Feature

const LAT_NAMES = [
  "lat", "latitude", "northing", "y", "y_lat", "lat_deg", "latdd",
  "lat_d", "decimallatitude", "decimal_lat",
]
const LON_NAMES = [
  "lon", "lng", "longitude", "easting", "x", "x_lon", "lon_deg", "longdd",
  "lon_d", "decimallongitude", "decimal_lon", "long",
]

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function findCoordColumns(headers: string[]): { latIdx: number; lonIdx: number } | null {
  const normed = headers.map(norm)
  let latIdx = -1
  let lonIdx = -1
  for (let i = 0; i < normed.length; i++) {
    if (latIdx < 0 && LAT_NAMES.some((n) => normed[i] === n || normed[i].includes(n))) latIdx = i
    if (lonIdx < 0 && LON_NAMES.some((n) => normed[i] === n || normed[i].includes(n))) lonIdx = i
  }
  if (latIdx >= 0 && lonIdx >= 0) return { latIdx, lonIdx }
  return null
}

function rowsToFC(rows: Record<string, unknown>[]): GeoJSONFC {
  if (!rows.length) return { type: "FeatureCollection", features: [] }
  const headers = Object.keys(rows[0])
  const coords = findCoordColumns(headers)
  if (!coords) throw new Error("No latitude/longitude columns detected. Use columns named lat, latitude, y, lon, longitude, x, etc.")
  const features: GeoJSONF[] = []
  for (const row of rows) {
    const vals = Object.values(row)
    const lat = parseFloat(String(vals[coords.latIdx] ?? ""))
    const lon = parseFloat(String(vals[coords.lonIdx] ?? ""))
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const props: Record<string, unknown> = {}
    for (let i = 0; i < headers.length; i++) {
      if (i === coords.latIdx || i === coords.lonIdx) continue
      const v = vals[i]
      if (v != null && v !== "") props[headers[i]] = v
    }
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: props,
    })
  }
  return { type: "FeatureCollection", features }
}

async function parseCSV(text: string): Promise<GeoJSONFC> {
  const wb = XLSX.read(text, { type: "string" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
  return rowsToFC(rows)
}

async function parseXLSX(buf: ArrayBuffer): Promise<GeoJSONFC> {
  const wb = XLSX.read(buf, { type: "array" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
  return rowsToFC(rows)
}

function parseKML(xmlText: string): GeoJSONFC {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, "application/xml")
  const errNode = doc.querySelector("parsererror")
  if (errNode) throw new Error("Invalid KML: " + errNode.textContent?.slice(0, 200))
  const ns = "http://www.opengis.net/kml/2.2"
  const placemarks = doc.getElementsByTagNameNS(ns, "Placemark")
  const features: GeoJSONF[] = []
  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i]
    const nameEl = pm.getElementsByTagNameNS(ns, "name")
    const name = nameEl.length ? nameEl[0].textContent ?? "" : ""
    const descEl = pm.getElementsByTagNameNS(ns, "description")
    const desc = descEl.length ? descEl[0].textContent ?? "" : ""
    const coordsEl = pm.getElementsByTagNameNS(ns, "coordinates")
    if (!coordsEl.length) continue
    const raw = coordsEl[0].textContent?.trim() ?? ""
    const points = raw.split(/\s+/).map((p) => {
      const [lon, lat] = p.split(",").map(Number)
      return [lon, lat]
    }).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
    if (!points.length) continue
    const lineEl = pm.getElementsByTagNameNS(ns, "LineString")
    const polyEl = pm.getElementsByTagNameNS(ns, "Polygon")
    const outerEl = polyEl.length ? polyEl[0].getElementsByTagNameNS(ns, "outerBoundaryIs") : null
    let geom: GeoJSON.Geometry
    if (polyEl.length && outerEl?.length) {
      const ringCoords = outerEl[0].getElementsByTagNameNS(ns, "coordinates")
      const ringRaw = ringCoords.length ? ringCoords[0].textContent?.trim() ?? "" : ""
      const ring = ringRaw.split(/\s+/).map((p) => {
        const [lon, lat] = p.split(",").map(Number)
        return [lon, lat]
      }).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
      geom = { type: "Polygon", coordinates: [ring] }
    } else if (lineEl.length) {
      geom = { type: "LineString", coordinates: points }
    } else if (points.length === 1) {
      geom = { type: "Point", coordinates: points[0] }
    } else {
      geom = { type: "LineString", coordinates: points }
    }
    features.push({
      type: "Feature",
      geometry: geom,
      properties: { name, description: desc },
    })
  }
  return { type: "FeatureCollection", features }
}

async function parseShapefileZip(buf: ArrayBuffer): Promise<GeoJSONFC> {
  const shpjs = (await import("shpjs")).default as unknown as (
    input: ArrayBuffer
  ) => Promise<GeoJSONFC>
  return shpjs(buf)
}

export type FileFormat = "geojson" | "csv" | "xlsx" | "kml" | "shapefile_zip" | "unknown"

export function detectFormat(file: File): FileFormat {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "geojson" || ext === "json") return "geojson"
  if (ext === "csv") return "csv"
  if (ext === "xlsx" || ext === "xls") return "xlsx"
  if (ext === "kml") return "kml"
  if (ext === "zip") return "shapefile_zip"
  return "unknown"
}

export async function parseFileToGeoJSON(file: File): Promise<GeoJSONFC> {
  const fmt = detectFormat(file)
  if (fmt === "geojson" || fmt === "json") {
    const text = await file.text()
    const data = JSON.parse(text)
    if (data.type === "FeatureCollection") return data as GeoJSONFC
    if (data.type === "Feature") return { type: "FeatureCollection", features: [data] }
    throw new Error("JSON does not contain GeoJSON Feature or FeatureCollection")
  }
  if (fmt === "csv") {
    const text = await file.text()
    return parseCSV(text)
  }
  if (fmt === "xlsx") {
    const buf = await file.arrayBuffer()
    return parseXLSX(buf)
  }
  if (fmt === "kml") {
    const text = await file.text()
    return parseKML(text)
  }
  if (fmt === "shapefile_zip") {
    const buf = await file.arrayBuffer()
    return parseShapefileZip(buf)
  }
  throw new Error(`Unsupported file format: .${file.name.split(".").pop()}`)
}

export async function convertToShapefileZip(
  fc: GeoJSONFC,
  _outName: string
): Promise<Blob> {
  const shpwrite = (await import("@mapbox/shp-write")).default as {
    zip: (gj: GeoJSONFC) => Promise<string>
  }
  const b64 = await shpwrite.zip(fc)
  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return new Blob([bytes], { type: "application/zip" })
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function getGeometrySummary(fc: GeoJSONFC): { types: Record<string, number>; count: number } {
  const types: Record<string, number> = {}
  for (const f of fc.features) {
    if (!f.geometry) continue
    const t = f.geometry.type
    types[t] = (types[t] ?? 0) + 1
  }
  return { types, count: fc.features.length }
}
