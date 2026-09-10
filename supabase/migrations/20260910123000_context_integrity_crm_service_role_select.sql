-- Context Integrity CI-1 requires server-side read access to resolve
-- tenant-scoped CRM organization identities. service_role is server-only;
-- no anon/authenticated privilege is broadened by this migration.
grant select on table public.crm_organizations to service_role;
