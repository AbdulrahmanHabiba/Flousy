-- Run only as a database administrator. All synthetic rows are rolled back.
begin;
do $$declare u uuid:=gen_random_uuid();b uuid:=gen_random_uuid();s uuid:=gen_random_uuid();begin
 insert into auth.users(id,email)values(u,'flousy-qa-'||u||'@example.invalid'),(b,'flousy-qa-'||b||'@example.invalid');
 insert into auth.sessions(id,user_id)values(s,u);
 insert into public.flousy_wallets(user_id,payload,revision)values(b,'{}',1);
 perform set_config('flousy.qa_b',b::text,true);perform set_config('flousy.qa_s',s::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',s)::text,true);
end $$;
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.flousy_save_wallet(0,'{"entries":[],"opening":{}}');if(r->>'revision')::int<>1 then raise exception 'Initial CAS failed';end if;
 r:=public.flousy_save_wallet(0,'{"opening":{},"entries":[]}');if(r->>'revision')::int<>1 then raise exception 'Idempotent retry failed';end if;
 begin perform public.flousy_save_wallet(0,'{"different":true}');raise exception 'Stale CAS accepted';exception when serialization_failure then null;end;
 if(select count(*)from public.flousy_wallets)<>1 then raise exception 'RLS isolation failed';end if;
 begin insert into public.flousy_wallets(user_id,payload,revision)values(current_setting('flousy.qa_b')::uuid,'{}',1);raise exception 'Foreign write accepted';exception when insufficient_privilege then null;end;
 insert into public.flousy_report_settings(user_id,payload)values(auth.uid(),'{"requested":true}');
 begin perform public.flousy_manage_wallet(1,false,'{}','1111');raise exception 'Bad confirmation accepted';exception when invalid_parameter_value then null;end;
 r:=public.flousy_manage_wallet(1,false,'{}','0000');
 if(r->>'revision')::int<>2 or(select payload->>'requested'from public.flousy_report_settings where user_id=auth.uid())<>'false' then raise exception 'Atomic reset failed';end if;
 perform public.flousy_manage_wallet(2,true,'{}','0000');
 if exists(select 1 from public.flousy_wallets)or exists(select 1 from public.flousy_report_settings)then raise exception 'Scoped delete failed';end if;
 begin perform public.flousy_save_wallet(2,'{}');raise exception 'Stale write recreated deleted wallet';exception when serialization_failure then null;end;
 perform public.flousy_save_wallet(0,'{}');
end $$;
reset role;
delete from auth.sessions where id=current_setting('flousy.qa_s')::uuid;
set local role authenticated;
do $$begin
 if flousy_private.session_active()or exists(select 1 from public.flousy_wallets)then raise exception 'Revoked session retained access';end if;
 begin perform public.flousy_save_wallet(1,'{}');raise exception 'Revoked write accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: isolation, CAS, lifecycle and session revocation; test fixtures rolled back' as verification;
