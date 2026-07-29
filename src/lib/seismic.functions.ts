import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RECORD_COLUMNS =
  "id,project_id,si_code,project_year,type_of_processing,quantum_skm,quantum_slkm,processing_bin,record_length,sampling_interval,fold,azimuth,spheroid,utm_zone,projection,project_timeline,centroid_lat,centroid_lon,bbox_min_lon,bbox_min_lat,bbox_max_lon,bbox_max_lat,corners,is_mapped,geometry_status,geometry_notes,flagged_for_review,projects(project_id,project_name,basin,project_type,data_dimension)";

const AUDIT_ACTIONS = [
  "PROJECT_VIEWED",
  "FILTER_APPLIED",
  "FILTER_CLEARED",
  "REPORT_EXPORTED",
  "MAP_TOOL_USED",
  "TIMELINE_PLAYED",
  "MAP_VIEWPORT_CHANGED",
  "DETAILS_OPENED",
] as const;

export const getSurveys = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("processing_records")
    .select(RECORD_COLUMNS)
    .order("project_year", { ascending: false })
    .order("project_id", { ascending: true });
  if (error) {
    console.error("[seismic] fetch surveys failed", error);
    throw new Error("Unable to load survey records");
  }
  return data ?? [];
});

export const getReports = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("project_reports")
    .select("id,project_id,si_code,report_type,file_name");
  if (error) {
    console.error("[seismic] fetch reports failed", error);
    throw new Error("Unable to load reports");
  }
  return (data ?? []).map((row) => ({ ...row, report_path: null as string | null }));
});

export const getAuditLogs = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ basin: z.string().trim().max(120).nullable().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("audit_logs")
      .select("id,action,project_id,si_code,basin,details,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (input.basin) query = query.eq("basin", input.basin);
    const { data, error } = await query;
    if (error) {
      console.error("[seismic] fetch audit logs failed", error);
      throw new Error("Unable to load audit trail");
    }
    return (data ?? []).map((row) => ({ ...row, user_session: null as string | null }));
  });

export const recordAudit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        action: z.enum(AUDIT_ACTIONS),
        user_session: z.string().trim().min(3).max(64),
        project_id: z.number().int().positive().nullable().optional(),
        si_code: z.string().trim().max(64).nullable().optional(),
        basin: z.string().trim().max(120).nullable().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const details = JSON.stringify(input.details ?? {});
    if (details.length > 3500) throw new Error("Audit payload too large");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      user_session: input.user_session,
      action: input.action,
      project_id: input.project_id ?? null,
      si_code: input.si_code ?? null,
      basin: input.basin ?? null,
      details: JSON.parse(details),
    });
    if (error) {
      console.error("[seismic] audit insert failed", error);
      throw new Error("Unable to record audit entry");
    }
    return { ok: true };
  });

/* ── Survey creation / import ───────────────────────────────────── */

const INDIA = { minLon: 68.1, maxLon: 97.42, minLat: 6.45, maxLat: 37.1 };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const draftSchema = z.object({
  project_name: z.string().trim().min(2).max(200),
  basin: z.string().trim().max(120).nullable().optional(),
  project_type: z.string().trim().max(120).nullable().optional(),
  data_dimension: z.string().trim().max(16).nullable().optional(),
  si_code: z.string().trim().max(64).nullable().optional(),
  project_year: z.string().trim().max(32).nullable().optional(),
  type_of_processing: z.string().trim().max(120).nullable().optional(),
  quantum_skm: z.number().finite().nullable().optional(),
  quantum_slkm: z.number().finite().nullable().optional(),
  processing_bin: z.string().trim().max(64).nullable().optional(),
  utm_zone: z.string().trim().max(32).nullable().optional(),
  min_lon: z.number().finite().nullable().optional(),
  min_lat: z.number().finite().nullable().optional(),
  max_lon: z.number().finite().nullable().optional(),
  max_lat: z.number().finite().nullable().optional(),
});

export type SurveyDraft = z.infer<typeof draftSchema>;

