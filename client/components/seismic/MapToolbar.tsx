"use client"

import { useState } from "react"
import { Layers, Eye, EyeOff, Grid3X3, Map, Satellite, Sun, Moon, ChevronDown, ChevronRight } from "lucide-react"
import type { ViewMode, BaseMapStyle } from "./types"

type Props = {
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  baseStyle: BaseMapStyle
  onBaseStyleChange: (v: BaseMapStyle) => void
}

export function MapToolbar({ viewMode, onViewModeChange, baseStyle, onBaseStyleChange }: Props) {
  const [layerOpen, setLayerOpen] = useState(false)

  const styles: { id: BaseMapStyle; label: string; icon: typeof Sun }[] = [
    { id: "satellite", label: "Satellite", icon: Satellite },
    { id: "osm", label: "OSM", icon: Map },
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ]

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col gap-2">
      <div className="pointer-events-auto flex flex-col gap-1 rounded border border-border bg-surface/95 p-1.5 shadow-lg backdrop-blur">
        {styles.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => onBaseStyleChange(s.id)}
              className={`grid h-8 w-8 place-items-center rounded text-xs transition-colors ${
                baseStyle === s.id
                  ? "bg-ochre/20 text-ochre"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
              title={s.label}
              aria-label={s.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>

      <div className="pointer-events-auto rounded border border-border bg-surface/95 shadow-lg backdrop-blur">
        <button
          onClick={() => setLayerOpen(!layerOpen)}
          className="flex w-full items-center gap-2 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5" />
          Layers
          {layerOpen ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
        </button>
        {layerOpen && (
          <div className="border-t border-border px-3 py-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={viewMode === "3d"}
                onChange={() => onViewModeChange(viewMode === "3d" ? "2d" : "3d")}
                className="accent-ochre"
              />
              <span className="text-[0.7rem] text-foreground flex items-center gap-1.5">
                <Grid3X3 className="h-3 w-3" />
                Survey Blocks (3D)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={viewMode === "2d"}
                onChange={() => onViewModeChange(viewMode === "2d" ? "3d" : "2d")}
                className="accent-ochre"
              />
              <span className="text-[0.7rem] text-foreground flex items-center gap-1.5">
                <Eye className="h-3 w-3" />
                Seismic Lines (2D)
              </span>
            </label>
            <div className="pt-1 text-[0.6rem] text-muted-foreground italic">
              Future: Interpretation polygons, Well data, Culture layers
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
