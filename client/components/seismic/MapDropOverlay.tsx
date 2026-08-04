"use client"

import { AlertCircle, CheckCircle2, Loader2, MapPin, Upload, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { ImportStatus } from "@/lib/useShapefileImport"

interface MapDropOverlayProps {
  dragging: boolean
  importing: boolean
  status: ImportStatus | null
  onDismissStatus: () => void
}

export default function MapDropOverlay({ dragging, importing, status, onDismissStatus }: MapDropOverlayProps) {
  const showStatus = status != null && (status.done || status.error != null)

  if (!dragging && !importing && !showStatus) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {dragging && (
        <div className="absolute inset-3 rounded-lg border-2 border-dashed border-ochre/80 bg-ochre/5" />
      )}
      <div className="relative max-w-xs rounded-md border border-border bg-popover px-4 py-3 text-center shadow-lg">
        {importing ? (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-ochre" />
            <p className="mt-2 text-xs text-foreground">{status?.message ?? "Importing…"}</p>
            {status && !status.done && (
              <Progress value={status.progress ?? 0} className="mt-2 h-1.5" />
            )}
          </>
        ) : showStatus ? (
          <>
            {status!.error ? (
              <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
            ) : (
              <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
            )}
            <p className="mt-2 text-xs text-foreground">{status!.message}</p>
            {status!.error && <p className="mt-1 text-[0.7rem] text-destructive break-words">{status!.error}</p>}
            {status!.warnings?.map((w) => (
              <p key={w} className="mt-1 text-[0.7rem] text-amber-500 break-words">⚠ {w}</p>
            ))}
            <button
              onClick={onDismissStatus}
              className="pointer-events-auto mt-2 inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[0.7rem] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Dismiss
            </button>
          </>
        ) : dragging ? (
          <>
            <Upload className="mx-auto h-6 w-6 text-ochre" />
            <p className="mt-2 text-xs text-foreground">Drop shapefile to import on the map</p>
            <p className="mt-1 text-[0.7rem] text-muted-foreground">
              .shp + .shx + .dbf + .prj — will be reprojected to WGS84 automatically
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[0.7rem] text-seismic">
              <MapPin className="h-3 w-3" /> view will zoom to the imported layer
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}

