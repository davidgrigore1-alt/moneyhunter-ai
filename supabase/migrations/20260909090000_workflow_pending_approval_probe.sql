begin;

-- safety-justification: Service-only boolean probe for the server-authorized workflow runtime; no approval content or write authority is exposed.
create or replace function public.workflow_has_pending_approval(target_business_id uuid, target_opportunity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_approval_requests approval
    join public.opportunities opportunity
      on opportunity.id = target_opportunity_id
      and opportunity.business_id = target_business_id
    where approval.business_id = target_business_id
      and approval.entity_id = opportunity.id
      and approval.status = 'pending'
  );
$$;

revoke all on function public.workflow_has_pending_approval(uuid, uuid) from public, anon, authenticated;
grant execute on function public.workflow_has_pending_approval(uuid, uuid) to service_role;

-- safety-justification: Service-only name projection for a company condition; tenant predicates are mandatory and no CRM mutation or contact data is exposed.
create or replace function public.workflow_company_name(target_business_id uuid, target_company_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select organization.name
  from public.crm_organizations organization
  where organization.id = target_company_id and organization.business_id = target_business_id;
$$;
revoke all on function public.workflow_company_name(uuid, uuid) from public, anon, authenticated;
grant execute on function public.workflow_company_name(uuid, uuid) to service_role;

-- safety-justification: Service-only event envelope, without approval payloads; the dispatcher rechecks the state, decision actor and tenant-owned target before processing.
create or replace function public.workflow_approval_event(target_business_id uuid, target_approval_id uuid)
returns table(id uuid, status text, entity_type text, entity_id uuid, decided_at timestamptz, decided_by_profile_id uuid)
language sql stable security definer set search_path = ''
as $$
  select approval.id, approval.status::text, approval.entity_type::text, approval.entity_id, approval.decided_at, approval.decided_by_profile_id
  from public.business_approval_requests approval
  where approval.business_id = target_business_id and approval.id = target_approval_id;
$$;
revoke all on function public.workflow_approval_event(uuid, uuid) from public, anon, authenticated;
grant execute on function public.workflow_approval_event(uuid, uuid) to service_role;

commit;
notify pgrst, 'reload schema';
