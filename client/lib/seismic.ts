import { api } from "./api"

export type Corner = {
  lat: number | null
  lon: number | null
  il: number | null
  xl: number | null
  easting: number | null
  northing: number | null
  corner: number | null
  is_assumed: boolean
}

export type ProjectRow = {
  project_id: number
  project_name: string
  basin: string | null
  project_type: string | null
  data_dimension: string | null
}

export type SurveyRecord = {
  id: number
  project_id: number
  si_code: string | null
  project_year: string | null
  type_of_processing: string | null
  quantum_skm: number | null
  quantum_slkm: number | null
  processing_bin: string | null
  record_length: string | null
  sampling_interval: string | null
  fold: string | null
  azimuth: string | null
  spheroid: string | null
  utm_zone: string | null
  projection: string | null
  project_timeline: string | null
  centroid_lat: number | null
  centroid_lon: number | null
  bbox_min_lon: number | null
  bbox_min_lat: number | null
  bbox_max_lon: number | null
  bbox_max_lat: number | null
  corners: Corner[]
  is_mapped: boolean
  geometry_status: string | null
  geometry_notes: string[]
  flagged_for_review: boolean
  projects: ProjectRow | null
  footprint_geojson: string | null
  centroid_geojson: string | null
  g1_x: number | null
  g1_y: number | null
  g1_il: number | null
  g1_xl: number | null
  g2_x: number | null
  g2_y: number | null
  g2_il: number | null
  g2_xl: number | null
  g3_x: number | null
  g3_y: number | null
  g3_il: number | null
  g3_xl: number | null
  g4_x: number | null
  g4_y: number | null
  g4_il: number | null
  g4_xl: number | null
}

export type ReportRow = {
  id: number
  project_id: number
  si_code: string | null
  report_type: string | null
  report_path: string | null
  file_name: string | null
}

export type AuditRow = {
  id: number
  user_session: string | null
  action: string
  project_id: number | null
  si_code: string | null
  basin: string | null
  details: Record<string, unknown>
  created_at: string
}

export type SurveyDraft = {
  project_name: string
  basin?: string | null
  project_type?: string | null
  data_dimension?: string | null
  si_code?: string | null
  project_year?: string | null
  type_of_processing?: string | null
  quantum_skm?: number | null
  quantum_slkm?: number | null
  processing_bin?: string | null
  utm_zone?: string | null
  min_lon?: number | null
  min_lat?: number | null
  max_lon?: number | null
  max_lat?: number | null
  g1_x?: number | null
  g1_y?: number | null
  g1_il?: number | null
  g1_xl?: number | null
  g2_x?: number | null
  g2_y?: number | null
  g2_il?: number | null
  g2_xl?: number | null
  g3_x?: number | null
  g3_y?: number | null
  g3_il?: number | null
  g3_xl?: number | null
  g4_x?: number | null
  g4_y?: number | null
  g4_il?: number | null
  g4_xl?: number | null
  record_length?: string | null
  sampling_interval?: string | null
  fold?: string | null
  azimuth?: string | null
  spheroid?: string | null
  projection?: string | null
  project_timeline?: string | null
}

export async function fetchSurveys(): Promise<SurveyRecord[]> {
  return api.get<SurveyRecord[]>("/surveys")
}

export async function fetchReports(): Promise<ReportRow[]> {
  return api.get<ReportRow[]>("/reports")
}

export async function fetchAuditLogs(basin?: string | null): Promise<AuditRow[]> {
  const params = basin ? `?basin=${encodeURIComponent(basin)}` : ""
  return api.get<AuditRow[]>(`/audit-logs${params}`)
}

export async function saveSurveys(
  drafts: SurveyDraft[],
): Promise<{ inserted: number; mapped: number; project_ids: number[] }> {
  return api.post("/surveys", { drafts })
}

export async function rollbackSurveys(projectIds: number[]): Promise<{ removed: number }> {
  return api.del("/surveys/rollback", projectIds)
}

export async function deleteSurvey(id: number): Promise<{ removed: number }> {
  return api.del(`/surveys/${id}`)
}

export async function clearAllSurveys(): Promise<{ removed: number }> {
  return api.del("/surveys")
}

export type SurveyUpdate = {
  si_code?: string | null
  project_year?: string | null
  type_of_processing?: string | null
  quantum_skm?: number | null
  quantum_slkm?: number | null
  processing_bin?: string | null
  utm_zone?: string | null
  record_length?: string | null
  sampling_interval?: string | null
  fold?: string | null
  azimuth?: string | null
  spheroid?: string | null
  projection?: string | null
  project_timeline?: string | null
  project_name?: string
  basin?: string | null
  project_type?: string | null
  data_dimension?: string | null
  corners?: Corner[]
  g1_x?: number | null
  g1_y?: number | null
  g1_il?: number | null
  g1_xl?: number | null
  g2_x?: number | null
  g2_y?: number | null
  g2_il?: number | null
  g2_xl?: number | null
  g3_x?: number | null
  g3_y?: number | null
  g3_il?: number | null
  g3_xl?: number | null
  g4_x?: number | null
  g4_y?: number | null
  g4_il?: number | null
  g4_xl?: number | null
  geometry_status?: string | null
  geometry_notes?: string[]
  flagged_for_review?: boolean
}

export async function updateSurvey(id: number, data: SurveyUpdate): Promise<{ updated: number }> {
  return api.put(`/surveys/${id}`, data)
}

export async function reprocessSurveys(): Promise<{ reprocessed: number; errors: number }> {
  return api.post("/surveys/reprocess", {})
}

export type AuditAction =
  | "PROJECT_VIEWED"
  | "FILTER_APPLIED"
  | "FILTER_CLEARED"
  | "REPORT_EXPORTED"
  | "MAP_TOOL_USED"
  | "TIMELINE_PLAYED"
  | "MAP_VIEWPORT_CHANGED"
  | "DETAILS_OPENED"

let sessionId: string | null = null

function getSession(): string {
  if (sessionId) return sessionId
  if (typeof window === "undefined") return "ssr-session"
  const stored = window.sessionStorage.getItem("geopic-session")
  sessionId = stored ?? `sess-${Math.random().toString(36).slice(2, 10)}`
  window.sessionStorage.setItem("geopic-session", sessionId)
  return sessionId
}

export async function logAudit(
  action: AuditAction,
  payload: {
    project_id?: number | null
    si_code?: string | null
    basin?: string | null
    details?: Record<string, unknown>
  } = {},
) {
  try {
    await api.post("/audit-logs", {
      user_session: getSession(),
      action,
      project_id: payload.project_id ?? null,
      si_code: payload.si_code ?? null,
      basin: payload.basin ?? null,
      details: payload.details ?? {},
    })
  } catch (err) {
    console.warn("audit log failed", err)
  }
}

export function surveyLabel(rec: SurveyRecord) {
  return rec.projects?.project_name ?? `Project ${rec.project_id}`
}

export function counts<T extends string>(values: (T | null | undefined)[]) {
  const map = new Map<string, number>()
  for (const value of values) {
    const key = (value ?? "Unspecified").trim() || "Unspecified"
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
