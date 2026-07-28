import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Info } from "lucide-react";
import {
  counts,
  fetchAuditLogs,
  fetchReports,
  fetchSurveys,
  logAudit,
  type SurveyRecord,
} from "@/lib/seismic";
import { buildProjectReport } from "@/lib/report-pdf";
import { FilterRail, type FacetKey } from "@/components/seismic/FilterRail";
import { MapCanvas, type MapTool } from "@/components/seismic/MapCanvas";
import { RibbonBar } from "@/components/seismic/RibbonBar";
import { EntityPanel } from "@/components/seismic/EntityPanel";
import { BottomBar } from "@/components/seismic/BottomBar";
import { DetailsDialog } from "@/components/seismic/DetailsDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GEOPIC Seismic Data Processing — India Survey Atlas" },
      {
        name: "description",
        content:
          "Interactive atlas of Indian seismic processing projects: basin filters, boxed survey footprints on the national extent, timeline playback and printable dossiers.",
      },
      { property: "og:title", content: "GEOPIC Seismic Data Processing — India Survey Atlas" },
      {
        property: "og:description",
        content:
          "Filter basins, scrub the project timeline and export a full survey dossier with basin audit trail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const EMPTY: Record<FacetKey, string[]> = {
  basin: [],
  project_type: [],
  project_year: [],
  type_of_processing: [],
};

function facetValue(rec: SurveyRecord, key: FacetKey) {
  if (key === "basin") return rec.projects?.basin ?? "Unspecified";
  if (key === "project_type") return rec.projects?.project_type ?? "Unspecified";
  if (key === "project_year") return rec.project_year ?? "Unspecified";
  return rec.type_of_processing ?? "Unspecified";
}

