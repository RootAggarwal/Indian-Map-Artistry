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
