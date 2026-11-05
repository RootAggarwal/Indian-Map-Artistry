"use client";
import { useCallback, useRef, useState } from "react";
import { Upload, X, FileSpreadsheet, Loader2, Plus, Pencil, Trash2, Check, RotateCcw, AlertTriangle, Database, RefreshCw, Download } from "lucide-react";
import type { SurveyDraft, SurveyRecord, SurveyUpdate } from "@/lib/seismic";
import {
  fetchExternalStatus,
  previewExternalTable,
  extractFromExternal,
  type ExternalStatus,
  type ExternalTableInfo,
  type ExternalPreviewItem,
  type ExternalExtractResult,
} from "@/lib/external";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (drafts: SurveyDraft[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: SurveyUpdate) => Promise<void>;
  onClearAll: () => Promise<void>;
  onExternalExtract: (result: { project_ids: number[]; count: number; mapped: number }) => void;
  surveys: SurveyRecord[];
  basins: string[];
};

const field =
  "w-full border border-border bg-ink px-2 py-1.5 text-[0.78rem] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ochre";

const EMPTY: SurveyDraft = {
  project_name: "",
  basin: "",
  project_type: "",
  data_dimension: "3D",
  si_code: "",
  project_year: "",
  type_of_processing: "",
  processing_bin: "",
  utm_zone: "",
  quantum_skm: null,
  quantum_slkm: null,
  min_lon: null, min_lat: null, max_lon: null, max_lat: null,
  g1_x: null, g1_y: null, g1_il: null, g1_xl: null,
  g2_x: null, g2_y: null, g2_il: null, g2_xl: null,
  g3_x: null, g3_y: null, g3_il: null, g3_xl: null,
  g4_x: null, g4_y: null, g4_il: null, g4_xl: null,
  record_length: null, sampling_interval: null, fold: null,
  azimuth: null, spheroid: null, projection: null, project_timeline: null,
};

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.\-+eE]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown) => (v == null ? "" : String(v).trim());

const KEY = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
function pick(row: Record<string, unknown>, ...names: string[]) {
  for (const [k, v] of Object.entries(row)) {
    const nk = KEY(k);
    if (names.some((n) => nk === KEY(n) || nk.includes(KEY(n)))) return v;
  }
  return undefined;
}

const G_NAMES = [
  ["g1_x", "g1x", "corner1_x", "corner1easting", "corner1east", "easting1", "easting_1", "x1", "point1_x", "p1_x"],
  ["g1_y", "g1y", "corner1_y", "corner1northing", "corner1north", "northing1", "northing_1", "y1", "point1_y", "p1_y"],
  ["g1_il", "g1il", "corner1_il", "corner1inline", "inline1", "inline_1", "il1", "il_1", "point1_il", "p1_il"],
  ["g1_xl", "g1xl", "corner1_xl", "corner1crossline", "crossline1", "crossline_1", "xl1", "xl_1", "point1_xl", "p1_xl"],
  ["g2_x", "g2x", "corner2_x", "corner2easting", "corner2east", "easting2", "easting_2", "x2", "point2_x", "p2_x"],
  ["g2_y", "g2y", "corner2_y", "corner2northing", "corner2north", "northing2", "northing_2", "y2", "point2_y", "p2_y"],
  ["g2_il", "g2il", "corner2_il", "corner2inline", "inline2", "inline_2", "il2", "il_2", "point2_il", "p2_il"],
  ["g2_xl", "g2xl", "corner2_xl", "corner2crossline", "crossline2", "crossline_2", "xl2", "xl_2", "point2_xl", "p2_xl"],
  ["g3_x", "g3x", "corner3_x", "corner3easting", "corner3east", "easting3", "easting_3", "x3", "point3_x", "p3_x"],
  ["g3_y", "g3y", "corner3_y", "corner3northing", "corner3north", "northing3", "northing_3", "y3", "point3_y", "p3_y"],
  ["g3_il", "g3il", "corner3_il", "corner3inline", "inline3", "inline_3", "il3", "il_3", "point3_il", "p3_il"],
  ["g3_xl", "g3xl", "corner3_xl", "corner3crossline", "crossline3", "crossline_3", "xl3", "xl_3", "point3_xl", "p3_xl"],
  ["g4_x", "g4x", "corner4_x", "corner4easting", "corner4east", "easting4", "easting_4", "x4", "point4_x", "p4_x"],
  ["g4_y", "g4y", "corner4_y", "corner4northing", "corner4north", "northing4", "northing_4", "y4", "point4_y", "p4_y"],
  ["g4_il", "g4il", "corner4_il", "corner4inline", "inline4", "inline_4", "il4", "il_4", "point4_il", "p4_il"],
  ["g4_xl", "g4xl", "corner4_xl", "corner4crossline", "crossline4", "crossline_4", "xl4", "xl_4", "point4_xl", "p4_xl"],
] as const

