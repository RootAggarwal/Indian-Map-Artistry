"use client"

import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react"
import { Map as MaplibreMap, NavigationControl, Popup, LngLatBounds, setWorkerUrl } from "maplibre-gl"
import type { GeoJSONSource } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { SurveyRecord } from "@/lib/seismic"
import type { LayerRecord } from "@/lib/layers"
import type { InterpretationRecord } from "@/lib/interpretations"
import { useTheme } from "@/contexts/theme"
import { MapToolbar } from "./MapToolbar"
import type { ViewMode, BaseMapStyle } from "./types"

type Props = {
  surveys: SurveyRecord[]
  selectedId: number | null
  onSelect: (rec: SurveyRecord) => void
  zoomSignal: { dir: number; nonce: number } | null
  resetSignal: number
  yearFilterActive: string | null
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  layerData: { layer: LayerRecord; features: GeoJSON.FeatureCollection }[]
  zoomToLayerSignal: { id: number; nonce: number } | null
  interpretations?: InterpretationRecord[]
  linkedSurveyIds?: number[] | null
  drawActive?: boolean
  drawPoints?: [number, number][]
  drawColor?: string
  onDrawPoint?: (lng: number, lat: number) => void
  onDrawDone?: () => void
  onDrawCancel?: () => void
}

setWorkerUrl("/maplibre-gl-worker.mjs")

const TILE_SOURCES: Record<BaseMapStyle, { tiles: string[]; attribution: string }> = {
  dark: {
    tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{ratio}.png"],
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> &copy; <a href=\"https://carto.com/\">CARTO</a>",
  },
  light: {
    tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{ratio}.png"],
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> &copy; <a href=\"https://carto.com/\">CARTO</a>",
  },
  osm: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a>",
  },
  satellite: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    attribution: "&copy; Esri",
  },
}

