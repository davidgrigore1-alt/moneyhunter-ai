begin;
-- safety-justification: Auth-derived role and tenant checks precede a company lock; creation,
-- primary selection and audit commit atomically without granting direct table writes.
create function public.create_company_primary_contact(target_business_id uuid, target_company_id uuid, request_contact_id uuid, contact_name text, contact_job_title text default null, contact_email text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare existing public.crm_contacts; clean_name text := btrim(contact_name); clean_job text := nullif(btrim(contact_job_title),''); clean_email text := nullif(lower(btrim(contact_email)),'');
begin
  if auth.uid() is null or public.current_profile_id() is null or coalesce(public.business_role_for_current_user(target_business_id),'') not in ('owner','admin','manager','member') then
    raise exception 'contact_creation_forbidden' using errcode = '42501';
  end if;
  if request_contact_id is null or clean_name is null or length(clean_name) not between 1 and 180 or length(clean_job) > 140 or length(clean_email) > 254 or (clean_email is not null and clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'contact_creation_invalid' using errcode = '22023';
  end if;
  perform 1 from public.crm_organizations where id=target_company_id and business_id=target_business_id and not is_archived for update;
  if not found then raise exception 'contact_creation_unavailable' using errcode = '42501'; end if;
  select * into existing from public.crm_contacts where id=request_contact_id;
  if found then
    if existing.business_id <> target_business_id or existing.organization_id is distinct from target_company_id or existing.full_name <> clean_name or existing.job_title is distinct from clean_job or existing.email is distinct from clean_email or not existing.is_active or existing.archived_at is not null then
      raise exception 'contact_request_conflict' using errcode = '42501';
    end if;
    -- A retry must not override a more recent primary-contact decision.
    return existing.id;
  end if;
  insert into public.crm_contacts(id,business_id,organization_id,full_name,normalized_name,job_title,email,normalized_email,is_active,is_primary_for_organization)
  values(request_contact_id,target_business_id,target_company_id,clean_name,lower(clean_name),clean_job,clean_email,clean_email,true,false);
  perform public.set_company_primary_contact(target_business_id,target_company_id,request_contact_id);
  return request_contact_id;
end;
$$;
revoke all on function public.create_company_primary_contact(uuid,uuid,uuid,text,text,text) from public,anon,service_role;
grant execute on function public.create_company_primary_contact(uuid,uuid,uuid,text,text,text) to authenticated;
commit;
