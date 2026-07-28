import { supabase } from "@/integrations/supabase/client";

export type Corner = {
  lat: number | null;
  lon: number | null;
  il: number | null;
  xl: number | null;
  easting: number | null;
  northing: number | null;
  corner: number | null;
  is_assumed: boolean;
};

export type ProjectRow = {
  project_id: number;
  project_name: string;
  basin: string | null;
  project_type: string | null;
  data_dimension: string | null;
};

export type SurveyRecord = {
  id: number;
  project_id: number;
  si_code: string | null;
  project_year: string | null;
  type_of_processing: string | null;
  quantum_skm: number | null;
  quantum_slkm: number | null;
  processing_bin: string | null;
  record_length: string | null;
  sampling_interval: string | null;
  fold: string | null;
  azimuth: string | null;
  spheroid: string | null;
  utm_zone: string | null;
  projection: string | null;
  project_timeline: string | null;
  centroid_lat: number | null;
  centroid_lon: number | null;
  bbox_min_lon: number | null;
  bbox_min_lat: number | null;
  bbox_max_lon: number | null;
  bbox_max_lat: number | null;
  corners: Corner[];
  is_mapped: boolean;
  geometry_status: string | null;
  geometry_notes: string[];
  flagged_for_review: boolean;
  projects: ProjectRow | null;
};

export type ReportRow = {
  id: number;
  project_id: number;
  si_code: string | null;
  report_type: string | null;
  report_path: string | null;
  file_name: string | null;
};

export type AuditRow = {
  id: number;
  user_session: string | null;
  action: string;
  project_id: number | null;
  si_code: string | null;
  basin: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const RECORD_COLUMNS =
  "id,project_id,si_code,project_year,type_of_processing,quantum_skm,quantum_slkm,processing_bin,record_length,sampling_interval,fold,azimuth,spheroid,utm_zone,projection,project_timeline,centroid_lat,centroid_lon,bbox_min_lon,bbox_min_lat,bbox_max_lon,bbox_max_lat,corners,is_mapped,geometry_status,geometry_notes,flagged_for_review,projects(project_id,project_name,basin,project_type,data_dimension)";

export async function fetchSurveys(): Promise<SurveyRecord[]> {
  const { data, error } = await supabase
    .from("processing_records")
    .select(RECORD_COLUMNS)
    .order("project_year", { ascending: false })
    .order("project_id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SurveyRecord[];
}

export async function fetchReports(): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from("project_reports")
    .select("id,project_id,si_code,report_type,report_path,file_name");
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function fetchAuditLogs(basin?: string | null): Promise<AuditRow[]> {
  let query = supabase
    .from("audit_logs")
    .select("id,user_session,action,project_id,si_code,basin,details,created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (basin) query = query.eq("basin", basin);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

/* ── Audit trail writer ─────────────────────────────────────────── */

let sessionId: string | null = null;
function getSession() {
  if (sessionId) return sessionId;
  if (typeof window === "undefined") return "ssr-session";
  const stored = window.sessionStorage.getItem("geopic-session");
  sessionId = stored ?? `sess-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem("geopic-session", sessionId);
  return sessionId;
}

export type AuditAction =
  | "PROJECT_VIEWED"
  | "FILTER_APPLIED"
  | "FILTER_CLEARED"
  | "REPORT_EXPORTED"
  | "MAP_TOOL_USED"
  | "TIMELINE_PLAYED"
  | "MAP_VIEWPORT_CHANGED"
  | "DETAILS_OPENED";

export async function logAudit(
  action: AuditAction,
  payload: {
    project_id?: number | null;
    si_code?: string | null;
    basin?: string | null;
    details?: Record<string, unknown>;
  } = {},
) {
  try {
    await supabase.from("audit_logs").insert({
      user_session: getSession(),
      action,
      project_id: payload.project_id ?? null,
      si_code: payload.si_code ?? null,
      basin: payload.basin ?? null,
      details: payload.details ?? {},
    });
  } catch (err) {
    console.warn("audit log failed", err);
  }
}

/* ── Derived helpers ────────────────────────────────────────────── */

export function surveyLabel(rec: SurveyRecord) {
  return rec.projects?.project_name ?? `Project ${rec.project_id}`;
}

export function counts<T extends string>(values: (T | null | undefined)[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    const key = (value ?? "Unspecified").trim() || "Unspecified";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
