begin;

create table if not exists public.execution_integrity_findings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  lifecycle_version text not null,
  case_key text not null,
  finding_key text not null,
  code text not null,
  severity text not null,
  source_type text not null,
  source_id text not null,
  label text not null,
  explanation text not null,
  safe_action_label text not null,
  safe_action_href text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  state text not null default 'open',
  row_version integer not null default 1,
  detection_count integer not null default 1,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  last_evaluated_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint execution_integrity_case_key_length
    check (length(case_key) between 1 and 1024),
  constraint execution_integrity_finding_key_length
    check (length(finding_key) between 1 and 2048),
  constraint execution_integrity_code
    check (code in (
      'overdue_next_action',
      'missing_next_action',
      'unassigned_owner',
      'pending_approval',
      'prepared_document_not_advanced'
    )),
  constraint execution_integrity_severity
    check (severity in ('critical','attention')),
  constraint execution_integrity_source_type
    check (source_type in (
      'opportunity','action','approval','document'
    )),
  constraint execution_integrity_label_length
    check (length(label) between 1 and 180),
  constraint execution_integrity_explanation_length
    check (length(explanation) between 1 and 600),
  constraint execution_integrity_safe_action_label_length
    check (length(safe_action_label) between 1 and 120),
  constraint execution_integrity_safe_action_href
    check (
      length(safe_action_href) between 1 and 600
      and left(safe_action_href, 1) = '/'
    ),
  constraint execution_integrity_evidence_refs
    check (
      jsonb_typeof(evidence_refs) = 'array'
      and jsonb_array_length(evidence_refs) <= 6
    ),
  constraint execution_integrity_state
    check (state in ('open','resolved')),
  constraint execution_integrity_row_version
    check (row_version >= 1),
  constraint execution_integrity_detection_count
    check (detection_count >= 1),
  constraint execution_integrity_business_case
    unique (business_id, case_key)
);

create index if not exists execution_integrity_business_state_idx
  on public.execution_integrity_findings(
    business_id,
    state,
    first_detected_at
  );

create index if not exists execution_integrity_opportunity_idx
  on public.execution_integrity_findings(
    business_id,
    opportunity_id,
    state
  );

create table if not exists public.execution_integrity_finding_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  finding_id uuid not null references public.execution_integrity_findings(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  event_type text not null,
  state_before text,
  state_after text not null,
  case_key text not null,
  finding_key text not null,
  code text not null,
  row_version integer not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  constraint execution_integrity_event_type
    check (event_type in ('detected','changed','reopened','resolved')),
  constraint execution_integrity_event_state_before
    check (state_before is null or state_before in ('open','resolved')),
  constraint execution_integrity_event_state_after
    check (state_after in ('open','resolved')),
  constraint execution_integrity_event_row_version
    check (row_version >= 1),
  constraint execution_integrity_event_evidence_refs
    check (
      jsonb_typeof(evidence_refs) = 'array'
      and jsonb_array_length(evidence_refs) <= 6
    )
);

create index if not exists execution_integrity_events_finding_idx
  on public.execution_integrity_finding_events(
    finding_id,
    created_at desc
  );

create index if not exists execution_integrity_events_business_idx
  on public.execution_integrity_finding_events(
    business_id,
    created_at desc
  );

alter table public.execution_integrity_findings enable row level security;
alter table public.execution_integrity_finding_events enable row level security;

drop policy if exists "execution_integrity_findings_read"
  on public.execution_integrity_findings;

create policy "execution_integrity_findings_read"
on public.execution_integrity_findings
for select
to authenticated
using (
  public.can_access_business(business_id)
  and (
    public.business_role_for_current_user(business_id)
      in ('owner','admin','manager')
    or exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = opportunity_id
        and opportunity.business_id = business_id
        and opportunity.owner_profile_id = public.current_profile_id()
    )
  )
);

drop policy if exists "execution_integrity_events_read"
  on public.execution_integrity_finding_events;

