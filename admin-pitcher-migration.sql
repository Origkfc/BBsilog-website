create or replace function public.bbsilog_admin_pitchers()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.bbsilog_is_feedback_admin() then raise exception 'Admin access required'; end if;
 select jsonb_build_object(
  'total', count(*), 'available', count(*) filter (where r.used_at is null),
  'claimed', count(*) filter (where r.used_at is not null),
  'rewards', coalesce((select jsonb_agg(t.item order by t.created_at desc) from (
   select r2.created_at, jsonb_build_object('code',r2.code,'phone',r2.phone,'created_at',r2.created_at,'used_at',r2.used_at,'customer_name',f.customer_name) item
   from bbsilog_private.pitcher_rewards r2 join public.bbsilog_feedback f on f.id=r2.feedback_id
   order by r2.created_at desc limit 200
  ) t),'[]'::jsonb))
 into result from bbsilog_private.pitcher_rewards r;
 return result;
end $$;
revoke all on function public.bbsilog_admin_pitchers() from public,anon,authenticated;
grant execute on function public.bbsilog_admin_pitchers() to authenticated;

grant select (id) on public.bbsilog_feedback to anon, authenticated;
