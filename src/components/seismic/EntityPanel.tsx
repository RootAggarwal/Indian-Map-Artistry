import { AlertTriangle, FileText, Printer } from "lucide-react";
import type { ReportRow, SurveyRecord } from "@/lib/seismic";

type Props = {
  rec: SurveyRecord | null;
  reports: ReportRow[];
  onPrint: () => void;
  onOpenDetails: () => void;
};

function v(x: unknown) {
  if (x === null || x === undefined || x === "") return "—";
  return String(x);
}

export function EntityPanel({ rec, reports, onPrint, onOpenDetails }: Props) {
  if (!rec) {
    return (
      <aside className="grid h-full place-items-center border-l border-border bg-surface p-6 text-center">
        <p className="rail-label">Select a footprint to load its dossier</p>
      </aside>
    );
  }

  const linked = reports.filter((r) => r.project_id === rec.project_id);
  const rows: [string, string, boolean?][] = [
    ["Project Year", v(rec.project_year)],
    ["Project Name", v(rec.projects?.project_name)],
    ["Investigation Details", v(rec.si_code)],
    ["Data Type (2D/3D/4D)", v(rec.projects?.data_dimension)],
    ["Data Type (New/Reprocessed)", /reprocess/i.test(rec.type_of_processing ?? "") ? "Reprocessed" : "New"],
    ["Basin", v(rec.projects?.basin)],
    ["Project Type", v(rec.type_of_processing)],
    ["Planned Area (LKM/SKM)", v(rec.quantum_skm)],
    ["Planned Area (Eq. SLKM)", v(rec.quantum_slkm)],
    ["Processed Area (LKM/SKM)", v(rec.quantum_skm)],
    ["Processed Area (Eq. SLKM)", v(rec.quantum_slkm)],
    ["Processing Bin Details", v(rec.processing_bin)],
    ["Record Length", v(rec.record_length)],
    ["Sampling Interval", v(rec.sampling_interval)],
    ["Fold", v(rec.fold)],
    ["Planned Timeline", v(rec.project_timeline)],
    ["Actual Timeline", v(rec.project_timeline)],
    ["Spheroid / Projection", `${v(rec.spheroid)} · ${v(rec.projection)}`],
    ["Azimuth", v(rec.azimuth)],
  ];

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border bg-surface">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-ink px-4 py-3">
        <div className="min-w-0">
          <p className="rail-label">Entity / Details</p>
          <h2 className="slab mt-1 line-clamp-2 text-[0.95rem] leading-tight text-foreground">
            {rec.projects?.project_name}
          </h2>
        </div>
        <button
          onClick={onPrint}
          className="grid h-8 w-8 shrink-0 place-items-center border border-ochre/50 text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground"
          title="Download dossier PDF"
          aria-label="Download dossier PDF"
        >
          <Printer className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed">
          <tbody>
            {rows.map(([label, value], i) => (
              <tr
                key={label}
                className={`border-b border-border/70 ${i % 2 ? "bg-surface-2/40" : ""}`}
              >
                <th className="w-[48%] px-3 py-1.5 text-left align-top text-[0.7rem] font-medium text-muted-foreground">
                  {label}
                </th>
                <td className="data-cell px-3 py-1.5 align-top break-words text-seismic">{value}</td>
              </tr>
            ))}
            <tr className="border-b border-border/70">
              <th className="px-3 py-1.5 text-left align-top text-[0.7rem] font-medium text-muted-foreground">
                Reports
              </th>
              <td className="px-3 py-1.5 align-top">
                {linked.length ? (
                  linked.map((r) => (
                    <span
                      key={r.id}
                      className="data-cell block break-all text-ochre underline decoration-dotted"
                      title={r.report_path ?? ""}
                    >
                      <FileText className="mr-1 inline h-3 w-3" />
                      {r.file_name}
                    </span>
                  ))
                ) : (
                  <span className="data-cell text-muted-foreground">No report on file</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {rec.geometry_notes?.length > 0 && (
          <div className="m-3 border border-rust/40 bg-rust/10 p-3">
            <p className="rail-label flex items-center gap-1.5 text-rust">
              <AlertTriangle className="h-3.5 w-3.5" /> Cartographic note
            </p>
            <ul className="mt-2 space-y-1.5">
              {rec.geometry_notes.map((n) => (
                <li key={n} className="text-[0.72rem] leading-snug text-foreground/85">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={onOpenDetails}
        className="hairline-top bg-ink px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground"
      >
        More details + audit trail
      </button>
    </aside>
  );
}
