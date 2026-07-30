"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Map as MaplibreMap, NavigationControl, Popup, LngLatBounds } from "maplibre-gl"
import type { GeoJSONSource } from "maplibre-gl"
import type { SurveyRecord } from "@/lib/seismic"
import { useTheme } from "@/contexts/theme"
import { MapToolbar } from "./MapToolbar"
import type { ViewMode } from "./types"

type Props = {
  surveys: SurveyRecord[]
  selectedId: number | null
  onSelect: (rec: SurveyRecord) => void
  zoomSignal: { dir: number; nonce: number } | null
  resetSignal: number
  yearFilterActive: string | null
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}

function makeBaseStyle(isDark: boolean): any {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": isDark ? "#0f172a" : "#f8fafc",
        },
      },
    ],
  }
}

export function MapCanvas({
  surveys,
  selectedId,
  onSelect,
  zoomSignal,
  resetSignal,
  viewMode,
  onViewModeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const { isDark } = useTheme()

  const geojson = useMemo(() => {
    const features: any[] = []
    for (const s of surveys) {
      if (!s.is_mapped || !s.footprint_geojson) continue
      let geom: any
      try {
        geom = JSON.parse(s.footprint_geojson)
      } catch {
        continue
      }
      if (!geom || geom.type !== "Polygon") continue
      features.push({
        type: "Feature",
        id: s.id,
        properties: {
          id: s.id,
          project_id: s.project_id,
          project_name: s.projects?.project_name,
          si_code: s.si_code,
          basin: s.projects?.basin,
          project_year: s.project_year,
          data_dimension: s.projects?.data_dimension,
          type_of_processing: s.type_of_processing,
          flagged: s.flagged_for_review,
        },
        geometry: geom,
      })
    }

    const lineFeatures: any[] = []
    for (const s of surveys) {
      if (s.projects?.data_dimension !== "2D") continue
      const corners = s.corners?.filter((c) => c.lat != null && c.lon != null) ?? []
      if (corners.length < 2) continue
      const coords: [number, number][] = corners.map((c) => [c.lon!, c.lat!])
      lineFeatures.push({
        type: "Feature",
        id: `line-${s.id}`,
        properties: {
          id: s.id,
          project_id: s.project_id,
          project_name: s.projects?.project_name,
          si_code: s.si_code,
          basin: s.projects?.basin,
          project_year: s.project_year,
          data_dimension: "2D",
          type_of_processing: s.type_of_processing,
          flagged: s.flagged_for_review,
        },
        geometry: { type: "LineString", coordinates: coords },
      })
    }

    return { polygonFeatures: features, lineFeatures }
  }, [surveys])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = new MaplibreMap({
      container: containerRef.current,
      style: makeBaseStyle(isDark),
      center: [82.5, 22.5],
      zoom: 4,
      attributionControl: false,
    })

    map.addControl(new NavigationControl(), "bottom-right")

    map.on("load", () => {
      map.addSource("india-boundary", {
        type: "geojson",
        data: "/data/india-boundary.json",
      })
      map.addLayer({
        id: "india-fill",
        type: "fill",
        source: "india-boundary",
        paint: {
          "fill-color": isDark ? "#1e293b" : "#e2e8f0",
          "fill-opacity": 0.6,
        },
      })
      map.addLayer({
        id: "india-outline",
        type: "line",
        source: "india-boundary",
        paint: {
          "line-color": isDark ? "#475569" : "#94a3b8",
          "line-width": 1.2,
        },
      })

      map.addSource("survey-polygons", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addLayer({
        id: "survey-fill",
        type: "fill",
        source: "survey-polygons",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["get", "flagged"], false],
            isDark ? "#b91c1c" : "#dc2626",
            isDark ? "#2d6a8f" : "#3b82f6",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.55,
            ["boolean", ["feature-state", "dimmed"], false],
            0.08,
            0.28,
          ],
        },
      })
      map.addLayer({
        id: "survey-outline",
        type: "line",
        source: "survey-polygons",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            isDark ? "#fbbf24" : "#d97706",
            ["boolean", ["get", "flagged"], false],
            isDark ? "#ef4444" : "#dc2626",
            isDark ? "#60a5fa" : "#2563eb",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            2.5,
            0.7,
          ],
        },
      })

      map.addSource("survey-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addLayer({
        id: "survey-line-2d",
        type: "line",
        source: "survey-lines",
        layout: { visibility: "none" },
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            isDark ? "#fbbf24" : "#d97706",
            ["boolean", ["get", "flagged"], false],
            isDark ? "#ef4444" : "#dc2626",
            isDark ? "#34d399" : "#059669",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            2.5,
            1,
          ],
        },
      })
      map.addLayer({
        id: "survey-point-2d",
        type: "circle",
        source: "survey-lines",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            4,
            2.5,
          ],
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            isDark ? "#fbbf24" : "#d97706",
            isDark ? "#34d399" : "#059669",
          ],
          "circle-stroke-color": isDark ? "#1e293b" : "#ffffff",
          "circle-stroke-width": 0.5,
        },
      })

      map.setLayoutProperty("survey-fill", "visibility", viewMode === "3d" ? "visible" : "none")
      map.setLayoutProperty("survey-outline", "visibility", viewMode === "3d" ? "visible" : "none")

      setMapReady(true)
    })

    map.on("click", "survey-fill", (e) => {
      if (!e.features?.[0]) return
      const id = e.features[0].properties?.id
      if (id != null) {
        const rec = surveys.find((s) => s.id === id)
        if (rec) onSelect(rec)
      }
    })

    map.on("click", "survey-line-2d", (e) => {
      if (!e.features?.[0]) return
      const id = e.features[0].properties?.id
      if (id != null) {
        const rec = surveys.find((s) => s.id === id)
        if (rec) onSelect(rec)
      }
    })

    map.on("mouseenter", "survey-fill", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "survey-fill", () => { map.getCanvas().style.cursor = "" })
    map.on("mouseenter", "survey-line-2d", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "survey-line-2d", () => { map.getCanvas().style.cursor = "" })

    map.on("mousemove", "survey-fill", (e) => {
      if (!e.features?.[0] || !map) return
      const p = e.features[0].properties
      const html = `<div class="px-3 py-2 text-xs" style="font-family:var(--font-sans);min-width:180px">
        <div style="font-family:var(--font-mono);font-size:0.625rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted-foreground);margin-bottom:4px">${p.si_code || "SIG —"}</div>
        <div style="font-weight:600;margin-bottom:2px">${p.project_name || ""}</div>
        <div style="color:var(--seismic)">${p.basin || ""} ${p.project_year ? `· ${p.project_year}` : ""}</div>
        <div style="color:var(--muted-foreground)">${p.data_dimension || ""} ${p.type_of_processing ? `· ${p.type_of_processing}` : ""}</div>
      </div>`
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
    })
    map.on("mouseleave", "survey-fill", () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
    })
    map.on("mousemove", "survey-line-2d", (e) => {
      if (!e.features?.[0] || !map) return
      const p = e.features[0].properties
      const html = `<div class="px-3 py-2 text-xs" style="font-family:var(--font-sans);min-width:180px">
        <div style="font-family:var(--font-mono);font-size:0.625rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted-foreground);margin-bottom:4px">${p.si_code || "SIG —"}</div>
        <div style="font-weight:600;margin-bottom:2px">${p.project_name || ""}</div>
        <div style="color:var(--seismic)">${p.basin || ""} ${p.project_year ? `· ${p.project_year}` : ""}</div>
        <div style="color:var(--muted-foreground)">2D · ${p.type_of_processing || ""}</div>
      </div>`
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
    })
    map.on("mouseleave", "survey-line-2d", () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
    })

    mapRef.current = map
  }, [])

  useEffect(() => {
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const src = map.getSource("survey-polygons") as GeoJSONSource
    if (src) src.setData({ type: "FeatureCollection", features: geojson.polygonFeatures })
    const lineSrc = map.getSource("survey-lines") as GeoJSONSource
    if (lineSrc) lineSrc.setData({ type: "FeatureCollection", features: geojson.lineFeatures })
  }, [geojson, mapReady])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const features = [...geojson.polygonFeatures, ...geojson.lineFeatures]
    for (const f of features) {
      map.setFeatureState({ source: "survey-polygons", id: f.id }, { selected: false, dimmed: false })
    }
    for (const f of features) {
      map.setFeatureState({ source: "survey-lines", id: `line-${f.id}` }, { selected: false, dimmed: false })
    }
    if (selectedId != null) {
      map.setFeatureState({ source: "survey-polygons", id: selectedId }, { selected: true, dimmed: false })
      map.setFeatureState({ source: "survey-lines", id: `line-${selectedId}` }, { selected: true, dimmed: false })
      for (const f of features) {
        if (f.id !== selectedId && f.id !== `line-${selectedId}`) {
          map.setFeatureState({ source: "survey-polygons", id: f.id }, { dimmed: true })
        }
      }
      for (const f of features) {
        if (f.id !== selectedId && f.id !== `line-${selectedId}`) {
          map.setFeatureState({ source: "survey-lines", id: `line-${f.id}` }, { dimmed: true })
        }
      }
    }
  }, [selectedId, geojson, mapReady])

  useEffect(() => {
    if (!zoomSignal || !mapRef.current) return
    const map = mapRef.current
    const zoom = map.getZoom()
    map.flyTo({ zoom: Math.max(3, Math.min(12, zoom + (zoomSignal.dir > 0 ? 1 : -1))), duration: 300 })
  }, [zoomSignal])

  useEffect(() => {
    if (!resetSignal || !mapRef.current) return
    mapRef.current.flyTo({ center: [82.5, 22.5], zoom: 4, duration: 500 })
  }, [resetSignal])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    map.setLayoutProperty("survey-fill", "visibility", viewMode === "3d" ? "visible" : "none")
    map.setLayoutProperty("survey-outline", "visibility", viewMode === "3d" ? "visible" : "none")
    map.setLayoutProperty("survey-line-2d", "visibility", viewMode === "2d" ? "visible" : "none")
    map.setLayoutProperty("survey-point-2d", "visibility", viewMode === "2d" ? "visible" : "none")
  }, [viewMode, mapReady])

  const zoomToSurvey = useCallback((id: number) => {
    if (!mapRef.current) return
    const map = mapRef.current
    const allFeatures = [...geojson.polygonFeatures, ...geojson.lineFeatures]
    const feat = allFeatures.find((f) => f.id === id || f.id === `line-${id}`)
    if (feat) {
      const bounds = new LngLatBounds()
      if (feat.geometry.type === "Polygon") {
        for (const ring of feat.geometry.coordinates) {
          for (const coord of ring) bounds.extend(coord as [number, number])
        }
      } else if (feat.geometry.type === "LineString") {
        for (const coord of feat.geometry.coordinates) bounds.extend(coord as [number, number])
      }
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 600 })
    } else {
      const rec = surveys.find((s) => s.id === id)
      if (rec?.centroid_lon != null && rec?.centroid_lat != null) {
        map.flyTo({ center: [rec.centroid_lon, rec.centroid_lat], zoom: 8, duration: 600 })
      }
    }
  }, [geojson, surveys])

  useEffect(() => {
    if (selectedId != null && mapReady) zoomToSurvey(selectedId)
  }, [selectedId, mapReady])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      {mapReady && (
        <MapToolbar viewMode={viewMode} onViewModeChange={onViewModeChange} />
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rail-label bg-ink/80 px-2 py-1">
        {geojson.polygonFeatures.length + geojson.lineFeatures.length} surveys
      </div>
    </div>
  )
}
