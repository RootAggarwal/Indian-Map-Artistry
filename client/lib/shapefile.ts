import proj4 from "proj4"

interface Proj4Converter {
  forward: (coords: number[]) => number[]
}

export interface ParseResult {
  features: GeoJSON.Feature[]
  geometryType: string
  featureCount: number
  crsOriginal: string
  epsgCode: number | null
}

const ELLIPSOID_DEFS: Record<string, string> = {
  "WGS_1984": "WGS84",
  "WGS84": "WGS84",
  "GRS_1980": "GRS80",
  "GRS80": "GRS80",
  "EVEREST": "evrst30",
  "EVEREST_1830": "evrst30",
  "EVEREST (1830)": "evrst30",
  "CLARKE_1866": "clrk66",
  "CLARKE_1880": "clrk80",
  "BESSEL_1841": "bessel",
  "AIRY_1830": "airy",
  "Krassowsky_1940": "krass",
  "International_1924": "intl",
  "SPHERE": "sphere",
}

function detectEpsgFromPrj(prjWkt: string): number | null {
  const epsgMatch = prjWkt.match(/AUTHORITY\["[^"]*","(\d+)"\]/)
  if (epsgMatch) return parseInt(epsgMatch[1], 10)
  const geogcsMatch = prjWkt.match(/GEOGCS\["[^"]*"/)
  if (geogcsMatch && !prjWkt.includes("PROJCS")) return 4326
  return null
}

function buildProj4Def(epsg: number): string | null {
  if (epsg >= 32601 && epsg <= 32660) {
    const zone = epsg - 32600
    return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`
  }
  if (epsg >= 32701 && epsg <= 32760) {
    const zone = epsg - 32700
    return `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`
  }
  if (epsg >= 24370 && epsg <= 24383) {
    const zone = epsg - 24370 + 1
    let central = 51 + (zone - 1) * 3
    let falseE = zone * 1000000 + 500000
    return `+proj=lcc +lat_1=26 +lat_0=26 +lon_0=${central} +k_0=0.998 +x_0=${falseE} +y_0=0 +ellps=evrst30 +units=m +no_defs`
  }
  if (epsg >= 7755 && epsg <= 7760) {
    const zone = epsg - 7755 + 1
    const central = 51 + (zone - 1) * 3
    return `+proj=lcc +lat_1=26 +lat_2=30.5 +lat_0=26 +lon_0=${central} +k_0=0.998 +x_0=0 +y_0=0 +ellps=evrst30 +units=m +no_defs`
  }
  return null
}

/** Build a proj4 string from an ESRI-style WKT without AUTHORITY codes. */
function buildProj4FromWkt(prjWkt: string): string | null {
  const projNameMatch = prjWkt.match(/PROJECTION\["([^"]+)"\]/)
  if (!projNameMatch) return null
  const projName = projNameMatch[1].toUpperCase()

  const param = (name: string): number | null => {
    const m = prjWkt.match(new RegExp(`PARAMETER\\["${name}",\\s*([0-9.+-]+)\\]`))
    return m ? parseFloat(m[1]) : null
  }

  let proj: string
  if (projName.includes("TRANSVERSE_MERCATOR")) proj = "tmerc"
  else if (projName.includes("LAMBERT_CONFORMAL")) proj = "lcc"
  else if (projName.includes("MERCATOR")) proj = "merc"
  else if (projName.includes("ALBERS")) proj = "aea"
  else if (projName.includes("POLYCONIC")) proj = "poly"
  else if (projName.includes("STEREOGRAPHIC")) proj = "stere"
  else if (projName.includes("ORTHOGRAPHIC")) proj = "ortho"
  else if (projName.includes("SINUSOIDAL")) proj = "sinu"
  else if (projName.includes("EQUIDISTANT_CONIC")) proj = "eqdc"
  else if (projName.includes("AZIMUTHAL_EQUIDISTANT")) proj = "aeqd"
  else return null

  const parts = [`+proj=${proj}`, "+units=m", "+no_defs"]

  const spheroidMatch = prjWkt.match(/SPHEROID\["([^"]+)"\s*,\s*([0-9.+-]+)\s*,\s*([0-9.+-]+)\]/)
  if (spheroidMatch) {
    const name = spheroidMatch[1].toUpperCase()
    const a = parseFloat(spheroidMatch[2])
    const invf = parseFloat(spheroidMatch[3])
    const ellps = Object.keys(ELLIPSOID_DEFS).find((k) => name.includes(k))
    if (ellps) parts.push(`+ellps=${ELLIPSOID_DEFS[ellps]}`)
    else if (isFinite(invf) && invf > 0) parts.push(`+a=${a}`, `+rf=${invf}`)
    else parts.push(`+a=${a}`)
  } else {
    parts.push("+datum=WGS84")
  }

  const lon0 = param("Central_Meridian")
  const lat0 = param("Latitude_Of_Origin")
  const fe = param("False_Easting")
  const fn = param("False_Northing")
  const k = param("Scale_Factor")
  const lat1 = param("Standard_Parallel_1")
  const lat2 = param("Standard_Parallel_2")

  if (lon0 !== null) parts.push(`+lon_0=${lon0}`)
  if (lat0 !== null) parts.push(`+lat_0=${lat0}`)
  if (fe !== null) parts.push(`+x_0=${fe}`)
  if (fn !== null) parts.push(`+y_0=${fn}`)
  if (k !== null) parts.push(`+k_0=${k}`)
  if (lat1 !== null) parts.push(`+lat_1=${lat1}`)
  if (lat2 !== null) parts.push(`+lat_2=${lat2}`)

  const datumMatch = prjWkt.match(/DATUM\["([^"]+)"\s*,\s*SPHEROID/)
  if (datumMatch && datumMatch[1].includes("WGS_1984") && !projName.includes("TRANSVERSE")) {
    parts.push("+datum=WGS84")
  }

  return parts.join(" ")
}

const KNOWN_PROJ4: Record<string, string> = {
  "EPSG:4326": "+proj=longlat +datum=WGS84 +no_defs",
  "EPSG:3857": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +no_defs",
}

async function loadEpsgDef(epsg: number): Promise<string | null> {
  const key = `EPSG:${epsg}`
  if (KNOWN_PROJ4[key]) return KNOWN_PROJ4[key]

  const built = buildProj4Def(epsg)
  if (built) return built

  try {
    const resp = await fetch(`https://epsg.io/${epsg}.proj4`)
    if (resp.ok) {
      const text = await resp.text()
      const trimmed = text.trim()
      if (trimmed) {
        KNOWN_PROJ4[key] = trimmed
        return trimmed
      }
    }
  } catch {}
  return null
}

function getGeometryType(features: GeoJSON.Feature[]): string {
  const types = new Set<string>()
  for (const f of features) {
    if (f.geometry) types.add(f.geometry.type)
  }
  if (types.size === 1) return types.values().next().value!
  if (types.size > 1) return "Mixed"
  return "Unknown"
}

export async function parseShapefile(files: File[]): Promise<ParseResult> {
  const shpFile = files.find((f) => f.name.endsWith(".shp"))
  const dbfFile = files.find((f) => f.name.endsWith(".dbf"))
  const prjFile = files.find((f) => f.name.endsWith(".prj"))

  if (!shpFile) throw new Error("Missing .shp file")

  const { getShapefile } = (await import("shpjs")) as unknown as {
    getShapefile: (input: { shp: ArrayBuffer; dbf?: ArrayBuffer }) => Promise<GeoJSON.FeatureCollection>
  }

  const shpBuf = await shpFile.arrayBuffer()
  const dbfBuf = dbfFile ? await dbfFile.arrayBuffer() : undefined

  let coll: GeoJSON.FeatureCollection
  try {
    coll = await getShapefile({ shp: shpBuf, dbf: dbfBuf })
  } catch (e) {
    throw new Error(`Shapefile parse error: ${(e as Error).message}`)
  }

  if (!coll) throw new Error("No features parsed from shapefile")

  const rawFeatures: GeoJSON.Feature[] = coll.features ?? []

  if (!rawFeatures.length) throw new Error("Shapefile has no features")

  const geometryType = getGeometryType(rawFeatures)

  let epsgCode: number | null = null
  let crsOriginal = ""
  let projDef: string | null = null

  if (prjFile) {
    const prjWkt = await prjFile.text()
    crsOriginal = prjWkt.slice(0, 200)
    epsgCode = detectEpsgFromPrj(prjWkt)
    if (epsgCode === 4326) epsgCode = null
    if (epsgCode) {
      projDef = await loadEpsgDef(epsgCode)
    } else {
      projDef = buildProj4FromWkt(prjWkt)
    }
  }

  let features = rawFeatures

  if (projDef) {
    try {
      const converter = proj4(projDef, "WGS84") as unknown as Proj4Converter
      features = rawFeatures.map((feat) => {
        if (!feat.geometry) return feat
        return transformGeometry(feat, (coords) => converter.forward(coords))
      })
    } catch (e) {
      console.warn("CRS transform failed, using raw coordinates:", (e as Error).message)
    }
  } else {
    console.warn("No CRS definition available for transform, using raw coordinates")
  }

  return {
    features,
    geometryType,
    featureCount: features.length,
    crsOriginal,
    epsgCode,
  }
}

function transformGeometry(
  feature: GeoJSON.Feature,
  transform: (coords: number[]) => number[],
): GeoJSON.Feature {
  const geo = feature.geometry
  if (!geo || geo.type === "GeometryCollection") return feature

  const clone = JSON.parse(JSON.stringify(feature))

  function recurse(coords: any): any {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [x, y] = transform(coords)
      return coords.length > 2 ? [x, y, ...coords.slice(2)] : [x, y]
    }
    return coords.map(recurse)
  }

  const geom = clone.geometry as any
  geom.coordinates = recurse(geom.coordinates)
  return clone
}

export function validateShapefileFiles(files: File[]): { errors: string[]; warnings: string[] } {
  const names = files.map((f) => f.name.toLowerCase())
  const errors: string[] = []
  const warnings: string[] = []

  const shpName = names.find((n) => n.endsWith(".shp"))
  const baseNames = new Set(
    names
      .filter((n) => /\.(shp|shx|dbf|prj|cpg|qmd)$/.test(n))
      .map((n) => n.replace(/\.(shp|shx|dbf|prj|cpg|qmd)$/, "")),
  )
  if (shpName && baseNames.size > 1) {
    errors.push(`Files have mismatched base names (${[...baseNames].join(", ")}); they must belong to the same layer`)
  }

  if (!shpName) errors.push("Missing .shp file — this upload is not a shapefile")
  if (names.some((n) => n.endsWith(".dbf")) && !names.some((n) => n.endsWith(".shp"))) {
    errors.push(".dbf present without .shp")
  }
  if (shpName && !names.some((n) => n.endsWith(".dbf"))) {
    warnings.push("No .dbf attribute table — features will be imported without attributes")
  }
  if (shpName && !names.some((n) => n.endsWith(".prj"))) {
    warnings.push("No .prj file — coordinates assumed to be WGS84 (lon/lat)")
  }
  if (shpName && !names.some((n) => n.endsWith(".shx"))) {
    warnings.push("No .shx index file (recommended, not required)")
  }

  return { errors, warnings }
}