function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function makeBaseStyle(baseStyle: BaseMapStyle, _isDark: boolean): any {
  const bg = baseStyle === "dark" || baseStyle === "satellite" ? "#0f172a" : "#f8fafc"
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": bg },
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
  layerData,
  zoomToLayerSignal,
  interpretations = [],
  linkedSurveyIds = null,
  drawActive = false,
  drawPoints = [],
  drawColor = "#f97316",
  onDrawPoint,
  onDrawDone,
  onDrawCancel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const resizeRef = useRef<ResizeObserver | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [basemapOffline, setBasemapOffline] = useState(false)
  const mapBasemapRef = useRef<{ current: boolean } | null>(null)
  const baseStyleNonce = useRef(0)
  const drawActiveRef = useRef(drawActive)
  const drawPointsRef = useRef(drawPoints)
  const onDrawPointRef = useRef(onDrawPoint)
  const onDrawDoneRef = useRef(onDrawDone)
  const onDrawCancelRef = useRef(onDrawCancel)
  const lastClickRef = useRef<{ t: number; lng: number; lat: number } | null>(null)
  drawActiveRef.current = drawActive
  drawPointsRef.current = drawPoints
  onDrawPointRef.current = onDrawPoint
  onDrawDoneRef.current = onDrawDone
  onDrawCancelRef.current = onDrawCancel
  const { isDark } = useTheme()
  const [baseStyle, setBaseStyle] = useState<BaseMapStyle>(isDark ? "dark" : "light")

  const geojson = useMemo(() => {
    const features: any[] = []
    const lineFeatures: any[] = []
    const propsOf = (s: SurveyRecord) => ({
      id: s.id,
      project_id: s.project_id,
      project_name: s.projects?.project_name,
      si_code: s.si_code,
      basin: s.projects?.basin,
      project_year: s.project_year,
      data_dimension: s.projects?.data_dimension,
      type_of_processing: s.type_of_processing,
      flagged: s.flagged_for_review,
    })
    for (const s of surveys) {
      let geom: any = null
      if (s.footprint_geojson) {
        try {
          geom = typeof s.footprint_geojson === "string" ? JSON.parse(s.footprint_geojson) : s.footprint_geojson
        } catch {}
      }
      if (!geom) continue

      if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
        features.push({ type: "Feature", id: s.id, properties: propsOf(s), geometry: geom })
      } else if (geom.type === "LineString") {
        lineFeatures.push({
          type: "Feature",
          id: `line-${s.id}`,
          properties: propsOf(s),
          geometry: geom,
        })
      } else if (geom.type === "Point") {
        lineFeatures.push({
          type: "Feature",
          id: `pt-${s.id}`,
          properties: propsOf(s),
          geometry: geom,
        })
      }
    }

    return { polygonFeatures: features, lineFeatures }
  }, [surveys])

  useLayoutEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const container = containerRef.current

    if (!container.offsetHeight) {
      console.warn("[MapCanvas] container has zero height, will retry")
    }

    const map = new MaplibreMap({
      container,
      style: makeBaseStyle(baseStyle, isDark),
      center: [82.5, 22.5],
      zoom: 5,
      attributionControl: false,
      renderWorldCopies: false,
    })

    map.addControl(new NavigationControl({ showZoom: true, showCompass: false }), "bottom-right")
    map.resize()

    if (process.env.NODE_ENV !== "production") {
      ;(window as unknown as Record<string, unknown>).__map = map
    }

    function initLayers() {
      try {
        if (map.getSource("india-boundary")) return
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
            "fill-opacity": 0.5,
          },
        })
        map.addLayer({
          id: "india-outline",
          type: "line",
          source: "india-boundary",
          paint: {
            "line-color": "#fbbf24",
            "line-width": 2,
            "line-opacity": 0.9,
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
              isDark ? "#2d6a8f" : "#2563eb",
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.65,
              ["boolean", ["feature-state", "dimmed"], false],
              0.15,
              0.45,
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
              isDark ? "#60a5fa" : "#1d4ed8",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              3,
              1.5,
            ],
          },
        })

        map.addSource("survey-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
        map.addLayer({
          id: "survey-line-2d",
          type: "line",
          source: "survey-lines",
          layout: { visibility: "visible" },
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
              3,
              1.5,
            ],
          },
        })
        map.addLayer({
          id: "survey-point-2d",
          type: "circle",
          source: "survey-lines",
          layout: { visibility: "visible" },
          paint: {
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              5,
              3,
            ],
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              isDark ? "#fbbf24" : "#d97706",
              isDark ? "#34d399" : "#059669",
            ],
            "circle-stroke-color": isDark ? "#1e293b" : "#ffffff",
            "circle-stroke-width": 1,
          },
        })

        // Linked-survey highlight (surveys intersecting the active interpretation)
        map.addSource("survey-linked", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
        map.addLayer({
          id: "survey-linked-fill",
          type: "fill",
          source: "survey-linked",
          layout: { visibility: "none" },
          paint: { "fill-color": "#f59e0b", "fill-opacity": 0.45 },
        })
        map.addLayer({
          id: "survey-linked-line",
          type: "line",
          source: "survey-linked",
          layout: { visibility: "none" },
          paint: { "line-color": "#f59e0b", "line-width": 2.5, "line-dasharray": [2, 1] },
        })
        map.addLayer({
          id: "survey-linked-point",
          type: "circle",
          source: "survey-linked",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": 5,
            "circle-color": "#f59e0b",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        })

        map.addSource("interpretations", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
        map.addLayer({
          id: "interpretation-fill",
          type: "fill",
          source: "interpretations",
          layout: { visibility: "visible" },
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#f97316"],
            "fill-opacity": ["coalesce", ["get", "opacity"], 0.4],
          },
        })
        map.addLayer({
          id: "interpretation-outline",
          type: "line",
          source: "interpretations",
          layout: { visibility: "visible" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#f97316"],
            "line-width": 1.5,
            "line-opacity": 0.9,
          },
        })

        map.addSource("draw-draft", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
        map.addLayer({
          id: "draw-draft-fill",
          type: "fill",
          source: "draw-draft",
          paint: {
            "fill-color": drawColor,
            "fill-opacity": 0.25,
          },
        })
        map.addLayer({
          id: "draw-draft-line",
          type: "line",
          source: "draw-draft",
          paint: {
            "line-color": drawColor,
            "line-width": 2,
            "line-dasharray": [2, 1.5],
            "line-opacity": 0.95,
          },
        })
        map.addLayer({
          id: "draw-draft-points",
          type: "circle",
          source: "draw-draft",
          paint: {
            "circle-radius": 4,
            "circle-color": drawColor,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1,
          },
        })

        map.setLayoutProperty("survey-fill", "visibility", "visible")
        map.setLayoutProperty("survey-outline", "visibility", "visible")

        setMapReady(true)
      } catch (err) {
        console.error("[MapCanvas] init error:", err)
      }
    }

    map.on("load", initLayers)

    const fallbackTimer = setTimeout(() => {
      if (!mapRef.current || mapReady) return
      try { initLayers() } catch { setMapReady(true) }
    }, 5000)

    const basemapOfflineRef = { current: false }
    map.on("error", (e) => {
      const msg = String((e as any)?.error?.message ?? "")
      const isTileError = Boolean((e as any)?.tile) || (e as any)?.sourceId === "base-tiles"
      const isNetworkError = /fetch|network|load|tile|status 404|Failed to/i.test(msg)

      if (isTileError || isNetworkError) {
        if (basemapOfflineRef.current) return
        basemapOfflineRef.current = true
        console.warn("[MapCanvas] basemap tiles unreachable — switching to plain background")
        try {
          if (map.getLayer("base-tiles")) map.removeLayer("base-tiles")
          if (map.getSource("base-tiles")) map.removeSource("base-tiles")
        } catch {}
        setBasemapOffline(true)
        return
      }

      console.warn("[MapCanvas] map error:", msg || e)
    })
    mapBasemapRef.current = basemapOfflineRef

    map.on("click", "survey-fill", (e) => {
      if (drawActiveRef.current) return
      if (!e.features?.[0]) return
      const id = e.features[0].properties?.id
      if (id != null) {
        const rec = surveys.find((s) => s.id === id)
        if (rec) onSelect(rec)
      }
    })

    map.on("click", "survey-line-2d", (e) => {
      if (drawActiveRef.current) return
      if (!e.features?.[0]) return
      const id = e.features[0].properties?.id
      if (id != null) {
        const rec = surveys.find((s) => s.id === id)
        if (rec) onSelect(rec)
      }
    })
    map.on("click", "survey-point-2d", (e) => {
      if (drawActiveRef.current) return
      if (!e.features?.[0]) return
      const id = e.features[0].properties?.id
      if (id != null) {
        const rec = surveys.find((s) => s.id === id)
        if (rec) onSelect(rec)
      }
    })

    // Drawing mode: plain map clicks append vertices; double-click finishes
    // (the second click of the pair is suppressed to avoid a duplicate vertex).
    map.on("click", (e) => {
      if (!drawActiveRef.current || !onDrawPointRef.current) return
      const now = Date.now()
      const last = lastClickRef.current
      const dup =
        last != null &&
        now - last.t < 350 &&
        Math.abs(e.lngLat.lng - last.lng) < 0.01 &&
        Math.abs(e.lngLat.lat - last.lat) < 0.01
      lastClickRef.current = { t: now, lng: e.lngLat.lng, lat: e.lngLat.lat }
      if (dup) return
      onDrawPointRef.current(e.lngLat.lng, e.lngLat.lat)
    })
    map.on("dblclick", () => {
      if (!drawActiveRef.current || !onDrawDoneRef.current) return
      if (drawPointsRef.current.length >= 3) onDrawDoneRef.current()
    })

    map.on("mouseenter", "survey-fill", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "survey-fill", () => { map.getCanvas().style.cursor = "" })
    map.on("mouseenter", "survey-line-2d", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "survey-line-2d", () => { map.getCanvas().style.cursor = "" })
    map.on("mouseenter", "survey-point-2d", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "survey-point-2d", () => { map.getCanvas().style.cursor = "" })

    const popupHtml = (p: any) => `<div class="px-3 py-2 text-xs" style="font-family:var(--font-sans);min-width:180px">
      <div style="font-family:var(--font-mono);font-size:0.625rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted-foreground);margin-bottom:4px">${escapeHtml(p.si_code) || "SIG —"}</div>
      <div style="font-weight:600;margin-bottom:2px">${escapeHtml(p.project_name)}</div>
      <div style="color:var(--seismic)">${escapeHtml(p.basin)} ${p.project_year ? `· ${escapeHtml(p.project_year)}` : ""}</div>
      <div style="color:var(--muted-foreground)">${escapeHtml(p.data_dimension)} ${p.type_of_processing ? `· ${escapeHtml(p.type_of_processing)}` : ""}</div>
    </div>`

    map.on("mousemove", "survey-fill", (e) => {
      if (!e.features?.[0] || !map) return
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(popupHtml(e.features[0].properties))
        .addTo(map)
    })
    map.on("mouseleave", "survey-fill", () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
    })
    map.on("mousemove", "survey-line-2d", (e) => {
      if (!e.features?.[0] || !map) return
      if (popupRef.current) popupRef.current.remove()
      const p = e.features[0].properties
      const html = popupHtml({ ...p, data_dimension: "2D" })
      popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
    })
    map.on("mouseleave", "survey-line-2d", () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
    })
    map.on("mousemove", "survey-point-2d", (e) => {
      if (!e.features?.[0] || !map) return
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(popupHtml(e.features[0].properties))
        .addTo(map)
    })
    map.on("mouseleave", "survey-point-2d", () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
    })

    mapRef.current = map

    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    })
    ro.observe(container.parentElement || container)
    resizeRef.current = ro

    return () => {
      clearTimeout(fallbackTimer)
      ro.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    mapRef.current?.resize()
  })

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const tile = TILE_SOURCES[baseStyle]
    const nonce = ++baseStyleNonce.current
    if (map.getLayer("base-tiles")) map.removeLayer("base-tiles")
    if (map.getSource("base-tiles")) map.removeSource("base-tiles")
    if (mapBasemapRef.current) mapBasemapRef.current.current = false
    setBasemapOffline(false)

    const probeUrl = tile.tiles[0]
      .replace("{z}", "0").replace("{x}", "0").replace("{y}", "0").replace("{ratio}", "")
    const probe = fetch(probeUrl, { mode: "cors" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`) })
      .catch(() => { throw new Error("unreachable") })

    void probe
      .then(() => {
        if (nonce !== baseStyleNonce.current || !mapRef.current) return
        if (map.getLayer("base-tiles")) map.removeLayer("base-tiles")
        if (map.getSource("base-tiles")) map.removeSource("base-tiles")
        map.addSource("base-tiles", {
          type: "raster",
          tiles: tile.tiles,
          tileSize: 256,
          attribution: tile.attribution,
        })
        map.addLayer({ id: "base-tiles", type: "raster", source: "base-tiles" }, "india-fill")
      })
      .catch(() => {
        if (nonce !== baseStyleNonce.current) return
        if (mapBasemapRef.current) mapBasemapRef.current.current = true
        setBasemapOffline(true)
      })
  }, [baseStyle, mapReady])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const polygonCount = geojson.polygonFeatures.length
    const lineCount = geojson.lineFeatures.length
    const src = map.getSource("survey-polygons") as GeoJSONSource
    if (src) {
      src.setData({ type: "FeatureCollection", features: geojson.polygonFeatures })
    }
    const lineSrc = map.getSource("survey-lines") as GeoJSONSource
    if (lineSrc) {
      lineSrc.setData({ type: "FeatureCollection", features: geojson.lineFeatures })
    }
  }, [geojson, mapReady])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    for (const f of geojson.polygonFeatures) {
      map.setFeatureState({ source: "survey-polygons", id: f.id }, { selected: false, dimmed: false })
    }
    for (const f of geojson.lineFeatures) {
      map.setFeatureState({ source: "survey-lines", id: f.id }, { selected: false, dimmed: false })
    }
    if (selectedId != null) {
      map.setFeatureState({ source: "survey-polygons", id: selectedId }, { selected: true, dimmed: false })
      map.setFeatureState({ source: "survey-lines", id: `line-${selectedId}` }, { selected: true, dimmed: false })
      map.setFeatureState({ source: "survey-lines", id: `pt-${selectedId}` }, { selected: true, dimmed: false })
      for (const f of geojson.polygonFeatures) {
        if (f.id !== selectedId && f.id !== `line-${selectedId}` && f.id !== `pt-${selectedId}`) {
          map.setFeatureState({ source: "survey-polygons", id: f.id }, { dimmed: true })
        }
      }
      for (const f of geojson.lineFeatures) {
        if (f.id !== selectedId && f.id !== `line-${selectedId}` && f.id !== `pt-${selectedId}`) {
          map.setFeatureState({ source: "survey-lines", id: f.id }, { dimmed: true })
        }
      }
    }
  }, [selectedId, geojson, mapReady])

  useEffect(() => {
    if (!zoomSignal || !mapRef.current) return
    const map = mapRef.current
    map.flyTo({ zoom: Math.max(3, Math.min(12, map.getZoom() + (zoomSignal.dir > 0 ? 1 : -1))), duration: 300 })
  }, [zoomSignal])

  useEffect(() => {
    if (!resetSignal || !mapRef.current) return
    mapRef.current.flyTo({ center: [82.5, 22.5], zoom: 4, duration: 500 })
  }, [resetSignal])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    map.setLayoutProperty("survey-fill", "visibility", "visible")
    map.setLayoutProperty("survey-outline", "visibility", "visible")
    map.setLayoutProperty("survey-line-2d", "visibility", "visible")
    map.setLayoutProperty("survey-point-2d", "visibility", "visible")
  }, [viewMode, mapReady])

  // ── Interpretation polygons ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const src = map.getSource("interpretations") as GeoJSONSource | undefined
    if (!src) return
    const features = interpretations
      .filter((r) => r.visible && r.geometry_geojson)
      .map((r) => ({
        type: "Feature" as const,
        id: r.id,
        properties: {
          id: r.id,
          name: r.name ?? r.si_code ?? `Interpretation #${r.id}`,
          color: r.color,
          opacity: r.opacity,
        },
        geometry: r.geometry_geojson as GeoJSON.Geometry,
      }))
    src.setData({ type: "FeatureCollection", features })
  }, [interpretations, mapReady])

  // ── Linked-survey highlight ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const src = map.getSource("survey-linked") as GeoJSONSource | undefined
    const active = linkedSurveyIds != null && linkedSurveyIds.length > 0
    for (const l of ["survey-linked-fill", "survey-linked-line", "survey-linked-point"]) {
      map.setLayoutProperty(l, "visibility", active ? "visible" : "none")
    }
    if (!src) return
    if (!active) {
      src.setData({ type: "FeatureCollection", features: [] })
      return
    }
    const ids = new Set(linkedSurveyIds)
    const features: any[] = []
    for (const s of surveys) {
      if (!ids.has(s.id)) continue
      let geom: any = null
      if (s.footprint_geojson) {
        try {
          geom = typeof s.footprint_geojson === "string" ? JSON.parse(s.footprint_geojson) : s.footprint_geojson
        } catch {}
      }
      if (!geom) continue
      features.push({ type: "Feature", id: s.id, properties: { id: s.id }, geometry: geom })
    }
    src.setData({ type: "FeatureCollection", features })
  }, [linkedSurveyIds, surveys, mapReady])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const src = map.getSource("draw-draft") as GeoJSONSource | undefined
    if (!src) return
    const features: GeoJSON.Feature[] = []
    if (drawActive && drawPoints.length > 0) {
      if (drawPoints.length >= 2) {
        features.push({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: drawPoints },
        })
        if (drawPoints.length >= 3) {
          features.push({
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [[...drawPoints, drawPoints[0]]] },
          })
        }
      }
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "MultiPoint", coordinates: drawPoints },
      })
    }
    src.setData({ type: "FeatureCollection", features })
  }, [drawActive, drawPoints, mapReady])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const visible = drawActive ? "visible" : "none"
    for (const l of ["draw-draft-fill", "draw-draft-line", "draw-draft-points"]) {
      map.setLayoutProperty(l, "visibility", visible)
    }
    if (drawActive) {
      try { map.doubleClickZoom.disable() } catch {}
      map.getCanvas().style.cursor = "crosshair"
      const onKey = (e: KeyboardEvent) => {
        const t = e.target as HTMLElement | null
        const tag = t?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return
        if (e.key === "Escape") onDrawCancelRef.current?.()
        if (e.key === "Enter") {
          if (drawPointsRef.current.length >= 3) onDrawDoneRef.current?.()
        }
      }
      window.addEventListener("keydown", onKey)
      return () => {
        window.removeEventListener("keydown", onKey)
        map.getCanvas().style.cursor = ""
      }
    }
    try { map.doubleClickZoom.enable() } catch {}
    map.getCanvas().style.cursor = ""
  }, [drawActive, mapReady])

  // ── Uploaded layers rendering ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current

    const existing = map.getStyle().layers?.filter((l) => l.id.startsWith("uploaded-")) ?? []
    for (const l of existing) {
      try { if (map.getLayer(l.id)) map.removeLayer(l.id) } catch {}
    }
    const srcKeys = Object.keys(map.getStyle().sources ?? {})
    for (const sid of srcKeys) {
      if (sid.startsWith("uploaded-")) {
        try { if (map.getSource(sid)) map.removeSource(sid) } catch {}
      }
    }

    const beforeId = map.getLayer("survey-fill") ? "survey-fill" : undefined

    for (const { layer: lr, features } of layerData) {
      if (!features.features.length) continue
      const sid = `uploaded-src-${lr.id}`
      const vis = (lr.visible !== false) ? "visible" : "none"
      const c = lr.style?.color ?? "#888"
      const o = lr.style?.opacity ?? 0.6
      const oc = lr.style?.outline_color ?? "#000"
      const ow = lr.style?.outline_width ?? 1
      const gt = lr.geometry_type ?? features.features[0]?.geometry?.type ?? ""

      map.addSource(sid, { type: "geojson", data: features })

      const isPoly = gt.includes("Polygon") || gt === "MultiPolygon"
      const isLine = gt.includes("Line") || gt === "MultiLineString"
      const isPoint = gt.includes("Point") || gt === "MultiPoint"

      if (isPoly || (!isLine && !isPoint)) {
        map.addLayer({
          id: `uploaded-fill-${lr.id}`, type: "fill",
          source: sid,
          layout: { visibility: vis },
          paint: { "fill-color": c, "fill-opacity": o },
        }, beforeId)
        map.addLayer({
          id: `uploaded-outline-${lr.id}`, type: "line",
          source: sid,
          layout: { visibility: vis },
          paint: { "line-color": oc, "line-width": ow, "line-opacity": 0.85 },
        }, beforeId)
      }
      if (isLine) {
        map.addLayer({
          id: `uploaded-line-${lr.id}`, type: "line",
          source: sid,
          layout: { visibility: vis },
          paint: { "line-color": c, "line-width": ow * 2, "line-opacity": o },
        }, beforeId)
      }
      if (isPoint) {
        map.addLayer({
          id: `uploaded-point-${lr.id}`, type: "circle",
          source: sid,
          layout: { visibility: vis },
          paint: {
            "circle-radius": 5, "circle-color": c,
            "circle-opacity": o, "circle-stroke-color": oc,
            "circle-stroke-width": 1,
          },
        }, beforeId)
      }
    }

    // Generic hover & popup for uploaded layers
    const uploadLayerIds = map.getStyle().layers
      ?.filter((l) => l.id.startsWith("uploaded-"))
      .map((l) => l.id) ?? []

    if (uploadLayerIds.length && popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }

    for (const lid of uploadLayerIds) {
      map.on("mouseenter", lid, () => { map.getCanvas().style.cursor = "pointer" })
      map.on("mouseleave", lid, () => { map.getCanvas().style.cursor = "" })
      map.on("mousemove", lid, (e) => {
        if (!e.features?.[0] || !map) return
        if (popupRef.current) popupRef.current.remove()
        const p = e.features[0].properties ?? {}
        const rows = Object.entries(p)
          .filter(([k]) => !k.startsWith("_"))
          .slice(0, 15)
          .map(([k, v]) => `<tr><td class="pr-2 font-semibold">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
          .join("")
        popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
          .setLngLat(e.lngLat)
          .setHTML(`<table class="text-xs" style="font-family:var(--font-sans)">${rows}</table>`)
          .addTo(map)
      })
      map.on("mouseleave", lid, () => {
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
      })
    }

    return () => {
      // cleanup is handled by re-run of this effect
    }
  }, [layerData, mapReady])

  // ── Zoom to layer ─────────────────────────────────────────────
  const pendingZoomRef = useRef<number | null>(null)

  const zoomToUploaded = useCallback(async (id: number) => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current
    const srcId = `uploaded-src-${id}`
    const src = map.getSource(srcId) as GeoJSONSource | undefined
    if (!src) {
      pendingZoomRef.current = id
      return
    }
    pendingZoomRef.current = null
    try {
      const data = (await src.getData()) as GeoJSON.FeatureCollection
      if (!data?.features?.length) return
      const bounds = new LngLatBounds()
      const extendCoords = (coords: unknown): void => {
        if (typeof coords === "number" || coords == null) return
        if (Array.isArray(coords)) {
          if (typeof coords[0] === "number" && typeof coords[1] === "number") {
            const [x, y] = coords as unknown as [number, number]
            if (x >= -180 && x <= 180 && y >= -90 && y <= 90) bounds.extend([x, y])
            return
          }
          ;(coords as unknown[]).forEach(extendCoords)
        }
      }
      for (const f of data.features) {
        if (!f.geometry) continue
        extendCoords((f.geometry as any).coordinates)
      }
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 600 })
    } catch {}
  }, [mapReady])

  useEffect(() => {
    if (!zoomToLayerSignal || !mapReady) return
    zoomToUploaded(zoomToLayerSignal.id)
  }, [zoomToLayerSignal, mapReady, zoomToUploaded])

  useEffect(() => {
    if (pendingZoomRef.current == null || !mapReady) return
    const id = pendingZoomRef.current
    const srcId = `uploaded-src-${id}`
    const src = mapRef.current?.getSource(srcId)
    if (!src) return
    zoomToUploaded(id)
  }, [layerData, mapReady, zoomToUploaded])

  const zoomToSurvey = useCallback((id: number) => {
    if (!mapRef.current) return
    const map = mapRef.current
    const allFeatures = [...geojson.polygonFeatures, ...geojson.lineFeatures]
    const feat = allFeatures.find((f) => f.id === id || f.id === `line-${id}`)
    if (feat) {
      try {
        const bounds = new LngLatBounds()
        const coords = feat.geometry.type === "Polygon"
          ? feat.geometry.coordinates.flat()
          : feat.geometry.coordinates
        for (const c of coords) {
          if (c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90) {
            bounds.extend(c as [number, number])
          }
        }
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 600 })
      } catch {
        // fallback: zoom to centroid if available
        const rec = surveys.find((s) => s.id === id)
        if (rec?.centroid_lon != null && rec?.centroid_lat != null) {
          map.flyTo({ center: [rec.centroid_lon, rec.centroid_lat], zoom: 8, duration: 600 })
        }
      }
    } else {
      const rec = surveys.find((s) => s.id === id)
      if (rec?.centroid_lon != null && rec?.centroid_lat != null) {
        map.flyTo({ center: [rec.centroid_lon, rec.centroid_lat], zoom: 8, duration: 600 })
      }
    }
  }, [geojson, surveys])

  useEffect(() => {
    if (selectedId != null && mapReady) zoomToSurvey(selectedId)
  }, [selectedId, mapReady, zoomToSurvey])

  return (
    <div className="relative flex flex-1 min-h-0 w-full">
      <div ref={containerRef} className="flex-1 min-h-0" />
      {mapReady && (
        <MapToolbar
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          baseStyle={baseStyle}
          onBaseStyleChange={setBaseStyle}
        />
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rail-label bg-ink/80 px-2 py-1 z-10">
        {geojson.polygonFeatures.length + geojson.lineFeatures.length} surveys
      </div>
      {basemapOffline && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rail-label rounded border border-rust/50 bg-ink/85 px-3 py-1.5 text-[0.68rem] text-foreground/85">
          Basemap tiles unreachable — showing plain background (local layers unaffected)
        </div>
      )}
    </div>
  )
}
