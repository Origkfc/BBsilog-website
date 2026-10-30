-- Add owner-approved Messenger imports without changing visitor consent rules.
-- Run against the BBSILOG website project only, before importing the reviews.
BEGIN;
ALTER TABLE public.bbsilog_feedback
  ADD COLUMN source text NOT NULL DEFAULT 'website',
  ADD COLUMN source_reference text,
  ADD COLUMN owner_publication_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.bbsilog_feedback ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE public.bbsilog_feedback DROP CONSTRAINT bbsilog_feedback_check;
ALTER TABLE public.bbsilog_feedback
  ADD CONSTRAINT bbsilog_feedback_source_check CHECK (source IN ('website', 'messenger_import')),
  ADD CONSTRAINT bbsilog_feedback_website_rating_check CHECK (source <> 'website' OR rating IS NOT NULL),
  ADD CONSTRAINT bbsilog_feedback_source_details_check CHECK (
    (source = 'website' AND source_reference IS NULL AND NOT owner_publication_approved)
    OR (source = 'messenger_import' AND source_reference IS NOT NULL)
  ),
  ADD CONSTRAINT bbsilog_feedback_source_reference_key UNIQUE (source_reference),
  ADD CONSTRAINT bbsilog_feedback_publication_check CHECK (
    status <> 'approved' OR publish_consent
    OR (source = 'messenger_import' AND owner_publication_approved)
  );
ALTER POLICY "public sees only consented approved reviews" ON public.bbsilog_feedback
  USING (status = 'approved' AND archived_at IS NULL AND (
    publish_consent OR (source = 'messenger_import' AND owner_publication_approved)
  ));
ALTER POLICY "admins moderate consented reviews" ON public.bbsilog_feedback
  WITH CHECK (public.bbsilog_is_feedback_admin() AND (
    status <> 'approved' OR publish_consent
    OR (source = 'messenger_import' AND owner_publication_approved)
  ));
-- Visitors cannot set import provenance or owner approval: existing column-level
-- INSERT and UPDATE grants stay unchanged. Importing is an operator-only action.
GRANT SELECT (source) ON public.bbsilog_feedback TO anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
