import { api } from "./api"

export type ExternalColumnInfo = {
  name: string
  dataType: string
  isNullable: boolean
  maxLength: number | null
}

export type ExternalTableInfo = {
  name: string
  rowCount: number
  columns: ExternalColumnInfo[]
}

export type ExternalStatus = {
  configured: boolean
  reachable: boolean
  dbName?: string
  dbVersion?: string
  error?: string
  tables: ExternalTableInfo[]
}

export type ExternalPreviewItem = {
  mapped: Record<string, unknown>
  key: string | null
  rawSample: Record<string, unknown>
}

export type ExternalMapping = {
  columnMap?: Record<string, string>
  keyField?: string
  geometryColumn?: string | null
}

export type ExternalExtractResult = {
  inserted: number
  updated: number
  skipped: number
  project_ids: number[]
}

export function fetchExternalStatus(): Promise<ExternalStatus> {
  return api.get<ExternalStatus>("/external/status")
}

export function previewExternalTable(
  table: string,
  mapping?: ExternalMapping,
  limit?: number,
): Promise<{ count: number; keyField: string; preview: ExternalPreviewItem[] }> {
  return api.post("/external/preview", { table, mapping, limit })
}

export function extractFromExternal(
  table: string,
  mapping?: ExternalMapping,
  limit?: number,
): Promise<ExternalExtractResult> {
  return api.post("/external/extract", { table, mapping, limit })
}
