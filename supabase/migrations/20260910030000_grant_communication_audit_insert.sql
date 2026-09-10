begin;

-- Communication OS performs server-side audit writes after bounded draft mutations.
-- Least privilege: only INSERT is required by the server runtime; no browser role,
-- no SELECT privilege, and no tenant policy is widened here.
grant insert on table public.audit_logs to service_role;

commit;

notify pgrst, 'reload schema';
