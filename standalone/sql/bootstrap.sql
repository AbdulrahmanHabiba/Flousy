-- Initial independent-app schema. Existing D1 data is not read or migrated.
create schema if not exists flousy_private;
revoke all on schema flousy_private from public,anon;
grant usage on schema flousy_private to authenticated;
-- The Auth session table is private, so this narrow read-only predicate needs definer rights.
create or replace function flousy_private.session_active() returns boolean
language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists(select 1 from auth.sessions s where s.user_id=auth.uid() and s.id::text=(auth.jwt()->>'session_id') and (s.not_after is null or s.not_after>now())); $$;
revoke all on function flousy_private.session_active() from public,anon;
grant execute on function flousy_private.session_active() to authenticated;

create table public.flousy_wallets(
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=8388608),
 revision bigint not null check(revision>0 and revision<=9007199254740991),
 updated_at timestamptz not null default now()
);
create table public.flousy_report_settings(
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=4096)
);
alter table public.flousy_wallets enable row level security;
alter table public.flousy_report_settings enable row level security;
revoke all on public.flousy_wallets,public.flousy_report_settings from anon,authenticated;
grant select,insert,update,delete on public.flousy_wallets,public.flousy_report_settings to authenticated;
create policy wallet_owner on public.flousy_wallets for all to authenticated using((select auth.uid())=user_id and (select flousy_private.session_active())) with check((select auth.uid())=user_id and (select flousy_private.session_active()));
create policy settings_owner on public.flousy_report_settings for all to authenticated using((select auth.uid())=user_id and (select flousy_private.session_active())) with check((select auth.uid())=user_id and (select flousy_private.session_active()));

create or replace function public.flousy_save_wallet(p_revision bigint,p_payload jsonb) returns jsonb
language plpgsql security invoker set search_path=''
as $$ declare u uuid:=auth.uid();old public.flousy_wallets%rowtype;begin
 if u is null or not flousy_private.session_active() then raise exception 'Unauthorized' using errcode='42501';end if;
 if p_revision<0 or p_revision>9007199254740990 or p_payload is null then raise exception 'Invalid input';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into old from public.flousy_wallets where user_id=u for update;
 if found then
  if old.revision<>p_revision then
   if old.payload=p_payload then return jsonb_build_object('revision',old.revision);end if;
   raise exception 'Revision conflict' using errcode='40001';
  end if;
  update public.flousy_wallets set payload=p_payload,revision=revision+1,updated_at=now() where user_id=u;
  return jsonb_build_object('revision',old.revision+1);
 else
  if p_revision<>0 then raise exception 'Revision conflict' using errcode='40001';end if;
  insert into public.flousy_wallets(user_id,payload,revision)values(u,p_payload,1);
  return jsonb_build_object('revision',1);
 end if;
end;$$;
revoke all on function public.flousy_save_wallet(bigint,jsonb) from public,anon;
grant execute on function public.flousy_save_wallet(bigint,jsonb) to authenticated;

create or replace function public.flousy_manage_wallet(p_revision bigint,p_delete boolean,p_payload jsonb,p_confirmation text)returns jsonb
language plpgsql security invoker set search_path=''
as $$declare u uuid:=auth.uid();current_revision bigint;begin
 if u is null or not flousy_private.session_active() then raise exception 'Unauthorized' using errcode='42501';end if;
 if p_confirmation<>'0000' or p_confirmation is null or p_revision<0 then raise exception 'Confirmation required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select revision into current_revision from public.flousy_wallets where user_id=u for update;
 if coalesce(current_revision,0)<>p_revision then raise exception 'Revision conflict' using errcode='40001';end if;
 if p_delete then
  delete from public.flousy_report_settings where user_id=u;
  delete from public.flousy_wallets where user_id=u;
  return jsonb_build_object('deleted',true);
 end if;
 perform public.flousy_save_wallet(p_revision,p_payload);
 update public.flousy_report_settings set payload=jsonb_set(payload,'{requested}','false') where user_id=u;
 return jsonb_build_object('revision',p_revision+1,'state',p_payload);
end;$$;
revoke all on function public.flousy_manage_wallet(bigint,boolean,jsonb,text) from public,anon;
grant execute on function public.flousy_manage_wallet(bigint,boolean,jsonb,text) to authenticated;
