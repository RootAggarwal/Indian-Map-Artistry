import { api } from "./api"

export interface LayerStyle {
  color?: string
  opacity?: number
  outline_color?: string
  outline_width?: number
}

export interface Extent {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

export interface LayerRecord {
  id: number
  project_id: number | null
  name: string
  description: string
  geometry_type: string | null
  crs_original: string
  style: LayerStyle
  visible: boolean
  display_order: number
  feature_count: number
  extent: Extent | null
  created_at: string
  updated_at: string
}

export interface LayerCreateBody {
  name: string
  description?: string
  geometry_type?: string
  crs_original?: string
  style?: LayerStyle
  visible?: boolean
  display_order?: number
}

export interface LayerUpdateBody {
  name?: string
  description?: string
  style?: LayerStyle
  visible?: boolean
  display_order?: number
}

export async function fetchLayers(): Promise<LayerRecord[]> {
  return api.get<LayerRecord[]>("/layers")
}

export async function fetchLayer(id: number): Promise<LayerRecord> {
  return api.get<LayerRecord>(`/layers/${id}`)
}

export async function createLayer(body: LayerCreateBody): Promise<{ id: number; created_at: string }> {
  return api.post<{ id: number; created_at: string }>("/layers", body)
}

export async function updateLayer(id: number, body: LayerUpdateBody): Promise<{ ok: boolean }> {
  return api.put<{ ok: boolean }>(`/layers/${id}`, body)
}

export async function deleteLayer(id: number): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>(`/layers/${id}`)
}

export async function reorderLayers(items: { id: number; display_order: number }[]): Promise<{ ok: boolean }> {
  return api.put<{ ok: boolean }>("/layers/reorder/batch", items)
}

export async function insertFeatures(
  layerId: number,
  features: GeoJSON.Feature[],
): Promise<{ inserted: number; geometry_type: string; extent: Extent | null }> {
  return api.post(`/layers/${layerId}/features`, { features })
}

export async function fetchFeatures(layerId: number): Promise<GeoJSON.FeatureCollection> {
  return api.get<GeoJSON.FeatureCollection>(`/layers/${layerId}/features`)
}

const PALETTE = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#42d4f4", "#f032e6", "#bfef45", "#fabed4",
  "#469990", "#dcbeff", "#9a6324", "#800000", "#aaffc3",
  "#000075", "#a9a9a9", "#ffd8b1", "#e6beff", "#008080",
]

let paletteIndex = 0

export function nextColor(): string {
  const c = PALETTE[paletteIndex % PALETTE.length]
  paletteIndex++
  return c
}

export function resetPalette(): void {
  paletteIndex = 0
}
