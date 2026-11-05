"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GisNav } from "@/components/gis/GisNav"
import { gisPolygons, type AcquisitionPolygon } from "@/lib/gis"

const PAGE_SIZE = 30

export default function GisPolygonsPage() {
  const qc = useQueryClient()
  const search = useSearchParams()
  const sigParam = search.get("sig") ? Number(search.get("sig")) : undefined
  const projectParam = search.get("project") ? Number(search.get("project")) : undefined

  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState("")
  const [active, setActive] = useState("true")

  const query = useQuery({
    queryKey: ["gis-polygons", page, searchText, active, sigParam, projectParam],
    queryFn: () =>
      gisPolygons.list({
        page,
        pageSize: PAGE_SIZE,
        sigCodeId: sigParam,
        projectId: projectParam,
        active,
        search: searchText,
      }),
    placeholderData: (prev) => prev,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => gisPolygons.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gis-polygons"] }),
  })

  const data = query.data
  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)), [data])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <GisNav />
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1) }} placeholder="Search polygon / SIG…" className="h-8 w-64 pl-8" />
        </div>
        <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1) }} className="h-8 rounded-md border bg-background px-2 text-xs">
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
          <option value="">All</option>
        </select>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {data ? `${(data.page - 1) * PAGE_SIZE + 1}–${Math.min(data.page * PAGE_SIZE, data.total)} of ${data.total}` : "…"}
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">SIG</th>
              <th className="px-4 py-2 font-medium">Identifier</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Corners</th>
              <th className="px-4 py-2 font-medium">Dim</th>
              <th className="px-4 py-2 font-medium">Active</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((p: AcquisitionPolygon) => (
              <tr key={p.id} className="border-b hover:bg-accent/30">
                <td className="px-4 py-1.5 text-muted-foreground">{p.id}</td>
                <td className="px-4 py-1.5 font-mono text-xs">{p.sig_code ?? "—"}</td>
                <td className="px-4 py-1.5 font-medium">{p.polygon_identifier ?? "—"}</td>
                <td className="px-4 py-1.5">{p.polygon_name ?? "—"}</td>
                <td className="px-4 py-1.5 text-xs">{p.polygon_type ?? "—"}</td>
                <td className="px-4 py-1.5 text-xs">{p.corner_count ?? "—"}</td>
                <td className="px-4 py-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.survey_type === "2D" ? "bg-blue-500/15 text-blue-500" : "bg-orange-500/15 text-orange-500"}`}>
                    {p.survey_type ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-1.5 text-xs">{p.active ? "Yes" : "No"}</td>
                <td className="px-4 py-1.5">
                  <div className="flex items-center gap-1">
                    <Link href={`/gis/polygons/${p.id}`}><Button variant="outline" size="sm" className="h-6 px-2 text-[10px]">Edit</Button></Link>
                    <Link href={`/gis/map?polygon=${p.id}`}><Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">Map</Button></Link>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => { if (confirm(`Delete polygon #${p.id}?`)) deleteMut.mutate(p.id) }} title="Delete polygon">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.data.length && <tr><td colSpan={9} className="px-4 py-10 text-center text-xs text-muted-foreground">No acquisition polygons found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}