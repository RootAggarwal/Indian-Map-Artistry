import { useEffect, useMemo, useRef, useState } from "react";
import type { SurveyRecord } from "@/lib/seismic";

export type MapTool = "pan" | "box" | "inspect";

type Props = {
  surveys: SurveyRecord[];
  selectedId: number | null;
  onSelect: (rec: SurveyRecord) => void;
  tool: MapTool;
  zoomSignal: { dir: number; nonce: number } | null;
  resetSignal: number;
  yearFilterActive: string | null;
};

/* Equirectangular projection tuned to the Indian national extent. */
const LON0 = 67.5;
const LON1 = 98.0;
const LAT0 = 5.5;
const LAT1 = 38.0;
const K = 40; // px per degree of longitude
const KX = K;
const KY = K * 1.08;
const VIEW_W = (LON1 - LON0) * KX;
const VIEW_H = (LAT1 - LAT0) * KY;

const px = (lon: number) => (lon - LON0) * KX;
const py = (lat: number) => (LAT1 - lat) * KY;

type Boundary = { type: string; coordinates: number[][][][] };

export function MapCanvas({
  surveys,
  selectedId,
  onSelect,
  tool,
  zoomSignal,
  resetSignal,
  yearFilterActive,
}: Props) {
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
  const [drag, setDrag] = useState<null | { sx: number; sy: number; view: typeof view }>(null);
  const [box, setBox] = useState<null | { x1: number; y1: number; x2: number; y2: number }>(null);
  const [hover, setHover] = useState<SurveyRecord | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    fetch("/data/india-boundary.json")
      .then((r) => r.json())
      .then(setBoundary)
      .catch(() => setBoundary(null));
  }, []);

  useEffect(() => {
    if (!zoomSignal) return;
    setView((v) => {
      const factor = zoomSignal.dir > 0 ? 0.72 : 1 / 0.72;
      const w = Math.min(VIEW_W * 1.2, Math.max(VIEW_W * 0.06, v.w * factor));
      const h = w * (VIEW_H / VIEW_W);
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
    });
  }, [zoomSignal]);

  useEffect(() => {
    if (resetSignal) setView({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
  }, [resetSignal]);

  const paths = useMemo(() => {
    if (!boundary) return [];
    return boundary.coordinates.map((poly) =>
      poly
        .map(
          (ring) =>
            ring.map(([lon, lat], i) => `${i ? "L" : "M"}${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join("") + "Z",
        )
        .join(" "),
    );
  }, [boundary]);

  const mapped = useMemo(() => surveys.filter((s) => s.is_mapped && s.bbox_min_lon != null), [surveys]);

  function toLocal(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: view.x + ((e.clientX - rect.left) / rect.width) * view.w,
      y: view.y + ((e.clientY - rect.top) / rect.height) * view.h,
    };
  }

  function onDown(e: React.MouseEvent) {
    const p = toLocal(e);
    if (tool === "box") setBox({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    else if (tool === "pan") setDrag({ sx: e.clientX, sy: e.clientY, view });
  }

  function onMove(e: React.MouseEvent) {
    if (box) {
      const p = toLocal(e);
      setBox((b) => (b ? { ...b, x2: p.x, y2: p.y } : b));
      return;
    }
    if (drag && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dx = ((e.clientX - drag.sx) / rect.width) * drag.view.w;
      const dy = ((e.clientY - drag.sy) / rect.height) * drag.view.h;
      setView({ ...drag.view, x: drag.view.x - dx, y: drag.view.y - dy });
    }
  }

  function onUp() {
    if (box) {
      const w = Math.abs(box.x2 - box.x1);
      const h = Math.abs(box.y2 - box.y1);
      if (w > 12 && h > 12) {
        const nw = Math.max(w, h * (VIEW_W / VIEW_H));
        setView({
          x: Math.min(box.x1, box.x2) - (nw - w) / 2,
          y: Math.min(box.y1, box.y2) - (nw * (VIEW_H / VIEW_W) - h) / 2,
          w: nw,
          h: nw * (VIEW_H / VIEW_W),
        });
      }
      setBox(null);
    }
    setDrag(null);
  }

  const cursor = tool === "pan" ? (drag ? "grabbing" : "grab") : tool === "box" ? "crosshair" : "pointer";
  const strokeScale = view.w / VIEW_W;

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink survey-grid grain">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-full w-full select-none"
        style={{ cursor }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      >
        <defs>
          <linearGradient id="landfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.34 0.03 250)" />
            <stop offset="100%" stopColor="oklch(0.27 0.028 250)" />
          </linearGradient>
        </defs>

        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="url(#landfill)"
            stroke="oklch(0.62 0.05 240)"
            strokeWidth={0.9 * strokeScale}
            strokeLinejoin="round"
          />
        ))}

        {mapped.map((s) => {
          const x = px(s.bbox_min_lon as number);
          const y = py(s.bbox_max_lat as number);
          const w = px(s.bbox_max_lon as number) - x;
          const h = py(s.bbox_min_lat as number) - y;
          const active = s.id === selectedId;
          const dim = yearFilterActive != null && s.project_year !== yearFilterActive;
          const suspect =
            (s.bbox_max_lon as number) - (s.bbox_min_lon as number) > 6 ||
            (s.bbox_max_lat as number) - (s.bbox_min_lat as number) > 6;
          return (
            <rect
              key={s.id}
              x={x}
              y={y}
              width={Math.max(w, 1.4)}
              height={Math.max(h, 1.4)}
              rx={0.6}
              fill={
                suspect
                  ? "transparent"
                  : active
                    ? "oklch(0.78 0.152 74 / 0.5)"
                    : "oklch(0.72 0.121 190 / 0.32)"
              }
              stroke={
                suspect
                  ? "oklch(0.66 0.17 30)"
                  : active
                    ? "oklch(0.86 0.16 78)"
                    : "oklch(0.75 0.12 190)"
              }
              strokeDasharray={suspect ? `${5 * strokeScale} ${4 * strokeScale}` : undefined}
              strokeWidth={(active ? 2.1 : suspect ? 1.2 : 0.9) * strokeScale}
              opacity={dim ? 0.14 : 1}
              className="transition-opacity duration-300"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover((h2) => (h2?.id === s.id ? null : h2))}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(s);
              }}
              style={{ cursor: "pointer" }}
            />
          );
        })}

        {box && (
          <rect
            x={Math.min(box.x1, box.x2)}
            y={Math.min(box.y1, box.y2)}
            width={Math.abs(box.x2 - box.x1)}
            height={Math.abs(box.y2 - box.y1)}
            fill="oklch(0.78 0.152 74 / 0.12)"
            stroke="oklch(0.86 0.16 78)"
            strokeDasharray={`${4 * strokeScale} ${3 * strokeScale}`}
            strokeWidth={1.4 * strokeScale}
          />
        )}
      </svg>

      <div className="pointer-events-none absolute left-3 bottom-3 rail-label bg-ink/80 px-2 py-1">
        {mapped.length} footprints · clipped to Indian extent
      </div>

      {hover && (
        <div className="pointer-events-none absolute right-3 top-3 max-w-[16rem] border border-border bg-popover/95 p-2 backdrop-blur">
          <p className="rail-label">{hover.si_code ?? "SIG —"}</p>
          <p className="mt-1 text-[0.72rem] leading-snug text-foreground">
            {hover.projects?.project_name}
          </p>
          <p className="data-cell mt-1 text-seismic">
            {hover.projects?.basin} · {hover.project_year}
          </p>
        </div>
      )}
    </div>
  );
}
