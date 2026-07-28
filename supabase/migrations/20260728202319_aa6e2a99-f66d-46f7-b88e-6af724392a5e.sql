DROP POLICY "Anyone can append audit logs" ON public.audit_logs;

CREATE POLICY "Append known dashboard actions to audit trail"
ON public.audit_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  action IN (
    'PROJECT_VIEWED','FILTER_APPLIED','FILTER_CLEARED','REPORT_EXPORTED',
    'MAP_TOOL_USED','TIMELINE_PLAYED','MAP_VIEWPORT_CHANGED','DETAILS_OPENED'
  )
  AND user_session IS NOT NULL
  AND length(user_session) BETWEEN 3 AND 64
  AND (project_id IS NULL OR EXISTS (SELECT 1 FROM public.projects p WHERE p.project_id = audit_logs.project_id))
  AND pg_column_size(details) < 4000
);