function rowToDraft(row: Record<string, unknown>): SurveyDraft | null {
  const name = str(pick(row, "project_name", "projectname", "name", "project"));
  if (!name) return null;

  const out: SurveyDraft = {
    project_name: name.slice(0, 200),
    basin: str(pick(row, "basin")),
    project_type: str(pick(row, "project_type", "type_of_project")),
    data_dimension: str(pick(row, "data_dimension", "dimension", "dim")) || null,
    si_code: str(pick(row,
      "si_code", "sicode", "sig_code", "sigcode",
      "details_code", "code", "sig", "si",
      "s_i_code", "survey_id", "identifier", "signature_code",
    )),
    project_year: str(pick(row, "project_year", "year")),
    type_of_processing: str(pick(row, "type_of_processing", "processing_type", "processing")),
    processing_bin: str(pick(row, "processing_bin", "bin")),
    utm_zone: str(pick(row,
      "utm_zone", "utm", "utm_zone_number",
    )),
    record_length: str(pick(row,
      "record_length", "reclength", "recordlength", "rec_len", "reclen",
      "record_len", "record length", "trace_length", "trclen",
    )),
    sampling_interval: str(pick(row,
      "sampling_interval", "sampint", "samplingint", "sample_interval",
      "sampleint", "samp_int", "si_ms", "sampling_rate", "samprate",
    )),
    fold: str(pick(row,
      "fold", "nfold", "stack", "coverage", "nominal_fold",
    )),
    azimuth: str(pick(row,
      "azimuth", "azi", "azm", "orientation", "direction",
    )),
    spheroid: str(pick(row,
      "spheroid", "sph", "ellipsoid", "datum", "geodetic_datum",
    )),
    projection: str(pick(row,
      "projection", "proj", "coord_sys", "coordinate_system", "map_projection",
    )),
    project_timeline: str(pick(row,
      "project_timeline", "timeline", "plan_timeline", "planned_timeline",
      "actual_timeline", "proj_timeline", "schedule",
    )),
    quantum_skm: num(pick(row, "quantum_skm", "skm")),
    quantum_slkm: num(pick(row, "quantum_slkm", "slkm")),
    min_lon: num(
      pick(row,
        "min_lon", "minlon", "lonmin", "lon_min",
        "west", "westlon", "west_longitude", "westlong", "w_lon", "w_long",
        "lon1", "x1", "xmin", "minx", "x_min", "min_x",
        "from_lon", "start_lon", "lon_from", "lon_start",
        "left_lon", "left",
        "min_longitude", "minlongitude", "minimum_lon", "minimum_longitude",
      )),
    min_lat: num(
      pick(row,
        "min_lat", "minlat", "latmin", "lat_min",
        "south", "southlat", "south_latitude", "s_lat", "s_lat",
        "lat1", "y1", "ymin", "miny", "y_min", "min_y",
        "from_lat", "start_lat", "lat_from", "lat_start",
        "bottom_lat", "bottom",
        "min_latitude", "minlatitude", "minimum_lat", "minimum_latitude",
      )),
    max_lon: num(
      pick(row,
        "max_lon", "maxlon", "lonmax", "lon_max",
        "east", "eastlon", "east_longitude", "eastlong", "e_lon", "e_long",
        "lon2", "x2", "xmax", "maxx", "x_max", "max_x",
        "to_lon", "end_lon", "lon_to", "lon_end",
        "right_lon", "right",
        "max_longitude", "maxlongitude", "maximum_lon", "maximum_longitude",
      )),
    max_lat: num(
      pick(row,
        "max_lat", "maxlat", "latmax", "lat_max",
        "north", "northlat", "north_latitude", "n_lat", "n_lat",
        "lat2", "y2", "ymax", "maxy", "y_max", "max_y",
        "to_lat", "end_lat", "lat_to", "lat_end",
        "top_lat", "top",
        "max_latitude", "maxlatitude", "maximum_lat", "maximum_latitude",
      )),
  }

  for (const [field, ...aliases] of G_NAMES) {
    const v = num(pick(row, field, ...aliases));
    if (v != null) (out as any)[field] = v;
  }

  return out;
}

