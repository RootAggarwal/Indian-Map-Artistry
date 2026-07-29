"use client";
import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { fetchAuditLogs, type AuditRow, type ReportRow, type SurveyRecord } from "@/lib/seismic";

type Props = {
  rec: SurveyRecord | null;
  reports: ReportRow[];
  onClose: () => void;
  onPrint: (rec: SurveyRecord) => void;
};

export function DetailsDialog({ rec, reports, onClose, onPrint }: Props) {
  const [audit, setAudit] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (!rec) return;
    let alive = true;
    fetchAuditLogs(rec.projects?.basin ?? null)
      .then((rows) => alive && setAudit(rows))
      .catch(() => alive && setAudit([]));
    return () => {
      alive = false;
    };
  }, [rec]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!rec) return null;
  const linked = reports.filter((r) => r.project_id === rec.project_id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="panel grain flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-ink px-5 py-4">
          <div className="min-w-0">
            <p className="rail-label">Dossier · {rec.si_code ?? "—"}</p>
            <h2 className="slab mt-1 truncate text-xl text-foreground">
              {rec.projects?.project_name}
            </h2>
            <p className="data-cell mt-1 text-seismic">
              {rec.projects?.basin} · {rec.project_year} · {rec.type_of_processing}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onPrint(rec)}
              className="flex h-8 items-center gap-2 border border-ochre/50 bg-ochre/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center border border-border text-muted-foreground hover:border-rust hover:text-rust"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <section>
            <p className="rail-label">Corner geometry</p>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  {["Corner", "Easting", "Northing", "IL", "XL", "Lat", "Lon", "Source"].map((h) => (
                    <th
                      key={h}
                      className="rail-label border-b border-border px-2 py-1 text-left font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(rec.corners ?? []).map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="data-cell px-2 py-1 text-ochre">G{c.corner ?? i + 1}</td>
                    <td className="data-cell px-2 py-1">{c.easting ?? "—"}</td>
                    <td className="data-cell px-2 py-1">{c.northing ?? "—"}</td>
                    <td className="data-cell px-2 py-1">{c.il ?? "—"}</td>
                    <td className="data-cell px-2 py-1">{c.xl ?? "—"}</td>
                    <td className="data-cell px-2 py-1 text-seismic">{c.lat?.toFixed(4) ?? "—"}</td>
                    <td className="data-cell px-2 py-1 text-seismic">{c.lon?.toFixed(4) ?? "—"}</td>
                    <td className="data-cell px-2 py-1 text-muted-foreground">
                      {c.is_assumed ? "assumed" : "surveyed"}
                    </td>
                  </tr>
                ))}
                {(rec.corners ?? []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center text-[0.78rem] text-muted-foreground">
                      No corner geometry captured for this survey.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {linked.length > 0 && (
            <section className="mt-6">
              <p className="rail-label">Linked reports</p>
              <ul className="mt-2 space-y-1">
                {linked.map((r) => (
                  <li key={r.id} className="data-cell break-all text-ochre">
                    {r.file_name} <span className="text-muted-foreground">· {r.report_type}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6">
            <p className="rail-label">Basin audit log · {rec.projects?.basin ?? "—"}</p>
            <ul className="mt-2 divide-y divide-border/60 border border-border">
              {audit.slice(0, 40).map((a) => (
                <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-3 py-2">
                  <span className="data-cell shrink-0 text-muted-foreground">
                    {a.created_at.replace("T", " ").slice(0, 19)}
                  </span>
                  <span className="min-w-0">
                    <span className="data-cell text-ochre">{a.action}</span>
                    <span className="data-cell ml-2 break-all text-muted-foreground">
                      {a.si_code ?? ""}
                    </span>
                  </span>
                </li>
              ))}
              {audit.length === 0 && (
                <li className="px-3 py-4 text-center text-[0.78rem] text-muted-foreground">
                  No audit entries recorded for this basin yet.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
