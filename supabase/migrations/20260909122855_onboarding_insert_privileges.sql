begin;

-- Onboarding uses the authenticated server caller. Existing RLS checks the
-- canonical owner_profile_id against current_profile_id(), and the child rows
-- against owns_business(). No policy or ownership predicate is widened here.
grant insert (
  id, owner_profile_id, name, legal_name, cui, website, industry,
  country_code, administrative_area_code, company_phone_e164, postal_code,
  city, county, average_contract_value, current_sales_process, notification_email
) on public.businesses to authenticated;

-- Only a canonical owner may bootstrap its own owner membership under the
-- existing business_members_insert_authorized policy. Replay does nothing on
-- conflict, so it needs no UPDATE privilege and cannot rewrite membership.
grant insert (business_id, profile_id, role) on public.business_members to authenticated;
grant insert (business_id, name) on public.business_services to authenticated;
grant insert (business_id, target_type, value) on public.business_targets to authenticated;

commit;
notify pgrst, 'reload schema';
