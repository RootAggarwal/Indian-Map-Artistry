"use client"

import { useState, useCallback } from "react"
import { AlertTriangle, FileText, Printer, Pencil, X, Check } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import type { ReportRow, SurveyRecord, SurveyUpdate } from "@/lib/seismic"
import { updateSurvey } from "@/lib/seismic"

type Props = {
  rec: SurveyRecord | null
  reports: ReportRow[]
  onPrint: () => void
  onOpenDetails: () => void
}

function v(x: unknown) {
  if (x === null || x === undefined || x === "") return "—"
  return String(x)
}

type FieldDef = {
  key: string
  label: string
  type: "text" | "number" | "select"
  options?: string[]
  recordPath: "rec" | "project"
}

const FIELDS: FieldDef[] = [
  { key: "project_year", label: "Project Year", type: "text", recordPath: "rec" },
  { key: "si_code", label: "SI Code", type: "text", recordPath: "rec" },
  { key: "type_of_processing", label: "Project Type", type: "text", recordPath: "rec" },
  { key: "quantum_skm", label: "Planned Area (SKM)", type: "number", recordPath: "rec" },
  { key: "quantum_slkm", label: "Planned Area (SLKM)", type: "number", recordPath: "rec" },
  { key: "processing_bin", label: "Processing Bin", type: "text", recordPath: "rec" },
  { key: "record_length", label: "Record Length", type: "text", recordPath: "rec" },
  { key: "sampling_interval", label: "Sampling Interval", type: "text", recordPath: "rec" },
  { key: "fold", label: "Fold", type: "text", recordPath: "rec" },
  { key: "azimuth", label: "Azimuth", type: "text", recordPath: "rec" },
  { key: "spheroid", label: "Spheroid", type: "text", recordPath: "rec" },
  { key: "projection", label: "Projection", type: "text", recordPath: "rec" },
  { key: "project_timeline", label: "Timeline", type: "text", recordPath: "rec" },
  { key: "project_name", label: "Project Name", type: "text", recordPath: "project" },
  { key: "basin", label: "Basin", type: "text", recordPath: "project" },
  { key: "data_dimension", label: "Data Dimension", type: "select", options: ["2D", "3D", "4D"], recordPath: "project" },
]

function getFieldValue(rec: SurveyRecord | null, field: FieldDef): string {
  if (!rec) return "—"
  if (field.recordPath === "project") return v((rec.projects as any)?.[field.key])
  return v((rec as any)[field.key])
}

function SingleFieldEditor({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  if (field.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink border border-input rounded px-1.5 py-0.5 text-[0.72rem] text-foreground font-mono"
      >
        <option value="">—</option>
        {(field.options ?? []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    )
  }
  return (
    <input
      type={field.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-ink border border-input rounded px-1.5 py-0.5 text-[0.72rem] text-foreground font-mono"
    />
  )
}

export function EntityPanel({ rec, reports, onPrint, onOpenDetails }: Props) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const startEdit = useCallback(() => {
    if (!rec) return
    const d: Record<string, string> = {}
    for (const f of FIELDS) {
      d[f.key] = getFieldValue(rec, f)
      if (d[f.key] === "—") d[f.key] = ""
    }
    setDraft(d)
    setEditing(true)
  }, [rec])

  const cancelEdit = useCallback(() => {
    setEditing(false)
    setDraft({})
  }, [])

  const saveEdit = useCallback(async () => {
    if (!rec) return
    setSaving(true)
    try {
      const update: SurveyUpdate = {}
      for (const f of FIELDS) {
        const val = draft[f.key]
        if (val === "" || val === "—") {
          ;(update as any)[f.key] = null
        } else if (f.type === "number") {
          ;(update as any)[f.key] = Number(val)
        } else {
          ;(update as any)[f.key] = val
        }
      }
      await updateSurvey(rec.id, update)
      await queryClient.invalidateQueries({ queryKey: ["surveys"] })
      setEditing(false)
    } catch (err) {
      console.error("[entity] save failed", err)
    } finally {
      setSaving(false)
    }
  }, [rec, draft, queryClient])

  if (!rec) {
    return (
      <aside className="grid h-full place-items-center border-l border-border bg-surface p-6 text-center">
        <p className="rail-label">Select a footprint to load its dossier</p>
      </aside>
    )
  }

  const linked = reports.filter((r) => r.project_id === rec.project_id)

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border bg-surface">
      <header className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2 border-b border-border bg-ink px-4 py-3">
        <div className="min-w-0">
          <p className="rail-label">Entity / Details</p>
          <h2 className="slab mt-1 line-clamp-2 text-[0.95rem] leading-tight text-foreground">
            {rec.projects?.project_name}
          </h2>
        </div>
        {editing ? (
          <>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="grid h-8 w-8 shrink-0 place-items-center border border-seismic/60 text-seismic transition-colors hover:bg-seismic hover:text-primary-foreground disabled:opacity-40"
              title="Save changes"
              aria-label="Save changes"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEdit}
              className="grid h-8 w-8 shrink-0 place-items-center border border-muted-foreground/50 text-muted-foreground transition-colors hover:border-rust hover:text-rust"
              title="Cancel editing"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onPrint}
              className="grid h-8 w-8 shrink-0 place-items-center border border-ochre/50 text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground"
              title="Download dossier PDF"
              aria-label="Download dossier PDF"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={startEdit}
              className="grid h-8 w-8 shrink-0 place-items-center border border-seismic/50 text-seismic transition-colors hover:bg-seismic hover:text-primary-foreground"
              title="Edit metadata"
              aria-label="Edit metadata"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed">
          <tbody>
            {FIELDS.map((field, i) => (
              <tr
                key={field.key}
                className={`border-b border-border/70 ${i % 2 ? "bg-surface-2/40" : ""}`}
              >
                <th className="w-[48%] px-3 py-1.5 text-left align-top text-[0.7rem] font-medium text-muted-foreground">
                  {field.label}
                </th>
                <td className="data-cell px-3 py-1.5 align-top break-words" style={{ color: editing ? "var(--color-foreground)" : "var(--color-seismic)" }}>
                  {editing ? (
                    <SingleFieldEditor
                      field={field}
                      value={draft[field.key] ?? ""}
                      onChange={(v) => setDraft((prev) => ({ ...prev, [field.key]: v }))}
                    />
                  ) : (
                    getFieldValue(rec, field)
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-b border-border/70">
              <th className="px-3 py-1.5 text-left align-top text-[0.7rem] font-medium text-muted-foreground">
                Reports
              </th>
              <td className="px-3 py-1.5 align-top">
                {linked.length ? (
                  linked.map((r) => (
                    <span
                      key={r.id}
                      className="data-cell block break-all text-ochre underline decoration-dotted"
                      title={r.report_path ?? ""}
                    >
                      <FileText className="mr-1 inline h-3 w-3" />
                      {r.file_name}
                    </span>
                  ))
                ) : (
                  <span className="data-cell text-muted-foreground">No report on file</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {rec.geometry_notes?.length > 0 && (
          <div className="m-3 border border-rust/40 bg-rust/10 p-3">
            <p className="rail-label flex items-center gap-1.5 text-rust">
              <AlertTriangle className="h-3.5 w-3.5" /> Cartographic note
            </p>
            <ul className="mt-2 space-y-1.5">
              {rec.geometry_notes.map((n) => (
                <li key={n} className="text-[0.72rem] leading-snug text-foreground/85">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={onOpenDetails}
        className="hairline-top bg-ink px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground"
      >
        More details + audit trail
      </button>
    </aside>
  )
}
