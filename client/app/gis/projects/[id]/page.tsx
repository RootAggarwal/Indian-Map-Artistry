"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Map as MapIcon, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GisNav } from "@/components/gis/GisNav"
import { gisProjects, gisMergeVolumes, gisSigCodes, type MergeVolume, type SigCode } from "@/lib/gis"

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const qc = useQueryClient()

  const detail = useQuery({
    queryKey: ["gis-project", id],
    queryFn: () => gisProjects.get(id),
    enabled: Number.isFinite(id),
  })

  const [expandedSigs, setExpandedSigs] = useState<Set<number>>(new Set())
  const [addMerge, setAddMerge] = useState(false)
  const [mergeDraft, setMergeDraft] = useState({ merge_name: "", merge_code: "", colour: "#f97316" })
  const [addSig, setAddSig] = useState(false)
  const [sigDraft, setSigDraft] = useState<{ sig_code: string; survey_type: string }>({ sig_code: "", survey_type: "3D" })

  const project = detail.data?.project

  const createMerge = useMutation({
    mutationFn: (d: { merge_name: string; merge_code: string; colour: string }) =>
      gisMergeVolumes.create({ processing_project_id: id, ...d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gis-project", id] }); setAddMerge(false); setMergeDraft({ merge_name: "", merge_code: "", colour: "#f97316" }) },
  })
  const deleteMerge = useMutation({
    mutationFn: (mid: number) => gisMergeVolumes.remove(mid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gis-project", id] }),
  })
  const createSig = useMutation({
    mutationFn: (d: { sig_code: string; survey_type: string; merge_volume_id?: number | null }) =>
      gisSigCodes.create({ processing_project_id: id, sig_code: d.sig_code, survey_type: d.survey_type as "2D" | "3D", merge_volume_id: d.merge_volume_id ?? null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gis-project", id] }); setAddSig(false); setSigDraft({ sig_code: "", survey_type: "3D" }) },
  })
  const deleteSig = useMutation({
    mutationFn: (sid: number) => gisSigCodes.remove(sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gis-project", id] }),
  })

  // SIG → polygon map (from detail.data.polygons)
  const polyBySig = useMemo(() => {
    const m = new Map<number, any[]>()
    for (const p of detail.data?.polygons ?? []) {
      const arr = m.get(p.sig_code_id) ?? []
      arr.push(p)
      m.set(p.sig_code_id, arr)
    }
    return m
  }, [detail.data])

  if (detail.isLoading) return <Shell><div className="p-8 text-xs text-muted-foreground">Loading project…</div></Shell>
  if (detail.isError || !detail.data) return <Shell><div className="p-8 text-xs text-destructive">Failed to load project.</div></Shell>

  const { merge_volumes, sig_codes, footprints } = detail.data
  const unassigned = sig_codes.filter((s) => s.merge_volume_id == null)

  return (
    <Shell>
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Link href="/gis/projects"><Button variant="ghost" size="icon" className="h-7 w-7"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{project?.project_name}</h1>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{project?.processing_type || "—"}</span>
            <span>·</span><span>{project?.year || "—"}</span>
            <span>·</span><span>{project?.basin || "—"}</span>
            <span className={`rounded px-1 py-px text-[10px] font-semibold ${project?.data_dimension === "2D" ? "bg-blue-500/15 text-blue-500" : "bg-orange-500/15 text-orange-500"}`}>
              {project?.data_dimension ?? "—"}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/gis/map?project=${id}`}><Button variant="outline" size="sm"><MapIcon className="h-3.5 w-3.5" /> View on Map</Button></Link>
          <Link href={`/gis/polygons?project=${id}`}><Button variant="outline" size="sm"><Layers className="h-3.5 w-3.5" /> All Polygons</Button></Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="Merge Volumes" value={merge_volumes.length} />
          <Stat label="SIG Codes" value={sig_codes.length} />
          <Stat label="Polygons" value={detail.data.polygons.length} />
          <Stat label="Footprints (metadata)" value={footprints.length} />
        </div>

        {/* Merge Volumes */}
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Merge Volumes</h2>
            <Button size="sm" variant="outline" onClick={() => setAddMerge(true)}><Plus className="h-3 w-3" /> Add</Button>
          </div>
          {addMerge && (
            <div className="mb-2 flex items-end gap-2 rounded-md border bg-accent/30 p-2">
              <Field label="Name"><Input className="h-7 w-56 text-xs" value={mergeDraft.merge_name} onChange={(e) => setMergeDraft({ ...mergeDraft, merge_name: e.target.value })} /></Field>
              <Field label="Code"><Input className="h-7 w-32 text-xs" value={mergeDraft.merge_code} onChange={(e) => setMergeDraft({ ...mergeDraft, merge_code: e.target.value })} /></Field>
              <Field label="Colour"><input type="color" className="h-7 w-10 cursor-pointer rounded border" value={mergeDraft.colour} onChange={(e) => setMergeDraft({ ...mergeDraft, colour: e.target.value })} /></Field>
              <Button size="sm" disabled={!mergeDraft.merge_name || createMerge.isPending} onClick={() => createMerge.mutate(mergeDraft)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddMerge(false)}>Cancel</Button>
            </div>
          )}
          {merge_volumes.length === 0 && (
            <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
              Merge volume data arrives from the LAN server. All SIG codes are currently <b>Unassigned</b>.
            </div>
          )}
          {merge_volumes.map((mv: MergeVolume) => (
            <div key={mv.id} className="mb-1 flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="h-4 w-4 shrink-0 rounded-sm border" style={{ backgroundColor: mv.colour }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{mv.merge_name || "Unnamed merge"}{mv.merge_code ? <span className="ml-2 text-xs text-muted-foreground">{mv.merge_code}</span> : null}</div>
                {mv.description ? <div className="truncate text-xs text-muted-foreground">{mv.description}</div> : null}
              </div>
              <span className="text-xs text-muted-foreground">{mv.sig_count ?? 0} SIGs</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => deleteMerge.mutate(mv.id)} title="Delete merge volume">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </section>

        {/* SIG Codes */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SIG Codes ({sig_codes.length})</h2>
            <Button size="sm" variant="outline" onClick={() => setAddSig(true)}><Plus className="h-3 w-3" /> Add</Button>
          </div>
          {addSig && (
            <div className="mb-2 flex items-end gap-2 rounded-md border bg-accent/30 p-2">
              <Field label="SIG Code"><Input className="h-7 w-40 text-xs" value={sigDraft.sig_code} onChange={(e) => setSigDraft({ ...sigDraft, sig_code: e.target.value })} /></Field>
              <Field label="Type">
                <select className="h-7 rounded-md border bg-background px-2 text-xs" value={sigDraft.survey_type} onChange={(e) => setSigDraft({ ...sigDraft, survey_type: e.target.value })}>
                  <option value="3D">3D</option><option value="2D">2D</option>
                </select>
              </Field>
              <Button size="sm" disabled={!sigDraft.sig_code.trim() || createSig.isPending} onClick={() => createSig.mutate({ ...sigDraft, merge_volume_id: null })}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddSig(false)}>Cancel</Button>
            </div>
          )}

          <SigGroup
            title="Unassigned (Merge Volume Unknown)"
            sigs={unassigned}
            polyBySig={polyBySig}
            expanded={expandedSigs}
            onToggle={(sid) => toggle(expandedSigs, setExpandedSigs, sid)}
            onDelete={(sid) => deleteSig.mutate(sid)}
          />
          {merge_volumes.map((mv) => (
            <SigGroup
              key={mv.id}
              title={`${mv.merge_name || "Merge"} (${mv.merge_code || "no code"})`}
              colour={mv.colour}
              sigs={sig_codes.filter((s) => s.merge_volume_id === mv.id)}
              polyBySig={polyBySig}
              expanded={expandedSigs}
              onToggle={(sid) => toggle(expandedSigs, setExpandedSigs, sid)}
              onDelete={(sid) => deleteSig.mutate(sid)}
            />
          ))}
        </section>
      </div>
    </Shell>
  )
}

function SigGroup({ title, colour, sigs, polyBySig, expanded, onToggle, onDelete }: {
  title: string
  colour?: string
  sigs: SigCode[]
  polyBySig: Map<number, any[]>
  expanded: Set<number>
  onToggle: (sid: number) => void
  onDelete: (sid: number) => void
}) {
  if (!sigs.length) return null
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {colour ? <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colour }} /> : null}
        {title} ({sigs.length})
      </div>
      <div className="overflow-hidden rounded-md border">
        {sigs.map((s) => {
          const polys = polyBySig.get(s.id) ?? []
          const open = expanded.has(s.id)
          return (
            <div key={s.id} className="border-b last:border-b-0">
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/40">
                <button onClick={() => onToggle(s.id)} className="text-muted-foreground">
                  {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                <span className="font-mono text-xs font-semibold">{s.sig_code}</span>
                <span className={`rounded px-1 text-[10px] font-semibold ${s.survey_type === "2D" ? "bg-blue-500/15 text-blue-500" : "bg-orange-500/15 text-orange-500"}`}>
                  {s.survey_type ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">{polys.length} polygon{polys.length !== 1 ? "s" : ""}</span>
                <div className="ml-auto flex items-center gap-1">
                  <Link href={`/gis/polygons?sig=${s.id}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Manage SIG polygons"><Pencil className="h-3 w-3" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => { if (confirm(`Delete SIG ${s.sig_code}?`)) onDelete(s.id) }} title="Delete SIG">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {open && (
                <div className="bg-accent/20 px-6 py-2">
                  {polys.length === 0 ? (
                    <div className="py-2 text-xs text-muted-foreground">No acquisition polygons yet. <Link href={`/gis/polygons?sig=${s.id}`} className="text-primary hover:underline">Create one</Link>.</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead><tr className="text-left text-muted-foreground">
                        <th className="py-1 pr-2 font-medium">ID</th>
                        <th className="py-1 pr-2 font-medium">Identifier</th>
                        <th className="py-1 pr-2 font-medium">Type</th>
                        <th className="py-1 pr-2 font-medium">Corners</th>
                        <th className="py-1 pr-2 font-medium">Status</th>
                        <th className="py-1 font-medium">Action</th>
                      </tr></thead>
                      <tbody>
                        {polys.map((p) => (
                          <tr key={p.id} className="border-t border-border/40">
                            <td className="py-1 pr-2 text-muted-foreground">{p.id}</td>
                            <td className="py-1 pr-2 font-medium">{p.polygon_identifier ?? "—"}</td>
                            <td className="py-1 pr-2">{p.polygon_type ?? "—"}</td>
                            <td className="py-1 pr-2">{p.corner_count ?? "—"}</td>
                            <td className="py-1 pr-2">{p.active ? "Active" : "Inactive"}</td>
                            <td className="py-1"><Link href={`/gis/polygons/${p.id}`} className="text-primary hover:underline">Edit</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toggle(set: Set<number>, setter: (s: Set<number>) => void, id: number) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id); else next.add(id)
  setter(next)
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex h-screen flex-col bg-background text-foreground"><GisNav />{children}</div>
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-3 py-2 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}{children}</label>
}
