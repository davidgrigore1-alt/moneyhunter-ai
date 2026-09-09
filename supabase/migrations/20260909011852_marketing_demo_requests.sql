-- Platform acquisition records are not tenant CRM records. Public clients have no table access.
create table public.marketing_demo_requests (
  id uuid primary key,
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  company text not null check (length(company) between 1 and 180),
  phone text not null default '' check (length(phone) <= 50),
  goal text not null default '' check (length(goal) <= 2000),
  contact_consent_at timestamptz not null default now(),
  contact_notice_version text not null default 'demo-contact-v1',
  created_at timestamptz not null default now()
);
alter table public.marketing_demo_requests enable row level security;
revoke all on public.marketing_demo_requests from public, anon, authenticated, service_role;
grant select on public.marketing_demo_requests to authenticated;
grant select, insert on public.marketing_demo_requests to service_role;
create policy marketing_demo_requests_platform_read on public.marketing_demo_requests
  for select to authenticated using (public.has_platform_role('platform_admin'));
create index marketing_demo_requests_created_idx on public.marketing_demo_requests(created_at desc);
create index marketing_demo_requests_email_created_idx on public.marketing_demo_requests(email, created_at desc);

-- Invoker rights: only the server service role may insert through this bounded path.
create function public.capture_marketing_demo_request(p_id uuid, p_payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare existing public.marketing_demo_requests;
begin
  if p_id is null or p_payload is null or jsonb_typeof(p_payload) <> 'object'
    or p_payload->'contactConsent' is distinct from 'true'::jsonb
    or exists (select 1 from unnest(array['name','email','company','phone','goal']) k where jsonb_typeof(p_payload->k) is distinct from 'string')
    or length(btrim(p_payload->>'name')) not between 1 and 120
    or length(p_payload->>'email') not between 3 and 254
    or (p_payload->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(btrim(p_payload->>'company')) not between 1 and 180
    or length(p_payload->>'phone') > 50 or length(p_payload->>'goal') > 2000
  then return null; end if;

  -- Serialize the small public intake so concurrent requests cannot bypass rate bounds.
  perform pg_catalog.pg_advisory_xact_lock(724168923);
  select * into existing from public.marketing_demo_requests where id = p_id;
  if found then
    if row(existing.name,existing.email,existing.company,existing.phone,existing.goal)
      is not distinct from row(btrim(p_payload->>'name'),lower(btrim(p_payload->>'email')),btrim(p_payload->>'company'),btrim(p_payload->>'phone'),btrim(p_payload->>'goal'))
    then return existing.id; end if;
    return null;
  end if;
  if (select count(*) from public.marketing_demo_requests where created_at > now() - interval '1 hour') >= 120
    or (select count(*) from public.marketing_demo_requests where email=lower(btrim(p_payload->>'email')) and created_at > now() - interval '1 hour') >= 3
  then return null; end if;
  insert into public.marketing_demo_requests(id,name,email,company,phone,goal)
    values(p_id,btrim(p_payload->>'name'),lower(btrim(p_payload->>'email')),btrim(p_payload->>'company'),btrim(p_payload->>'phone'),btrim(p_payload->>'goal'));
  return p_id;
end;
$$;
revoke all on function public.capture_marketing_demo_request(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.capture_marketing_demo_request(uuid,jsonb) to service_role;
