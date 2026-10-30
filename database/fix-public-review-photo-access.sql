-- Public photo checks require these columns, while feedback RLS still limits visible rows.
BEGIN;
GRANT SELECT (publish_consent, status, archived_at) ON public.bbsilog_feedback TO anon;
ALTER POLICY "BBSILOG admins and approved reviewers read photos" ON storage.objects TO anon, authenticated
USING (bucket_id = 'bbsilog-feedback-photos' AND EXISTS (
 SELECT 1 FROM public.bbsilog_feedback f WHERE f.photo_path = objects.name
 AND f.photo_consent = true AND f.publish_consent = true
 AND f.status = 'approved' AND f.archived_at IS NULL
));
-- Keep admin-only function calls out of policies that also run for anonymous visitors.
CREATE POLICY "BBSILOG admins read all feedback photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bbsilog-feedback-photos' AND public.bbsilog_is_feedback_admin());
NOTIFY pgrst, 'reload schema';
COMMIT;
