-- New image integrity tables (old forensic tables are emptied by data cleanup and no longer used by the app).
CREATE TABLE public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL,
  name text NOT NULL,
  mime_type text,
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.images TO authenticated;
GRANT ALL ON public.images TO service_role;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view own images" ON public.images FOR SELECT TO authenticated USING (owner = auth.uid());
CREATE POLICY "Owner can add own images" ON public.images FOR INSERT TO authenticated WITH CHECK (owner = auth.uid());
CREATE POLICY "Owner can delete own images" ON public.images FOR DELETE TO authenticated USING (owner = auth.uid());

CREATE TABLE public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL,
  original_image_id uuid NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  original_name text NOT NULL,
  original_sha256 text NOT NULL,
  check_name text NOT NULL,
  check_mime_type text,
  check_file_size bigint NOT NULL DEFAULT 0,
  check_storage_path text NOT NULL,
  check_sha256 text NOT NULL,
  matched boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view own verifications" ON public.verifications FOR SELECT TO authenticated USING (owner = auth.uid());
CREATE POLICY "Owner can add own verifications" ON public.verifications FOR INSERT TO authenticated WITH CHECK (owner = auth.uid());
CREATE POLICY "Owner can delete own verifications" ON public.verifications FOR DELETE TO authenticated USING (owner = auth.uid());

CREATE INDEX images_owner_idx ON public.images (owner, created_at DESC);
CREATE INDEX verifications_owner_idx ON public.verifications (owner, created_at DESC);

COMMENT ON TABLE public.cases IS 'DEPRECATED: retired with forensic module, no longer used by the app';
COMMENT ON TABLE public.evidence IS 'DEPRECATED: retired with forensic module, no longer used by the app';
COMMENT ON TABLE public.custody_events IS 'DEPRECATED: retired with forensic module, no longer used by the app';
COMMENT ON TABLE public.audit_logs IS 'DEPRECATED: retired with forensic module, no longer used by the app';
COMMENT ON TABLE public.user_roles IS 'DEPRECATED: roles removed, app is single-purpose';
COMMENT ON TABLE public.profiles IS 'DEPRECATED: app uses auth user email only';