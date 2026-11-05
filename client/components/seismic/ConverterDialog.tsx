"use client"

import { useCallback, useRef, useState } from "react"
import {
  Upload,
  X,
  FileDown,
  Loader2,
  FileText,
  Check,
  AlertTriangle,
  MapPin,
} from "lucide-react"
import {
  parseFileToGeoJSON,
  convertToShapefileZip,
  triggerDownload,
  getGeometrySummary,
  detectFormat,
  type FileFormat,
} from "@/lib/converter"

type Props = {
  open: boolean
  onClose: () => void
}

type Status = "idle" | "parsing" | "ready" | "converting" | "done" | "error"

const FORMAT_LABELS: Record<FileFormat, string> = {
  geojson: "GeoJSON",
  csv: "CSV",
  xlsx: "Excel",
  kml: "KML",
  shapefile_zip: "Shapefile ZIP",
  unknown: "Unknown",
}

const ACCEPT = ".geojson,.json,.csv,.xlsx,.xls,.kml,.zip"

export function ConverterDialog({ open, onClose }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileFormat, setFileFormat] = useState<FileFormat>("unknown")
  const [summary, setSummary] = useState<{ types: Record<string, number>; count: number } | null>(null)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [sampleProps, setSampleProps] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStatus("idle")
    setGeojson(null)
    setFileName("")
    setFileFormat("unknown")
    setSummary(null)
    setError("")
    setSampleProps([])
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const processFile = useCallback(async (file: File) => {
    reset()
    setFileName(file.name)
    setFileFormat(detectFormat(file))
    setStatus("parsing")
    try {
      const fc = await parseFileToGeoJSON(file)
      setGeojson(fc)
      setSummary(getGeometrySummary(fc))
      const firstProps = new Set<string>()
      for (const f of fc.features.slice(0, 5)) {
        if (f.properties) {
          for (const k of Object.keys(f.properties)) firstProps.add(k)
        }
      }
      setSampleProps([...firstProps].slice(0, 10))
      setStatus("ready")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file")
      setStatus("error")
    }
  }, [reset])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      if (inputRef.current) inputRef.current.value = ""
    },
    [processFile]
  )

  const handleConvert = useCallback(async () => {
    if (!geojson) return
    setStatus("converting")
    try {
      const baseName = fileName.replace(/\.[^.]+$/, "")
      const blob = await convertToShapefileZip(geojson, baseName)
      triggerDownload(blob, `${baseName}_shapefile.zip`)
      setStatus("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed")
      setStatus("error")
    }
  }, [geojson, fileName])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col border border-border bg-surface shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-ink px-4 py-3">
          <div>
            <p className="rail-label">Converter</p>
            <h2 className="slab text-lg text-foreground">Dataset → Shapefile</h2>
          </div>
          <button
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:border-rust hover:text-rust"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {(status === "idle" || status === "error") && !geojson && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-3 border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragOver
                  ? "border-ochre bg-ochre/10"
                  : error
                    ? "border-rust/50 bg-rust/5"
                    : "border-border hover:border-ochre/50 hover:bg-ochre/5"
              }`}
            >
              {error ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-rust" />
                  <p className="text-sm text-rust">{error}</p>
                  <p className="text-xs text-muted-foreground">Click or drop a different file</p>
                </>
              ) : (
                <>
                  <Upload className={`h-8 w-8 ${dragOver ? "text-ochre" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop a dataset here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Supports GeoJSON, CSV, Excel, KML, Shapefile ZIP
                    </p>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {(status === "parsing") && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-ochre" />
              <p className="text-sm text-muted-foreground">Parsing {fileName}…</p>
            </div>
          )}

          {(status === "ready" || status === "converting" || status === "done") && geojson && summary && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded border border-border bg-ink px-3 py-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {FORMAT_LABELS[fileFormat]} → {summary.count} feature{summary.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="grid h-6 w-6 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-rust"
                  aria-label="Clear file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-border bg-ink px-3 py-2">
                  <p className="rail-label text-[0.65rem]">Features</p>
                  <p className="slab text-lg text-ochre">{summary.count}</p>
                </div>
                <div className="rounded border border-border bg-ink px-3 py-2">
                  <p className="rail-label text-[0.65rem]">Geometry types</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {Object.entries(summary.types).map(([t, n]) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                      >
                        <MapPin className="h-2.5 w-2.5" />
                        {t}: {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {sampleProps.length > 0 && (
                <div>
                  <p className="rail-label mb-1 text-[0.65rem]">Attributes</p>
                  <div className="flex flex-wrap gap-1">
                    {sampleProps.map((p) => (
                      <span
                        key={p}
                        className="border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {status === "done" && (
                <div className="flex items-center gap-2 rounded border border-green-500/30 bg-green-500/10 px-3 py-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  <p className="text-sm text-green-500">Download started — check your downloads folder</p>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-ink px-4 py-3">
          <p className="min-w-0 flex-1 text-[0.7rem] text-muted-foreground">
            {status === "converting" ? "Converting…" : status === "done" ? "Ready for another file" : status === "parsing" ? "Reading file…" : "Select a file to convert"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="border border-border px-3 py-1.5 text-[0.75rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
            <button
              disabled={!geojson || status === "converting" || status === "done"}
              onClick={handleConvert}
              className="flex items-center gap-1.5 border border-ochre/60 bg-ochre/10 px-3 py-1.5 text-[0.75rem] font-semibold text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "converting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Download Shapefile
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
