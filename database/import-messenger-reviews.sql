-- Exact customer quotes supplied by the BBSILOG owner on 2026-10-30.
-- No star ratings or original review dates were supplied. Missing names stay null.
-- Owner publication approval is separate from website visitor consent.
BEGIN;
INSERT INTO public.bbsilog_feedback
  (customer_name, rating, message, publish_consent, status, source, source_reference, owner_publication_approved)
VALUES
  ('Stephanie', NULL, 'salamat! sulit ang paghihintay. sarap!', false, 'approved', 'messenger_import', '744088012_1656877383117635_6021450914582398195_n.jpg#stephanie', true),
  (NULL, NULL, E'sarap nung gravy nyo solid\npati chicken at liempo\nlegit nga kayo nga talaga pinaka masarap na silugan dito', false, 'approved', 'messenger_import', '744088012_1656877383117635_6021450914582398195_n.jpg#gravy', true),
  ('Eme', NULL, 'Ty den po. Masarap 👌 un lng sa deliver matagal po 😅 but understandable madami po yta kayu paorder Hehe', false, 'approved', 'messenger_import', '744088012_1656877383117635_6021450914582398195_n.jpg#eme', true),
  (NULL, NULL, 'ay grabe kagabi kumain kami jan as in speechless ako sa sobrang sarap ng BBsilog also yung mango cheesecake shake🥰🥰for sure babalik balikan namin ang place nyo sinangag pa lng sobrang panalo na ❤️❤️❤️', false, 'approved', 'messenger_import', '759208433_1673663124772394_939487039667237100_n.jpg', true),
  (NULL, NULL, 'Masarap po yung buttered chicken. No bias 😍 Very malasa and crispy 🙌 Will def purchase again 💓💓 Thank youuuuuuuuu', false, 'approved', 'messenger_import', '797811418_1770352780828399_8520873926593162994_n.jpg', true),
  ('LO', NULL, 'Thank you po ✨ sarap po ng food niyo especially garlic rice 😊', false, 'approved', 'messenger_import', '864159278_1766924135446292_7066775401512267783_n.jpg', true),
  ('Claudine', NULL, 'Thanks din po. Masarap ang foods!', false, 'approved', 'messenger_import', '867290374_908398452241201_7621560263928159411_n.jpg', true),
  (NULL, NULL, 'Masarap po', false, 'approved', 'messenger_import', '638447564_1534018708736837_7561739472990847203_n.jpg', true)
ON CONFLICT (source_reference) DO NOTHING;
-- Rerunning the import never republishes or unarchives a moderated review.
COMMIT;
