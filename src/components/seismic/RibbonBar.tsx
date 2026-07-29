import {
  Hand,
  Square,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Play,
  Pause,
  Search,
  X,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MapTool } from "./MapCanvas";

type Props = {
  tool: MapTool;
  setTool: (t: MapTool) => void;
  onZoom: (dir: number) => void;
  onReset: () => void;
  onPrint: () => void;
  years: string[];
  yearIndex: number;
  setYearIndex: (i: number) => void;
  playing: boolean;
  togglePlay: () => void;
  query: string;
  setQuery: (q: string) => void;
  matches: number;
  onAdd: () => void;
};

const toolBtn =
  "grid h-8 w-8 shrink-0 place-items-center border border-border text-muted-foreground transition-colors hover:border-ochre hover:text-ochre";

export function RibbonBar({
  tool,
  setTool,
  onZoom,
  onReset,
  onPrint,
  years,
  yearIndex,
  setYearIndex,
  playing,
  togglePlay,
  query,
  setQuery,
  matches,
  onAdd,
}: Props) {
  const active = "border-ochre bg-ochre/15 text-ochre";
  const [findOpen, setFindOpen] = useState(false);
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (findOpen) findRef.current?.focus();
  }, [findOpen]);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2/60 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1">
        <button
          className={`${toolBtn} ${tool === "pan" ? active : ""}`}
          onClick={() => setTool("pan")}
          title="Hand — drag to pan"
          aria-label="Hand tool"
        >
          <Hand className="h-4 w-4" />
        </button>
        <button
          className={`${toolBtn} ${tool === "box" ? active : ""}`}
          onClick={() => setTool("box")}
          title="Draw box — drag a rectangle to zoom"
          aria-label="Draw box tool"
        >
          <Square className="h-4 w-4" />
        </button>
        <button
          className={`${toolBtn} ${tool === "inspect" ? active : ""}`}
          onClick={() => setTool("inspect")}
          title="Inspect — click a footprint"
          aria-label="Inspect tool"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
      </div>

      <span className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        <button className={toolBtn} onClick={() => onZoom(1)} title="Zoom in" aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button className={toolBtn} onClick={() => onZoom(-1)} title="Zoom out" aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button className={toolBtn} onClick={onReset} title="Fit India" aria-label="Fit to India">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <span className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        <button
          className={`${toolBtn} ${findOpen ? active : ""}`}
          onClick={() => {
            if (findOpen) setQuery("");
            setFindOpen((o) => !o);
          }}
          title="Find — project, processing, SI code"
          aria-label="Find"
        >
          <Search className="h-4 w-4" />
        </button>
        {findOpen && (
          <div className="flex h-8 items-center gap-2 border border-ochre/50 bg-ink px-2">
            <input
              ref={findRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQuery("");
                  setFindOpen(false);
                }
              }}
              placeholder="Project · processing · SI code"
              aria-label="Find surveys"
              className="w-48 bg-transparent text-[0.75rem] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <span className="data-cell shrink-0 text-ochre">{matches}</span>
            <button
              onClick={() => {
                setQuery("");
                setFindOpen(false);
              }}
              className="text-muted-foreground transition-colors hover:text-rust"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <span className="h-6 w-px bg-border" />

      <button
        className="flex h-8 items-center gap-2 border border-seismic/50 bg-seismic/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-seismic transition-colors hover:bg-seismic hover:text-primary-foreground"
        onClick={onAdd}
        title="Add or import a project / survey"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>

      <button
        className="flex h-8 items-center gap-2 border border-ochre/50 bg-ochre/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground"
        onClick={onPrint}
        title="Print / download dossier"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>

      <span className="h-6 w-px bg-border" />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button className={toolBtn} onClick={togglePlay} title="Play timeline" aria-label="Play timeline">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(years.length - 1, 0)}
          value={yearIndex}
          onChange={(e) => setYearIndex(Number(e.target.value))}
          className="h-1 min-w-24 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-ochre"
          aria-label="Project year timeline"
        />
        <span className="data-cell shrink-0 border border-border bg-ink px-2 py-1 text-ochre">
          {years[yearIndex] ?? "ALL"}
        </span>
      </div>
    </div>
  );
}
