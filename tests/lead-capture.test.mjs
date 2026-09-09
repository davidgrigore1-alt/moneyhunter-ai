import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
function load(file,mocks={}) {const mod={exports:{}};const full=path.resolve(file);vm.runInNewContext(ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,require(spec){if(spec in mocks)return mocks[spec];return load(spec.startsWith('@/')?'src/'+spec.slice(2)+'.ts':path.resolve(path.dirname(full),spec+'.ts'),mocks);},Object,Array,String,RegExp});return mod.exports;}
const valid={requestId:'aa111111-1111-4111-8111-111111111111',name:' Ana ',email:' ANA@EXAMPLE.COM ',company:' Firmă ',phone:'',goal:'Oferte fără răspuns',contactConsent:true,website:''};
const {parseLeadCapture}=load('src/lib/marketing/lead-capture.ts');
test('public intake validates shape, consent, honeypot, bounds and normalizes without inventing fields',()=>{
  assert.equal(parseLeadCapture(valid).email,'ana@example.com');assert.equal(parseLeadCapture(valid).name,'Ana');
  for(const value of [null,[],{}, {...valid,contactConsent:false},{...valid,website:'spam'},{...valid,name:[]},{...valid,requestId:'bad'},{...valid,email:'a@b.ro\nBcc:a@c.ro'},{...valid,goal:'x'.repeat(2001)},{...valid,phone:'\0'}])assert.equal(parseLeadCapture(value),null);
});
test('only a matching persisted receipt is success; invalid requests never reach privileged client',async()=>{
  let calls=0;let response={data:valid.requestId,error:null};
  const {submitDemoRequest}=load('src/lib/marketing/lead-capture-actions.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient(){calls++;return {rpc:async(name,args)=>{assert.equal(name,'capture_marketing_demo_request');assert.equal(args.p_payload.email,'ana@example.com');assert.equal('business_id' in args.p_payload,false);return response;}};}}});
  assert.equal((await submitDemoRequest({})).accepted,false);assert.equal(calls,0);
  assert.equal((await submitDemoRequest(valid)).accepted,true);
  for(const r of [{data:null,error:null},{data:'other-receipt',error:null},{data:valid.requestId,error:{message:'private'}}]){response=r;assert.equal((await submitDemoRequest(valid)).accepted,false);}
});
test('unconfigured persistence and thrown provider errors fail closed',async()=>{
  for(const createSupabaseAdminClient of [()=>null,()=>{throw Error('secret error');}]){const {submitDemoRequest}=load('src/lib/marketing/lead-capture-actions.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient}});assert.deepEqual(JSON.parse(JSON.stringify(await submitDemoRequest(valid))),{accepted:false});}
});

test('internal review denies before reading and escapes captured text for platform admin',async()=>{
  let allowed=false;let reads=0;
  const mod={exports:{}};
  const mocks={
    'react/jsx-runtime':jsxRuntime,
    '@/lib/authz/get-authorization-context':{getAuthorizationContext:async()=>({})},
    '@/lib/authz/has-permission':{hasPermission:()=>allowed},
    '@/components/authz/ForbiddenState':{ForbiddenState:()=>jsxRuntime.jsx('p',{children:'Forbidden'})},
    '@/components/dashboard/PageShell':{PageShell:({children})=>jsxRuntime.jsx('main',{children})},
    '@/lib/supabase/server':{createSupabaseServerClient:async()=>{reads++;return {from:()=>({select:()=>({order:()=>({limit:async count=>{assert.equal(count,100);return {data:[{id:'fixture',name:'<script>untrusted</script>',company:'Fixture',email:'fixture@example.invalid',phone:'',goal:'<img src=x onerror=alert(1)>',created_at:'2026-09-09T00:00:00Z'}],error:null};}})})})};}}
  };
  const code=ts.transpileModule(fs.readFileSync('src/app/(protected)/admin/leads/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code,{module:mod,exports:mod.exports,require:spec=>{assert.ok(spec in mocks,spec);return mocks[spec];},Date});
  assert.match(renderToStaticMarkup(await mod.exports.default()),/Forbidden/);assert.equal(reads,0);
  allowed=true;const html=renderToStaticMarkup(await mod.exports.default());
  assert.equal(reads,1);assert.match(html,/&lt;script&gt;untrusted/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<script>|<img/);
});
