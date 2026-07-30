CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.projects (
  project_id INT PRIMARY KEY,
  project_name TEXT NOT NULL,
  basin TEXT,
  project_type TEXT,
  data_dimension TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.processing_records (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  si_code TEXT,
  project_year TEXT,
  type_of_processing TEXT,
  quantum_skm NUMERIC,
  quantum_slkm NUMERIC,
  processing_bin TEXT,
  record_length TEXT,
  sampling_interval TEXT,
  fold TEXT,
  azimuth TEXT,
  spheroid TEXT,
  utm_zone TEXT,
  projection TEXT,
  project_timeline TEXT,
  g1_x NUMERIC, g1_y NUMERIC, g1_il NUMERIC, g1_xl NUMERIC,
  g2_x NUMERIC, g2_y NUMERIC, g2_il NUMERIC, g2_xl NUMERIC,
  g3_x NUMERIC, g3_y NUMERIC, g3_il NUMERIC, g3_xl NUMERIC,
  g4_x NUMERIC, g4_y NUMERIC, g4_il NUMERIC, g4_xl NUMERIC,
  centroid_lat NUMERIC, centroid_lon NUMERIC,
  bbox_min_lon NUMERIC, bbox_min_lat NUMERIC, bbox_max_lon NUMERIC, bbox_max_lat NUMERIC,
  corners JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_mapped BOOLEAN NOT NULL DEFAULT false,
  geometry_status TEXT,
  geometry_notes TEXT[] NOT NULL DEFAULT '{}',
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  footprint geometry(Polygon, 4326),
  centroid_geom geometry(Point, 4326)
);

CREATE INDEX IF NOT EXISTS idx_pr_footprint ON public.processing_records USING GIST (footprint);

CREATE TABLE IF NOT EXISTS public.project_reports (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  si_code TEXT,
  report_type TEXT,
  report_path TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_session TEXT,
  action TEXT NOT NULL,
  project_id INT,
  si_code TEXT,
  basin TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_basin ON public.projects(basin);
CREATE INDEX IF NOT EXISTS idx_pr_project_id ON public.processing_records(project_id);
CREATE INDEX IF NOT EXISTS idx_pr_year ON public.processing_records(project_year);
CREATE INDEX IF NOT EXISTS idx_reports_project ON public.project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_project ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_basin ON public.audit_logs(basin);
