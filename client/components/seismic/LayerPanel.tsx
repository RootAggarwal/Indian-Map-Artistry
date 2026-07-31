"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GripVertical, Eye, EyeOff, Trash2, Pencil, Crosshair, ChevronUp, ChevronDown, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { LayerRecord, LayerStyle } from "@/lib/layers"

interface LayerPanelProps {
  layers: LayerRecord[]
  onToggleVisibility: (id: number) => void
  onRemove: (id: number) => void
  onRename: (id: number, name: string) => void
  onZoomTo: (id: number) => void
  onReorder: (id: number, direction: "up" | "down") => void
  onStyleChange: (id: number, style: LayerStyle) => void
}

export default function LayerPanel({
  layers,
  onToggleVisibility,
  onRemove,
  onRename,
  onZoomTo,
  onReorder,
  onStyleChange,
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [metaId, setMetaId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const startRename = useCallback((layer: LayerRecord) => {
    setEditingId(layer.id)
    setEditName(layer.name)
  }, [])

  const commitRename = useCallback(() => {
    if (editingId !== null && editName.trim()) {
      onRename(editingId, editName.trim())
    }
    setEditingId(null)
  }, [editingId, editName, onRename])

  if (!layers.length) {
    return (
      <div className="px-3 py-8 text-center text-xs text-muted-foreground">
        No layers loaded.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 px-1">
      {layers.map((layer, idx) => (
        <div
          key={layer.id}
          className="group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs hover:bg-accent/40 transition-colors"
        >
          <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/40 cursor-grab" />

          <button
            onClick={() => onToggleVisibility(layer.id)}
            className="shrink-0 p-0.5 rounded hover:bg-accent"
            title={layer.visible ? "Hide layer" : "Show layer"}
          >
            {layer.visible ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </button>

          <span
            className="inline-block w-3 h-3 shrink-0 rounded-sm border"
            style={{
              backgroundColor: layer.visible ? (layer.style?.color ?? "#888") : "transparent",
              borderColor: layer.style?.outline_color ?? "#666",
            }}
          />

          {editingId === layer.id ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename()
                if (e.key === "Escape") setEditingId(null)
              }}
              className="h-6 min-w-0 flex-1 px-1 py-0 text-xs"
            />
          ) : (
            <span
              className="flex-1 truncate cursor-pointer hover:text-foreground/80"
              onDoubleClick={() => startRename(layer)}
              title={`${layer.name} (${layer.feature_count} feature${layer.feature_count !== 1 ? "s" : ""})`}
            >
              {layer.name}
            </span>
          )}

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => startRename(layer)}
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => onZoomTo(layer.id)}
              title="Zoom to layer"
            >
              <Crosshair className="h-3 w-3" />
            </Button>
            <Popover open={metaId === layer.id} onOpenChange={(o) => setMetaId(o ? layer.id : null)}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5" title="Layer info">
                  <Info className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-64 text-xs">
                <LayerMetadata layer={layer} />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive/60 hover:text-destructive"
              onClick={() => onRemove(layer.id)}
              title="Remove layer"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onReorder(layer.id, "up")}
              disabled={idx === 0}
              className="h-2.5 w-4 flex items-center justify-center disabled:opacity-20 hover:text-foreground/80"
            >
              <ChevronUp className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={() => onReorder(layer.id, "down")}
              disabled={idx === layers.length - 1}
              className="h-2.5 w-4 flex items-center justify-center disabled:opacity-20 hover:text-foreground/80"
            >
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatExtent(ext: { xmin: number; ymin: number; xmax: number; ymax: number } | null): string {
  if (!ext) return "—"
  return `${ext.xmin.toFixed(4)}, ${ext.ymin.toFixed(4)} → ${ext.xmax.toFixed(4)}, ${ext.ymax.toFixed(4)}`
}

function LayerMetadata({ layer }: { layer: LayerRecord }) {
  return (
    <div className="space-y-1.5">
      <h4 className="font-semibold text-sm">{layer.name}</h4>
      <table className="w-full text-muted-foreground">
        <tbody>
          <tr><td className="pr-3 py-0.5">Type</td><td>{layer.geometry_type ?? "—"}</td></tr>
          <tr><td className="pr-3 py-0.5">Features</td><td>{layer.feature_count}</td></tr>
          <tr><td className="pr-3 py-0.5">Original CRS</td><td className="break-all">{layer.crs_original?.slice(0, 80) || "—"}</td></tr>
          <tr><td className="pr-3 py-0.5">Extent</td><td className="break-all">{formatExtent(layer.extent)}</td></tr>
          <tr><td className="pr-3 py-0.5">Order</td><td>{layer.display_order}</td></tr>
          <tr><td className="pr-3 py-0.5">Created</td><td>{new Date(layer.created_at).toLocaleString()}</td></tr>
        </tbody>
      </table>
    </div>
  )
}
