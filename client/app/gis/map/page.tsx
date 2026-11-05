"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Map as MaplibreMap,
  LngLatBounds,
  type GeoJSONSource,
  type RasterTileSource,
  type MapGeoJSONFeature,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { GisNav } from "@/components/gis/GisNav"
import { gisMap, gisProjects, gisPolygons, type MapCollection, type MapFeature } from "@/lib/gis"
import { Button } from "@/components/ui/button"

const BASEMAPS: Record<string, string> = {
  OSM: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  CartoLight: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  CartoDark: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  Esri: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
}

export default function GisMapViewer() {  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const hoveredRef = useRef<MapFeature["properties"] | null>(null)
  const didFit = useRef(false)
  const search = useSearchParams()
  const projectParam = search.get("project") ? Number(search.get("project")) : undefined
  const polygonParam = search.get("polygon") ? Number(search.get("polygon")) : undefined

  const [basemap, setBasemap] = useState("CartoLight")
  const [hovered, setHovered] = useState<MapFeature["properties"] | null>(null)

  // Data source: global map, project map, or single polygon
  const allMap = useQuery({
    queryKey: ["gis-map-global"],
    queryFn: gisMap,
    enabled: projectParam == null && polygonParam == null,
  })
  const projectMap = useQuery({
    queryKey: ["gis-map-project", projectParam],
    queryFn: () => gisProjects.mapData(projectParam!),
    enabled: projectParam != null,
  })
  const singlePoly = useQuery({
    queryKey: ["gis-map-polygon", polygonParam],
    queryFn: async () => {
      const p = await gisPolygons.get(polygonParam!)
      const feature: MapFeature = {
        type: "Feature",
        properties: {
          polygon_id: p.id,
          polygon_identifier: p.polygon_identifier ?? null,
          polygon_name: p.polygon_name ?? null,
          polygon_colour: p.polygon_colour ?? null,
          active: true,
          sig_code: p.sig_code ?? "",
          survey_type: p.survey_type ?? null,
          processing_project_id: 0,
          project_name: "",
          merge_volume_id: p.merge_volume_id ?? null,
          merge_code: p.merge_code ?? null,
          merge_name: p.merge_name ?? null,
          fill_colour: p.polygon_colour ?? "#f97316",
          corner_count: p.corners?.length ?? 0,
        },
        geometry: p.geometry as GeoJSON.Geometry,
      }
      return { type: "FeatureCollection" as const, features: [feature] }
    },
    enabled: polygonParam != null,
  })

  const data = projectParam != null ? projectMap : polygonParam != null ? singlePoly : allMap
  const geojson = useMemo<MapCollection>(
    () => (data.data as MapCollection) ?? { type: "FeatureCollection", features: [] },
    [data.data],
  )

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new MaplibreMap({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      center: [79.5, 22.5],
      zoom: 4.2,
    })
    mapRef.current = map
    map.on("load", () => {
      map.addSource("base", {
        type: "raster",
        tiles: [BASEMAPS[basemap]],
        tileSize: 256,
      })
      map.addLayer({ id: "base", type: "raster", source: "base", paint: { "raster-opacity": 0.8 } })
      registerPolygonLayers(map)
    })
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update basemap source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource("base")) return
    const src = map.getSource("base") as RasterTileSource
    src.setTiles([BASEMAPS[basemap]])
  }, [basemap])

  // Push polygon data into the source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource("polygons")) return
    const src = map.getSource("polygons") as GeoJSONSource
    src.setData(geojson)
    if (!didFit.current && geojson.features.length) {
      const bounds = new LngLatBounds()
      let any = false
      const visit = (c: unknown): void => {
        if (Array.isArray(c) && typeof c[0] === "number") { bounds.extend(c as [number, number]); any = true; return }
        if (Array.isArray(c)) c.forEach((x) => visit(x))
      }
      for (const f of geojson.features) visit((f.geometry as any)?.coordinates)
      if (any) { map.fitBounds(bounds, { padding: 40 }); didFit.current = true }
    }
  }, [geojson])

  function registerPolygonLayers(map: MaplibreMap) {
    if (!map.getSource("polygons")) {
      map.addSource("polygons", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
    }
    if (!map.getLayer("polygons-fill")) {
      map.addLayer({
        id: "polygons-fill",
        type: "fill",
        source: "polygons",
        paint: {
          "fill-color": ["coalesce", ["get", "fill_colour"], "#f97316"],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.7, 0.42],
        },
      })
      map.addLayer({
        id: "polygons-outline",
        type: "line",
        source: "polygons",
        paint: { "line-color": "#1a1a1a", "line-width": 1.1 },
      })
      map.on("mouseenter", "polygons-fill", () => { map.getCanvas().style.cursor = "pointer" })
      map.on("mouseleave", "polygons-fill", () => { map.getCanvas().style.cursor = "" })
      map.on("mousemove", "polygons-fill", (e) => {
        const f = e.features?.[0] as MapGeoJSONFeature | undefined
        if (!f) return
        const props = f.properties as unknown as MapFeature["properties"]
        if (hoveredRef.current && hoveredRef.current.polygon_id !== props.polygon_id) {
          map.setFeatureState({ source: "polygons", id: hoveredRef.current.polygon_id }, { hover: false })
        }
        map.setFeatureState({ source: "polygons", id: f.id ?? props.polygon_id }, { hover: true })
        hoveredRef.current = props
        setHovered(props)
      })
      map.on("mouseleave", "polygons-fill", () => {
        if (hoveredRef.current) {
          map.setFeatureState({ source: "polygons", id: hoveredRef.current.polygon_id }, { hover: false })
        }
        hoveredRef.current = null
        setHovered(null)
      })
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <GisNav />
      <div className="relative flex-1">
        <div ref={containerRef} className="h-full w-full" />
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md border bg-background/90 px-2 py-1.5 shadow">
          <select value={basemap} onChange={(e) => setBasemap(e.target.value)} className="h-7 rounded border bg-background px-1 text-xs">
            {Object.keys(BASEMAPS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Acquisition Polygons: {geojson.features.length}
          </span>
        </div>
        {hovered && (
          <div className="absolute right-3 top-3 z-10 w-64 rounded-md border bg-background/95 p-3 text-xs shadow">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: hovered.fill_colour }} />
              <span className="font-semibold">{hovered.polygon_name || hovered.sig_code || `Polygon ${hovered.polygon_id}`}</span>
            </div>
            <dl className="space-y-1 text-muted-foreground">
              <KV label="SIG Code" v={hovered.sig_code || "—"} />
              <KV label="Survey Type" v={hovered.survey_type ?? "—"} />
              <KV label="Merge Volume" v={hovered.merge_code || hovered.merge_name || "Unknown"} />
              <KV label="Corners" v={String(hovered.corner_count)} />
              {hovered.project_name ? <KV label="Project" v={hovered.project_name} /> : null}
            </dl>
            <Link href={`/gis/polygons/${hovered.polygon_id}`}>
              <Button size="sm" className="mt-2 w-full text-[11px]">Open Polygon Details</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function KV({ label, v }: { label: string; v: string }) {
  return <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="truncate font-medium text-foreground">{v}</dd></div>
}