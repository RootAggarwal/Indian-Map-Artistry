import { api } from "./api"

export interface InterpretationRecord {
  id: number
  si_code: string | null
  name: string | null
  description: string | null
  color: string
  opacity: number
  visible: boolean
  processing_type: string | null
  project_year: string | null
  geometry_geojson: { type: string; coordinates: unknown } | null
  properties: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface InterpretationCreateBody {
  si_code?: string | null
  name?: string | null
  description?: string | null
  color?: string
  opacity?: number
  visible?: boolean
  geometry: string | { type: string; coordinates: unknown }
}

export interface InterpretationUpdateBody {
  name?: string | null
  description?: string | null
  color?: string
  opacity?: number
  visible?: boolean
}

export const INTERPRETATION_COLORS = [
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
]

export async function fetchInterpretations(): Promise<InterpretationRecord[]> {
  return api.get<InterpretationRecord[]>("/interpretation")
}

export async function createInterpretations(
  bodies: InterpretationCreateBody[],
): Promise<{ inserted: number; ids: number[] }> {
  return api.post<{ inserted: number; ids: number[] }>("/interpretation", bodies)
}

export async function updateInterpretation(
  id: number,
  body: InterpretationUpdateBody,
): Promise<{ id: number }> {
  return api.patch<{ id: number }>(`/interpretation/${id}`, body)
}

export async function deleteInterpretation(id: number): Promise<{ deleted: number }> {
  return api.del<{ deleted: number }>(`/interpretation/${id}`)
}

export interface InterpretationSurveyLink {
  id: number
  project_name: string | null
  si_code: string | null
  project_year: string | null
  basin: string | null
  status: string | null
  processing_type: string | null
  footprint_geojson: { type: string; coordinates: unknown } | null
}

export async function fetchSurveysForInterpretation(
  id: number,
): Promise<{ id: number; surveys: InterpretationSurveyLink[] }> {
  return api.get<{ id: number; surveys: InterpretationSurveyLink[] }>(`/interpretation/${id}/surveys`)
}

export async function fetchInterpretationsForRecord(
  recordId: number,
): Promise<InterpretationRecord[]> {
  return api.get<InterpretationRecord[]>(`/surveys/${recordId}/interpretations`)
}
