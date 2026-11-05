"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Search, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GisNav } from "@/components/gis/GisNav"
import { gisProjects, type ProcessingProject, type ProjectDraft } from "@/lib/gis"

const PAGE_SIZE = 20

export default function GisProjectsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [dimension, setDimension] = useState("")
  const [sortBy, setSortBy] = useState("id")
  const [sortDir, setSortDir] = useState("ASC")
  const [showCreate, setShowCreate] = useState(false)
  const [draft, setDraft] = useState<ProjectDraft>({ project_name: "" })

  const query = useQuery({
    queryKey: ["gis-projects", page, search, dimension, sortBy, sortDir],
    queryFn: () =>
      gisProjects.list({ page, pageSize: PAGE_SIZE, search, dimension, sortBy, sortDir }),
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({
    mutationFn: (d: ProjectDraft) => gisProjects.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gis-projects"] })
      setShowCreate(false)
      setDraft({ project_name: "" })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => gisProjects.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gis-projects"] }),
  })

  const data = query.data
  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)), [data])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <GisNav />
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search projects…"
            className="h-8 w-64 pl-8"
          />
        </div>
        <select
          value={dimension}
          onChange={(e) => { setDimension(e.target.value); setPage(1) }}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">All dimensions</option>
          <option value="2D">2D</option>
          <option value="3D">3D</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="id">Sort: ID</option>
          <option value="project_name">Sort: Name</option>
          <option value="year">Sort: Year</option>
          <option value="basin">Sort: Basin</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === "ASC" ? "DESC" : "ASC")}>
          {sortDir}
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {data ? `${(data.page - 1) * PAGE_SIZE + 1}–${Math.min(data.page * PAGE_SIZE, data.total)} of ${data.total}` : "…"}
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> New Project
        </Button>
      </div>

      {showCreate && (
        <div className="border-b bg-accent/30 px-4 py-3">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Project Name">
              <Input className="h-8 w-80" value={draft.project_name} onChange={(e) => setDraft({ ...draft, project_name: e.target.value })} />
            </Field>
            <Field label="Processing Type">
              <Input className="h-8 w-56" value={draft.processing_type ?? ""} onChange={(e) => setDraft({ ...draft, processing_type: e.target.value })} />
            </Field>
            <Field label="Year">
              <Input className="h-8 w-28" value={draft.year ?? ""} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
            </Field>
            <Field label="Basin">
              <Input className="h-8 w-40" value={draft.basin ?? ""} onChange={(e) => setDraft({ ...draft, basin: e.target.value })} />
            </Field>
            <Field label="Dimension">
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={draft.data_dimension ?? ""}
                onChange={(e) => setDraft({ ...draft, data_dimension: e.target.value || null })}
              >
                <option value="">—</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
              </select>
            </Field>
            <Button size="sm" onClick={() => createMut.mutate(draft)} disabled={!draft.project_name.trim() || createMut.isPending}>
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Project Name</th>
              <th className="px-4 py-2 font-medium">Processing Type</th>
              <th className="px-4 py-2 font-medium">Year</th>
              <th className="px-4 py-2 font-medium">Basin</th>
              <th className="px-4 py-2 font-medium">Dim</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((p: ProcessingProject) => (
              <tr key={p.id} className="border-b hover:bg-accent/30">
                <td className="px-4 py-1.5 text-muted-foreground">{p.id}</td>
                <td className="px-4 py-1.5">
                  <Link href={`/gis/projects/${p.id}`} className="font-medium text-foreground hover:underline">
                    {p.project_name}
                  </Link>
                </td>
                <td className="px-4 py-1.5 text-xs">{p.processing_type ?? "—"}</td>
                <td className="px-4 py-1.5 text-xs">{p.year ?? "—"}</td>
                <td className="px-4 py-1.5 text-xs">{p.basin || "—"}</td>
                <td className="px-4 py-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.data_dimension === "2D" ? "bg-blue-500/15 text-blue-500" : "bg-orange-500/15 text-orange-500"}`}>
                    {p.data_dimension ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-1.5 text-xs">{p.status}</td>
                <td className="px-4 py-1.5 text-xs text-muted-foreground">
                  {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive/60 hover:text-destructive"
                    onClick={() => { if (confirm(`Delete project ${p.project_name}? This cascades to all SIG codes & polygons.`)) deleteMut.mutate(p.id) }}
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {!data?.data.length && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-xs text-muted-foreground">No processing projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
      {children}
    </label>
  )
}
