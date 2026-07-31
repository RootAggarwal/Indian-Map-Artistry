"use client"

import { useCallback, useRef, useState, type DragEvent } from "react"
import { Upload, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useShapefileImport } from "@/lib/useShapefileImport"

interface ShapefileUploaderProps {
  onLayerCreated?: (id: number) => void
}

export default function ShapefileUploader({ onLayerCreated }: ShapefileUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { importing, status, importFiles, dismissStatus } = useShapefileImport({
    onLayerCreated,
  })

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length) {
        void importFiles(e.dataTransfer.files)
      }
    },
    [importFiles],
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleFilePick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        void importFiles(e.target.files)
        e.target.value = ""
      }
    },
    [importFiles],
  )

  return (
    <div className="px-3 py-2 space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFilePick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-muted/20",
          importing && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".shp,.shx,.dbf,.prj,.cpg,.qmd"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />

        {importing ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
        )}
        <span className="text-xs text-muted-foreground text-center">
          {importing ? "Importing…" : "Drop shapefile files here or click to browse"}
        </span>
        <span className="text-[10px] text-muted-foreground/60 mt-0.5">
          .shp, .shx, .dbf, .prj — or drop the .shp directly on the map
        </span>
      </div>

      {status && (
        <div className="rounded-md border bg-muted/30 p-2 text-xs space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {status.error ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              ) : status.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              )}
              <span className="truncate">{status.message}</span>
            </div>
            {status.done && (
              <button onClick={dismissStatus} className="shrink-0 p-0.5 hover:bg-accent rounded">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {!status.done && (
            <Progress value={status.progress} className="h-1" />
          )}
          {status.error && (
            <p className="text-destructive/80 break-words">{status.error}</p>
          )}
          {status.warnings?.map((w) => (
            <p key={w} className="text-amber-500/90 break-words">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  )
}
