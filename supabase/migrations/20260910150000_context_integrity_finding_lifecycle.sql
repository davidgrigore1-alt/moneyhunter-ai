begin;

create table if not exists public.context_integrity_findings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  lifecycle_version text not null,
  contract_version text not null,
  case_key text not null,
  finding_key text not null,
  visibility_scope text not null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  subject_type text not null,
  subject_id text not null,
  field text not null,
  severity text not null,
  evidence_strength text not null,
  reason_code text not null,
  safe_action text not null,
  canonical_observation_id text not null,
  conflicting_observation_ids text[] not null default '{}',
  evidence_refs jsonb not null default '[]'::jsonb,
  state text not null default 'needs_review',
  row_version integer not null default 1,
  detection_count integer not null default 1,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  last_evaluated_at timestamptz not null default now(),
  resolution_reason text,
  resolution_note text,
  resolved_by_profile_id uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint context_integrity_findings_case_key_length
    check (length(case_key) between 1 and 2048),
  constraint context_integrity_findings_finding_key_length
    check (length(finding_key) between 1 and 4096),
  constraint context_integrity_findings_visibility
    check (visibility_scope in ('business','owner_private')),
  constraint context_integrity_findings_private_owner
    check (
      (visibility_scope = 'business' and owner_profile_id is null)
      or
      (visibility_scope = 'owner_private' and owner_profile_id is not null)
    ),
  constraint context_integrity_findings_state
    check (state in ('open','needs_review','resolved','dismissed','superseded')),
  constraint context_integrity_findings_row_version
    check (row_version >= 1),
  constraint context_integrity_findings_detection_count
    check (detection_count >= 1),
  constraint context_integrity_findings_evidence_array
    check (
      jsonb_typeof(evidence_refs) = 'array'
      and jsonb_array_length(evidence_refs) <= 6
    ),
  constraint context_integrity_findings_resolution_reason
    check (
      resolution_reason is null
      or resolution_reason in (
        'kept_current_context',
        'source_relinked',
        'current_value_confirmed',
        'observation_marked_historical',
        'dismissed_with_reason',
        'source_changed'
      )
    ),
  constraint context_integrity_findings_resolution_note_length
    check (resolution_note is null or length(resolution_note) <= 1000),
  constraint context_integrity_findings_human_resolution
    check (
      state not in ('resolved','dismissed')
      or (
        resolution_reason is not null
        and resolved_by_profile_id is not null
        and resolved_at is not null
      )
    ),
  constraint context_integrity_findings_business_case_key
    unique (business_id, case_key)
);

create index if not exists context_integrity_findings_business_state_idx
  on public.context_integrity_findings(business_id, state, last_detected_at desc);

create index if not exists context_integrity_findings_opportunity_idx
  on public.context_integrity_findings(business_id, opportunity_id, state);

create index if not exists context_integrity_findings_subject_idx
  on public.context_integrity_findings(business_id, subject_type, subject_id);

create table if not exists public.context_integrity_finding_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  finding_id uuid not null references public.context_integrity_findings(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  visibility_scope text not null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  state_before text,
  state_after text not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  reason_code text,
  note text,
  case_key text not null,
  finding_key text not null,
  row_version integer not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  constraint context_integrity_events_visibility
    check (visibility_scope in ('business','owner_private')),
  constraint context_integrity_events_private_owner
    check (
      (visibility_scope = 'business' and owner_profile_id is null)
      or
      (visibility_scope = 'owner_private' and owner_profile_id is not null)
    ),
  constraint context_integrity_events_type
    check (event_type in (
      'detected',
      'observed',
      'changed',
      'reopened',
      'resolution_recorded',
      'superseded'
    )),
  constraint context_integrity_events_state_before
    check (
      state_before is null
      or state_before in ('open','needs_review','resolved','dismissed','superseded')
    ),
  constraint context_integrity_events_state_after
    check (state_after in ('open','needs_review','resolved','dismissed','superseded')),
  constraint context_integrity_events_note_length
    check (note is null or length(note) <= 1000),
  constraint context_integrity_events_row_version
    check (row_version >= 1),
  constraint context_integrity_events_evidence_array
    check (
      jsonb_typeof(evidence_refs) = 'array'
      and jsonb_array_length(evidence_refs) <= 6
    )
);

create index if not exists context_integrity_events_finding_idx
  on public.context_integrity_finding_events(finding_id, created_at desc);

create index if not exists context_integrity_events_business_idx
  on public.context_integrity_finding_events(business_id, created_at desc);

create or replace function public.context_integrity_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.context_integrity_touch_updated_at()
  from public, anon, authenticated;

drop trigger if exists trg_context_integrity_findings_touch_updated_at
  on public.context_integrity_findings;

create trigger trg_context_integrity_findings_touch_updated_at
before update on public.context_integrity_findings
for each row execute function public.context_integrity_touch_updated_at();

alter table public.context_integrity_findings enable row level security;
alter table public.context_integrity_finding_events enable row level security;

drop policy if exists "context_integrity_findings_read" on public.context_integrity_findings;
create policy "context_integrity_findings_read"
on public.context_integrity_findings
for select
to authenticated
using (
  public.can_access_business(business_id)
  and (
    visibility_scope = 'business'
    or owner_profile_id = public.current_profile_id()
  )
);

drop policy if exists "context_integrity_events_read" on public.context_integrity_finding_events;
create policy "context_integrity_events_read"
on public.context_integrity_finding_events
for select
to authenticated
using (
  public.can_access_business(business_id)
  and (
    visibility_scope = 'business'
    or owner_profile_id = public.current_profile_id()
  )
);

revoke all on table public.context_integrity_findings from anon, authenticated, service_role;
revoke all on table public.context_integrity_finding_events from anon, authenticated, service_role;

grant select on table public.context_integrity_findings to authenticated;
grant select on table public.context_integrity_finding_events to authenticated;

grant select, insert, update on table public.context_integrity_findings to service_role;
grant select, insert on table public.context_integrity_finding_events to service_role;

commit;
