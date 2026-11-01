-- Keep the newest 50 archive entries. Reward history remains private and
-- independent so deleting feedback never resets one-reward-per-mobile rules.
ALTER TABLE bbsilog_private.pitcher_rewards
  ADD COLUMN IF NOT EXISTS feedback_snapshot jsonb,
  ALTER COLUMN feedback_id DROP NOT NULL;
ALTER TABLE bbsilog_private.pitcher_rewards
  DROP CONSTRAINT pitcher_rewards_feedback_id_fkey,
  ADD CONSTRAINT pitcher_rewards_feedback_id_fkey FOREIGN KEY (feedback_id)
    REFERENCES public.bbsilog_feedback(id) ON DELETE SET NULL;
ALTER TABLE bbsilog_private.web_orders
  DROP CONSTRAINT web_orders_review_id_fkey,
  ADD CONSTRAINT web_orders_review_id_fkey FOREIGN KEY (review_id)
    REFERENCES public.bbsilog_feedback(id) ON DELETE SET NULL;

-- Serialize before acquiring feedback row locks, including concurrent restores
-- and manual deletions. This keeps the archive limit deterministic.
CREATE OR REPLACE FUNCTION bbsilog_private.lock_feedback_archive()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(614203850, 50);
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION bbsilog_private.lock_feedback_archive() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER feedback_archive_lock BEFORE INSERT OR UPDATE OR DELETE
ON public.bbsilog_feedback FOR EACH STATEMENT
EXECUTE FUNCTION bbsilog_private.lock_feedback_archive();

CREATE OR REPLACE FUNCTION bbsilog_private.preserve_feedback_reward()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Called only by the table trigger; callers cannot supply arbitrary snapshots.
  UPDATE bbsilog_private.pitcher_rewards
  SET feedback_snapshot = pg_catalog.jsonb_build_object(
    'customer_name', OLD.customer_name, 'message', OLD.message,
    'photo_path', OLD.photo_path, 'photo_layout', OLD.photo_layout)
  WHERE feedback_id = OLD.id;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION bbsilog_private.preserve_feedback_reward() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER feedback_preserve_reward BEFORE DELETE
ON public.bbsilog_feedback FOR EACH ROW
EXECUTE FUNCTION bbsilog_private.preserve_feedback_reward();

CREATE OR REPLACE FUNCTION bbsilog_private.trim_feedback_archive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.bbsilog_feedback
  WHERE id IN (
    SELECT id FROM public.bbsilog_feedback WHERE archived_at IS NOT NULL
    ORDER BY archived_at DESC, id DESC OFFSET 50
  );
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION bbsilog_private.trim_feedback_archive() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER feedback_archive_limit AFTER INSERT OR UPDATE OF archived_at
ON public.bbsilog_feedback FOR EACH STATEMENT
EXECUTE FUNCTION bbsilog_private.trim_feedback_archive();
CREATE INDEX IF NOT EXISTS feedback_archive_retention_idx
ON public.bbsilog_feedback (archived_at DESC, id DESC) WHERE archived_at IS NOT NULL;

-- Visitors cannot submit already-archived records to force archive eviction.
ALTER POLICY "visitors can submit feedback" ON public.bbsilog_feedback
WITH CHECK (status = 'pending' AND archived_at IS NULL);
-- Permanent deletion is restricted to authorized admins and archived feedback.
ALTER POLICY "admins delete feedback" ON public.bbsilog_feedback
USING (archived_at IS NOT NULL AND (SELECT public.bbsilog_is_feedback_admin()));
GRANT DELETE ON public.bbsilog_feedback TO authenticated;
CREATE OR REPLACE FUNCTION public.bbsilog_delete_archived_feedback(
  p_id bigint, p_confirmation text
)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.bbsilog_is_feedback_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'DELETE' THEN
    RAISE EXCEPTION 'Deletion confirmation is required';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(614203850, 50);
  DELETE FROM public.bbsilog_feedback WHERE id = p_id AND archived_at IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Archived feedback not found. Refresh the inbox.'; END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.bbsilog_delete_archived_feedback(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bbsilog_delete_archived_feedback(bigint, text) TO authenticated;

-- Preserve the existing API shape while supporting a removed feedback record.
CREATE OR REPLACE FUNCTION public.bbsilog_pitcher_admin(p_code uuid, p_action text DEFAULT 'verify')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r bbsilog_private.pitcher_rewards; f public.bbsilog_feedback; claimed boolean := false;
BEGIN
  IF NOT public.bbsilog_is_feedback_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('verify','claim') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  SELECT * INTO r FROM bbsilog_private.pitcher_rewards WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid pitcher reward QR'; END IF;
  SELECT * INTO f FROM public.bbsilog_feedback WHERE id = r.feedback_id;
  IF p_action = 'claim' AND r.used_at IS NULL THEN
    UPDATE bbsilog_private.pitcher_rewards SET used_at = now(), used_by = auth.uid()
    WHERE code = r.code RETURNING * INTO r;
    claimed := true;
  END IF;
  RETURN jsonb_build_object('claimed_now',claimed,'used',r.used_at IS NOT NULL,
    'used_at',r.used_at,'customer_name',coalesce(f.customer_name,r.feedback_snapshot->>'customer_name'),
    'phone',r.phone,'message',coalesce(f.message,r.feedback_snapshot->>'message'),
    'photo_path',coalesce(f.photo_path,r.feedback_snapshot->>'photo_path'),
    'photo_layout',coalesce(f.photo_layout,r.feedback_snapshot->>'photo_layout'),
    'created_at',r.created_at,'feedback_deleted',r.feedback_id IS NULL);
END;
$$;
CREATE OR REPLACE FUNCTION public.bbsilog_admin_pitchers()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.bbsilog_is_feedback_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT jsonb_build_object(
    'total',count(*),'available',count(*) FILTER (WHERE r.used_at IS NULL),
    'claimed',count(*) FILTER (WHERE r.used_at IS NOT NULL),
    'rewards',coalesce((SELECT jsonb_agg(t.item ORDER BY t.created_at DESC) FROM (
      SELECT r2.created_at,jsonb_build_object('code',r2.code,'phone',r2.phone,
        'created_at',r2.created_at,'used_at',r2.used_at,
        'customer_name',coalesce(f.customer_name,r2.feedback_snapshot->>'customer_name')) item
      FROM bbsilog_private.pitcher_rewards r2
      LEFT JOIN public.bbsilog_feedback f ON f.id = r2.feedback_id
      ORDER BY r2.created_at DESC LIMIT 200
    ) t),'[]'::jsonb)) INTO result FROM bbsilog_private.pitcher_rewards r;
  RETURN result;
END;
$$;

-- Apply the cap to any existing excess archives too (currently only 5).
DELETE FROM public.bbsilog_feedback WHERE id IN (
  SELECT id FROM public.bbsilog_feedback WHERE archived_at IS NOT NULL
  ORDER BY archived_at DESC, id DESC OFFSET 50
);