export const createSurveys = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ drafts: z.array(draftSchema).min(1).max(500) }).parse(input),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: last, error: lastErr } = await supabaseAdmin
      .from("projects")
      .select("project_id")
      .order("project_id", { ascending: false })
      .limit(1);
    if (lastErr) throw new Error("Unable to allocate project id");
    let nextId = (last?.[0]?.project_id ?? 0) + 1;

    type ProjectInsert = {
      project_id: number;
      project_name: string;
      basin: string | null;
      project_type: string | null;
      data_dimension: string | null;
    };
    const projects: ProjectInsert[] = [];
    const records: (Record<string, unknown> & { project_id: number; is_mapped: boolean })[] = [];

    for (const d of input.drafts) {
      const projectId = nextId++;
      projects.push({
        project_id: projectId,
        project_name: d.project_name,
        basin: d.basin || null,
        project_type: d.project_type || null,
        data_dimension: d.data_dimension || null,
      });

      const notes: string[] = [];
      let bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number } | null = null;
      if (
        d.min_lon != null && d.min_lat != null && d.max_lon != null && d.max_lat != null
      ) {
        const raw = {
          minLon: Math.min(d.min_lon, d.max_lon),
          maxLon: Math.max(d.min_lon, d.max_lon),
          minLat: Math.min(d.min_lat, d.max_lat),
          maxLat: Math.max(d.min_lat, d.max_lat),
        };
        bbox = {
          minLon: clamp(raw.minLon, INDIA.minLon, INDIA.maxLon),
          maxLon: clamp(raw.maxLon, INDIA.minLon, INDIA.maxLon),
          minLat: clamp(raw.minLat, INDIA.minLat, INDIA.maxLat),
          maxLat: clamp(raw.maxLat, INDIA.minLat, INDIA.maxLat),
        };
        if (
          bbox.minLon !== raw.minLon || bbox.maxLon !== raw.maxLon ||
          bbox.minLat !== raw.minLat || bbox.maxLat !== raw.maxLat
        ) {
          notes.push("Extent clipped to the Indian national boundary.");
        }
        notes.push("Footprint squared to an axis-aligned box.");
      }

      records.push({
        project_id: projectId,
        si_code: d.si_code || null,
        project_year: d.project_year || null,
        type_of_processing: d.type_of_processing || null,
        quantum_skm: d.quantum_skm ?? null,
        quantum_slkm: d.quantum_slkm ?? null,
        processing_bin: d.processing_bin || null,
        utm_zone: d.utm_zone || null,
        bbox_min_lon: bbox?.minLon ?? null,
        bbox_min_lat: bbox?.minLat ?? null,
        bbox_max_lon: bbox?.maxLon ?? null,
        bbox_max_lat: bbox?.maxLat ?? null,
        centroid_lon: bbox ? (bbox.minLon + bbox.maxLon) / 2 : null,
        centroid_lat: bbox ? (bbox.minLat + bbox.maxLat) / 2 : null,
        corners: bbox
          ? [
              { lon: bbox.minLon, lat: bbox.minLat, corner: 1, is_assumed: true },
              { lon: bbox.maxLon, lat: bbox.minLat, corner: 2, is_assumed: true },
              { lon: bbox.maxLon, lat: bbox.maxLat, corner: 3, is_assumed: true },
              { lon: bbox.minLon, lat: bbox.maxLat, corner: 4, is_assumed: true },
            ]
          : [],
        is_mapped: Boolean(bbox),
        geometry_status: bbox ? "BOXED" : "UNMAPPED",
        geometry_notes: notes,
        flagged_for_review: !bbox,
      });
    }

    const { error: pErr } = await supabaseAdmin.from("projects").insert(projects);
    if (pErr) {
      console.error("[seismic] project insert failed", pErr);
      throw new Error("Unable to save project");
    }
    const { error: rErr } = await supabaseAdmin.from("processing_records").insert(records as never);
    if (rErr) {
      console.error("[seismic] record insert failed", rErr);
      throw new Error("Unable to save survey records");
    }
    return { inserted: records.length, mapped: records.filter((r) => r.is_mapped).length };
  });
