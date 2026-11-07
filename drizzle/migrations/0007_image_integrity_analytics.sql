-- Add metadata and authenticated, owner-scoped version and duplicate records.
ALTER TABLE public.images
  ADD COLUMN width integer,
  ADD COLUMN height integer;

ALTER TABLE public.verifications
  ADD COLUMN visual_similarity numeric(5,2),
  ADD COLUMN difference_percent numeric(5,2),
  ADD COLUMN analysis_summary text,
  ADD COLUMN original_width integer,
  ADD COLUMN original_height integer,
  ADD COLUMN check_width integer,
  ADD COLUMN check_height integer;

-- Ensure a caller can only create a check against an original they own.
DROP POLICY IF EXISTS "Owner can add own verifications" ON public.verifications;
CREATE POLICY "Owner can add verifications for own images" ON public.verifications
  FOR INSERT TO authenticated WITH CHECK (
    owner = auth.uid() AND EXISTS (
      SELECT 1 FROM public.images WHERE id = original_image_id AND owner = auth.uid()
    )
  );

CREATE TABLE public.image_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL,
  original_image_id uuid NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number >= 2),
  name text NOT NULL,
  mime_type text,
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  sha256 text NOT NULL,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (original_image_id, version_number)
);
GRANT SELECT, INSERT, DELETE ON public.image_versions TO authenticated;
GRANT ALL ON public.image_versions TO service_role;
ALTER TABLE public.image_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view own image versions" ON public.image_versions FOR SELECT TO authenticated USING (owner = auth.uid());
CREATE POLICY "Owner can add own image versions" ON public.image_versions FOR INSERT TO authenticated WITH CHECK (
  owner = auth.uid() AND EXISTS (SELECT 1 FROM public.images WHERE id = original_image_id AND owner = auth.uid())
);
CREATE POLICY "Owner can delete own image versions" ON public.image_versions FOR DELETE TO authenticated USING (owner = auth.uid());
CREATE INDEX image_versions_owner_idx ON public.image_versions (owner, original_image_id, version_number);

CREATE TABLE public.duplicate_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL,
  existing_image_id uuid NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  upload_name text NOT NULL,
  sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.duplicate_uploads TO authenticated;
GRANT ALL ON public.duplicate_uploads TO service_role;
ALTER TABLE public.duplicate_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view own duplicate uploads" ON public.duplicate_uploads FOR SELECT TO authenticated USING (owner = auth.uid());
CREATE POLICY "Owner can add own duplicate uploads" ON public.duplicate_uploads FOR INSERT TO authenticated WITH CHECK (
  owner = auth.uid() AND EXISTS (SELECT 1 FROM public.images WHERE id = existing_image_id AND owner = auth.uid())
);
CREATE POLICY "Owner can delete own duplicate uploads" ON public.duplicate_uploads FOR DELETE TO authenticated USING (owner = auth.uid());
CREATE INDEX duplicate_uploads_owner_idx ON public.duplicate_uploads (owner, created_at DESC);
