import { runLocalSql } from "../demo/local-supabase.mjs";

// Explicit local validation: temporary approval in an existing workspace, rolled back.
// No execution, external provider, activation or durable fixture changes.
const sql = `
begin;
do $$
declare opportunity record; company record; approval_id uuid := gen_random_uuid(); signature text; role_name text;
begin
  select o.id, o.business_id, b.owner_profile_id into strict opportunity
    from public.opportunities o join public.businesses b on b.id=o.business_id where not exists(select 1 from public.business_approval_requests a where a.business_id=o.business_id and a.entity_id=o.id and a.status='pending') limit 1;
  select id, business_id, name into strict company from public.crm_organizations limit 1;
  perform set_config('qa.business', opportunity.business_id::text, true);
  perform set_config('qa.opportunity', opportunity.id::text, true);
  perform set_config('qa.approval', approval_id::text, true);
  perform set_config('qa.company', company.id::text, true);
  perform set_config('qa.company_business', company.business_id::text, true);
  perform set_config('qa.company_name', company.name, true);
  insert into public.business_approval_requests(id,business_id,action_type,entity_type,entity_id,requested_by_profile_id,payload_fingerprint,safe_summary,expires_at)
    values(approval_id,opportunity.business_id,'revenue_confirmation','opportunity',opportunity.id,opportunity.owner_profile_id,md5(approval_id::text)||md5(approval_id::text),'Local projection verification',now()+interval '1 day');
  foreach signature in array array['public.workflow_has_pending_approval(uuid,uuid)','public.workflow_company_name(uuid,uuid)','public.workflow_approval_event(uuid,uuid)'] loop
    if not has_function_privilege('service_role', signature, 'EXECUTE') then raise exception 'Missing service execution grant'; end if;
    foreach role_name in array array['anon','authenticated'] loop
      if has_function_privilege(role_name, signature, 'EXECUTE') then raise exception 'Client execution grant leaked'; end if;
    end loop;
  end loop;
end $$;
set local role service_role;
do $$
declare b uuid:=current_setting('qa.business')::uuid; o uuid:=current_setting('qa.opportunity')::uuid; a uuid:=current_setting('qa.approval')::uuid; c uuid:=current_setting('qa.company')::uuid; cb uuid:=current_setting('qa.company_business')::uuid;
begin
  if not public.workflow_has_pending_approval(b,o) then raise exception 'Pending approval not detected'; end if;
  if public.workflow_has_pending_approval(gen_random_uuid(),o) then raise exception 'Cross-tenant approval probe'; end if;
  if public.workflow_has_pending_approval(b,gen_random_uuid()) then raise exception 'Unknown opportunity probe'; end if;
  if public.workflow_company_name(cb,c) is distinct from current_setting('qa.company_name') then raise exception 'Company projection mismatch'; end if;
  if public.workflow_company_name(gen_random_uuid(),c) is not null then raise exception 'Cross-tenant company'; end if;
  if (select count(*) from public.workflow_approval_event(b,a))<>1 then raise exception 'Missing approval envelope'; end if;
  if exists(select 1 from public.workflow_approval_event(gen_random_uuid(),a)) then raise exception 'Cross-tenant approval envelope'; end if;
end $$;
reset role;
update public.business_approval_requests set status='approved',decided_at=now(),decided_by_profile_id=requested_by_profile_id where id=current_setting('qa.approval')::uuid;
set local role service_role;
do $$ begin
  if public.workflow_has_pending_approval(current_setting('qa.business')::uuid,current_setting('qa.opportunity')::uuid) then raise exception 'Approved request treated as pending'; end if;
  if not exists(select 1 from public.workflow_approval_event(current_setting('qa.business')::uuid,current_setting('qa.approval')::uuid) where status='approved' and decided_at is not null and decided_by_profile_id is not null) then raise exception 'Decision envelope mismatch'; end if;
end $$;
reset role;
set local role authenticated;
do $$ declare denied integer:=0; begin
  begin perform public.workflow_has_pending_approval(gen_random_uuid(),gen_random_uuid()); exception when insufficient_privilege then denied:=denied+1; end;
  begin perform public.workflow_company_name(gen_random_uuid(),gen_random_uuid()); exception when insufficient_privilege then denied:=denied+1; end;
  begin perform public.workflow_approval_event(gen_random_uuid(),gen_random_uuid()); exception when insufficient_privilege then denied:=denied+1; end;
  if denied<>3 then raise exception 'Client RPC execution was allowed'; end if;
end $$;
reset role;
rollback;
`;
runLocalSql(sql);
console.log("PASS: service projections, tenant mismatch, decision envelope, denied client execution. Temporary approval rolled back.");
