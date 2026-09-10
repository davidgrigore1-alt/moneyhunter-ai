// Real Auth + PostgREST + Next route verification; localhost only, disposable users.
// Requires the local app on port 3001. --expect-denied reproduces the missing grant.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { createLocalAdminClient, runLocalSql } from '../demo/local-supabase.mjs';

const { local, client: admin } = createLocalAdminClient();
const users = [];
const businesses = [];
const expectDenied = process.argv.includes('--expect-denied');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
async function account() {
  const email = `ftue-${randomUUID()}@example.test`;
  const password = `Ftue!${randomUUID()}aA9`;
  const client = createClient(local.apiUrl, local.anonKey, options);
  const signup = await client.auth.signUp({ email, password });
  assert.equal(signup.error, null, 'normal local signup succeeds');
  users.push(signup.data.user.id);
  assert.ok(signup.data.session, 'local supported auto-confirm signup supplies a session');
  const jar = new Map();
  const server = createServerClient(local.apiUrl, local.anonKey, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) }
  });
  assert.equal((await server.auth.signInWithPassword({ email, password })).error, null);
  return { client, id: signup.data.user.id, email,
    cookie: () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ') };
}
const count = id => Number(runLocalSql(`select count(*) from public.profiles where user_id='${id}'::uuid`));
const bootstrap = a => fetch('http://localhost:3001/auth/bootstrap', {
  headers: { cookie: a.cookie() }, redirect: 'manual'
});
try {
  const a = await account();
  assert.equal(count(a.id), 0, 'fixture has no pre-seeded profile');
  const first = await bootstrap(a);
  assert.equal(first.status, 307);
  if (expectDenied) {
    assert.match(first.headers.get('location'), /bootstrap\/retry\?reason=profile_rls_denied/);
    assert.equal(count(a.id), 0);
    console.log('PASS: real signup/session -> real app bootstrap reproduces missing INSERT privilege.');
  } else {
    assert.equal(new URL(first.headers.get('location')).pathname, '/onboarding');
    assert.equal(count(a.id), 1);
    for (let i = 0; i < 2; i++) {
      assert.equal(new URL((await bootstrap(a)).headers.get('location')).pathname, '/onboarding');
      assert.equal(count(a.id), 1, 'bootstrap replay keeps exactly one profile');
    }
    const own = await a.client.from('profiles').select('id,user_id,full_name,email,role').single();
    assert.equal(own.error, null);
    assert.equal(own.data.user_id, a.id);
    assert.equal(own.data.email, a.email);
    assert.equal(own.data.role, null);
    const b = await account();
    const payload = { user_id: a.id, full_name: 'Unauthorized replacement', email: b.email };
    assert.equal((await b.client.from('profiles').insert(payload)).error?.code, '42501');
    const update = await b.client.from('profiles').update({ full_name: 'Unauthorized replacement' }).eq('id', own.data.id).select('id');
    assert.equal(update.error, null);
    assert.deepEqual(update.data, [], 'other user cannot update the profile');
    const anon = createClient(local.apiUrl, local.anonKey, options);
    assert.equal((await anon.from('profiles').insert(payload)).error?.code, '42501');
    for (const role of ['admin', 'business_owner']) {
      assert.equal((await b.client.from('profiles').insert({ ...payload, user_id: b.id, role })).error?.code, '42501');
      assert.equal((await a.client.from('profiles').update({ role }).eq('id', own.data.id)).error?.code, '42501');
    }
    assert.equal((await b.client.from('profiles').insert({ ...payload, user_id: b.id, id: randomUUID() })).error?.code, '42501');
    assert.equal((await a.client.from('profiles').update({ user_id: b.id }).eq('id', own.data.id)).error?.code, '42501');
    assert.equal((await a.client.from('profiles').insert({ user_id: a.id, full_name: 'Duplicate', email: `duplicate-${a.email}` })).error?.code, '23505');
    assert.equal(count(a.id), 1);
    assert.equal(count(b.id), 0);
    const businessId = randomUUID();
    const businessPayload = { id: businessId, owner_profile_id: own.data.id, name: 'Disposable FTUE verification', industry: 'IT', city: 'București' };
    assert.equal((await b.client.from('businesses').insert(businessPayload)).error?.code, '42501');
    assert.equal((await anon.from('businesses').insert(businessPayload)).error?.code, '42501');
    assert.equal((await a.client.from('businesses').insert(businessPayload)).error, null);
    businesses.push(businessId);
    const member = { business_id: businessId, profile_id: own.data.id, role: 'owner' };
    for (let i = 0; i < 2; i++) {
      assert.equal((await a.client.from('business_members').upsert(member, { onConflict: 'business_id,profile_id', ignoreDuplicates: true })).error, null);
    }
    assert.equal((await b.client.from('business_members').insert(member)).error?.code, '42501');
    assert.equal((await a.client.from('business_members').update({ role: 'admin' }).eq('business_id', businessId)).error?.code, '42501');
    for (const [table, values] of [
      ['business_services', { business_id: businessId, name: 'Test service' }],
      ['business_targets', { business_id: businessId, target_type: 'city', value: 'București' }]
    ]) {
      assert.equal((await b.client.from(table).insert(values)).error?.code, '42501');
      assert.equal((await anon.from(table).insert(values)).error?.code, '42501');
      assert.equal((await a.client.from(table).insert(values)).error, null);
    }
    assert.equal((await a.client.from('platform_user_roles').insert({ profile_id: own.data.id, role: 'platform_admin' })).error?.code, '42501');
    assert.equal(Number(runLocalSql(`select count(*) from public.business_members where business_id='${businessId}' and profile_id='${own.data.id}' and role='owner'`)), 1);
    assert.equal(Number(runLocalSql(`select count(*) from public.opportunities where business_id='${businessId}'`)), 0);
    console.log('PASS: canonical workspace ownership, owner membership replay, setup inserts, cross-user/anon setup denial, no membership rewrite or platform elevation, zero opportunities.');
    console.log('PASS: fresh normal signup/session, real app bootstrap, own identity, two replays, onboarding redirect, cross-user/anon denial, protected role/id/user_id, unique profile.');
  }
} finally {
  for (const id of businesses) runLocalSql(`delete from public.businesses where id='${id}'::uuid and owner_profile_id in (select id from public.profiles where user_id in (${users.map(user => `'${user}'::uuid`).join(',')}));`);
  for (const id of users.reverse()) {
    const result = await admin.auth.admin.deleteUser(id);
    assert.equal(result.error, null, 'delete only this run\'s disposable auth fixture');
    assert.equal(count(id), 0, 'fixture profile cascades away');
  }
  console.log('PASS: this run\'s fixtures removed; existing users/workspaces untouched.');
}
