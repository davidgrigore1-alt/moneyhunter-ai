import fs from 'node:fs';
import {runLocalSql} from '../demo/local-supabase.mjs';
const migration=fs.readFileSync('supabase/migrations/20260909011852_marketing_demo_requests.sql','utf8');
const sql=`begin;
${process.argv.includes('--existing') ? '' : migration}
set local role service_role;
do $$ declare r uuid; payload jsonb := '{"name":"SQL validation","email":"capture-sql@example.invalid","company":"Local validation","phone":"","goal":"<script>literal untrusted text</script>","contactConsent":true}'; begin
  r:=public.capture_marketing_demo_request('aa111111-1111-4111-8111-111111111111',payload);
  if r is null then raise exception 'capture failed'; end if;
  if public.capture_marketing_demo_request(r,payload) is distinct from r then raise exception 'replay failed'; end if;
  if (select count(*) from public.marketing_demo_requests where id=r)<>1 then raise exception 'duplicate'; end if;
  if public.capture_marketing_demo_request(r,payload||'{"name":"Different"}') is not null then raise exception 'collision accepted'; end if;
  if public.capture_marketing_demo_request(gen_random_uuid(),payload||'{"contactConsent":false}') is not null then raise exception 'consent bypass'; end if;
  if public.capture_marketing_demo_request(gen_random_uuid(),payload||'{"email":"invalid"}') is not null then raise exception 'invalid email'; end if;
  perform public.capture_marketing_demo_request(gen_random_uuid(),payload);
  perform public.capture_marketing_demo_request(gen_random_uuid(),payload);
  if public.capture_marketing_demo_request(gen_random_uuid(),payload) is not null then raise exception 'rate bypass'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',p.user_id::text,true) from public.profiles p join public.businesses b on b.owner_profile_id=p.id join public.crm_organizations o on o.business_id=b.id where o.id='de100001-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 if exists(select 1 from public.marketing_demo_requests where email='capture-sql@example.invalid') then raise exception 'workspace owner can read platform leads'; end if;
 if has_function_privilege('authenticated','public.capture_marketing_demo_request(uuid,jsonb)','EXECUTE') then raise exception 'public RPC bypass'; end if;
 if has_table_privilege('authenticated','public.marketing_demo_requests','INSERT') then raise exception 'public insert grant'; end if;
end $$;
reset role;
insert into public.platform_user_roles(profile_id,role)
 select id,'platform_admin' from public.profiles where user_id=auth.uid()
 on conflict(profile_id,role) do update set is_active=true,revoked_at=null,expires_at=null;
set local role authenticated;
do $$ begin
 if (select count(*) from public.marketing_demo_requests where email='capture-sql@example.invalid')<>3 then raise exception 'platform admin cannot read'; end if;
end $$;
reset role;
update public.platform_user_roles set revoked_at=now() where profile_id in (select id from public.profiles where user_id=auth.uid()) and role='platform_admin';
set local role authenticated;
do $$ begin
 if exists(select 1 from public.marketing_demo_requests) then raise exception 'revoked platform admin can read'; end if;
end $$;
reset role;
set local role service_role;
insert into public.marketing_demo_requests(id,name,email,company)
 select gen_random_uuid(),'Rate fixture','rate-'||g||'@example.invalid','Rollback only' from generate_series(1,120) g;
do $$ begin
 if public.capture_marketing_demo_request(gen_random_uuid(),'{"name":"Global rate","email":"global-rate@example.invalid","company":"Rollback","phone":"","goal":"","contactConsent":true}') is not null then raise exception 'global rate bypass'; end if;
end $$;
reset role;
do $$ begin
 if has_table_privilege('anon','public.marketing_demo_requests','SELECT') or has_function_privilege('anon','public.capture_marketing_demo_request(uuid,jsonb)','EXECUTE') then raise exception 'anonymous access'; end if;
end $$;
rollback;`;
console.log(runLocalSql(sql));
console.log('PASS: persistence, replay, collision, validation, consent, email/global rate limits, business-owner denial, platform-admin read/revocation and anonymous denial. All fixtures rolled back.');
