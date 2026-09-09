import { runLocalSql } from '../demo/local-supabase.mjs';
const sql = `begin;
select set_config('request.jwt.claim.sub',p.user_id::text,true) from public.profiles p join public.businesses b on b.owner_profile_id=p.id join public.crm_organizations o on o.business_id=b.id where o.id='de100001-0000-4000-8000-000000000001';
insert into public.crm_contacts(id,business_id,organization_id,full_name,normalized_name,is_active,is_primary_for_organization)
select 'ef200001-0000-4000-8000-000000000001',business_id,organization_id,'Gate 3 SQL temporary','gate 3 sql temporary',true,false from public.crm_contacts where id='de200001-0000-4000-8000-000000000001';
set local role authenticated;
do $$ declare b uuid; old_contact uuid; n int; begin
select business_id into b from public.crm_organizations where id='de100001-0000-4000-8000-000000000001';
perform public.set_company_primary_contact(b,'de100001-0000-4000-8000-000000000001','ef200001-0000-4000-8000-000000000001');
select count(*) into n from public.crm_contacts where organization_id='de100001-0000-4000-8000-000000000001' and is_primary_for_organization and is_active;
if n <> 1 then raise exception 'primary cardinality invalid'; end if;
begin
 perform public.set_company_primary_contact(b,'de100001-0000-4000-8000-000000000001','de200007-0000-4000-8000-000000000007');
 raise exception 'foreign company contact accepted';
exception when insufficient_privilege then null; end;
select id into old_contact from public.crm_contacts where organization_id='de100001-0000-4000-8000-000000000001' and is_primary_for_organization and is_active;
if old_contact <> 'ef200001-0000-4000-8000-000000000001' then raise exception 'failed selection changed primary'; end if;
begin
 perform public.set_company_primary_contact('ef000001-0000-4000-8000-000000000001','de100001-0000-4000-8000-000000000001','ef200001-0000-4000-8000-000000000001');
 raise exception 'foreign tenant accepted';
exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ declare b uuid; n int; begin
select business_id into b from public.crm_organizations where id='de100001-0000-4000-8000-000000000001';
perform public.create_company_primary_contact(b,'de100001-0000-4000-8000-000000000001','ef200002-0000-4000-8000-000000000002','SQL creation',null,null);
perform public.create_company_primary_contact(b,'de100001-0000-4000-8000-000000000001','ef200002-0000-4000-8000-000000000002','SQL creation',null,null);
select count(*) into n from public.crm_contacts where id='ef200002-0000-4000-8000-000000000002' and is_primary_for_organization;
if n<>1 then raise exception 'creation or replay invalid'; end if;
begin
 perform public.create_company_primary_contact(b,'de100007-0000-4000-8000-000000000007','ef200002-0000-4000-8000-000000000002','SQL creation',null,null);
 raise exception 'cross-company replay accepted';
exception when insufficient_privilege then null; end;
perform public.set_company_primary_contact(b,'de100001-0000-4000-8000-000000000001','ef200001-0000-4000-8000-000000000001');
perform public.create_company_primary_contact(b,'de100001-0000-4000-8000-000000000001','ef200002-0000-4000-8000-000000000002','SQL creation',null,null);
if not exists(select 1 from public.crm_contacts where id='ef200001-0000-4000-8000-000000000001' and is_primary_for_organization) then raise exception 'retry overwrote later decision'; end if;
begin
 perform public.create_company_primary_contact(b,'ef100001-0000-4000-8000-000000000001','ef200003-0000-4000-8000-000000000003','Invalid company',null,null);
 raise exception 'missing company accepted';
exception when insufficient_privilege then null; end;
if exists(select 1 from public.crm_contacts where id='ef200003-0000-4000-8000-000000000003') then raise exception 'failed create retained contact'; end if;
end $$;
reset role;
do $$ begin
if not exists(select 1 from public.business_audit_events where action='company.primary_contact_changed' and safe_metadata->>'contact_id'='ef200001-0000-4000-8000-000000000001') then raise exception 'missing audit'; end if;
if has_function_privilege('anon','public.set_company_primary_contact(uuid,uuid,uuid)','EXECUTE') then raise exception 'anon grant'; end if;
if has_function_privilege('anon','public.create_company_primary_contact(uuid,uuid,uuid,text,text,text)','EXECUTE') then raise exception 'anonymous create grant'; end if;
if (select count(*) from public.business_audit_events where action='company.primary_contact_changed' and safe_metadata->>'contact_id'='ef200002-0000-4000-8000-000000000002')<>1 then raise exception 'creation audit duplicated or missing'; end if;
end $$;
select set_config('request.jwt.claim.sub','ef900001-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
begin
 perform public.set_company_primary_contact('ef000001-0000-4000-8000-000000000001','de100001-0000-4000-8000-000000000001','ef200001-0000-4000-8000-000000000001');
 raise exception 'unrelated actor accepted';
exception when insufficient_privilege then null; end;
end $$;
rollback;`;
console.log(runLocalSql(sql));
console.log('PASS: authorized atomic selection, one primary, unrelated contact/tenant/actor denied, previous contact retained after failure, audit in transaction, anonymous execution denied. All test changes rolled back.');
