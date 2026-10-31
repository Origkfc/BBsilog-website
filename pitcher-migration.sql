create table if not exists bbsilog_private.pitcher_rewards (
 code uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 phone text not null unique, feedback_id bigint not null references public.bbsilog_feedback(id),
 created_at timestamptz not null default now(), used_at timestamptz, used_by uuid
);
alter table bbsilog_private.pitcher_rewards enable row level security;
revoke all on bbsilog_private.pitcher_rewards from public, anon, authenticated;

create or replace function public.bbsilog_pitcher_submit(p_request uuid,p_phone text,p_review jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare n text; ph text; photo text; f_id bigint; reward bbsilog_private.pitcher_rewards;
begin
 if p_request is null then raise exception 'Missing request ID'; end if;
 select * into reward from bbsilog_private.pitcher_rewards where request_id=p_request;
 if found then return jsonb_build_object('eligible',true,'code',reward.code,'used',reward.used_at is not null); end if;
 n:=trim(coalesce(p_review->>'customer_name','')); ph:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 if ph ~ '^639[0-9]{9}$' then ph:='0'||substr(ph,3); end if;
 if ph !~ '^09[0-9]{9}$' or length(n) not between 1 and 80 then raise exception 'Enter your name and a valid Philippine mobile number'; end if;
 if coalesce((p_review->>'rating')::integer,0) not between 1 and 5 or length(trim(coalesce(p_review->>'message',''))) not between 1 and 1500 then raise exception 'Choose a rating and enter your feedback'; end if;
 photo:=nullif(p_review->>'photo_path','');
 if photo is null or photo !~ '^incoming/[0-9a-f-]{36}[.]webp$' or not exists(select 1 from storage.objects where bucket_id='bbsilog-feedback-photos' and name=photo) then raise exception 'A photo is required for the free pitcher reward'; end if;
 if coalesce(p_review->>'photo_layout','') not in ('selfie','groupie') then raise exception 'Choose a photo type'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pitcher:'||ph,0));
 select * into reward from bbsilog_private.pitcher_rewards where request_id=p_request;
 if found then return jsonb_build_object('eligible',true,'code',reward.code,'used',reward.used_at is not null); end if;
 if exists(select 1 from bbsilog_private.pitcher_rewards where phone=ph) then return jsonb_build_object('eligible',false,'message','This mobile number has already received a pitcher reward. You may still submit feedback without joining the reward.'); end if;
 insert into public.bbsilog_feedback(customer_name,rating,message,publish_consent,photo_path,photo_layout,photo_consent)
 values(n,(p_review->>'rating')::smallint,trim(p_review->>'message'),coalesce((p_review->>'publish_consent')::boolean,false),photo,p_review->>'photo_layout',coalesce((p_review->>'photo_consent')::boolean,false)) returning id into f_id;
 insert into bbsilog_private.pitcher_rewards(request_id,phone,feedback_id) values(p_request,ph,f_id) returning * into reward;
 return jsonb_build_object('eligible',true,'code',reward.code,'used',false);
end $$;
create or replace function public.bbsilog_pitcher_admin(p_code uuid,p_action text default 'verify')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r bbsilog_private.pitcher_rewards; f public.bbsilog_feedback; claimed boolean:=false;
begin
 if not public.bbsilog_is_feedback_admin() then raise exception 'Admin access required'; end if;
 if p_action not in ('verify','claim') then raise exception 'Invalid action'; end if;
 select * into r from bbsilog_private.pitcher_rewards where code=p_code for update;
 if not found then raise exception 'Invalid pitcher reward QR'; end if;
 select * into f from public.bbsilog_feedback where id=r.feedback_id;
 if p_action='claim' and r.used_at is null then update bbsilog_private.pitcher_rewards set used_at=now(),used_by=auth.uid() where code=r.code returning * into r; claimed:=true; end if;
 return jsonb_build_object('claimed_now',claimed,'used',r.used_at is not null,'used_at',r.used_at,'customer_name',f.customer_name,'phone',r.phone,'message',f.message,'photo_path',f.photo_path,'photo_layout',f.photo_layout,'created_at',r.created_at);
end $$;
revoke all on function public.bbsilog_pitcher_submit(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.bbsilog_pitcher_submit(uuid,text,jsonb) to anon,authenticated;
revoke all on function public.bbsilog_pitcher_admin(uuid,text) from public,anon,authenticated;
grant execute on function public.bbsilog_pitcher_admin(uuid,text) to authenticated;
