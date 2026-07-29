import { useCallback, useRef, useState } from "react";
import { Upload, X, FileSpreadsheet, Loader2, Plus } from "lucide-react";
import type { SurveyDraft } from "@/lib/seismic";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (drafts: SurveyDraft[]) => Promise<void>;
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
  min_lon: null,
  min_lat: null,
  max_lon: null,
  max_lat: null,
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

function rowToDraft(row: Record<string, unknown>): SurveyDraft | null {
  const name = str(pick(row, "project_name", "projectname", "name", "project"));
  if (!name) return null;
  return {
    project_name: name.slice(0, 200),
    basin: str(pick(row, "basin")),
    project_type: str(pick(row, "project_type", "type_of_project")),
    data_dimension: str(pick(row, "data_dimension", "dimension", "dim")) || null,
    si_code: str(pick(row, "si_code", "sicode", "details_code", "code")),
    project_year: str(pick(row, "project_year", "year")),
    type_of_processing: str(pick(row, "type_of_processing", "processing_type", "processing")),
    processing_bin: str(pick(row, "processing_bin", "bin")),
    utm_zone: str(pick(row, "utm_zone", "utm")),
    quantum_skm: num(pick(row, "quantum_skm", "skm")),
    quantum_slkm: num(pick(row, "quantum_slkm", "slkm")),
    min_lon: num(pick(row, "min_lon", "minlon", "west", "lon1", "x1")),
    min_lat: num(pick(row, "min_lat", "minlat", "south", "lat1", "y1")),
    max_lon: num(pick(row, "max_lon", "maxlon", "east", "lon2", "x2")),
    max_lat: num(pick(row, "max_lat", "maxlat", "north", "lat2", "y2")),
  };
}

export function AddSurveyDialog({ open, onClose, onSubmit, basins }: Props) {
  const [mode, setMode] = useState<"manual" | "import">("manual");
  const [draft, setDraft] = useState<SurveyDraft>(EMPTY);
  const [queued, setQueued] = useState<SurveyDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          {(["manual", "import"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rail-label border px-3 py-1.5 transition-colors ${
                mode === m
                  ? "border-ochre bg-ochre/15 text-ochre"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "manual" ? "Manual entry" : "Import files"}
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
                    <Labeled key={k} label={label}>
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

          {message && (
            <p className="mt-3 border border-border bg-ink px-3 py-2 text-[0.75rem] text-foreground/85">
              {message}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-ink px-4 py-3">
          <p className="text-[0.72rem] text-muted-foreground">
            Saved records appear on the map and tables immediately.
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rail-label border border-border px-3 py-2">
              Cancel
            </button>
            <button
              disabled={busy || (mode === "manual" ? draft.project_name.trim().length < 2 : !queued.length)}
              onClick={() => void submit(mode === "manual" ? [draft] : queued)}
              className="flex items-center gap-2 border border-ochre bg-ochre px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {mode === "manual" ? "Add survey" : `Import ${queued.length || ""}`}
            </button>
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
