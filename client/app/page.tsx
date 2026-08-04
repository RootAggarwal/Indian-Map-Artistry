"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Activity, RotateCcw, X, Palette, PanelLeftClose, PanelRightClose, PanelBottomClose, ZoomIn, ZoomOut } from "lucide-react"
import {
  counts,
  fetchReports,
  fetchSurveys,
  logAudit,
  deleteSurvey,
  clearAllSurveys,
  rollbackSurveys,
  saveSurveys,
  updateSurvey,
  reprocessSurveys,
  downloadPdf,
  type SurveyDraft,
  type SurveyRecord,
  type SurveyUpdate,
} from "@/lib/seismic"
import { FilterRail, type FacetKey } from "@/components/seismic/FilterRail"
import { MapCanvas } from "@/components/seismic/MapCanvas"
import { MapErrorBoundary } from "@/components/seismic/MapErrorBoundary"
import { RibbonBar } from "@/components/seismic/RibbonBar"
import { EntityPanel } from "@/components/seismic/EntityPanel"
import { BottomBar } from "@/components/seismic/BottomBar"
import { DetailsDialog } from "@/components/seismic/DetailsDialog"
import { AddSurveyDialog } from "@/components/seismic/AddSurveyDialog"
import LayerPanel from "@/components/seismic/LayerPanel"
import ShapefileUploader from "@/components/seismic/ShapefileUploader"
import MapDropOverlay from "@/components/seismic/MapDropOverlay"
import { useTheme, type ThemeId } from "@/contexts/theme"
import { useFontSize } from "@/contexts/font-size"
import { ResizablePanelGroupPersist, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { fetchInterpretations, createInterpretations, updateInterpretation, deleteInterpretation, fetchSurveysForInterpretation, fetchInterpretationsForRecord } from "@/lib/interpretations"
import type { InterpretationRecord } from "@/lib/interpretations"
import InterpretationPanel from "@/components/seismic/InterpretationPanel"
import { fetchLayers, fetchFeatures, fetchBulkFeatures, updateLayer, deleteLayer, reorderLayers, resetPalette } from "@/lib/layers"
import type { LayerRecord, LayerStyle } from "@/lib/layers"
import { useShapefileImport } from "@/lib/useShapefileImport"
import type { MapTool, ViewMode } from "@/components/seismic/types"

const EMPTY: Record<FacetKey, string[]> = {
  basin: [],
  area: [],
  data_dimension: [],
  project_year: [],
  type_of_processing: [],
}

const THEMES: { id: ThemeId; label: string; group: string }[] = [
  { id: "graphite", label: "Graphite", group: "Dark" },
  { id: "midnight", label: "Midnight", group: "Dark" },
  { id: "slate", label: "Slate", group: "Dark" },
  { id: "paper", label: "Paper", group: "Light" },
  { id: "ivory", label: "Ivory", group: "Light" },
  { id: "classic", label: "Classic GIS", group: "Light" },
]

function facetValue(rec: SurveyRecord, key: FacetKey) {
  if (key === "basin") return rec.projects?.basin ?? "Unspecified"
  if (key === "area") return rec.utm_zone ? `UTM ${rec.utm_zone}` : "Unspecified"
  if (key === "data_dimension") return (rec.projects?.data_dimension ?? "Unspecified").toUpperCase()
  if (key === "project_year") return rec.project_year ?? "Unspecified"
  return rec.type_of_processing ?? "Unspecified"
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { theme, setTheme, isDark } = useTheme()
  const { fontSize, setFontSize, increase: fontSizeUp, decrease: fontSizeDown } = useFontSize()
  const surveys = useQuery({ queryKey: ["surveys"], queryFn: fetchSurveys })
  const reports = useQuery({ queryKey: ["reports"], queryFn: fetchReports })

  const [selected, setSelected] = useState<Record<FacetKey, string[]>>(EMPTY)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [dialogRec, setDialogRec] = useState<SurveyRecord | null>(null)
  const [tool, setTool] = useState<MapTool>("pan")
  const [zoomSignal, setZoomSignal] = useState<{ dir: number; nonce: number } | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [yearIndex, setYearIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [query, setQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [lastImport, setLastImport] = useState<{ project_ids: number[]; count: number; mapped: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [bottomOpen, setBottomOpen] = useState(true)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("3d")
  const [layerPanelOpen, setLayerPanelOpen] = useState(false)
  const [zoomToLayerSig, setZoomToLayerSig] = useState<{ id: number; nonce: number } | null>(null)
  const zoomLayerNonce = useRef(0)
  const nonce = useRef(0)

  const layersQuery = useQuery({ queryKey: ["layers"], queryFn: fetchLayers })
  const layers = layersQuery.data ?? []
  const interpretationsQuery = useQuery({ queryKey: ["interpretations"], queryFn: fetchInterpretations })
  const interpretations = interpretationsQuery.data ?? []

  const recordInterpretationsQuery = useQuery({
    queryKey: ["interpretations", "by-record", activeId],
    queryFn: () => fetchInterpretationsForRecord(activeId!),
    enabled: activeId != null,
  })
  const recordInterpretations = recordInterpretationsQuery.data ?? []

  const [drawActive, setDrawActive] = useState(false)
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([])
  const [drawColor, setDrawColor] = useState("#f97316")

  const [linkedSurveyIds, setLinkedSurveyIds] = useState<number[] | null>(null)
  const [linkedInfo, setLinkedInfo] = useState<{ id: number; count: number } | null>(null)
  const [linkingId, setLinkingId] = useState<number | null>(null)

  async function handleLinkSurveys(rec: InterpretationRecord) {
    setLinkingId(rec.id)
    try {
      const res = await fetchSurveysForInterpretation(rec.id)
      setLinkedSurveyIds(res.surveys.map((s) => s.id))
      setLinkedInfo({ id: rec.id, count: res.surveys.length })
    } catch (err) {
      console.error("[interpretations] link failed:", err)
      setLinkedSurveyIds(null)
      setLinkedInfo(null)
    }
    setLinkingId(null)
  }

  function handleUnlinkSurveys() {
    setLinkedSurveyIds(null)
    setLinkedInfo(null)
    setLinkingId(null)
  }

  function handleDrawPoint(lng: number, lat: number) {
    setDrawPoints((prev) => (prev.length >= 64 ? prev : [...prev, [lng, lat]]))
  }

  async function handleFinishDraw(name: string, color: string) {
    if (drawPoints.length < 3) return
    const coords: [number, number][] = [...drawPoints, drawPoints[0]]
    try {
      await createInterpretations([
        {
          name: name || null,
          color,
          geometry: { type: "Polygon", coordinates: [coords] },
        },
      ])
      await interpretationsQuery.refetch()
    } catch (err) {
      console.error("[interpretations] create failed:", err)
    }
    setDrawPoints([])
    setDrawActive(false)
  }

  function handleCancelDraw() {
    setDrawPoints([])
    setDrawActive(false)
  }

  const mapDropDepth = useRef(0)
  const [mapDragging, setMapDragging] = useState(false)

  const { importing: importingShapefile, status: importStatus, importFiles, dismissStatus } = useShapefileImport({
    onLayerCreated: (id) => {
      void layersQuery.refetch()
      setLayerPanelOpen(true)
      handleZoomToLayer(id)
    },
  })

  function handleMapDragEnter(e: React.DragEvent) {
    if (!e.dataTransfer?.types?.includes("Files")) return
    e.preventDefault()
    mapDropDepth.current += 1
    setMapDragging(true)
  }

  function handleMapDragOver(e: React.DragEvent) {
    if (!e.dataTransfer?.types?.includes("Files")) return
    e.preventDefault()
  }

  function handleMapDragLeave(e: React.DragEvent) {
    e.preventDefault()
    mapDropDepth.current = Math.max(0, mapDropDepth.current - 1)
    if (mapDropDepth.current === 0) setMapDragging(false)
  }

  function handleMapDrop(e: React.DragEvent) {
    e.preventDefault()
    mapDropDepth.current = 0
    setMapDragging(false)
    if (e.dataTransfer.files.length) {
      void importFiles(e.dataTransfer.files)
    }
  }

  const layerIdsWithFeatures = useMemo(
    () => layers.filter((l) => (l.feature_count ?? 0) > 0).map((l) => l.id),
    [layers],
  )

  const bulkFeaturesQuery = useQuery({
    queryKey: ["layer-features-bulk", layerIdsWithFeatures],
    queryFn: () => fetchBulkFeatures(layerIdsWithFeatures),
    enabled: layerIdsWithFeatures.length > 0,
    staleTime: 60_000,
  })

  const layerData = useMemo(() => {
    const bulk = bulkFeaturesQuery.data ?? {}
    return layers
      .filter((l) => (l.feature_count ?? 0) > 0)
      .map((l) => ({
        layer: l,
        features: bulk[String(l.id)] ?? { type: "FeatureCollection", features: [] },
      }))
  }, [layers, bulkFeaturesQuery.data])

  async function handleToggleVisibility(id: number) {
    const lr = layers.find((l) => l.id === id)
    if (!lr) return
    await updateLayer(id, { visible: !lr.visible })
    await layersQuery.refetch()
  }

  async function handleRemoveLayer(id: number) {
    await deleteLayer(id)
    await layersQuery.refetch()
  }

  async function handleRenameLayer(id: number, name: string) {
    await updateLayer(id, { name })
    await layersQuery.refetch()
  }

  function handleZoomToLayer(id: number) {
    zoomLayerNonce.current += 1
    setZoomToLayerSig({ id, nonce: zoomLayerNonce.current })
  }

  async function handleReorderLayer(id: number, dir: "up" | "down") {
    const sorted = [...layers].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex((l) => l.id === id)
    if (idx < 0) return
    const swap = dir === "up" ? idx - 1 : idx + 1
    if (swap < 0 || swap >= sorted.length) return
    const items = [
      { id, display_order: sorted[swap].display_order },
      { id: sorted[swap].id, display_order: sorted[idx].display_order },
    ]
    await reorderLayers(items)
    await layersQuery.refetch()
  }

  async function handleLayerCreated() {
    await layersQuery.refetch()
    setLayerPanelOpen(true)
  }

  const all = surveys.data ?? []

  const years = useMemo(
    () => ["ALL", ...[...new Set(all.map((s) => s.project_year).filter(Boolean) as string[])].sort()],
    [all],
  )
  const timelineYear = years[yearIndex] === "ALL" ? null : (years[yearIndex] ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((rec) => {
      const facetOk = (Object.keys(selected) as FacetKey[]).every((key) => {
        const picks = selected[key]
        return picks.length === 0 || picks.includes(facetValue(rec, key))
      })
      if (!facetOk) return false
      if (!q) return true
      return [
        rec.projects?.project_name,
        rec.type_of_processing,
        rec.si_code,
        rec.projects?.basin,
        rec.project_year,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [all, selected, query])

  const facets = useMemo(
    () =>
      (
        [
          ["basin", "Basin"],
          ["area", "Area (UTM zone)"],
          ["data_dimension", "Data Dimension"],
          ["project_year", "Year of Processing"],
          ["type_of_processing", "Type of Processing"],
        ] as [FacetKey, string][]
      ).map(([key, label]) => ({
        key,
        label,
        options: counts(all.map((rec) => facetValue(rec, key))),
      })),
    [all],
  )

  const activeRec = useMemo(
    () => filtered.find((r) => r.id === activeId) ?? all.find((r) => r.id === activeId) ?? null,
    [filtered, all, activeId],
  )

  useEffect(() => {
    if (!playing) return
    const t = setInterval(
      () => setYearIndex((i) => (i + 1 >= years.length ? 0 : i + 1)),
      1200,
    )
    return () => clearInterval(t)
  }, [playing, years.length])

  function selectRec(rec: SurveyRecord) {
    setActiveId(rec.id)
    void logAudit("PROJECT_VIEWED", {
      project_id: rec.project_id,
      si_code: rec.si_code,
      basin: rec.projects?.basin ?? null,
      details: { project_name: rec.projects?.project_name },
    })
  }

  function toggleFacet(key: FacetKey, value: string) {
    setSelected((prev) => {
      const on = prev[key].includes(value)
      const next = { ...prev, [key]: on ? prev[key].filter((v) => v !== value) : [...prev[key], value] }
      void logAudit("FILTER_APPLIED", { details: { facet: key, value, active: !on } })
      return next
    })
  }

  async function printReport(rec: SurveyRecord | null) {
    if (!rec) return
    try {
      await downloadPdf(rec)
      void logAudit("REPORT_EXPORTED", {
        project_id: rec.project_id,
        si_code: rec.si_code,
        basin: rec.projects?.basin ?? null,
        details: { format: "pdf" },
      })
    } catch (err) {
      console.error("[print] PDF failed:", err)
    }
  }

  async function handleAdd(drafts: SurveyDraft[]) {
    const result = await saveSurveys(drafts)
    await queryClient.invalidateQueries({ queryKey: ["surveys"] })
    void logAudit("PROJECT_VIEWED", {
      details: { created: drafts.length, source: drafts.length > 1 ? "import" : "manual" },
    })

    if (result.project_ids?.length) {
      setLastImport({
        project_ids: result.project_ids,
        count: result.project_ids.length,
        mapped: result.mapped,
      })
    }
  }

  async function handleRollback() {
    if (!lastImport) return
    await rollbackSurveys(lastImport.project_ids)
    await queryClient.invalidateQueries({ queryKey: ["surveys"] })
    setLastImport(null)
  }

  const mappedCount = filtered.filter((s) => s.is_mapped).length
  const adjusted = filtered.filter((s) => (s.geometry_notes?.length ?? 0) > 0).length

  return (
    <main className="flex h-screen min-h-0 flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border bg-ink px-4 py-2 sm:px-6">
        <span className="grid h-8 w-8 shrink-0 place-items-center border border-ochre/60 bg-ochre/10">
          <Activity className="h-4 w-4 text-ochre" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="slab truncate text-base leading-none text-foreground sm:text-lg">
            Seismic Data Processing
          </h1>
          <p className="rail-label mt-0.5 truncate">
            GEOPIC · India survey atlas · {all.length} records
          </p>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Stat label="Mapped" value={`${mappedCount}`} />
          <Stat label="Adjusted" value={`${adjusted}`} />
          <Stat label="Year" value={years[yearIndex] ?? "ALL"} />
          <span className="h-5 w-px bg-border" />
          <button
            onClick={() => setLayerPanelOpen((o) => !o)}
            className={`grid h-8 w-8 place-items-center border transition-colors ${
              layerPanelOpen
                ? "border-ochre text-ochre bg-ochre/10"
                : "border-border text-muted-foreground hover:border-ochre hover:text-ochre"
            }`}
            title="Toggle layer panel"
            aria-label="Toggle layer panel"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:border-ochre hover:text-ochre"
              title="Change theme"
              aria-label="Change theme"
            >
              <Palette className="h-4 w-4" />
            </button>
            {themeMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 border border-border bg-popover shadow-lg">
                  {(["Dark", "Light"] as const).map((group) => (
                    <div key={group}>
                      <p className="rail-label px-3 pt-2 pb-1">{group}</p>
                      {THEMES.filter((t) => t.group === group).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setTheme(t.id); setThemeMenuOpen(false) }}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-[0.72rem] text-left transition-colors ${
                            theme === t.id
                              ? "bg-ochre/15 text-ochre"
                              : "text-foreground hover:bg-surface-2"
                          }`}
                        >
                          <span className={`h-3 w-3 rounded-full border ${
                            t.id === "graphite" ? "bg-gray-700" :
                            t.id === "midnight" ? "bg-indigo-900" :
                            t.id === "slate" ? "bg-slate-600" :
                            t.id === "paper" ? "bg-amber-100" :
                            t.id === "ivory" ? "bg-yellow-50" :
                            "bg-blue-200"
                          }`} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="border-t border-border mt-1 pt-1 pb-1">
                    <p className="rail-label px-3 pt-2 pb-1">Font Size</p>
                    <div className="flex items-center gap-1 px-3 py-1">
                      <button
                        onClick={() => fontSizeDown()}
                        disabled={fontSize === "normal"}
                        className="grid h-7 w-7 place-items-center border border-border text-muted-foreground transition-colors hover:border-ochre hover:text-ochre disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                        title="Decrease font size"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex-1 text-center text-[0.72rem] text-foreground">
                        {fontSize === "normal" ? "Default" : fontSize === "large" ? "Large" : "X-Large"}
                      </span>
                      <button
                        onClick={() => fontSizeUp()}
                        disabled={fontSize === "xlarge"}
                        className="grid h-7 w-7 place-items-center border border-border text-muted-foreground transition-colors hover:border-ochre hover:text-ochre disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                        title="Increase font size"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-border mt-1 pt-1 pb-1">
                    <button
                      onClick={async () => {
                        await reprocessSurveys()
                        await queryClient.invalidateQueries({ queryKey: ["surveys"] })
                        setThemeMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[0.72rem] text-left text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reprocess geometry
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <ResizablePanelGroupPersist id="geopic:main" orientation="horizontal" className="min-h-0 flex-1">
        {sidebarOpen && (
          <>
            <ResizablePanel
              id="sidebar"
              className="hidden overflow-hidden lg:flex"
              defaultSize={240}
              minSize={180}
              maxSize={420}
            >
              <aside className="flex h-full w-full flex-col border-r border-border bg-surface">
                <FilterRail
                  facets={facets}
                  selected={selected}
                  toggle={toggleFacet}
                  clear={() => {
                    setSelected(EMPTY)
                    void logAudit("FILTER_CLEARED")
                  }}
                  total={all.length}
                  shown={filtered.length}
                />
              </aside>
            </ResizablePanel>
            <ResizableHandle id="sidebar-handle" className="hidden lg:flex" />
          </>
        )}

        <ResizablePanel id="main-section" className="flex min-h-0 min-w-0 flex-col">
          <RibbonBar
            tool={tool}
            setTool={(t) => {
              setTool(t)
              void logAudit("MAP_TOOL_USED", { details: { tool: t } })
            }}
            onZoom={(dir) => {
              nonce.current += 1
              setZoomSignal({ dir, nonce: nonce.current })
            }}
            onReset={() => setResetSignal((v) => v + 1)}
            onPrint={() => void printReport(activeRec ?? filtered[0] ?? null)}
            years={years}
            yearIndex={yearIndex}
            setYearIndex={setYearIndex}
            playing={playing}
            togglePlay={() => {
              setPlaying((p) => !p)
              void logAudit("TIMELINE_PLAYED")
            }}
            query={query}
            setQuery={setQuery}
            matches={filtered.length}
            onAdd={() => setAddOpen(true)}
            sidebarOpen={sidebarOpen}
            detailsOpen={detailsOpen}
            bottomOpen={bottomOpen}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            onToggleDetails={() => setDetailsOpen((o) => !o)}
            onToggleBottom={() => setBottomOpen((o) => !o)}
          />

          <ResizablePanelGroupPersist id="geopic:content" orientation="vertical" className="min-h-0 flex-1">
            <ResizablePanel id="content-top" className="flex min-h-0 min-w-0 flex-col">
              <ResizablePanelGroupPersist id="geopic:maprow" orientation="horizontal" className="min-h-0 flex-1">
                <ResizablePanel id="map" className="flex min-h-0 min-w-0">
                  <div
                    className="relative min-w-0 flex-1 flex flex-col"
                    onDragEnter={handleMapDragEnter}
                    onDragOver={handleMapDragOver}
                    onDragLeave={handleMapDragLeave}
                    onDrop={handleMapDrop}
                  >
                    <MapErrorBoundary>
                      <MapCanvas
                        surveys={filtered}
                        selectedId={activeId}
                        onSelect={selectRec}
                        zoomSignal={zoomSignal}
                        resetSignal={resetSignal}
                        yearFilterActive={timelineYear}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        layerData={layerData}
                        zoomToLayerSignal={zoomToLayerSig}
                        interpretations={interpretations}
                        linkedSurveyIds={linkedSurveyIds}
                        drawActive={drawActive}
                        drawPoints={drawPoints}
                        drawColor={drawColor}
                        onDrawPoint={handleDrawPoint}
                        onDrawDone={() => void handleFinishDraw("", drawColor)}
                        onDrawCancel={handleCancelDraw}
                      />
                    </MapErrorBoundary>
                    <MapDropOverlay
                      dragging={mapDragging}
                      importing={importingShapefile}
                      status={importStatus}
                      onDismissStatus={dismissStatus}
                    />
                  </div>
                </ResizablePanel>
                {layerPanelOpen && (
                  <>
                    <ResizableHandle id="layers-handle" className="hidden lg:flex" />
                    <ResizablePanel
                      id="layers"
                      className="hidden overflow-hidden lg:flex"
                      defaultSize={240}
                      minSize={180}
                      maxSize={420}
                    >
                      <aside className="flex h-full w-full flex-col border-l border-border bg-surface">
                        <div className="flex items-center justify-between border-b border-border px-3 py-2">
                          <h3 className="rail-label text-xs font-semibold uppercase tracking-wider">Layers</h3>
                          <span className="text-[10px] text-muted-foreground">{layers.length} layer{layers.length !== 1 ? "s" : ""}</span>
                        </div>
                        <ShapefileUploader onLayerCreated={handleLayerCreated} />
                        <div className="flex-1 overflow-y-auto">
                          <LayerPanel
                            layers={[...layers].sort((a, b) => a.display_order - b.display_order)}
                            onToggleVisibility={handleToggleVisibility}
                            onRemove={handleRemoveLayer}
                            onRename={handleRenameLayer}
                            onZoomTo={handleZoomToLayer}
                            onReorder={handleReorderLayer}
                            onStyleChange={async (id, style) => {
                              await updateLayer(id, { style })
                              await layersQuery.refetch()
                            }}
                          />
                        </div>
                        <InterpretationPanel
                          interpretations={interpretations}
                          drawActive={drawActive}
                          drawPoints={drawPoints.length}
                          color={drawColor}
                          onColorChange={setDrawColor}
                          onStartDraw={() => {
                            setDrawPoints([])
                            setDrawActive(true)
                          }}
                          onCancelDraw={handleCancelDraw}
                          onFinishDraw={(name, color) => void handleFinishDraw(name, color)}
                          onToggleVisible={async (rec, visible) => {
                            await updateInterpretation(rec.id, { visible })
                            await interpretationsQuery.refetch()
                          }}
                          onDelete={async (rec) => {
                            await deleteInterpretation(rec.id)
                            await interpretationsQuery.refetch()
                          }}
                          onRename={async (rec, name) => {
                            await updateInterpretation(rec.id, { name })
                            await interpretationsQuery.refetch()
                          }}
                          linkedInfo={linkedInfo}
                          linkingId={linkingId}
                          onLinkSurveys={(rec) => void handleLinkSurveys(rec)}
                          onUnlinkSurveys={handleUnlinkSurveys}
                        />
                      </aside>
                    </ResizablePanel>
                  </>
                )}
                {detailsOpen && (
                  <>
                    <ResizableHandle id="details-handle" className="hidden lg:flex" />
                    <ResizablePanel
                      id="details"
                      className="hidden overflow-hidden lg:flex"
                      defaultSize={288}
                      minSize={224}
                      maxSize={440}
                    >
                      <aside className="flex h-full w-full flex-col border-l border-border bg-surface">
                        <EntityPanel
                          rec={activeRec}
                          reports={reports.data ?? []}
                          interpretations={recordInterpretations}
                          onPrint={() => void printReport(activeRec)}
                          onOpenDetails={() => {
                            setDialogRec(activeRec)
                            void logAudit("DETAILS_OPENED", { project_id: activeRec?.project_id ?? null })
                          }}
                        />
                      </aside>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroupPersist>
            </ResizablePanel>
            {bottomOpen && <ResizableHandle id="bottom-handle" className="hidden lg:flex" />}
            {bottomOpen && (
              <ResizablePanel
                id="bottom"
                className="hidden overflow-hidden lg:flex"
                defaultSize={200}
                minSize={120}
                maxSize={500}
              >
                <div className="flex h-full w-full flex-col border-t border-border">
                  <BottomBar
                    rows={filtered}
                    selectedId={activeId}
                    onSelect={selectRec}
                    onMore={(rec) => {
                      selectRec(rec)
                      setDialogRec(rec)
                    }}
                  />
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroupPersist>
        </ResizablePanel>
      </ResizablePanelGroupPersist>

      {lastImport && (
        <div className="flex items-center gap-3 border-t border-seismic/40 bg-seismic/10 px-4 py-2">
          <RotateCcw className="h-4 w-4 shrink-0 text-seismic" />
          <p className="min-w-0 flex-1 truncate text-[0.75rem] text-foreground/90">
            Imported {lastImport.count} survey{lastImport.count > 1 ? "s" : ""}
            {lastImport.mapped > 0 ? ` · ${lastImport.mapped} with geometry` : ""}
          </p>
          <button
            onClick={handleRollback}
            className="rail-label shrink-0 border border-seismic/60 px-3 py-1 text-seismic transition-colors hover:bg-seismic hover:text-primary-foreground"
          >
            Undo
          </button>
          <button
            onClick={() => setLastImport(null)}
            className="grid h-6 w-6 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-rust"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AddSurveyDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        onDelete={async (id) => {
          await deleteSurvey(id)
          await queryClient.invalidateQueries({ queryKey: ["surveys"] })
        }}
        onUpdate={async (id, data) => {
          await updateSurvey(id, data)
          await queryClient.invalidateQueries({ queryKey: ["surveys"] })
        }}
        onClearAll={async () => {
          await clearAllSurveys()
          await queryClient.invalidateQueries({ queryKey: ["surveys"] })
        }}
        surveys={all}
        basins={[...new Set(all.map((r) => r.projects?.basin).filter(Boolean) as string[])].sort()}
      />

      <DetailsDialog
        rec={dialogRec}
        reports={reports.data ?? []}
        onClose={() => setDialogRec(null)}
        onPrint={(rec) => void printReport(rec)}
      />
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="rail-label">{label}</p>
      <p className="slab text-base text-ochre">{value}</p>
    </div>
  )
}
