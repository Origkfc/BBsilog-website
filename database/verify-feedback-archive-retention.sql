-- All fixtures and deletions are rolled back, including archive auto-pruning.
BEGIN;
DO $$
DECLARE
  active_id bigint; oldest_id bigint; newest_id bigint; reward_code uuid;
  test_phone text; result jsonb; fixture_photo text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub',
    (SELECT user_id::text FROM bbsilog_private.feedback_admins LIMIT 1),true);
  IF NOT public.bbsilog_is_feedback_admin() THEN RAISE EXCEPTION 'No admin fixture available'; END IF;
  SELECT '09'||g::text INTO test_phone FROM generate_series(999990000,999990999) g
  WHERE NOT EXISTS(SELECT 1 FROM bbsilog_private.pitcher_rewards WHERE phone='09'||g::text) LIMIT 1;
  fixture_photo := 'incoming/'||gen_random_uuid()::text||'.webp';
  INSERT INTO public.bbsilog_feedback(customer_name,rating,message)
  VALUES('Archive regression active',5,'Active feedback stays untouched') RETURNING id INTO active_id;
  INSERT INTO public.bbsilog_feedback(customer_name,rating,message,photo_path,photo_layout)
  VALUES('Archive regression reward',4,'Reward verification survives deletion',fixture_photo,'groupie') RETURNING id INTO oldest_id;
  INSERT INTO bbsilog_private.pitcher_rewards(request_id,phone,feedback_id)
  VALUES(gen_random_uuid(),test_phone,oldest_id) RETURNING code INTO reward_code;
  UPDATE public.bbsilog_feedback SET archived_at='2100-01-01' WHERE id=oldest_id;
  FOR i IN 1..49 LOOP
    INSERT INTO public.bbsilog_feedback(customer_name,rating,message,archived_at)
    VALUES('Archive regression fixture',5,'Boundary test '||i,'2100-01-01'::timestamptz+i*interval '1 minute');
  END LOOP;
  IF (SELECT count(*) FROM public.bbsilog_feedback WHERE archived_at IS NOT NULL) <> 50
  OR NOT EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE id=oldest_id)
  THEN RAISE EXCEPTION 'The 50th archive must retain the oldest fixture'; END IF;
  INSERT INTO public.bbsilog_feedback(customer_name,rating,message,archived_at)
  VALUES('Archive regression newest',5,'51st archive boundary','2100-01-02') RETURNING id INTO newest_id;
  IF (SELECT count(*) FROM public.bbsilog_feedback WHERE archived_at IS NOT NULL) <> 50
  OR EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE id=oldest_id)
  OR NOT EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE id=active_id AND archived_at IS NULL)
  OR NOT EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE id=newest_id)
  THEN RAISE EXCEPTION '51st archive did not prune only the oldest'; END IF;
  IF NOT EXISTS(SELECT 1 FROM bbsilog_private.pitcher_rewards
    WHERE code=reward_code AND feedback_id IS NULL AND phone=test_phone
    AND feedback_snapshot->>'photo_path'=fixture_photo)
  THEN RAISE EXCEPTION 'Reward history or verification photo was lost'; END IF;
  result := public.bbsilog_pitcher_admin(reward_code,'verify');
  IF result->>'customer_name'<>'Archive regression reward'
  OR result->>'message'<>'Reward verification survives deletion'
  OR result->>'photo_layout'<>'groupie' OR (result->>'used')::boolean
  THEN RAISE EXCEPTION 'QR verification cannot use the preserved record'; END IF;
  result := public.bbsilog_pitcher_admin(reward_code,'claim');
  IF NOT (result->>'claimed_now')::boolean THEN RAISE EXCEPTION 'First reward claim failed'; END IF;
  result := public.bbsilog_pitcher_admin(reward_code,'claim');
  IF (result->>'claimed_now')::boolean OR NOT (result->>'used')::boolean
  THEN RAISE EXCEPTION 'Reward could be reused'; END IF;
  BEGIN
    INSERT INTO bbsilog_private.pitcher_rewards(request_id,phone,feedback_id)
    VALUES(gen_random_uuid(),test_phone,active_id);
    RAISE EXCEPTION 'Duplicate mobile number was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  result := public.bbsilog_admin_pitchers();
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'rewards') r WHERE r->>'code'=reward_code::text)
  THEN RAISE EXCEPTION 'Deleted-feedback reward disappeared from admin list'; END IF;
  BEGIN
    PERFORM public.bbsilog_delete_archived_feedback(active_id,'DELETE');
    RAISE EXCEPTION 'Active feedback was deleted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Archived feedback not found%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.bbsilog_delete_archived_feedback(newest_id,'NO');
    RAISE EXCEPTION 'Unconfirmed deletion was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Deletion confirmation is required' THEN RAISE; END IF;
  END;
  IF NOT public.bbsilog_delete_archived_feedback(newest_id,'DELETE') THEN RAISE EXCEPTION 'Confirmed deletion failed'; END IF;
  IF EXISTS(SELECT 1 FROM public.bbsilog_feedback WHERE id=newest_id) THEN RAISE EXCEPTION 'Deleted row remains'; END IF;
  -- Restore returns an entry to Pending without deleting any active record.
  UPDATE public.bbsilog_feedback SET archived_at=NULL,status='pending'
  WHERE id=(SELECT id FROM public.bbsilog_feedback WHERE archived_at IS NOT NULL ORDER BY archived_at DESC,id DESC LIMIT 1);
  IF (SELECT count(*) FROM public.bbsilog_feedback WHERE archived_at IS NOT NULL) <> 48 THEN RAISE EXCEPTION 'Restore failed'; END IF;
END;
$$;

-- Check RLS under real API roles (not just the migration owner's privileges).
SELECT set_config('request.jwt.claim.sub', (SELECT user_id::text FROM bbsilog_private.feedback_admins LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE item_id bigint; affected integer;
BEGIN
  INSERT INTO public.bbsilog_feedback(customer_name,rating,message)
  VALUES('Archive authenticated fixture',3,'Authenticated-role regression') RETURNING id INTO item_id;
  DELETE FROM public.bbsilog_feedback WHERE id=item_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Direct deletion bypassed the archive requirement'; END IF;
  UPDATE public.bbsilog_feedback SET archived_at=now() WHERE id=item_id;
  IF NOT public.bbsilog_delete_archived_feedback(item_id,'DELETE') THEN RAISE EXCEPTION 'Admin RPC lacks permissions'; END IF;
END;
$$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.bbsilog_delete_archived_feedback(-1,'DELETE');
    RAISE EXCEPTION 'Non-admin deletion was permitted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.bbsilog_delete_archived_feedback(-1,'DELETE');
    RAISE EXCEPTION 'Anonymous deletion was permitted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.bbsilog_feedback(rating,message,archived_at)
    VALUES(5,'Anonymous archive eviction attempt',now());
    RAISE EXCEPTION 'Visitor could force archive eviction';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: 50/51 retention, reward snapshot/claim/phone uniqueness, manual confirmation, restore, admin/non-admin/anon permissions' AS result;
