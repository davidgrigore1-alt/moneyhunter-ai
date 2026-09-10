begin;

-- First-time identity bootstrap uses the authenticated caller, not a definer
-- function or service role. Existing profiles_insert_own enforces user_id =
-- auth.uid(); the lookup/helper does not require a profile before INSERT.
-- Keep all generated identity, role and timestamp columns outside the grant.
revoke insert on public.profiles from public, anon, authenticated;
do $$
declare column_names text;
begin
  select string_agg(quote_ident(attname), ', ' order by attnum)
    into column_names from pg_attribute
    where attrelid = 'public.profiles'::regclass and attnum > 0 and not attisdropped;
  execute format('revoke insert (%s) on public.profiles from public, anon, authenticated', column_names);
end $$;
grant insert (user_id, full_name, email) on public.profiles to authenticated;

commit;
notify pgrst, 'reload schema';
