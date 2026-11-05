"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GisNav } from "@/components/gis/GisNav"
import { api } from "@/lib/api"

interface AuditEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  user_session: string | null
  details: Record<string, unknown>
  created_at: string
}

const PAGE_SIZE = 50

export default function GisAuditPage() {
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: ["gis-audit", page],
    queryFn: () =>
      api.get<{ data: AuditEntry[]; total: number; page: number }>(
        `/gis/audit?page=${page}&pageSize=${PAGE_SIZE}`,
      ),
  })
  const data = query.data
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <GisNav />
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold">GIS Audit History</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {data ? `Total ${data.total}` : "…"}
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Entity</th>
              <th className="px-4 py-2 font-medium">Entity ID</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Session</th>
              <th className="px-4 py-2 font-medium">Details</th>
              <th className="px-4 py-2 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((e) => (
              <tr key={e.id} className="border-b hover:bg-accent/30">
                <td className="px-4 py-1.5 text-muted-foreground">{e.id}</td>
                <td className="px-4 py-1.5 font-mono text-xs">{e.entity_type}</td>
                <td className="px-4 py-1.5 text-xs">{e.entity_id}</td>
                <td className="px-4 py-1.5"><span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold">{e.action}</span></td>
                <td className="px-4 py-1.5 text-xs">{e.user_session ?? "—"}</td>
                <td className="max-w-[360px] truncate px-4 py-1.5 font-mono text-[10px] text-muted-foreground">{JSON.stringify(e.details)}</td>
                <td className="px-4 py-1.5 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!data?.data.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">No audit entries.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}