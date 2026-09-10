begin;

create or replace function public.reconcile_context_integrity_v1(
  target_business_id uuid,
  target_opportunity_id uuid,
  target_evaluated_at timestamptz,
  target_coverage_status text,
  detected_findings jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  item jsonb;
  existing_row public.context_integrity_findings%rowtype;
  case_key_value text;
  finding_key_value text;
  visibility_scope_value text;
  owner_profile_id_value uuid;
  evidence_refs_value jsonb;
  conflicting_ids_value text[];
  event_kind text;
  previous_state text;
  count_created integer := 0;
  count_observed integer := 0;
  count_changed integer := 0;
  count_reopened integer := 0;
  count_superseded integer := 0;
  count_held integer := 0;
  detected_case_keys text[] := '{}';
begin
  if target_business_id is null or target_opportunity_id is null then
    raise exception 'Context Integrity scope is required' using errcode = '22023';
  end if;

  if target_evaluated_at is null then
    raise exception 'Context Integrity evaluated_at is required' using errcode = '22023';
  end if;

  if target_coverage_status not in ('complete','partial','insufficient','unavailable') then
    raise exception 'Invalid Context Integrity coverage status' using errcode = '22023';
  end if;

  if detected_findings is null or jsonb_typeof(detected_findings) <> 'array' then
    raise exception 'detected_findings must be an array' using errcode = '22023';
  end if;

  if jsonb_array_length(detected_findings) > 32 then
    raise exception 'Too many Context Integrity findings' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.opportunities opportunity
    where opportunity.id = target_opportunity_id
      and opportunity.business_id = target_business_id
  ) then
    raise exception 'Context Integrity opportunity scope unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(detected_findings) element
    group by element->>'caseKey'
    having count(*) > 1
  ) then
    raise exception 'Duplicate Context Integrity case key' using errcode = '22023';
  end if;

  for item in
    select value
    from jsonb_array_elements(detected_findings)
    order by value->>'caseKey'
  loop
    case_key_value := nullif(btrim(item->>'caseKey'), '');
    finding_key_value := nullif(btrim(item->>'findingKey'), '');
    visibility_scope_value := item->>'visibilityScope';
    owner_profile_id_value := nullif(item->>'ownerProfileId', '')::uuid;
    evidence_refs_value := coalesce(item->'evidenceRefs', '[]'::jsonb);

    if case_key_value is null or length(case_key_value) > 2048 then
      raise exception 'Invalid Context Integrity case key' using errcode = '22023';
    end if;
    if finding_key_value is null or length(finding_key_value) > 4096 then
      raise exception 'Invalid Context Integrity finding key' using errcode = '22023';
    end if;
    if visibility_scope_value not in ('business','owner_private') then
      raise exception 'Invalid Context Integrity visibility' using errcode = '22023';
    end if;
    if visibility_scope_value = 'business' and owner_profile_id_value is not null then
      raise exception 'Business visibility cannot carry owner profile' using errcode = '22023';
    end if;
    if visibility_scope_value = 'owner_private' and owner_profile_id_value is null then
      raise exception 'Private visibility requires owner profile' using errcode = '22023';
    end if;
    if jsonb_typeof(evidence_refs_value) <> 'array' or jsonb_array_length(evidence_refs_value) > 6 then
      raise exception 'Invalid Context Integrity evidence refs' using errcode = '22023';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(evidence_refs_value) evidence
      where exists (
        select 1
        from jsonb_object_keys(evidence) key
        where key not in (
          'sourceType','sourceId','sourceRevision','sourceDocumentId',
          'sourceSegmentId','title','sourceLocation','occurredAt','provider'
        )
      )
    ) then
      raise exception 'Context Integrity evidence refs contain disallowed fields' using errcode = '22023';
    end if;

    conflicting_ids_value := array(
      select value
      from jsonb_array_elements_text(coalesce(item->'conflictingObservationIds', '[]'::jsonb))
      order by value
      limit 32
    );

    detected_case_keys := array_append(detected_case_keys, case_key_value);

    select *
    into existing_row
    from public.context_integrity_findings
    where business_id = target_business_id
      and case_key = case_key_value
    for update;

    if not found then
      insert into public.context_integrity_findings (
        business_id,
        opportunity_id,
        lifecycle_version,
        contract_version,
        case_key,
        finding_key,
        visibility_scope,
        owner_profile_id,
        kind,
        subject_type,
        subject_id,
        field,
        severity,
        evidence_strength,
        reason_code,
        safe_action,
        canonical_observation_id,
        conflicting_observation_ids,
        evidence_refs,
        state,
        row_version,
        detection_count,
        first_detected_at,
        last_detected_at,
        last_evaluated_at
      ) values (
        target_business_id,
        target_opportunity_id,
        item->>'lifecycleVersion',
        item->>'contractVersion',
        case_key_value,
        finding_key_value,
        visibility_scope_value,
        owner_profile_id_value,
        item->>'kind',
        item->>'subjectType',
        item->>'subjectId',
        item->>'field',
        item->>'severity',
        item->>'evidenceStrength',
        item->>'reasonCode',
        item->>'safeAction',
        item->>'canonicalObservationId',
        conflicting_ids_value,
        evidence_refs_value,
        'needs_review',
        1,
        1,
        target_evaluated_at,
        target_evaluated_at,
        target_evaluated_at
      )
      returning * into existing_row;

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
        case_key,
        finding_key,
        row_version,
        evidence_refs
      ) values (
        target_business_id,
        existing_row.id,
        target_opportunity_id,
        existing_row.visibility_scope,
        existing_row.owner_profile_id,
        'detected',
        null,
        existing_row.state,
        null,
        existing_row.case_key,
        existing_row.finding_key,
        existing_row.row_version,
        existing_row.evidence_refs
      );

      count_created := count_created + 1;
      continue;
    end if;

    previous_state := existing_row.state;

    if existing_row.finding_key = finding_key_value
       and existing_row.state <> 'superseded' then
      update public.context_integrity_findings
      set
        detection_count = detection_count + 1,
        last_detected_at = target_evaluated_at,
        last_evaluated_at = target_evaluated_at,
        evidence_refs = evidence_refs_value
      where id = existing_row.id
      returning * into existing_row;

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
        case_key,
        finding_key,
        row_version,
        evidence_refs
      ) values (
        target_business_id,
        existing_row.id,
        target_opportunity_id,
        existing_row.visibility_scope,
        existing_row.owner_profile_id,
        'observed',
        previous_state,
        existing_row.state,
        null,
        existing_row.case_key,
        existing_row.finding_key,
        existing_row.row_version,
        existing_row.evidence_refs
      );

      count_observed := count_observed + 1;
      continue;
    end if;

    if existing_row.state in ('resolved','dismissed','superseded') then
      event_kind := 'reopened';
      count_reopened := count_reopened + 1;
    else
      event_kind := 'changed';
      count_changed := count_changed + 1;
    end if;

    update public.context_integrity_findings
    set
      opportunity_id = target_opportunity_id,
      lifecycle_version = item->>'lifecycleVersion',
      contract_version = item->>'contractVersion',
      finding_key = finding_key_value,
      visibility_scope = visibility_scope_value,
      owner_profile_id = owner_profile_id_value,
      kind = item->>'kind',
      subject_type = item->>'subjectType',
      subject_id = item->>'subjectId',
      field = item->>'field',
      severity = item->>'severity',
      evidence_strength = item->>'evidenceStrength',
      reason_code = item->>'reasonCode',
      safe_action = item->>'safeAction',
      canonical_observation_id = item->>'canonicalObservationId',
      conflicting_observation_ids = conflicting_ids_value,
      evidence_refs = evidence_refs_value,
      state = 'needs_review',
      row_version = row_version + 1,
      detection_count = detection_count + 1,
      last_detected_at = target_evaluated_at,
      last_evaluated_at = target_evaluated_at,
      resolution_reason = null,
      resolution_note = null,
      resolved_by_profile_id = null,
      resolved_at = null
    where id = existing_row.id
    returning * into existing_row;

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
      case_key,
      finding_key,
      row_version,
      evidence_refs
    ) values (
      target_business_id,
      existing_row.id,
      target_opportunity_id,
      existing_row.visibility_scope,
      existing_row.owner_profile_id,
      event_kind,
      previous_state,
      existing_row.state,
      null,
      existing_row.case_key,
      existing_row.finding_key,
      existing_row.row_version,
      existing_row.evidence_refs
    );
  end loop;

  if target_coverage_status = 'complete' then
    for existing_row in
      select *
      from public.context_integrity_findings
      where business_id = target_business_id
        and opportunity_id = target_opportunity_id
        and state in ('open','needs_review')
        and not (case_key = any(detected_case_keys))
      order by case_key
      for update
    loop
      previous_state := existing_row.state;

      update public.context_integrity_findings
      set
        state = 'superseded',
        row_version = row_version + 1,
        last_evaluated_at = target_evaluated_at
      where id = existing_row.id
      returning * into existing_row;

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
        case_key,
        finding_key,
        row_version,
        evidence_refs
      ) values (
        target_business_id,
        existing_row.id,
        target_opportunity_id,
        existing_row.visibility_scope,
        existing_row.owner_profile_id,
        'superseded',
        previous_state,
        existing_row.state,
        null,
        existing_row.case_key,
        existing_row.finding_key,
        existing_row.row_version,
        existing_row.evidence_refs
      );

      count_superseded := count_superseded + 1;
    end loop;
  else
    select count(*)::integer
    into count_held
    from public.context_integrity_findings
    where business_id = target_business_id
      and opportunity_id = target_opportunity_id
      and state in ('open','needs_review')
      and not (case_key = any(detected_case_keys));
  end if;

  return jsonb_build_object(
    'status', 'saved',
    'created', count_created,
    'observed', count_observed,
    'changed', count_changed,
    'reopened', count_reopened,
    'superseded', count_superseded,
    'held', count_held,
    'cases', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', finding.id,
          'case_key', finding.case_key,
          'finding_key', finding.finding_key,
          'state', finding.state,
          'row_version', finding.row_version,
          'detection_count', finding.detection_count,
          'last_detected_at', finding.last_detected_at,
          'last_evaluated_at', finding.last_evaluated_at,
          'resolution_reason', finding.resolution_reason,
          'resolved_at', finding.resolved_at
        )
        order by finding.last_detected_at desc, finding.id
      )
      from public.context_integrity_findings finding
      where finding.business_id = target_business_id
        and finding.opportunity_id = target_opportunity_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.reconcile_context_integrity_v1(
  uuid, uuid, timestamptz, text, jsonb
) from public, anon, authenticated;

grant execute on function public.reconcile_context_integrity_v1(
  uuid, uuid, timestamptz, text, jsonb
) to service_role;

commit;
