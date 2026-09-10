begin;

alter table public.context_integrity_findings
  drop constraint if exists context_integrity_findings_resolution_reason;

alter table public.context_integrity_findings
  add constraint context_integrity_findings_resolution_reason
  check (
    resolution_reason is null
    or resolution_reason in (
      'kept_current_context',
      'source_belongs_elsewhere',
      'source_relinked',
      'current_value_confirmed',
      'observation_marked_historical',
      'dismissed_with_reason',
      'source_changed'
    )
  );

create or replace function public.resolve_context_integrity_finding_v1(
  target_finding_id uuid,
  expected_row_version integer,
  expected_finding_key text,
  target_reason text,
  target_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  finding_row public.context_integrity_findings%rowtype;
  actor_profile_id uuid;
  actor_role text;
  next_state text;
  normalized_note text;
  previous_state text;
begin
  actor_profile_id := public.current_profile_id();
  if actor_profile_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if target_finding_id is null
     or expected_row_version is null
     or expected_row_version < 1
     or nullif(btrim(expected_finding_key), '') is null then
    raise exception 'Invalid Context Integrity decision token' using errcode = '22023';
  end if;

  if target_reason not in (
    'kept_current_context',
    'source_belongs_elsewhere',
    'observation_marked_historical',
    'dismissed_with_reason'
  ) then
    raise exception 'Unsupported Context Integrity resolution reason' using errcode = '22023';
  end if;

  normalized_note := nullif(btrim(target_note), '');
  if normalized_note is not null and length(normalized_note) > 1000 then
    raise exception 'Context Integrity resolution note is too long' using errcode = '22023';
  end if;
  if target_reason = 'dismissed_with_reason'
     and (normalized_note is null or length(normalized_note) < 3) then
    raise exception 'Dismissal requires a reason' using errcode = '22023';
  end if;

  select *
  into finding_row
  from public.context_integrity_findings
  where id = target_finding_id
  for update;

  if not found or not public.can_access_business(finding_row.business_id) then
    raise exception 'Context Integrity finding unavailable' using errcode = '42501';
  end if;

  if finding_row.visibility_scope = 'owner_private'
     and finding_row.owner_profile_id is distinct from actor_profile_id then
    raise exception 'Private Context Integrity finding unavailable' using errcode = '42501';
  end if;

  actor_role := public.business_role_for_current_user(finding_row.business_id);

  if actor_role not in ('owner', 'admin', 'manager') then
    if actor_role <> 'member'
       or finding_row.opportunity_id is null
       or not exists (
         select 1
         from public.opportunities opportunity
         where opportunity.id = finding_row.opportunity_id
           and opportunity.business_id = finding_row.business_id
           and opportunity.owner_profile_id = actor_profile_id
       ) then
      raise exception 'Context Integrity resolution is not authorized' using errcode = '42501';
    end if;
  end if;

  if finding_row.state = 'superseded' then
    return jsonb_build_object(
      'status', 'conflict',
      'reason', 'finding_no_longer_active',
      'finding_id', finding_row.id
    );
  end if;

  if finding_row.row_version <> expected_row_version then
    return jsonb_build_object(
      'status', 'conflict',
      'reason', 'stale_version',
      'finding_id', finding_row.id,
      'current_row_version', finding_row.row_version
    );
  end if;

  if finding_row.finding_key <> btrim(expected_finding_key) then
    return jsonb_build_object(
      'status', 'conflict',
      'reason', 'finding_changed',
      'finding_id', finding_row.id,
      'current_row_version', finding_row.row_version
    );
  end if;

  previous_state := finding_row.state;
  next_state := case
    when target_reason = 'dismissed_with_reason' then 'dismissed'
    else 'resolved'
  end;

  update public.context_integrity_findings
  set
    state = next_state,
    row_version = row_version + 1,
    resolution_reason = target_reason,
    resolution_note = normalized_note,
    resolved_by_profile_id = actor_profile_id,
    resolved_at = now()
  where id = finding_row.id
    and row_version = expected_row_version
    and finding_key = btrim(expected_finding_key)
  returning * into finding_row;

  if not found then
    return jsonb_build_object(
      'status', 'conflict',
      'reason', 'compare_and_set_failed',
      'finding_id', target_finding_id
    );
  end if;

  insert into public.context_integrity_finding_events (
    business_id,
    finding_id,
    opportunity_id,
    visibility_scope,
    owner_profile_id,
    event_type,
    state_before,
    state_after,
    actor_profile_id,
    reason_code,
    note,
    case_key,
    finding_key,
    row_version,
    evidence_refs
  ) values (
    finding_row.business_id,
    finding_row.id,
    finding_row.opportunity_id,
    finding_row.visibility_scope,
    finding_row.owner_profile_id,
    'resolution_recorded',
    previous_state,
    finding_row.state,
    actor_profile_id,
    target_reason,
    normalized_note,
    finding_row.case_key,
    finding_row.finding_key,
    finding_row.row_version,
    finding_row.evidence_refs
  );

  return jsonb_build_object(
    'status', 'resolved',
    'finding_id', finding_row.id,
    'state', finding_row.state,
    'row_version', finding_row.row_version,
    'finding_key', finding_row.finding_key,
    'reason', finding_row.resolution_reason,
    'resolved_at', finding_row.resolved_at,
    'resolved_by_profile_id', actor_profile_id
  );
end;
$$;

revoke all on function public.resolve_context_integrity_finding_v1(
  uuid, integer, text, text, text
) from public, anon, service_role;

grant execute on function public.resolve_context_integrity_finding_v1(
  uuid, integer, text, text, text
) to authenticated;

commit;
