-- Exact, lossless crops from the customer profile photos supplied by the owner.
BEGIN;
ALTER TABLE public.bbsilog_feedback ADD COLUMN avatar_path text;
ALTER TABLE public.bbsilog_feedback ADD CONSTRAINT bbsilog_feedback_avatar_path_check
  CHECK (avatar_path IS NULL OR (source = 'messenger_import' AND avatar_path ~ '^/files/review-avatars/[a-z0-9-]+[.]webp$'));
GRANT SELECT (avatar_path) ON public.bbsilog_feedback TO anon;
UPDATE public.bbsilog_feedback AS review SET avatar_path = images.path
FROM (VALUES
  ('744088012_1656877383117635_6021450914582398195_n.jpg#stephanie', '/files/review-avatars/review-stephanie.webp'),
  ('744088012_1656877383117635_6021450914582398195_n.jpg#gravy', '/files/review-avatars/review-gravy.webp'),
  ('744088012_1656877383117635_6021450914582398195_n.jpg#eme', '/files/review-avatars/review-eme.webp'),
  ('759208433_1673663124772394_939487039667237100_n.jpg', '/files/review-avatars/review-mango.webp'),
  ('797811418_1770352780828399_8520873926593162994_n.jpg', '/files/review-avatars/review-buttered-chicken.webp'),
  ('864159278_1766924135446292_7066775401512267783_n.jpg', '/files/review-avatars/review-garlic-rice.webp'),
  ('867290374_908398452241201_7621560263928159411_n.jpg', '/files/review-avatars/review-claudine.webp'),
  ('638447564_1534018708736837_7561739472990847203_n.jpg', '/files/review-avatars/review-masarap.webp')
) AS images(reference, path)
WHERE review.source = 'messenger_import' AND review.source_reference = images.reference;
NOTIFY pgrst, 'reload schema';
COMMIT;
