begin;

-- Fix Communication OS trigger reuse across heterogeneous tables.
-- The original function referenced NEW.profile_id / NEW.created_by / NEW.owner_profile_id
-- inside a CASE expression. NEW is a record whose fields depend on the triggering table,
-- so communication_drafts could fail before the correct CASE branch was selected.
-- Using to_jsonb(NEW) preserves the existing authorization semantics without broadening access.

create or replace function public.validate_communication_os_scope()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  scoped_profile uuid;
begin
  scoped_profile := case
    when tg_table_name = 'communication_preferences'
      then nullif(to_jsonb(new)->>'profile_id', '')::uuid
    when tg_table_name = 'communication_templates'
      then nullif(to_jsonb(new)->>'created_by', '')::uuid
    when tg_table_name = 'communication_drafts'
      then nullif(to_jsonb(new)->>'owner_profile_id', '')::uuid
    when tg_table_name = 'sequence_enrollments'
      then nullif(to_jsonb(new)->>'owner_profile_id', '')::uuid
    when tg_table_name = 'communication_notifications'
      then nullif(to_jsonb(new)->>'recipient_profile_id', '')::uuid
    else null
  end;

  if scoped_profile is null then
    raise exception 'communication actor scope is missing'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.businesses business
    left join public.business_members member
      on member.business_id = business.id
      and member.profile_id = scoped_profile
      and member.status = 'active'
    where business.id = new.business_id
      and (
        business.owner_profile_id = scoped_profile
        or member.profile_id is not null
      )
  ) then
    raise exception 'communication actor must belong to the business'
      using errcode = '42501';
  end if;

  if tg_table_name = 'communication_drafts' then
    if not exists (
      select 1
      from public.external_connections connection
      where connection.id = new.connection_id
        and connection.business_id = new.business_id
        and connection.owner_profile_id = new.owner_profile_id
    ) then
      raise exception 'communication connection scope mismatch'
        using errcode = '42501';
    end if;

    if new.source_message_id is not null and not exists (
      select 1
      from public.external_email_messages message
      where message.id = new.source_message_id
        and message.business_id = new.business_id
        and message.owner_profile_id = new.owner_profile_id
        and message.connection_id = new.connection_id
    ) then
      raise exception 'communication source scope mismatch'
        using errcode = '42501';
    end if;

    if new.linked_contact_id is not null and not exists (
      select 1
      from public.crm_contacts item
      where item.id = new.linked_contact_id
        and item.business_id = new.business_id
    ) then
      raise exception 'communication contact scope mismatch'
        using errcode = '42501';
    end if;

    if new.linked_organization_id is not null and not exists (
      select 1
      from public.crm_organizations item
      where item.id = new.linked_organization_id
        and item.business_id = new.business_id
    ) then
      raise exception 'communication organization scope mismatch'
        using errcode = '42501';
    end if;

    if new.linked_opportunity_id is not null and not exists (
      select 1
      from public.opportunities item
      where item.id = new.linked_opportunity_id
        and item.business_id = new.business_id
    ) then
      raise exception 'communication opportunity scope mismatch'
        using errcode = '42501';
    end if;

  elsif tg_table_name = 'sequence_enrollments' then
    if not exists (
      select 1
      from public.outreach_sequences sequence
      where sequence.id = new.sequence_id
        and sequence.business_id = new.business_id
    ) then
      raise exception 'sequence enrollment scope mismatch'
        using errcode = '42501';
    end if;

    if new.opportunity_id is not null and not exists (
      select 1
      from public.opportunities item
      where item.id = new.opportunity_id
        and item.business_id = new.business_id
    ) then
      raise exception 'sequence opportunity scope mismatch'
        using errcode = '42501';
    end if;

    if new.contact_id is not null and not exists (
      select 1
      from public.crm_contacts item
      where item.id = new.contact_id
        and item.business_id = new.business_id
    ) then
      raise exception 'sequence contact scope mismatch'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_communication_os_scope()
  from public, anon, authenticated;

commit;

notify pgrst, 'reload schema';