function Dashboard() {
  const surveys = useQuery({ queryKey: ["surveys"], queryFn: fetchSurveys });
  const reports = useQuery({ queryKey: ["reports"], queryFn: fetchReports });

  const [selected, setSelected] = useState<Record<FacetKey, string[]>>(EMPTY);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [dialogRec, setDialogRec] = useState<SurveyRecord | null>(null);
  const [tool, setTool] = useState<MapTool>("pan");
  const [zoomSignal, setZoomSignal] = useState<{ dir: number; nonce: number } | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const nonce = useRef(0);

  const all = surveys.data ?? [];

  const years = useMemo(
    () => ["ALL", ...[...new Set(all.map((s) => s.project_year).filter(Boolean) as string[])].sort()],
    [all],
  );
  const timelineYear = years[yearIndex] === "ALL" ? null : (years[yearIndex] ?? null);

  const filtered = useMemo(
    () =>
      all.filter((rec) =>
        (Object.keys(selected) as FacetKey[]).every((key) => {
          const picks = selected[key];
          return picks.length === 0 || picks.includes(facetValue(rec, key));
        }),
      ),
    [all, selected],
  );

  const facets = useMemo(
    () =>
      (
        [
          ["basin", "Basin"],
          ["project_type", "Area / Block"],
          ["project_year", "Year of Processing"],
          ["type_of_processing", "Type of Processing"],
        ] as [FacetKey, string][]
      ).map(([key, label]) => ({
        key,
        label,
        options: counts(all.map((rec) => facetValue(rec, key))),
      })),
    [all],
  );

  const activeRec = useMemo(
    () => filtered.find((r) => r.id === activeId) ?? all.find((r) => r.id === activeId) ?? null,
    [filtered, all, activeId],
  );

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () => setYearIndex((i) => (i + 1 >= years.length ? 0 : i + 1)),
      1200,
    );
    return () => clearInterval(t);
  }, [playing, years.length]);

  function selectRec(rec: SurveyRecord) {
    setActiveId(rec.id);
    void logAudit("PROJECT_VIEWED", {
      project_id: rec.project_id,
      si_code: rec.si_code,
      basin: rec.projects?.basin ?? null,
      details: { project_name: rec.projects?.project_name },
    });
  }

  function toggleFacet(key: FacetKey, value: string) {
    setSelected((prev) => {
      const on = prev[key].includes(value);
      const next = { ...prev, [key]: on ? prev[key].filter((v) => v !== value) : [...prev[key], value] };
      void logAudit("FILTER_APPLIED", { details: { facet: key, value, active: !on } });
      return next;
    });
  }

  async function printReport(rec: SurveyRecord | null) {
    if (!rec) return;
    const audit = await fetchAuditLogs(rec.projects?.basin ?? null).catch(() => []);
    buildProjectReport(rec, reports.data ?? [], audit);
    void logAudit("REPORT_EXPORTED", {
      project_id: rec.project_id,
      si_code: rec.si_code,
      basin: rec.projects?.basin ?? null,
      details: { format: "pdf" },
    });
  }

  const mappedCount = filtered.filter((s) => s.is_mapped).length;
  const adjusted = filtered.filter((s) => (s.geometry_notes?.length ?? 0) > 0).length;

  return (
    <main className="flex h-screen min-h-0 flex-col bg-background text-foreground">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-ink px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center border border-ochre/60 bg-ochre/10">
            <Activity className="h-4 w-4 text-ochre" />
          </span>
          <div className="min-w-0">
            <h1 className="slab truncate text-lg leading-none text-foreground sm:text-xl">
              Seismic Data Processing
            </h1>
            <p className="rail-label mt-1 truncate">
              GEOPIC · India survey atlas · {all.length} records
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <Stat label="Mapped" value={`${mappedCount}`} />
          <Stat label="Adjusted" value={`${adjusted}`} />
          <Stat label="Timeline" value={years[yearIndex] ?? "ALL"} />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] lg:grid-rows-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
          <div className="hidden min-h-0 lg:block">
            <FilterRail
              facets={facets}
              selected={selected}
              toggle={toggleFacet}
              clear={() => {
                setSelected(EMPTY);
                void logAudit("FILTER_CLEARED");
              }}
              total={all.length}
              shown={filtered.length}
            />
          </div>

          <section className="flex min-h-0 min-w-0 flex-col">
            <RibbonBar
              tool={tool}
              setTool={(t) => {
                setTool(t);
                void logAudit("MAP_TOOL_USED", { details: { tool: t } });
              }}
              onZoom={(dir) => {
                nonce.current += 1;
                setZoomSignal({ dir, nonce: nonce.current });
              }}
              onReset={() => setResetSignal((v) => v + 1)}
              onPrint={() => void printReport(activeRec ?? filtered[0] ?? null)}
              years={years}
              yearIndex={yearIndex}
              setYearIndex={setYearIndex}
              playing={playing}
              togglePlay={() => {
                setPlaying((p) => !p);
                void logAudit("TIMELINE_PLAYED");
              }}
            />
            <div className="min-h-[18rem] flex-1">
              <MapCanvas
                surveys={filtered}
                selectedId={activeId}
                onSelect={selectRec}
                tool={tool}
                zoomSignal={zoomSignal}
                resetSignal={resetSignal}
                yearFilterActive={timelineYear}
              />
            </div>
            {adjusted > 0 && (
              <p className="flex items-start gap-2 border-t border-border bg-rust/10 px-3 py-2 text-[0.7rem] leading-snug text-foreground/85">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rust" />
                {adjusted} footprint{adjusted > 1 ? "s" : ""} in view were squared to an
                axis-aligned box and clipped to the Indian boundary — see the cartographic note in
                the dossier for each survey.
              </p>
            )}
          </section>

          <div className="hidden min-h-0 lg:block">
            <EntityPanel
              rec={activeRec}
              reports={reports.data ?? []}
              onPrint={() => void printReport(activeRec)}
              onOpenDetails={() => {
                setDialogRec(activeRec);
                void logAudit("DETAILS_OPENED", { project_id: activeRec?.project_id ?? null });
              }}
            />
          </div>
        </div>

        <div className="min-h-[13rem] lg:min-h-0">
          <BottomBar
            rows={filtered}
            selectedId={activeId}
            onSelect={selectRec}
            onMore={(rec) => {
              selectRec(rec);
              setDialogRec(rec);
            }}
          />
        </div>
      </div>

      <DetailsDialog
        rec={dialogRec}
        reports={reports.data ?? []}
        onClose={() => setDialogRec(null)}
        onPrint={(rec) => void printReport(rec)}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="rail-label">{label}</p>
      <p className="slab text-base text-ochre">{value}</p>
    </div>
  );
}
