import { ArrowUpRight } from "lucide-react";
import type { SurveyRecord } from "@/lib/seismic";

type Props = {
  rows: SurveyRecord[];
  selectedId: number | null;
  onSelect: (rec: SurveyRecord) => void;
  onMore: (rec: SurveyRecord) => void;
};

function summary(rec: SurveyRecord) {
  const bits = [
    rec.projects?.data_dimension,
    rec.type_of_processing,
    rec.quantum_skm != null ? `${rec.quantum_skm} SKM` : null,
    rec.processing_bin ? `bin ${rec.processing_bin}` : null,
  ].filter(Boolean);
  return bits.join(" · ") || "No summary recorded";
}

export function BottomBar({ rows, selectedId, onSelect, onMore }: Props) {
  return (
    <section className="flex h-full min-h-0 flex-col border-t border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-ink px-4 py-2">
        <p className="rail-label">Project Year / Project Name / Details / Summary</p>
        <p className="data-cell shrink-0 text-muted-foreground">{rows.length} records</p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[46rem] border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr>
              {["Year", "Project name", "Details", "Summary", ""].map((h) => (
                <th
                  key={h}
                  className="rail-label border-b border-border px-3 py-2 text-left font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((rec) => {
              const active = rec.id === selectedId;
              return (
                <tr
                  key={rec.id}
                  onClick={() => onSelect(rec)}
                  className={`cursor-pointer border-b border-border/60 transition-colors ${
                    active ? "bg-ochre/12" : "hover:bg-surface-2/60"
                  }`}
                >
                  <td className="data-cell whitespace-nowrap px-3 py-2 text-ochre">
                    {rec.project_year ?? "—"}
                  </td>
                  <td className="max-w-[22rem] px-3 py-2">
                    <span className="block truncate text-[0.78rem] text-foreground">
                      {rec.projects?.project_name}
                    </span>
                  </td>
                  <td className="data-cell whitespace-nowrap px-3 py-2 text-seismic">
                    {rec.si_code ?? "—"}
                  </td>
                  <td className="max-w-[24rem] px-3 py-2">
                    <span className="block truncate text-[0.74rem] text-muted-foreground">
                      {summary(rec)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMore(rec);
                      }}
                      className="rail-label inline-flex items-center gap-1 text-ochre transition-colors hover:text-foreground"
                    >
                      More details <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[0.8rem] text-muted-foreground">
                  No projects match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
