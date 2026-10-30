-- Runs against actual roles; every data change is rolled back.
BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT user_id::text FROM bbsilog_private.feedback_admins LIMIT 1), true);
SELECT set_config('bbsilog.test_id', id::text, true) FROM public.bbsilog_feedback
 WHERE source_reference='867290374_908398452241201_7621560263928159411_n.jpg';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 UPDATE public.bbsilog_feedback SET archived_at=now() WHERE id=current_setting('bbsilog.test_id')::bigint;
 IF NOT FOUND THEN RAISE EXCEPTION 'Admin archive failed'; END IF;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE message='Thanks din po. Masarap ang foods!') THEN RAISE EXCEPTION 'Archived review exposed'; END IF;
 BEGIN
  PERFORM source_reference FROM public.bbsilog_feedback;
  RAISE EXCEPTION 'Private import metadata exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.bbsilog_feedback(customer_name,rating,message,source) VALUES ('test',5,'test','messenger_import');
  RAISE EXCEPTION 'Visitor can spoof an imported review';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE authenticated;
UPDATE public.bbsilog_feedback SET archived_at=null,status='pending' WHERE id=current_setting('bbsilog.test_id')::bigint;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE message='Thanks din po. Masarap ang foods!') THEN RAISE EXCEPTION 'Restored pending review exposed'; END IF;
END $$;
SET LOCAL ROLE authenticated;
UPDATE public.bbsilog_feedback SET status='approved' WHERE id=current_setting('bbsilog.test_id')::bigint;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE message='Thanks din po. Masarap ang foods!') THEN RAISE EXCEPTION 'Reapproved review missing'; END IF;
END $$;
ROLLBACK;
SELECT 'Passed: admin archive, pending restore, reapproval, and visitor permission checks. All changes rolled back.' AS verification;
