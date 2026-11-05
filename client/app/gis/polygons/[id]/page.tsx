"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GisNav } from "@/components/gis/GisNav"
import { gisPolygons, gisSigCodes, gisProjects, type PolygonCorner } from "@/lib/gis"

export default function PolygonDetailsPage() {
  const params = useParams<{ id: string }>()
  const polygonId = Number(params.id)
  const search = useSearchParams()
  const sigId = search.get("sig") ? Number(search.get("sig")) : undefined
  const projectId = search.get("project") ? Number(search.get("project")) : undefined
  const qc = useQueryClient()

  // Polygon detail (or project context if creating)
  const polyQuery = useQuery({
    queryKey: ["gis-polygon", polygonId],
    queryFn: () => gisPolygons.get(polygonId),
    enabled: Number.isFinite(polygonId) && polygonId > 0,
  })
  const sigQuery = useQuery({
    queryKey: ["gis-sig", sigId],
    queryFn: () => gisSigCodes.get(sigId!),
    enabled: sigId != null,
  })
  const projectQuery = useQuery({
    queryKey: ["gis-project-mini", projectId],
    queryFn: () => gisProjects.get(projectId!),
    enabled: projectId != null,
  })

  const [corners, setCorners] = useState<PolygonCorner[]>([])
  const [meta, setMeta] = useState({ polygon_identifier: "", polygon_name: "", polygon_colour: "#f97316" })
  const [saveResult, setSaveResult] = useState<{ ok: boolean; status: string; area_m2: number | null; perimeter_m: number | null; corner_count?: number } | null>(null)

  useEffect(() => {
    if (polyQuery.data?.corners) {
      setCorners(polyQuery.data.corners.map((c) => ({ ...c })))
      setMeta({
        polygon_identifier: polyQuery.data.polygon_identifier ?? "",
        polygon_name: polyQuery.data.polygon_name ?? "",
        polygon_colour: polyQuery.data.polygon_colour ?? "#f97316",
      })
    }
  }, [polyQuery.data])

  const cornersSorted = useMemo(() => [...corners].sort((a, b) => a.corner_order - b.corner_order), [corners])
  const validation = useMemo(() => validatePolygon(cornersSorted), [cornersSorted])
  const areaM2 = validation.valid ? shoelaceAreaKm2(cornersSorted) * 1_000_000 : null

  const saveMut = useMutation({
    mutationFn: async () => {
      const ordered = [...corners].sort((a, b) => a.corner_order - b.corner_order)
      if (polygonId > 0) {
        if (meta.polygon_identifier || meta.polygon_name || meta.polygon_colour) {
          await gisPolygons.update(polygonId, {
            polygon_identifier: meta.polygon_identifier || null,
            polygon_name: meta.polygon_name || null,
            polygon_colour: meta.polygon_colour || null,
          })
        }
        return gisPolygons.replaceCorners(polygonId, ordered.map((c, i) => ({ ...c, corner_order: i + 1 })))
      } else {
        // Create new polygon under the given SIG
        const created = await gisPolygons.create({
          sig_code_id: sigId!,
          polygon_identifier: meta.polygon_identifier || null,
          polygon_name: meta.polygon_name || null,
          polygon_colour: meta.polygon_colour || null,
          corners: ordered.map((c, i) => ({ ...c, corner_order: i + 1 })),
        })
        // navigate to the created polygon
        window.location.href = `/gis/polygons/${created.id}`
        return null as any
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["gis-polygon", polygonId] })
      setSaveResult(res)
    },
  })

  const updating = saveMut.isPending
  const isNew = !(Number.isFinite(polygonId) && polygonId > 0)
  const contextLabel = sigQuery.data?.sig_code ?? (projectId ? projectQuery.data?.project.project_name ?? `Project ${projectId}` : undefined)

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <GisNav />
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Link href={isNew && sigId ? `/gis/projects/${sigQuery.data?.processing_project_id ?? ""}`.replace(/\/$/, "") || "/gis/projects" : "/gis/projects"}>
          <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-sm font-semibold">{isNew ? "New Acquisition Polygon" : `Polygon #${polygonId}`}</h1>
          <div className="text-[11px] text-muted-foreground">
            {contextLabel ? `SIG ${contextLabel}` : ""} · {corners.length} corners · geometry {validation.valid ? "valid" : "invalid"}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isNew && (
            <Link href={`/gis/map?polygon=${polygonId}`}><Button variant="outline" size="sm">View on Map</Button></Link>
          )}
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={updating}>
            {updating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isNew ? "Create Polygon" : "Save Corners"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-auto p-4">
        <div className="flex-1 space-y-4">
          {/* Metadata */}
          <section className="rounded-md border p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Polygon Metadata</h2>
            <div className="flex flex-wrap gap-3">
              <Field label="Identifier"><Input className="h-7 w-52 text-xs" value={meta.polygon_identifier} onChange={(e) => setMeta({ ...meta, polygon_identifier: e.target.value })} /></Field>
              <Field label="Name"><Input className="h-7 w-64 text-xs" value={meta.polygon_name} onChange={(e) => setMeta({ ...meta, polygon_name: e.target.value })} /></Field>
              <Field label="Colour"><input type="color" className="h-7 w-14 cursor-pointer rounded border" value={meta.polygon_colour} onChange={(e) => setMeta({ ...meta, polygon_colour: e.target.value })} /></Field>
              <Button size="sm" variant="outline" onClick={saveMut.mutate as any} disabled={updating}>Apply Metadata</Button>
            </div>
          </section>

          {/* Corner editor */}
          <section className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Corner Coordinates</h2>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => addCorner(setCorners)}><Plus className="h-3 w-3" /> Add Corner</Button>
                <Button size="sm" variant="outline" onClick={() => autoCloseCorners(setCorners)}>Auto-close</Button>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">#</th>
                  <th className="py-1 pr-2 font-medium">Longitude</th>
                  <th className="py-1 pr-2 font-medium">Latitude</th>
                  <th className="py-1 pr-2 font-medium">Easting</th>
                  <th className="py-1 pr-2 font-medium">Northing</th>
                  <th className="py-1 pr-2 font-medium">Elevation</th>
                  <th className="py-1 pr-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cornersSorted.map((c, i) => (
                  <tr key={c.id ?? `c-${i}`} className="border-b border-border/40">
                    <td className="py-1 pr-2 text-muted-foreground">{c.corner_order}</td>
                    <td className="py-1 pr-2"><NumInput value={c.longitude as number} onChange={(v) => updateCorner(setCorners, c, { longitude: v })} /></td>
                    <td className="py-1 pr-2"><NumInput value={c.latitude as number} onChange={(v) => updateCorner(setCorners, c, { latitude: v })} /></td>
                    <td className="py-1 pr-2"><NumInput value={c.easting as number} onChange={(v) => updateCorner(setCorners, c, { easting: v })} /></td>
                    <td className="py-1 pr-2"><NumInput value={c.northing as number} onChange={(v) => updateCorner(setCorners, c, { northing: v })} /></td>
                    <td className="py-1 pr-2"><NumInput value={c.elevation as number} onChange={(v) => updateCorner(setCorners, c, { elevation: v })} /></td>
                    <td className="py-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/60 hover:text-destructive" onClick={() => removeCorner(setCorners, c)} title="Remove corner">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!corners.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No corners yet. Add corners to define the polygon.</td></tr>}
              </tbody>
            </table>
          </section>
        </div>

        {/* Validation panel */}
        <aside className="w-72 shrink-0 space-y-3">
          <section className="rounded-md border p-3">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {validation.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
              Geometry Validation
            </h2>
            <dl className="space-y-1.5 text-xs">
              <Row label="Status" value={validation.valid ? "Valid polygon" : "Invalid"} />
              <Row label="Corners" value={String(corners.length)} />
              <Row label="Self-intersecting" value={validation.selfIntersecting ? "Yes" : "No"} />
              <Row label="Closed ring" value={validation.closed ? "Yes" : "No"} />
              <Row label="Area (approx km²)" value={formatNumber(validation.area)} />
              <Row label="Perimeter (km)" value={formatNumber(validation.perimeter)} />
            </dl>
            {saveResult && (
              <div className={`mt-2 rounded p-2 text-xs ${saveResult.status === "valid" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                Saved: status={saveResult.status}, area={formatArea(saveResult.area_m2)}, corners={saveResult.corner_count}
              </div>
            )}
          </section>

          {/* Preview via mini geometry list */}
          <section className="rounded-md border p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ordered Coordinates Preview</h2>
            <pre className="max-h-72 overflow-auto rounded bg-muted/40 p-2 font-mono text-[10px] leading-4 text-muted-foreground">
              {JSON.stringify(cornersSorted.map((c) => [c.longitude, c.latitude]), null, 0)}
            </pre>
          </section>
        </aside>
      </div>
    </div>
  )
}

function validatePolygon(corners: PolygonCorner[]) {
  const pts = corners.filter((c) => c.longitude != null && c.latitude != null) as { longitude: number; latitude: number }[]
  const area = shoelaceAreaKm2(corners)
  const perimeter = perimeterKm(corners)
  let selfIntersecting = false
  if (pts.length >= 4) {
    outer: for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a1: [number, number] = [pts[i].longitude, pts[i].latitude]
        const a2: [number, number] = [pts[(i + 1) % pts.length].longitude, pts[(i + 1) % pts.length].latitude]
        const b1: [number, number] = [pts[j].longitude, pts[j].latitude]
        const b2: [number, number] = [pts[(j + 1) % pts.length].longitude, pts[(j + 1) % pts.length].latitude]
        if (i !== j && Math.abs(i - j) % pts.length > 1 && segIntersect(a1, a2, b1, b2)) {
          selfIntersecting = true
          break outer
        }
      }
    }
  }
  return {
    valid: pts.length >= 3 && !selfIntersecting,
    selfIntersecting,
    closed: pts.length >= 3,
    area,
    perimeter,
  }
}

type CornerSetter = React.Dispatch<React.SetStateAction<PolygonCorner[]>>

function addCorner(setter: CornerSetter) {
  setter((prev) => [...prev, { corner_order: prev.length + 1, longitude: null, latitude: null }])
}
function removeCorner(setter: CornerSetter, corner: PolygonCorner) {
  setter((prev) => {
    const next = prev.filter((c) => c !== corner)
    return next.map((c, i) => ({ ...c, corner_order: i + 1 }))
  })
}
function updateCorner(setter: CornerSetter, corner: PolygonCorner, patch: Partial<PolygonCorner>) {
  setter((prev) => prev.map((c) => (c === corner ? { ...c, ...patch } : c)))
}
function autoCloseCorners(setter: CornerSetter) {
  setter((prev) => {
    if (!prev.length) return prev
    const first = prev[0]
    const last = prev[prev.length - 1]
    if (last.longitude === first.longitude && last.latitude === first.latitude) return prev
    return [...prev, { ...first, corner_order: prev.length + 1 }]
  })
}

// Haversine-based area (shoelace on lon/lat scaled) and perimeter
function shoelaceAreaKm2(corners: PolygonCorner[]) {
  const pts = corners.filter((c) => c.longitude != null && c.latitude != null) as { longitude: number; latitude: number }[]
  if (pts.length < 3) return 0
  const y = pts.map((p) => p.latitude)
  const lat0 = (Math.min(...y) + Math.max(...y)) / 2
  let sum = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    sum += pts[i].longitude * pts[j].latitude - pts[j].longitude * pts[i].latitude
  }
  return Math.abs(sum) / 2 * (111.32 * 111.32 * Math.cos(lat0 * Math.PI / 180))
}
function perimeterKm(corners: PolygonCorner[]) {
  const pts = corners.filter((c) => c.longitude != null && c.latitude != null) as { longitude: number; latitude: number }[]
  if (pts.length < 2) return 0
  let perim = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    perim += distKm([pts[i].longitude, pts[i].latitude], [pts[j].longitude, pts[j].latitude])
  }
  return perim
}
function distKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = (b[1] - a[1]) * Math.PI / 180
  const dLon = (b[0] - a[0]) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
function segIntersect(a1: [number, number], a2: [number, number], b1: [number, number], b2: [number, number]): boolean {
  const d = (p1: [number, number], p2: [number, number], p: [number, number]): number => {
    const x = p2[0] - p1[0], y = p2[1] - p1[1]
    return x * (p[1] - p1[1]) - y * (p[0] - p1[0])
  }
  const d1 = d(a1, a2, b1), d2 = d(a1, a2, b2), d3 = d(b1, b2, a1), d4 = d(b1, b2, a2)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

function NumInput({ value, onChange }: { value: number | null | undefined; onChange: (v: number | null) => void }) {
  return <Input className="h-6 w-full min-w-[64px] px-1 text-xs" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} inputMode="decimal" />
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}{children}</label>
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono font-medium">{value}</dd></div>
}
function formatNumber(v: number) {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
function formatArea(v: number | null) {
  if (v == null) return "—"
  return v > 10000 ? `${(v / 1_000_000).toFixed(2)} km²` : `${v.toFixed(0)} m²`
}
function formatPerim(v: number) {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}