create policy "execution_integrity_events_read"
on public.execution_integrity_finding_events
for select
to authenticated
using (
  public.can_access_business(business_id)
  and (
    public.business_role_for_current_user(business_id)
      in ('owner','admin','manager')
    or exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = opportunity_id
        and opportunity.business_id = business_id
        and opportunity.owner_profile_id = public.current_profile_id()
    )
  )
);

revoke all on table public.execution_integrity_findings
  from anon, authenticated, service_role;
revoke all on table public.execution_integrity_finding_events
  from anon, authenticated, service_role;

grant select on table public.execution_integrity_findings
  to authenticated;
grant select on table public.execution_integrity_finding_events
  to authenticated;

grant select, insert, update on table public.execution_integrity_findings
  to service_role;
grant select, insert on table public.execution_integrity_finding_events
  to service_role;

create or replace function public.reconcile_execution_integrity_workspace_v1(
  target_business_id uuid,
  target_evaluated_at timestamptz,
  evaluations jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  evaluation jsonb;
  finding jsonb;
  opportunity_id_value uuid;
  coverage_complete boolean;
  detected_case_keys text[];
  current_row public.execution_integrity_findings%rowtype;
  case_key_value text;
  finding_key_value text;
  evidence_refs_value jsonb;
  previous_state text;
  event_type_value text;
  count_created integer := 0;
  count_observed integer := 0;
  count_changed integer := 0;
  count_reopened integer := 0;
  count_resolved integer := 0;
  count_held integer := 0;
begin
  if target_business_id is null or target_evaluated_at is null then
    raise exception 'Execution Integrity scope is required'
      using errcode = '22023';
  end if;

  if evaluations is null or jsonb_typeof(evaluations) <> 'array' then
    raise exception 'Execution Integrity evaluations must be an array'
      using errcode = '22023';
  end if;

  if jsonb_array_length(evaluations) > 100 then
    raise exception 'Too many Execution Integrity evaluations'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(evaluations) item
    group by item->>'opportunityId'
    having count(*) > 1
  ) then
    raise exception 'Duplicate Execution Integrity opportunity evaluation'
      using errcode = '22023';
  end if;

  for evaluation in
    select value
    from jsonb_array_elements(evaluations)
    order by value->>'opportunityId'
  loop
    opportunity_id_value :=
      nullif(evaluation->>'opportunityId','')::uuid;
    coverage_complete :=
      coalesce((evaluation->>'coverageComplete')::boolean, false);

    if not exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = opportunity_id_value
        and opportunity.business_id = target_business_id
    ) then
      raise exception 'Execution Integrity opportunity scope unavailable'
        using errcode = '42501';
    end if;

    perform pg_advisory_xact_lock(
      hashtextextended(
        target_business_id::text || ':' || opportunity_id_value::text,
        0
      )
    );

    if jsonb_typeof(coalesce(evaluation->'findings','[]'::jsonb)) <> 'array'
       or jsonb_array_length(
         coalesce(evaluation->'findings','[]'::jsonb)
       ) > 8 then
      raise exception 'Invalid Execution Integrity finding set'
        using errcode = '22023';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(
        coalesce(evaluation->'findings','[]'::jsonb)
      ) item
      group by item->>'caseKey'
      having count(*) > 1
    ) then
      raise exception 'Duplicate Execution Integrity case key'
        using errcode = '22023';
    end if;

    detected_case_keys := '{}';

    for finding in
      select value
      from jsonb_array_elements(
        coalesce(evaluation->'findings','[]'::jsonb)
      )
      order by value->>'caseKey'
    loop
      case_key_value := nullif(btrim(finding->>'caseKey'),'');
      finding_key_value := nullif(btrim(finding->>'findingKey'),'');
      evidence_refs_value :=
        coalesce(finding->'evidenceRefs','[]'::jsonb);

      if case_key_value is null or length(case_key_value) > 1024 then
        raise exception 'Invalid Execution Integrity case key'
          using errcode = '22023';
      end if;

      if finding_key_value is null
         or length(finding_key_value) > 2048 then
        raise exception 'Invalid Execution Integrity finding key'
          using errcode = '22023';
      end if;

      if finding->>'version' <> 'execution-integrity/1' then
        raise exception 'Invalid Execution Integrity version'
          using errcode = '22023';
      end if;

      if finding->>'code' not in (
        'overdue_next_action',
        'missing_next_action',
        'unassigned_owner',
        'pending_approval',
        'prepared_document_not_advanced'
      ) then
        raise exception 'Unsupported Execution Integrity code'
          using errcode = '22023';
      end if;

      if finding->>'severity' not in ('critical','attention') then
        raise exception 'Invalid Execution Integrity severity'
          using errcode = '22023';
      end if;

      if finding->>'sourceType' not in (
        'opportunity','action','approval','document'
      ) then
        raise exception 'Invalid Execution Integrity source type'
          using errcode = '22023';
      end if;

      if nullif(btrim(finding->>'sourceId'),'') is null then
        raise exception 'Execution Integrity source id is required'
          using errcode = '22023';
      end if;

      if nullif(btrim(finding->>'label'),'') is null
         or length(finding->>'label') > 180 then
        raise exception 'Invalid Execution Integrity label'
          using errcode = '22023';
      end if;

      if nullif(btrim(finding->>'explanation'),'') is null
         or length(finding->>'explanation') > 600 then
        raise exception 'Invalid Execution Integrity explanation'
          using errcode = '22023';
      end if;

      if nullif(btrim(finding->>'safeActionLabel'),'') is null
         or length(finding->>'safeActionLabel') > 120 then
        raise exception 'Invalid Execution Integrity action label'
          using errcode = '22023';
      end if;

      if left(coalesce(finding->>'safeActionHref',''),1) <> '/'
         or length(finding->>'safeActionHref') > 600 then
        raise exception 'Invalid Execution Integrity action href'
          using errcode = '22023';
      end if;

      if jsonb_typeof(evidence_refs_value) <> 'array'
         or jsonb_array_length(evidence_refs_value) > 6 then
        raise exception 'Invalid Execution Integrity evidence refs'
          using errcode = '22023';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(evidence_refs_value) evidence
        where exists (
          select 1
          from jsonb_object_keys(evidence) key
          where key not in (
            'sourceType','sourceId','label','observedAt','href'
          )
        )
      ) then
        raise exception 'Execution Integrity evidence contains disallowed fields'
          using errcode = '22023';
      end if;

      detected_case_keys :=
        array_append(detected_case_keys, case_key_value);

      select *
      into current_row
      from public.execution_integrity_findings
      where business_id = target_business_id
        and case_key = case_key_value
      for update;

      if not found then
        insert into public.execution_integrity_findings (
          business_id,
          opportunity_id,
          lifecycle_version,
          case_key,
          finding_key,
          code,
          severity,
          source_type,
          source_id,
          label,
          explanation,
          safe_action_label,
          safe_action_href,
          evidence_refs,
          state,
          row_version,
          detection_count,
          first_detected_at,
          last_detected_at,
          last_evaluated_at
        ) values (
          target_business_id,
          opportunity_id_value,
          finding->>'version',
          case_key_value,
          finding_key_value,
          finding->>'code',
          finding->>'severity',
          finding->>'sourceType',
          finding->>'sourceId',
          finding->>'label',
          finding->>'explanation',
          finding->>'safeActionLabel',
          finding->>'safeActionHref',
          evidence_refs_value,
          'open',
          1,
          1,
          target_evaluated_at,
          target_evaluated_at,
          target_evaluated_at
        )
        returning * into current_row;

        insert into public.execution_integrity_finding_events (
          business_id,
          finding_id,
          opportunity_id,
          event_type,
          state_before,
          state_after,
          case_key,
          finding_key,
          code,
          row_version,
          evidence_refs
        ) values (
          target_business_id,
          current_row.id,
          opportunity_id_value,
          'detected',
          null,
          'open',
          current_row.case_key,
          current_row.finding_key,
          current_row.code,
          current_row.row_version,
          current_row.evidence_refs
        );

        count_created := count_created + 1;
        continue;
      end if;

      previous_state := current_row.state;

      if current_row.finding_key = finding_key_value
         and current_row.state = 'open' then
        update public.execution_integrity_findings
        set
          detection_count = detection_count + 1,
          last_detected_at = target_evaluated_at,
          last_evaluated_at = target_evaluated_at,
          evidence_refs = evidence_refs_value,
          updated_at = now()
        where id = current_row.id;

        count_observed := count_observed + 1;
        continue;
      end if;

      event_type_value :=
        case
          when current_row.state = 'resolved' then 'reopened'
          else 'changed'
        end;

      update public.execution_integrity_findings
      set
        finding_key = finding_key_value,
        code = finding->>'code',
        severity = finding->>'severity',
        source_type = finding->>'sourceType',
        source_id = finding->>'sourceId',
        label = finding->>'label',
        explanation = finding->>'explanation',
        safe_action_label = finding->>'safeActionLabel',
        safe_action_href = finding->>'safeActionHref',
        evidence_refs = evidence_refs_value,
        state = 'open',
        row_version = row_version + 1,
        detection_count = detection_count + 1,
        last_detected_at = target_evaluated_at,
        last_evaluated_at = target_evaluated_at,
        resolved_at = null,
        updated_at = now()
      where id = current_row.id
      returning * into current_row;

      insert into public.execution_integrity_finding_events (
        business_id,
        finding_id,
        opportunity_id,
        event_type,
        state_before,
        state_after,
        case_key,
        finding_key,
        code,
        row_version,
        evidence_refs
      ) values (
        target_business_id,
        current_row.id,
        opportunity_id_value,
        event_type_value,
        previous_state,
        'open',
        current_row.case_key,
        current_row.finding_key,
        current_row.code,
        current_row.row_version,
        current_row.evidence_refs
      );

      if event_type_value = 'reopened' then
        count_reopened := count_reopened + 1;
      else
        count_changed := count_changed + 1;
      end if;
    end loop;

    if coverage_complete then
      for current_row in
        select *
        from public.execution_integrity_findings
        where business_id = target_business_id
          and opportunity_id = opportunity_id_value
          and state = 'open'
          and not (case_key = any(detected_case_keys))
        order by case_key
        for update
      loop
        update public.execution_integrity_findings
        set
          state = 'resolved',
          row_version = row_version + 1,
          last_evaluated_at = target_evaluated_at,
          resolved_at = target_evaluated_at,
          updated_at = now()
        where id = current_row.id
        returning * into current_row;

        insert into public.execution_integrity_finding_events (
          business_id,
          finding_id,
          opportunity_id,
          event_type,
          state_before,
          state_after,
          case_key,
          finding_key,
          code,
          row_version,
          evidence_refs
        ) values (
          target_business_id,
          current_row.id,
          opportunity_id_value,
          'resolved',
          'open',
          'resolved',
          current_row.case_key,
          current_row.finding_key,
          current_row.code,
          current_row.row_version,
          current_row.evidence_refs
        );

        count_resolved := count_resolved + 1;
      end loop;
    else
      select count(*)::integer
      into count_held
      from public.execution_integrity_findings
      where business_id = target_business_id
        and opportunity_id = opportunity_id_value
        and state = 'open'
        and not (case_key = any(detected_case_keys));
    end if;
  end loop;

  return jsonb_build_object(
    'status','saved',
    'created',count_created,
    'observed',count_observed,
    'changed',count_changed,
    'reopened',count_reopened,
    'resolved',count_resolved,
    'held',count_held
  );
end;
$$;

revoke all on function public.reconcile_execution_integrity_workspace_v1(
  uuid, timestamptz, jsonb
) from public, anon, authenticated;

grant execute on function public.reconcile_execution_integrity_workspace_v1(
  uuid, timestamptz, jsonb
) to service_role;

commit;
