DROP POLICY IF EXISTS "Public read projects" ON public.projects;
DROP POLICY IF EXISTS "Public read processing records" ON public.processing_records;
DROP POLICY IF EXISTS "Public read reports" ON public.project_reports;
DROP POLICY IF EXISTS "Public read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Append known dashboard actions to audit trail" ON public.audit_logs;

REVOKE ALL ON public.projects FROM anon, authenticated;
REVOKE ALL ON public.processing_records FROM anon, authenticated;
REVOKE ALL ON public.project_reports FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;

GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.processing_records TO service_role;
GRANT ALL ON public.project_reports TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO service_role;