"use client"

import { useState } from "react"
import { Eye, EyeOff, Plus, Trash2, X, Check, PencilLine, Link2, Unlink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  INTERPRETATION_COLORS,
  type InterpretationRecord,
} from "@/lib/interpretations"

interface InterpretationPanelProps {
  interpretations: InterpretationRecord[]
  drawActive: boolean
  drawPoints: number
  color: string
  onColorChange: (c: string) => void
  onStartDraw: () => void
  onCancelDraw: () => void
  onFinishDraw: (name: string, color: string) => void
  onToggleVisible: (rec: InterpretationRecord, visible: boolean) => void
  onDelete: (rec: InterpretationRecord) => void
  onRename: (rec: InterpretationRecord, name: string) => void
  linkedInfo: { id: number; count: number } | null
  linkingId: number | null
  onLinkSurveys: (rec: InterpretationRecord) => void
  onUnlinkSurveys: () => void
}

export default function InterpretationPanel({
  interpretations,
  drawActive,
  drawPoints,
  color,
  onColorChange,
  onStartDraw,
  onCancelDraw,
  onFinishDraw,
  onToggleVisible,
  onDelete,
  onRename,
  linkedInfo,
  linkingId,
  onLinkSurveys,
  onUnlinkSurveys,
}: InterpretationPanelProps) {
  const [drawName, setDrawName] = useState("")
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState("")

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="rail-label text-xs font-semibold uppercase tracking-wider">
          Interpretation polygons
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {interpretations.length}
        </span>
      </div>

      {drawActive ? (
        <div className="space-y-2 border-b border-border bg-ochre/10 px-3 py-2">
          <p className="text-[0.68rem] leading-snug text-foreground/85">
            Click on the map to place vertices — {drawPoints} point{drawPoints === 1 ? "" : "s"}.
            {drawPoints >= 3 ? " Double-click or Finish to save." : ""} Esc cancels.
          </p>
          <input
            value={drawName}
            onChange={(e) => setDrawName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full border border-border bg-ink px-2 py-1 text-[0.72rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ochre"
            aria-label="Interpretation name"
          />
          <div className="flex items-center gap-1.5">
            {INTERPRETATION_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={cn(
                  "h-4 w-4 rounded-full border",
                  color === c ? "border-foreground ring-1 ring-offset-1 ring-foreground" : "border-border",
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onFinishDraw(drawName.trim(), color)}
              disabled={drawPoints < 3}
              className="flex flex-1 items-center justify-center gap-1 border border-ochre bg-ochre/15 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-3 w-3" /> Finish
            </button>
            <button
              onClick={onCancelDraw}
              className="flex flex-1 items-center justify-center gap-1 border border-border px-2 py-1 text-[0.7rem] uppercase tracking-wide text-muted-foreground transition-colors hover:border-rust hover:text-rust"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onStartDraw}
          className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-[0.72rem] font-medium text-foreground transition-colors hover:bg-ochre/10 hover:text-ochre"
        >
          <PencilLine className="h-3.5 w-3.5" />
          Draw polygon on map
        </button>
      )}

      <div className="max-h-44 overflow-y-auto">
        {interpretations.length === 0 && (
          <p className="px-3 py-3 text-[0.68rem] italic text-muted-foreground">
            No interpretation polygons yet.
          </p>
        )}
        {linkedInfo && (
          <div className="flex items-center gap-2 border-b border-ochre/40 bg-ochre/10 px-3 py-1.5 text-[0.68rem]">
            <span className="font-semibold text-ochre">
              {linkedInfo.count} survey{linkedInfo.count === 1 ? "" : "s"} intersect this polygon
            </span>
            <button
              onClick={onUnlinkSurveys}
              className="ml-auto flex items-center gap-1 text-muted-foreground transition-colors hover:text-rust"
              aria-label="Clear linked surveys"
            >
              <Unlink className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
        {interpretations.map((rec) => (
          <div
            key={rec.id}
            className="group flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-[0.72rem]"
          >
            <button
              onClick={() => (linkedInfo?.id === rec.id ? onUnlinkSurveys() : onLinkSurveys(rec))}
              className="shrink-0 text-muted-foreground transition-colors hover:text-ochre"
              title={linkedInfo?.id === rec.id ? "Clear linked surveys" : "Find surveys intersecting this polygon"}
              aria-label={linkedInfo?.id === rec.id ? `Unlink ${rec.name ?? rec.id}` : `Link ${rec.name ?? rec.id}`}
            >
              {linkingId === rec.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => onToggleVisible(rec, !rec.visible)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title={rec.visible ? "Hide" : "Show"}
              aria-label={rec.visible ? `Hide ${rec.name ?? rec.id}` : `Show ${rec.name ?? rec.id}`}
            >
              {rec.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <span className="h-3 w-3 shrink-0 rounded-sm border border-border" style={{ backgroundColor: rec.color }} />
            {renamingId === rec.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onRename(rec, renameValue.trim() || String(rec.id))
                    setRenamingId(null)
                  }
                  if (e.key === "Escape") setRenamingId(null)
                }}
                onBlur={() => {
                  onRename(rec, renameValue.trim() || String(rec.id))
                  setRenamingId(null)
                }}
                className="min-w-0 flex-1 border border-border bg-ink px-1 py-0.5 text-[0.72rem] outline-none focus:border-ochre"
                aria-label="Rename interpretation"
              />
            ) : (
              <button
                onClick={() => {
                  setRenamingId(rec.id)
                  setRenameValue(rec.name ?? rec.si_code ?? `Interpretation #${rec.id}`)
                }}
                className="min-w-0 flex-1 truncate text-left text-foreground transition-colors hover:text-ochre"
                title={rec.description ?? undefined}
                aria-label={`Rename ${rec.name ?? rec.id}`}
              >
                {rec.name ?? rec.si_code ?? `Interpretation #${rec.id}`}
              </button>
            )}
            {rec.si_code && (
              <span className="shrink-0 text-[0.6rem] text-muted-foreground">{rec.si_code}</span>
            )}
            <button
              onClick={() => onDelete(rec)}
              className="shrink-0 text-muted-foreground opacity-0 transition-all hover:text-rust group-hover:opacity-100"
              title="Delete"
              aria-label={`Delete ${rec.name ?? rec.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