export function AddSurveyDialog({ open, onClose, onSubmit, onDelete, onUpdate, onClearAll, onExternalExtract, surveys, basins }: Props) {
  const [mode, setMode] = useState<"manual" | "import" | "manage" | "external">("manual");
  const [draft, setDraft] = useState<SurveyDraft>(EMPTY);
  const [queued, setQueued] = useState<SurveyDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [manageQuery, setManageQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<SurveyUpdate>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [extStatus, setExtStatus] = useState<ExternalStatus | null>(null);
  const [extBusy, setExtBusy] = useState(false);
  const [extSelectedTable, setExtSelectedTable] = useState<string | null>(null);
  const [extPreview, setExtPreview] = useState<ExternalPreviewItem[] | null>(null);
  const [extMessage, setExtMessage] = useState<string | null>(null);
  const [extExtracting, setExtExtracting] = useState(false);

  const set = <K extends keyof SurveyDraft>(k: K, v: SurveyDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const ingestFiles = useCallback(async (files: File[]) => {
    setBusy(true);
    setMessage(null);
    const found: SurveyDraft[] = [];
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "csv" || ext === "xlsx" || ext === "xls") {
          const XLSX = await import("xlsx");
          const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
          for (const sheet of wb.SheetNames) {
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet]);
            if (rows.length > 0) {
              const colList = Object.keys(rows[0]);
              const known = new Set<string>();
              const allPatterns = [
                "project_name", "basin", "si_code", "project_year",
                "g1_x", "g1_y", "g1_il", "g1_xl",
                "min_lon", "min_lat", "max_lon", "max_lat",
              ];
              for (const pat of allPatterns) {
                const kp = KEY(pat);
                for (const c of colList) {
                  const nc = KEY(c);
                  if (nc === kp || nc.includes(kp)) known.add(c);
                }
              }
              const foundCols = colList.filter((c) => known.has(c));
              const hasCoords = foundCols.some((c) =>
                ["g1_x", "g1_y", "g1_il", "g1_xl", "min_lon", "min_lat", "max_lon", "max_lat"]
                  .some((p) => KEY(c) === KEY(p) || KEY(c).includes(KEY(p)))
              );
              if (!hasCoords) {
                setMessage(`Sheet "${sheet}" columns: ${colList.join(", ")} — no coordinate columns matched`);
              }
              console.log("[import] Sheet:", sheet, "Columns:", colList.join(", "), "Matched:", foundCols);
            }
            rows.forEach((r) => {
              const d = rowToDraft(r);
              if (d) found.push(d);
            });
          }
        } else if (ext === "shp" || ext === "zip" || ext === "shx" || ext === "dbf") {
          if (ext === "shx" || ext === "dbf") continue; // sidecars — read with the .shp
          const shp = (await import("shpjs")).default;
          const fc = (await shp(await file.arrayBuffer())) as unknown;
          const collections = Array.isArray(fc) ? fc : [fc];
          for (const col of collections as { features?: unknown[] }[]) {
            for (const feat of col.features ?? []) {
              const f = feat as {
                properties?: Record<string, unknown>;
                geometry?: { coordinates: unknown };
              };
              const base = rowToDraft(f.properties ?? {}) ?? {
                ...EMPTY,
                project_name: file.name.replace(/\.[^.]+$/, ""),
              };
              const coords: number[][] = [];
              const walk = (v: unknown) => {
                if (Array.isArray(v) && typeof v[0] === "number") coords.push(v as number[]);
                else if (Array.isArray(v)) v.forEach(walk);
              };
              walk(f.geometry?.coordinates);
              if (coords.length) {
                const lons = coords.map((c) => c[0]);
                const lats = coords.map((c) => c[1]);
                base.min_lon = Math.min(...lons);
                base.max_lon = Math.max(...lons);
                base.min_lat = Math.min(...lats);
                base.max_lat = Math.max(...lats);
              }
              found.push(base);
            }
          }
        } else {
          setMessage(`Unsupported file: ${file.name}`);
        }
      }
      setQueued((q) => [...q, ...found]);
      setMessage(found.length ? `${found.length} record(s) parsed and ready.` : "No usable rows found.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not parse that file.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!open) return null;

  const submit = async (drafts: SurveyDraft[]) => {
    if (!drafts.length) return;
    setBusy(true);
    try {
      await onSubmit(drafts);
      setDraft(EMPTY);
      setQueued([]);
      setMessage(null);
      onClose();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col border border-border bg-surface shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-ink px-4 py-3">
          <div>
            <p className="rail-label">Register</p>
            <h2 className="slab text-lg text-foreground">Add project / survey</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:border-rust hover:text-rust"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex gap-1 border-b border-border bg-surface-2/60 px-4 py-2">
          {(["manual", "import", "external", "manage"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rail-label border px-3 py-1.5 transition-colors ${
                mode === m
                  ? "border-ochre bg-ochre/15 text-ochre"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "manual" ? "Manual entry" : m === "import" ? "Import files" : m === "external" ? "External DB" : "Manage records"}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {mode === "manual" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Labeled label="Project name *">
                <input
                  className={field}
                  value={draft.project_name}
                  onChange={(e) => set("project_name", e.target.value)}
                  placeholder="e.g. Kaveri Offshore 3D"
                />
              </Labeled>
              <Labeled label="Basin">
                <input
                  className={field}
                  list="basin-options"
                  value={draft.basin ?? ""}
                  onChange={(e) => set("basin", e.target.value)}
                />
                <datalist id="basin-options">
                  {basins.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Labeled>
              <Labeled label="Data dimension">
                <div className="flex gap-2">
                  {["2D", "3D"].map((d) => (
                    <button
                      key={d}
                      onClick={() => set("data_dimension", d)}
                      className={`rail-label flex-1 border px-3 py-1.5 transition-colors ${
                        draft.data_dimension === d
                          ? "border-ochre bg-ochre/15 text-ochre"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Labeled>
              <Labeled label="SI / details code">
                <input
                  className={field}
                  value={draft.si_code ?? ""}
                  onChange={(e) => set("si_code", e.target.value)}
                />
              </Labeled>
              <Labeled label="Project year">
                <input
                  className={field}
                  value={draft.project_year ?? ""}
                  onChange={(e) => set("project_year", e.target.value)}
                  placeholder="2026"
                />
              </Labeled>
              <Labeled label="Type of processing">
                <input
                  className={field}
                  value={draft.type_of_processing ?? ""}
                  onChange={(e) => set("type_of_processing", e.target.value)}
                  placeholder="PSTM / PSDM"
                />
              </Labeled>
              <Labeled label="Processing bin">
                <input
                  className={field}
                  value={draft.processing_bin ?? ""}
                  onChange={(e) => set("processing_bin", e.target.value)}
                />
              </Labeled>
              <Labeled label="UTM zone">
                <input
                  className={field}
                  value={draft.utm_zone ?? ""}
                  onChange={(e) => set("utm_zone", e.target.value)}
                />
              </Labeled>
              <Labeled label="Quantum SKM">
                <input
                  className={field}
                  inputMode="decimal"
                  value={draft.quantum_skm ?? ""}
                  onChange={(e) => set("quantum_skm", num(e.target.value))}
                />
              </Labeled>
              <Labeled label="Quantum SLKM">
                <input
                  className={field}
                  inputMode="decimal"
                  value={draft.quantum_slkm ?? ""}
                  onChange={(e) => set("quantum_slkm", num(e.target.value))}
                />
              </Labeled>
              <Labeled label="Record length">
                <input
                  className={field}
                  value={draft.record_length ?? ""}
                  onChange={(e) => set("record_length", e.target.value)}
                />
              </Labeled>
              <Labeled label="Sampling interval">
                <input
                  className={field}
                  value={draft.sampling_interval ?? ""}
                  onChange={(e) => set("sampling_interval", e.target.value)}
                />
              </Labeled>
              <Labeled label="Fold">
                <input
                  className={field}
                  value={draft.fold ?? ""}
                  onChange={(e) => set("fold", e.target.value)}
                />
              </Labeled>
              <Labeled label="Azimuth">
                <input
                  className={field}
                  value={draft.azimuth ?? ""}
                  onChange={(e) => set("azimuth", e.target.value)}
                />
              </Labeled>
              <Labeled label="Spheroid">
                <input
                  className={field}
                  value={draft.spheroid ?? ""}
                  onChange={(e) => set("spheroid", e.target.value)}
                />
              </Labeled>
              <Labeled label="Projection">
                <input
                  className={field}
                  value={draft.projection ?? ""}
                  onChange={(e) => set("projection", e.target.value)}
                />
              </Labeled>
              <Labeled label="Project timeline">
                <input
                  className={field}
                  value={draft.project_timeline ?? ""}
                  onChange={(e) => set("project_timeline", e.target.value)}
                />
              </Labeled>

              <div className="sm:col-span-2">
                <p className="rail-label mb-2">
                  Footprint box (decimal degrees — clipped to India automatically)
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["min_lon", "West lon"],
                      ["min_lat", "South lat"],
                      ["max_lon", "East lon"],
                      ["max_lat", "North lat"],
                    ] as [keyof SurveyDraft, string][]
                  ).map(([k, label]) => (
                    <Labeled key={String(k)} label={label}>
                      <input
                        className={field}
                        inputMode="decimal"
                        value={(draft[k] as number | null) ?? ""}
                        onChange={(e) => set(k, num(e.target.value) as never)}
                      />
                    </Labeled>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void ingestFiles([...e.dataTransfer.files]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`grid cursor-pointer place-items-center gap-2 border border-dashed px-6 py-12 text-center transition-colors ${
                  dragging ? "border-ochre bg-ochre/10" : "border-border hover:border-ochre/60"
                }`}
              >
                <Upload className="h-6 w-6 text-ochre" />
                <p className="slab text-sm text-foreground">Drop survey files here</p>
                <p className="text-[0.74rem] text-muted-foreground">
                  .csv · .xlsx · .shp (with .shx/.dbf zipped) — or click to browse
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls,.shp,.shx,.dbf,.zip"
                  className="hidden"
                  onChange={(e) => void ingestFiles([...(e.target.files ?? [])])}
                />
              </div>

              {queued.length > 0 && (
                <ul className="mt-3 max-h-56 divide-y divide-border overflow-y-auto border border-border">
                  {queued.map((q, i) => (
                    <li key={i} className="flex items-center gap-2 px-3 py-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-seismic" />
                      <span className="min-w-0 flex-1 truncate text-[0.78rem] text-foreground">
                        {q.project_name}
                      </span>
                      <span className="data-cell shrink-0 text-muted-foreground">
                        {q.project_year || "—"} · {q.basin || "no basin"}
                      </span>
                      <button
                        onClick={() => setQueued((list) => list.filter((_, j) => j !== i))}
                        className="text-muted-foreground transition-colors hover:text-rust"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {mode === "manage" && (
            <div>
              <input
                value={manageQuery}
                onChange={(e) => setManageQuery(e.target.value)}
                placeholder="Search by name, basin, year, SI code…"
                className="mb-3 w-full border border-border bg-ink px-3 py-2 text-[0.78rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ochre"
              />
              <div className="max-h-[28rem] overflow-y-auto border border-border">
                {surveys
                  .filter((s) => {
                    const q = manageQuery.toLowerCase()
                    if (!q) return true
                    return [s.projects?.project_name, s.projects?.basin, s.project_year, s.si_code]
                      .filter(Boolean)
                      .some((v) => String(v).toLowerCase().includes(q))
                  })
                  .map((s) => (
                    <div key={s.id} className="border-b border-border last:border-0">
                      {editingId === s.id ? (
                        <div className="grid gap-2 p-3 sm:grid-cols-2">
                          <Labeled label="Project name">
                            <input className={field} value={editData.project_name ?? s.projects?.project_name ?? ""} onChange={(e) => setEditData((d) => ({ ...d, project_name: e.target.value }))} />
                          </Labeled>
                          <Labeled label="Basin">
                            <input className={field} value={editData.basin ?? s.projects?.basin ?? ""} onChange={(e) => setEditData((d) => ({ ...d, basin: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="SI code">
                            <input className={field} value={editData.si_code ?? s.si_code ?? ""} onChange={(e) => setEditData((d) => ({ ...d, si_code: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Year">
                            <input className={field} value={editData.project_year ?? s.project_year ?? ""} onChange={(e) => setEditData((d) => ({ ...d, project_year: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Processing type">
                            <input className={field} value={editData.type_of_processing ?? s.type_of_processing ?? ""} onChange={(e) => setEditData((d) => ({ ...d, type_of_processing: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Processing bin">
                            <input className={field} value={editData.processing_bin ?? s.processing_bin ?? ""} onChange={(e) => setEditData((d) => ({ ...d, processing_bin: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="SKM">
                            <input className={field} inputMode="decimal" value={editData.quantum_skm ?? s.quantum_skm ?? ""} onChange={(e) => setEditData((d) => ({ ...d, quantum_skm: parseFloat(e.target.value) || null }))} />
                          </Labeled>
                          <Labeled label="SLKM">
                            <input className={field} inputMode="decimal" value={editData.quantum_slkm ?? s.quantum_slkm ?? ""} onChange={(e) => setEditData((d) => ({ ...d, quantum_slkm: parseFloat(e.target.value) || null }))} />
                          </Labeled>
                          <Labeled label="Record length">
                            <input className={field} value={editData.record_length ?? s.record_length ?? ""} onChange={(e) => setEditData((d) => ({ ...d, record_length: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Sampling interval">
                            <input className={field} value={editData.sampling_interval ?? s.sampling_interval ?? ""} onChange={(e) => setEditData((d) => ({ ...d, sampling_interval: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Fold">
                            <input className={field} value={editData.fold ?? s.fold ?? ""} onChange={(e) => setEditData((d) => ({ ...d, fold: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Azimuth">
                            <input className={field} value={editData.azimuth ?? s.azimuth ?? ""} onChange={(e) => setEditData((d) => ({ ...d, azimuth: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Spheroid">
                            <input className={field} value={editData.spheroid ?? s.spheroid ?? ""} onChange={(e) => setEditData((d) => ({ ...d, spheroid: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Projection">
                            <input className={field} value={editData.projection ?? s.projection ?? ""} onChange={(e) => setEditData((d) => ({ ...d, projection: e.target.value || null }))} />
                          </Labeled>
                          <Labeled label="Project timeline">
                            <input className={field} value={editData.project_timeline ?? s.project_timeline ?? ""} onChange={(e) => setEditData((d) => ({ ...d, project_timeline: e.target.value || null }))} />
                          </Labeled>
                          <div className="flex items-end gap-2 sm:col-span-2">
                            <button
                              onClick={async () => {
                                await onUpdate(s.id, editData)
                                setEditingId(null)
                                setEditData({})
                              }}
                              className="flex items-center gap-1 border border-seismic bg-seismic px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
                            >
                              <Check className="h-3.5 w-3.5" /> Save
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditData({}) }}
                              className="rail-label border border-border px-3 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : deletingId === s.id ? (
                        <div className="flex items-center gap-3 bg-rust/10 px-4 py-3">
                          <Trash2 className="h-4 w-4 shrink-0 text-rust" />
                          <p className="flex-1 text-[0.78rem] text-foreground/90">
                            Delete <span className="font-semibold text-rust">{s.projects?.project_name}</span>? This cannot be undone.
                          </p>
                          <button
                            onClick={async () => {
                              await onDelete(s.id)
                              setDeletingId(null)
                            }}
                            className="rail-label border border-rust bg-rust px-3 py-1 text-primary-foreground"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="rail-label border border-border px-3 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-2">
                          <span className="data-cell w-20 shrink-0 text-ochre">{s.project_year ?? "—"}</span>
                          <span className="min-w-0 flex-1 truncate text-[0.78rem] text-foreground">{s.projects?.project_name}</span>
                          <span className="data-cell hidden w-24 shrink-0 truncate text-muted-foreground sm:block">{s.projects?.basin ?? "—"}</span>
                          <span className="data-cell hidden w-24 shrink-0 truncate text-muted-foreground md:block">{s.si_code ?? "—"}</span>
                          <button
                            onClick={() => { setEditingId(s.id); setEditData({}); setDeletingId(null) }}
                            className="grid h-7 w-7 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-seismic"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setDeletingId(s.id); setEditingId(null) }}
                            className="grid h-7 w-7 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-rust"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                {surveys.length === 0 && (
                  <p className="px-4 py-8 text-center text-[0.78rem] text-muted-foreground">No surveys loaded.</p>
                )}
              </div>
              {confirmClear ? (
                <div className="mt-3 flex items-center gap-3 border border-rust bg-rust/10 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rust" />
                  <p className="flex-1 text-[0.78rem] text-foreground/90">
                    Delete all <span className="font-semibold text-rust">{surveys.length}</span> surveys? This cannot be undone.
                  </p>
                  <button
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await onClearAll()
                        setConfirmClear(false)
                      } finally {
                        setBusy(false)
                      }
                    }}
                    className="rail-label border border-rust bg-rust px-3 py-1 text-primary-foreground"
                  >
                    Yes, clear all
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="rail-label border border-border px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : surveys.length > 0 && (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-rust/50 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-rust transition-colors hover:bg-rust hover:text-primary-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all data ({surveys.length})
                </button>
              )}
            </div>
          )}

          {mode === "external" && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-seismic" />
                <p className="slab text-sm text-foreground">External Database</p>
              </div>
              <p className="mb-3 text-[0.74rem] text-muted-foreground">
                Connect to a remote PostgreSQL database to preview and extract survey records.
                Set <code className="bg-ink px-1 text-ochre">EXTERNAL_DATABASE_URL</code> in <code className="bg-ink px-1 text-ochre">.env</code> and restart the server.
              </p>

              {extStatus && !extStatus.configured && (
                <div className="border border-border bg-ink px-4 py-3 text-[0.75rem] text-muted-foreground">
                  Not configured — set EXTERNAL_DATABASE_URL in .env and restart the server.
                </div>
              )}

              {extStatus && extStatus.configured && !extStatus.reachable && (
                <div className="border border-rust/40 bg-rust/5 px-4 py-3 text-[0.75rem] text-rust">
                  {extStatus.error || "Could not connect to external database."}
                </div>
              )}

              {extStatus && extStatus.reachable && (
                <div className="mb-3 border border-border bg-ink px-4 py-3">
                  <p className="rail-label mb-1">Connected to <span className="text-foreground">{extStatus.dbName}</span></p>
                  <p className="text-[0.72rem] text-muted-foreground truncate">{extStatus.dbVersion}</p>
                </div>
              )}

              {extStatus?.tables && extStatus.tables.length > 0 && (
                <div className="mb-3">
                  <p className="rail-label mb-2">Tables</p>
                  <div className="max-h-40 overflow-y-auto border border-border">
                    {extStatus.tables.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => { setExtSelectedTable(t.name); setExtPreview(null); setExtMessage(null); }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[0.78rem] transition-colors border-b border-border last:border-0 ${
                          extSelectedTable === t.name
                            ? "bg-ochre/10 text-ochre"
                            : "text-foreground hover:bg-surface-2/60"
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{t.name}</span>
                        <span className="data-cell shrink-0 text-muted-foreground">{t.rowCount.toLocaleString()} rows</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {extSelectedTable && (
                <div className="flex gap-2 mb-3">
                  <button
                    disabled={extBusy}
                    onClick={async () => {
                      setExtBusy(true);
                      setExtMessage(null);
                      try {
                        const res = await previewExternalTable(extSelectedTable, undefined, 5);
                        setExtPreview(res.preview);
                        setExtMessage(`Previewing ${res.count} rows (key: ${res.keyField})`);
                      } catch (err) {
                        setExtMessage(err instanceof Error ? err.message : "Preview failed");
                      } finally {
                        setExtBusy(false);
                      }
                    }}
                    className="flex items-center gap-1 border border-border px-3 py-1.5 text-[0.72rem] text-muted-foreground transition-colors hover:border-ochre hover:text-ochre disabled:opacity-40"
                  >
                    {extBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Preview
                  </button>
                  <button
                    disabled={extExtracting}
                    onClick={async () => {
                      setExtExtracting(true);
                      setExtMessage(null);
                      try {
                        const res = await extractFromExternal(extSelectedTable);
                        setExtMessage(`Extracted ${res.inserted} record(s) · ${res.skipped} skipped`);
                        onExternalExtract({
                          project_ids: res.project_ids,
                          count: res.inserted,
                          mapped: res.inserted,
                        });
                      } catch (err) {
                        setExtMessage(err instanceof Error ? err.message : "Extract failed");
                      } finally {
                        setExtExtracting(false);
                      }
                    }}
                    className="flex items-center gap-1 border border-ochre bg-ochre px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity disabled:opacity-40"
                  >
                    {extExtracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Extract
                  </button>
                </div>
              )}

              {extPreview && extPreview.length > 0 && (
                <div className="max-h-48 overflow-auto border border-border">
                  <table className="w-full text-[0.72rem]">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/60">
                        <th className="px-2 py-1 text-left text-muted-foreground">Key</th>
                        <th className="px-2 py-1 text-left text-muted-foreground">Project Name</th>
                        <th className="px-2 py-1 text-left text-muted-foreground">Basin</th>
                        <th className="px-2 py-1 text-left text-muted-foreground">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extPreview.map((item, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-2 py-1 text-muted-foreground">{item.key ?? "—"}</td>
                          <td className="px-2 py-1 text-foreground">{String(item.mapped.project_name ?? "—")}</td>
                          <td className="px-2 py-1 text-muted-foreground">{String(item.mapped.basin ?? "—")}</td>
                          <td className="px-2 py-1 text-muted-foreground">{String(item.mapped.project_year ?? "—")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!extStatus && !extBusy && (
                <button
                  disabled={extBusy}
                  onClick={async () => {
                    setExtBusy(true);
                    try {
                      const status = await fetchExternalStatus();
                      setExtStatus(status);
                    } catch (err) {
                      setExtMessage(err instanceof Error ? err.message : "Status check failed");
                    } finally {
                      setExtBusy(false);
                    }
                  }}
                  className="flex items-center gap-1 border border-border px-3 py-1.5 text-[0.72rem] text-muted-foreground transition-colors hover:border-ochre hover:text-ochre"
                >
                  {extBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Check connection
                </button>
              )}
            </div>
          )}

          {message && (
            <p className="mt-3 border border-border bg-ink px-3 py-2 text-[0.75rem] text-foreground/85">
              {message}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-ink px-4 py-3">
          <p className="text-[0.72rem] text-muted-foreground">
            {mode === "external"
              ? "Extracted records appear on the map and tables immediately."
              : "Saved records appear on the map and tables immediately."}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rail-label border border-border px-3 py-2">
              {mode === "external" ? "Close" : "Cancel"}
            </button>
            {mode !== "external" && (
              <button
                disabled={busy || (mode === "manual" ? draft.project_name.trim().length < 2 : !queued.length)}
                onClick={() => void submit(mode === "manual" ? [draft] : queued)}
                className="flex items-center gap-2 border border-ochre bg-ochre px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {mode === "manual" ? "Add survey" : `Import ${queued.length || ""}`}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="rail-label mb-1 block">{label}</span>
      {children}
    </label>
  );
}
