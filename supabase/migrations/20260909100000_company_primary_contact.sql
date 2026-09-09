begin;
-- safety-justification: Bounded atomic contact selection derives actor and business role from Auth,
-- locks the tenant company, checks the target's membership, and writes an audit receipt in the same transaction.
create or replace function public.set_company_primary_contact(target_business_id uuid, target_company_id uuid, target_contact_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid; previous_contact uuid;
begin
  actor := public.current_profile_id();
  if auth.uid() is null or actor is null or coalesce(public.business_role_for_current_user(target_business_id), '') not in ('owner','admin','manager','member') then
    raise exception 'contact_selection_forbidden' using errcode = '42501';
  end if;
  perform 1 from public.crm_organizations where id = target_company_id and business_id = target_business_id and not is_archived for update;
  if not found then raise exception 'contact_selection_unavailable' using errcode = '42501'; end if;
  perform 1 from public.crm_contacts where id = target_contact_id and business_id = target_business_id and organization_id = target_company_id and is_active and archived_at is null for update;
  if not found then raise exception 'contact_selection_unavailable' using errcode = '42501'; end if;
  select id into previous_contact from public.crm_contacts where business_id = target_business_id and organization_id = target_company_id and is_active and is_primary_for_organization;
  if previous_contact = target_contact_id then return target_contact_id; end if;
  update public.crm_contacts set is_primary_for_organization = false where business_id = target_business_id and organization_id = target_company_id and is_primary_for_organization;
  update public.crm_contacts set is_primary_for_organization = true where id = target_contact_id and business_id = target_business_id and organization_id = target_company_id;
  insert into public.business_audit_events (business_id,actor_profile_id,category,action,entity_type,entity_id,result,description,safe_metadata)
  values (target_business_id,actor,'assignment','company.primary_contact_changed','crm_organization',target_company_id,'success','Contactul principal al companiei a fost confirmat.',jsonb_build_object('previous_contact_id',previous_contact,'contact_id',target_contact_id));
  return target_contact_id;
end;
$$;
revoke all on function public.set_company_primary_contact(uuid,uuid,uuid) from public, anon, service_role;
grant execute on function public.set_company_primary_contact(uuid,uuid,uuid) to authenticated;
commit;
