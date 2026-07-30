"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Activity, Info, RotateCcw, X, Palette, PanelLeftClose, PanelRightClose, PanelBottomClose } from "lucide-react"
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
  type SurveyDraft,
  type SurveyRecord,
  type SurveyUpdate,
} from "@/lib/seismic"
import { FilterRail, type FacetKey } from "@/components/seismic/FilterRail"
import { MapCanvas } from "@/components/seismic/MapCanvas"
import { RibbonBar } from "@/components/seismic/RibbonBar"
import { EntityPanel } from "@/components/seismic/EntityPanel"
import { BottomBar } from "@/components/seismic/BottomBar"
import { DetailsDialog } from "@/components/seismic/DetailsDialog"
import { AddSurveyDialog } from "@/components/seismic/AddSurveyDialog"
import { useTheme, type ThemeId } from "@/contexts/theme"
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
  const nonce = useRef(0)

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
      const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "")
      const resp = await fetch(`${base}/api/surveys/${rec.id}/pdf`)
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error((err as any).error || `HTTP ${resp.status}`)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disposition = resp.headers.get("Content-Disposition") || ""
      const m = disposition.match(/filename="?(.+?)"?$/)
      a.download = m ? m[1] : `seismic-dossier-${rec.project_id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
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

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block">
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
        )}

        <section className="flex min-w-0 flex-1 flex-col">
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
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1">
              <MapCanvas
                surveys={filtered}
                selectedId={activeId}
                onSelect={selectRec}
                zoomSignal={zoomSignal}
                resetSignal={resetSignal}
                yearFilterActive={timelineYear}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            {detailsOpen && (
              <aside className="hidden w-72 shrink-0 border-l border-border bg-surface lg:block">
                <EntityPanel
                  rec={activeRec}
                  reports={reports.data ?? []}
                  onPrint={() => void printReport(activeRec)}
                  onOpenDetails={() => {
                    setDialogRec(activeRec)
                    void logAudit("DETAILS_OPENED", { project_id: activeRec?.project_id ?? null })
                  }}
                />
              </aside>
            )}
          </div>
          {adjusted > 0 && (
            <p className="flex items-start gap-2 border-t border-border bg-rust/10 px-3 py-2 text-[0.7rem] leading-snug text-foreground/85">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rust" />
              {adjusted} footprint{adjusted > 1 ? "s" : ""} in view carry a cartographic note — squared to an
              axis-aligned box and/or clipped to the Indian boundary.
            </p>
          )}
          {bottomOpen && (
            <div className="h-48 shrink-0 border-t border-border lg:h-44">
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
          )}
        </section>
      </div>

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
