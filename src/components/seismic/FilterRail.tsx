import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type FacetKey = "basin" | "project_type" | "project_year" | "type_of_processing";

type Facet = {
  key: FacetKey;
  label: string;
  options: [string, number][];
};

type Props = {
  facets: Facet[];
  selected: Record<FacetKey, string[]>;
  toggle: (key: FacetKey, value: string) => void;
  clear: () => void;
  total: number;
  shown: number;
};

export function FilterRail({ facets, selected, toggle, clear, total, shown }: Props) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="rail-label">Filters</p>
          <p className="slab truncate text-lg text-foreground">
            {shown}
            <span className="text-muted-foreground">/{total}</span>
          </p>
        </div>
        <button
          onClick={clear}
          className="rail-label shrink-0 border border-border px-2 py-1 transition-colors hover:border-rust hover:text-rust"
        >
          Reset
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {facets.map((facet) => (
          <FacetBlock
            key={facet.key}
            facet={facet}
            selected={selected[facet.key]}
            toggle={toggle}
          />
        ))}
      </div>
    </aside>
  );
}

function FacetBlock({
  facet,
  selected,
  toggle,
}: {
  facet: Facet;
  selected: string[];
  toggle: (key: FacetKey, value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const max = Math.max(...facet.options.map(([, c]) => c), 1);

  return (
    <section className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-ink px-4 py-2 text-left"
      >
        <span className="slab text-[0.72rem] uppercase tracking-[0.18em] text-foreground">
          {facet.label}
        </span>
        <span className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="data-cell rounded-full bg-ochre px-1.5 text-primary-foreground">
              {selected.length}
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </span>
      </button>

      {open && (
        <ul className="max-h-52 overflow-y-auto py-1">
          {facet.options.map(([value, count]) => {
            const on = selected.includes(value);
            return (
              <li key={value}>
                <button
                  onClick={() => toggle(facet.key, value)}
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-1.5 text-left transition-colors hover:bg-surface-2"
                >
                  <span
                    className={`grid h-3.5 w-3.5 shrink-0 place-items-center border ${
                      on ? "border-ochre bg-ochre" : "border-border"
                    }`}
                  >
                    {on && <span className="block h-1.5 w-1.5 bg-primary-foreground" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[0.76rem] ${on ? "text-ochre" : "text-foreground/85"}`}
                    >
                      {value}
                    </span>
                    <span className="mt-1 block h-[3px] w-full bg-border">
                      <span
                        className="block h-full bg-seismic-soft/70 transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="data-cell shrink-0 text-muted-foreground">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
