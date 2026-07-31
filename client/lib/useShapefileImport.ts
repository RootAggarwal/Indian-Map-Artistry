"use client"

import { useCallback, useRef, useState } from "react"
import { parseShapefile, validateShapefileFiles } from "@/lib/shapefile"
import { createLayer, insertFeatures, nextColor } from "@/lib/layers"

export interface ImportStatus {
  progress: number
  message: string
  error?: string
  warnings?: string[]
  done?: boolean
}

interface UseShapefileImportOptions {
  onLayerCreated?: (id: number) => void
}

const NAME_KEYS = ["name", "layer", "layer_name", "layername", "layer_id", "area", "basin", "well"]

function pickLayerName(features: GeoJSON.Feature[], fileName: string): string {
  const props = features[0]?.properties
  if (props && typeof props === "object") {
    const keys = Object.keys(props)
    for (const want of NAME_KEYS) {
      const key = keys.find((k) => k.toLowerCase() === want)
      if (key && typeof props[key] === "string" && String(props[key]).trim()) {
        return String(props[key]).trim().slice(0, 80)
      }
    }
  }
  return fileName.replace(/\.shp$/i, "") || `Layer ${Date.now()}`
}

export function useShapefileImport({ onLayerCreated }: UseShapefileImportOptions = {}) {
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<ImportStatus | null>(null)
  const nonceRef = useRef(0)

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files)
      if (!fileArr.length) return

      const nonce = ++nonceRef.current

      const { errors, warnings } = validateShapefileFiles(fileArr)
      if (errors.length) {
        setStatus({ progress: 0, message: "Validation failed", error: errors.join("; "), done: false, warnings })
        return
      }

      setUploading(true)
      setStatus({ progress: 10, message: "Parsing shapefile…", warnings })

      try {
        const result = await parseShapefile(fileArr)

        if (nonce !== nonceRef.current) return
        if (!result.features.length) throw new Error("No features found")

        setStatus({ progress: 40, message: `Parsed ${result.featureCount} feature(s) as ${result.geometryType}`, warnings })

        const shpFile = fileArr.find((f) => f.name.endsWith(".shp"))
        const name = pickLayerName(result.features, shpFile?.name ?? "")
        const color = nextColor()

        setStatus({ progress: 50, message: "Creating layer…", warnings })

        const layerRes = await createLayer({
          name,
          description: "",
          geometry_type: result.geometryType,
          crs_original: result.crsOriginal?.slice(0, 200) || "",
          style: {
            color,
            opacity: 0.6,
            outline_color: "#000",
            outline_width: 1,
          },
        })

        setStatus({ progress: 65, message: "Importing features…", warnings })

        const importRes = await insertFeatures(layerRes.id, result.features)

        if (nonce !== nonceRef.current) return

        setStatus({
          progress: 100,
          message: `Imported ${importRes.inserted} feature(s)`,
          done: true,
          warnings,
        })

        onLayerCreated?.(layerRes.id)
      } catch (err) {
        if (nonce !== nonceRef.current) return
        setStatus({
          progress: 0,
          message: "Import failed",
          error: (err as Error).message,
          done: true,
          warnings,
        })
      } finally {
        setUploading(false)
      }
    },
    [onLayerCreated],
  )

  const dismissStatus = useCallback(() => setStatus(null), [])

  return { importing: uploading, status, importFiles, dismissStatus }
}
