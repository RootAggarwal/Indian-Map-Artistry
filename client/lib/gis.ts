import { api } from "./api"

export interface ProcessingProject {
  id: number
  legacy_record_id?: number | null
  project_name: string
  processing_type?: string | null
  year?: string | null
  basin?: string | null
  summary?: string | null
  data_dimension?: string | null
  status: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface MergeVolume {
  id: number
  processing_project_id: number
  merge_name?: string | null
  merge_code?: string | null
  description?: string | null
  colour: string
  display_order: number
  future_server_reference?: string | null
  sig_count?: number
}

export interface SigCode {
  id: number
  processing_project_id: number
  merge_volume_id?: number | null
  sig_code: string
  survey_type?: "2D" | "3D" | null
  status: string
  future_server_reference?: string | null
  polygon_count?: number
}

export interface PolygonCorner {
  id?: number
  corner_order: number
  easting?: number | null
  northing?: number | null
  latitude?: number | null
  longitude?: number | null
  elevation?: number | null
  source?: string
  projection?: string | null
}

export interface AcquisitionPolygon {
  id: number
  sig_code_id: number
  polygon_identifier?: string | null
  polygon_name?: string | null
  polygon_colour?: string | null
  polygon_type?: string | null
  active: boolean
  properties?: Record<string, unknown>
  geometry?: GeoJSON.Geometry | null
  corner_count?: number
  sig_code?: string
  survey_type?: "2D" | "3D" | null
  corners?: PolygonCorner[]
  merge_volume_id?: number | null
  merge_code?: string | null
  merge_name?: string | null
  merge_colour?: string | null
}

export interface Paged<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export interface ProjectDetail {
  project: ProcessingProject
  footprints: Array<{ id: number; processing_box_id: string | null; source: string | null; geojson: string }>
  merge_volumes: MergeVolume[]
  sig_codes: Array<SigCode & { polygon_count?: number }>
  polygons: Array<AcquisitionPolygon & { corner_count?: number; geojson?: string | null }>
}

export interface ProjectDraft {
  project_name: string
  processing_type?: string | null
  year?: string | null
  basin?: string | null
  summary?: string | null
  data_dimension?: string | null
  status?: string
}

export interface MergeVolumeDraft {
  processing_project_id: number
  merge_name?: string | null
  merge_code?: string | null
  description?: string | null
  colour?: string
  display_order?: number
  future_server_reference?: string | null
}

export interface SigCodeDraft {
  processing_project_id: number
  merge_volume_id?: number | null
  sig_code: string
  survey_type?: "2D" | "3D" | null
  status?: string
}

export interface PolygonDraft {
  sig_code_id: number
  polygon_identifier?: string | null
  polygon_name?: string | null
  polygon_colour?: string | null
  polygon_type?: string | null
  active?: boolean
  corners?: PolygonCorner[]
}

export interface PolygonValidation {
  valid: boolean
  reason: string
  area_m2: number | null
  perimeter_m: number | null
  n_points: number
}

export interface MapFeature {
  type: "Feature"
  properties: {
    polygon_id: number
    polygon_identifier: string | null
    polygon_name: string | null
    polygon_colour: string | null
    active: boolean
    sig_code: string
    survey_type: "2D" | "3D" | null
    processing_project_id: number
    project_name: string
    merge_volume_id: number | null
    merge_code: string | null
    merge_name: string | null
    fill_colour: string
    corner_count: number
  }
  geometry: GeoJSON.Geometry
}

export interface MapCollection {
  type: "FeatureCollection"
  features: MapFeature[]
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

// ── Processing Projects ───────────────────────────────────────────
export const gisProjects = {
  list: (params: { page?: number; pageSize?: number; search?: string; basin?: string; year?: string; dimension?: string; status?: string; sortBy?: string; sortDir?: string }) =>
    api.get<Paged<ProcessingProject>>(`/gis/projects${qs({ ...params })}`),
  get: (id: number) => api.get<ProjectDetail>(`/gis/projects/${id}`),
  create: (draft: ProjectDraft) => api.post<{ id: number }>("/gis/projects", draft),
  update: (id: number, draft: Partial<ProjectDraft>) => api.put(`/gis/projects/${id}`, draft),
  remove: (id: number) => api.del(`/gis/projects/${id}`),
  mapData: (id: number) => api.get<MapCollection>(`/gis/projects/${id}/map`),
}

// ── Merge Volumes ─────────────────────────────────────────────────
export const gisMergeVolumes = {
  list: (params: { projectId?: number; search?: string; page?: number; pageSize?: number }) =>
    api.get<Paged<MergeVolume>>(`/gis/merge-volumes${qs({ ...params })}`),
  get: (id: number) => api.get<MergeVolume>(`/gis/merge-volumes/${id}`),
  create: (draft: MergeVolumeDraft) => api.post<{ id: number }>("/gis/merge-volumes", draft),
  update: (id: number, draft: Partial<MergeVolumeDraft>) => api.put(`/gis/merge-volumes/${id}`, draft),
  remove: (id: number) => api.del(`/gis/merge-volumes/${id}`),
}

// ── SIG Codes ─────────────────────────────────────────────────────
export const gisSigCodes = {
  list: (params: { projectId?: number; mergeVolumeId?: number; surveyType?: string; status?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<Paged<SigCode>>(`/gis/sig-codes${qs({ ...params })}`),
  get: (id: number) => api.get<SigCode>(`/gis/sig-codes/${id}`),
  create: (draft: SigCodeDraft) => api.post<{ id: number }>("/gis/sig-codes", draft),
  update: (id: number, draft: Partial<Omit<SigCodeDraft, "processing_project_id">>) =>
    api.put(`/gis/sig-codes/${id}`, draft),
  remove: (id: number) => api.del(`/gis/sig-codes/${id}`),
}

// ── Acquisition Polygons ──────────────────────────────────────────
export const gisPolygons = {
  list: (params: { sigCodeId?: number; projectId?: number; mergeVolumeId?: number; active?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<Paged<AcquisitionPolygon>>(`/gis/polygons${qs({ ...params })}`),
  get: (id: number) => api.get<AcquisitionPolygon>(`/gis/polygons/${id}`),
  create: (draft: PolygonDraft) => api.post<{ id: number }>("/gis/polygons", draft),
  update: (id: number, draft: Partial<Omit<PolygonDraft, "sig_code_id" | "corners">>) =>
    api.put(`/gis/polygons/${id}`, draft),
  remove: (id: number) => api.del(`/gis/polygons/${id}`),
  replaceCorners: (id: number, corners: PolygonCorner[]) =>
    api.post<{ ok: boolean; status: string; corner_count: number; area_m2: number | null; perimeter_m: number | null }>(
      `/gis/polygons/${id}/corners`,
      { corners },
    ),
  patchCorner: (polygonId: number, cornerId: number, patch: Partial<Omit<PolygonCorner, "id">>) =>
    api.patch(`/gis/polygons/${polygonId}/corners/${cornerId}`, patch),
  validate: (id: number) => api.get<PolygonValidation>(`/gis/polygons/${id}/validate`),
}

// ── Global Map (all active polygons) ──────────────────────────────
export const gisMap = () => api.get<MapCollection>("/gis/map")