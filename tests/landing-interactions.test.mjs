import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const nativeRequire = createRequire(import.meta.url);
function load(relativePath) {
  const filename = path.resolve(relativePath);
  const source = fs.readFileSync(filename,"utf8");
  const compiled = ts.transpileModule(source,{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(compiled,{module,exports:module.exports,require(id) {
    if(id.endsWith('.css')) return {__esModule:true,default:new Proxy({}, {get:(_,name)=>String(name)})};
    if(id.startsWith('@/')) return load('src/'+id.slice(2)+'.ts');
    if(id.startsWith('./')) {
      const base=path.resolve(path.dirname(filename),id);
      const resolved=['.tsx','.ts'].map(ext=>base+ext).find(file=>fs.existsSync(file));
      if(resolved) return load(resolved);
    }
    return nativeRequire(id);
  }},{filename});
  return module.exports;
}
const { landingDemo, nextTheatreScene } = load('src/lib/marketing/demo.ts');
const { validateDemoRequest, isDemoRequestAccepted } = load('src/lib/marketing/demo-request.ts');
const { playbackReducer, staticPlayback, adjacentBeat, beatDuration } = load('src/lib/marketing/theatre-playback.ts');

test('E0 autoplay loops through five views and a soft reset in the approved duration',()=>{
  let state=playbackReducer(staticPlayback,{type:'start'});
  const visited=[state.beat];
  for(let i=0;i<12;i++) { state=playbackReducer(state,{type:'advance'}); visited.push(state.beat); }
  assert.deepEqual(visited,[0,1,2,3,4,5,0,1,2,3,4,5,0]);
  const duration=beatDuration.reduce((sum,value)=>sum+value,0);
  assert.ok(duration >= 18000 && duration <= 24000);
  assert.equal(state.mode,'playing');
});
test('E0 pause and manual selection stop advancement; reduced motion returns to the first query',()=>{
  let state=playbackReducer(staticPlayback,{type:'start'});
  state=playbackReducer(state,{type:'advance'});
  state=playbackReducer(state,{type:'pause'});
  assert.equal(playbackReducer(state,{type:'advance'}).beat,1);
  state=playbackReducer(state,{type:'toggle'});
  assert.equal(playbackReducer(state,{type:'advance'}).beat,2);
  state=playbackReducer(state,{type:'select',beat:3});
  assert.equal(playbackReducer(state,{type:'advance'}).beat,3);
  state=playbackReducer(state,{type:'reduce'});
  assert.equal(state.beat,0);
  assert.equal(state.mode,'complete');
  assert.equal(playbackReducer(state,{type:'advance'}),state);
  assert.equal(playbackReducer(state,{type:'toggle'}),state);
  assert.equal(adjacentBeat(4,'ArrowRight'),0);
  assert.equal(adjacentBeat(0,'ArrowLeft'),4);
  assert.equal(adjacentBeat(2,'Home'),0);
  assert.equal(adjacentBeat(2,'End'),4);
  assert.equal(adjacentBeat(2,'Tab'),2);
});

test('the server-rendered theatre starts with Intelligence and keeps Reports and editable work inert',()=>{
  const {ProductTheatre}=load('src/components/marketing/ProductTheatre.tsx');
  const html=renderToStaticMarkup(React.createElement(ProductTheatre));
  const scenes=Array.from(html.matchAll(/<section\b[^>]*data-view="(\d)"[^>]*>/g));
  assert.equal(scenes.length,5);
  const visible=scenes.filter(([tag])=>tag.includes('data-active="true"'));
  assert.equal(visible.length,1);
  assert.equal(visible[0][1],'0');
  for(const [tag,view] of scenes) {
    assert.ok(tag.includes(`aria-hidden="${view==='0'?'false':'true'}"`));
    assert.equal(tag.includes('inert=""'),view!=='0');
  }
  assert.match(html, /data-beat="0" data-running="false" data-enhanced="false"/);
  assert.equal(staticPlayback.beat,0);
  assert.equal(playbackReducer(staticPlayback,{type:'start'}).beat,0);
  assert.equal((html.match(/Scenariu de prezentare · companii și valori de exemplu/g)||[]).length,1);
  assert.equal((html.match(/Pregătit · revizuire necesară/g)||[]).length,1);
  assert.doesNotMatch(html,/ARR estimat|Spațiu demonstrativ|nu se trimite/);
});

test('the illustrative answer, company register and reports reconcile',()=>{
  const {theatreCompanies,portfolioTotal,reviewTotal,portfolioHistory}=load('src/lib/marketing/theatre-portfolio.ts');
  assert.equal(theatreCompanies.length,8);
  assert.equal(portfolioTotal,930000);
  assert.equal(reviewTotal,282000);
  assert.equal(theatreCompanies.filter(c=>c.status==='De revizuit').length,3);
  assert.equal(theatreCompanies.filter(c=>c.status==='În discuție').length,3);
  assert.equal(theatreCompanies.filter(c=>c.status==='Pas stabilit').length,2);
  assert.equal(portfolioHistory.at(-1).values.reduce((sum,value)=>sum+value,0)*1000,portfolioTotal);
  assert.ok(theatreCompanies.every(c=>c.domain.endsWith('.example') && Object.isFrozen(c)));
});

test('portfolio ring closes every boundary and covers exactly the eight companies',()=>{
  const {portfolioRingSegments,theatreSources}=load('src/lib/marketing/theatre-portfolio.ts');
  const segments=portfolioRingSegments();
  assert.equal(segments.reduce((sum,segment)=>sum+segment.percent,0),100);
  assert.deepEqual(Array.from(segments,segment=>segment.count),[3,3,2]);
  const coordinates=segments.map(segment=>{
    const match=segment.path.match(/^M([^A]+)A91,91 0 [01] 1 ([^L]+)L/);
    assert.ok(match,'each sector has an outer arc and a closed inner return');
    assert.ok(segment.path.endsWith('Z'));
    return {start:match[1].split(',').map(Number),end:match[2].split(',').map(Number)};
  });
  coordinates.forEach((sector,index)=>{
    const next=coordinates[(index+1)%coordinates.length];
    assert.ok(Math.hypot(sector.end[0]-next.start[0],sector.end[1]-next.start[1])<0.000001,'adjacent sectors meet without a missing wedge');
  });
  assert.ok(Object.isFrozen(theatreSources));
  assert.ok(theatreSources.every(source=>Object.isFrozen(source)));
});

test('public illustration is immutable and keeps source and money qualifiers',()=>{
  assert.ok(Object.isFrozen(landingDemo));
  assert.equal(landingDemo.amount,'42.000 RON');
  assert.equal(landingDemo.qualifier,'Valoare estimată');
  assert.equal(landingDemo.range,'A8:F8');
  assert.equal(landingDemo.row,8);
  assert.equal(landingDemo.preparedState,'prepared_not_executed');
  assert.throws(()=>{landingDemo.company='Changed';});
});
test('scene keyboard selection wraps, supports endpoints and ignores unrelated keys',()=>{
  assert.equal(nextTheatreScene(2,'ArrowRight'),0);
  assert.equal(nextTheatreScene(0,'ArrowLeft'),2);
  assert.equal(nextTheatreScene(1,'Home'),0);
  assert.equal(nextTheatreScene(0,'End'),2);
  assert.equal(nextTheatreScene(1,'Tab'),1);
});
test('demo intake requires only three fields and accepts personal email/international names',()=>{
  const values={name:"Łukasz O’Connor",email:'ana@gmail.com',company:'Atelier Nord',phone:'',goal:''};
  assert.deepEqual(Object.keys(validateDemoRequest(values)),[]);
  assert.deepEqual(Object.keys(validateDemoRequest({...values,name:' ',email:'',company:''})),['name','email','company']);
  assert.ok(validateDemoRequest({...values,email:'a@x.ro\nBcc:someone@x.ro'}).email);
  assert.ok(validateDemoRequest({...values,goal:'x'.repeat(2001)}).goal);
});
test('only an explicit accepted result with a receipt can lead to success',()=>{
  for(const result of [undefined,null,true,{}, {ok:true},{accepted:true},{accepted:true,receipt:''},{accepted:false,receipt:'x'}]) assert.equal(isDemoRequestAccepted(result),false);
  assert.equal(isDemoRequestAccepted({accepted:true,receipt:'isolated-test-receipt'}),true);
});
test('unconnected public form fails closed and renders accessible isolated statuses',()=>{
  const {DemoRequestForm,DemoSubmissionStatus}=load('src/components/marketing/DemoRequestForm.tsx');
  const html=renderToStaticMarkup(React.createElement(DemoRequestForm));
  assert.match(html,/Trimiterea nu este disponibilă momentan/);
  assert.match(html,/<button[^>]+type="submit"[^>]+disabled/);
  assert.doesNotMatch(html,/Solicitarea a fost preluată/);
  assert.match(html,/aria-describedby="demo-unavailable"/);
  assert.equal((html.match(/ required=""/g)||[]).length,3);
  assert.match(renderToStaticMarkup(React.createElement(DemoSubmissionStatus,{state:'error'})),/role="alert"/);
  assert.match(renderToStaticMarkup(React.createElement(DemoSubmissionStatus,{state:'pending'})),/role="status"/);
  assert.match(renderToStaticMarkup(React.createElement(DemoSubmissionStatus,{state:'success'})),/Solicitarea a fost preluată/);
});
test('landing has no provider or private-data boundary and all primary CTAs share one route',()=>{
  const root='src/components/marketing/';
  for(const file of ['ProductTheatre.tsx','TheatreScenes.tsx','WorkbookEvidence.tsx','WorkflowDemo.tsx','LandingChapters.tsx','LandingVisuals.tsx','ChapterMotion.tsx','DemoRequestForm.tsx','QualificationRouter.tsx']) {
    const source=fs.readFileSync(root+file,'utf8');
    assert.doesNotMatch(source,/fetch\(|localStorage|sessionStorage|supabase|openai|\/api\//i,file);
  }
  const page=fs.readFileSync('src/app/(marketing)/solicita-demo/page.tsx','utf8');
  assert.match(page,/<DemoRequestForm\s*\/>/);
  assert.equal(load('src/lib/marketing/conversion.ts').demoRequestHref,'/solicita-demo');
  for(const file of ['src/app/(marketing)/page.tsx',root+'MarketingNav.tsx',root+'LandingChapters.tsx']) assert.match(fs.readFileSync(file,'utf8'),/<DemoRequestLink/);
});

test('lower chapters render meaningful final states before client enhancement',()=>{
  const {LandingChapters}=load('src/components/marketing/LandingChapters.tsx');
  const html=renderToStaticMarkup(React.createElement(LandingChapters));
  assert.equal((html.match(/data-chapter-motion=/g)||[]).length,11);
  assert.equal((html.match(/data-phase="6" data-playing="false"/g)||[]).length,11);
  assert.doesNotMatch(html,/data-chapter-motion="fit"/);
  assert.equal((html.match(/<details\b/g)||[]).length,10);
  for(const id of ['produs','dovezi','executie','integrari','masurare','securitate','intrebari','urmatorul-pas','workbook-range']) assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/href="#workbook-range"/);
  assert.match(html,/Nu o încasare verificată/);
  assert.match(html,/Facturarea și încasarea rămân separat/);
  const order=["produs","ce-se-schimba","masurare","executie","integrari","dovezi","securitate","potrivire","incepem","intrebari","urmatorul-pas"].map(id=>html.indexOf(`id="${id}"`));
  assert.ok(order.every((position,index)=>index===0 || position>order[index-1]));
  assert.doesNotMatch(html,/<iframe|Redă|Parcurge|Pauză animație|Continuă animația/);
});

test('evidence and measurement preserve the approved illustrative case and source coordinates',()=>{
  const {WorkbookEvidence}=load('src/components/marketing/WorkbookEvidence.tsx');
  const {MeasurementScene}=load('src/components/marketing/LandingVisuals.tsx');
  const workbook=renderToStaticMarkup(React.createElement(WorkbookEvidence));
  const measurement=renderToStaticMarkup(React.createElement(MeasurementScene));
  assert.match(workbook,/Atelier Nord/);
  assert.match(workbook,/04 septembrie/);
  assert.match(workbook,/F8 · NOTA ORIGINALĂ/);
  assert.doesNotMatch(workbook,/<table|Meridian Systems|Vector Industrial/);
  assert.match(workbook,/versiunea 3/);
  assert.match(workbook,/A8:F8/);
  assert.match(measurement,/Orizont Service/);
  assert.match(measurement,/48\.000/);
  assert.match(measurement,/46\.000/);
  assert.match(measurement,/Radu Matei/);
  assert.match(measurement,/Nu o încasare verificată/);
  assert.match(measurement,/Reconcilierea automată a facturilor și plăților nu este disponibilă/);
});


test('qualification is bounded, distinguishes low fit and never grants CRM connectivity',()=>{
 const {qualify}=load('src/lib/marketing/qualification.ts');
 for(const process of ['offers','handoff','renewals','retail']) for(const context of ['files','crm','mixed']) for(const team of ['one','several']) {
  const result=qualify({process,context,team});
  for(const field of ['fit','risk','sources','reveal','prepare','decision','outcome']) assert.ok(result[field]?.length>15);
  if(process==='retail') assert.match(result.fit,/limitată/);
  if(context==='crm') assert.match(result.sources,/se validează înainte de activare/);
  assert.doesNotMatch(JSON.stringify(result),/venit garantat|integrare activă|analiză AI live/);
 }
});

test('source labels preserve pixel size, dwell for reading and travel one at a time',()=>{
 const {paintSources,sourceFrame}=load('src/lib/marketing/source-convergence.ts');
 const packet={ownerSVGElement:{clientWidth:1250,clientHeight:66},style:{},setAttribute(key,value){this[key]=value;}};
 const path={dataset:{},d:'M100 0V132',getAttribute(){return this.d},setAttribute(key,value){this.d=value},getTotalLength:()=>132,getPointAtLength:value=>({x:100,y:value})};
 const root={querySelectorAll:()=>[packet],querySelector:q=>q.includes('route')?path:null};
 paintSources(root,400,9500);
 assert.match(packet.transform,/scale\(0.8 2\)/);
 assert.equal(packet.style.opacity,'1');
 assert.equal(sourceFrame(829,9500,0).progress,0);
 assert.ok(sourceFrame(1000,9500,0).progress>0);
 assert.equal(sourceFrame(1480,9500,0).progress,1);
 for(let time=0;time<=9500;time+=25) {
  const states=Array.from({length:5},(_,i)=>sourceFrame(time,9500,i));
  assert.ok(states.filter(s=>s.active).length<=1);
 }
 assert.equal(sourceFrame(1800,9500,0).active,false);
 assert.equal(sourceFrame(1800,9500,1).active,false,'pause after the first arrival');
 paintSources(root,9500,9500);
 assert.equal(packet.style.opacity,'0');
 assert.equal(sourceFrame(9500,9500,4).merged,true);
 packet.ownerSVGElement.clientWidth=300;
 paintSources(root,1000,9500);
 assert.equal(path.d,'M500 0V132');
});

test('executive diagnostic starts with guidance and waits for an explicit submission',()=>{
 const {QualificationRouter}=load('src/components/marketing/QualificationRouter.tsx');
 const html=renderToStaticMarkup(React.createElement(QualificationRouter));
 assert.match(html,/data-diagnostic-state="introduction"/);
 assert.match(html,/Arată-mi unde se poate rupe execuția/);
 assert.match(html,/Cât din continuitate depinde de memoria echipei/);
 assert.doesNotMatch(html,/Unde poate apărea ruptura|Ce câștigă conducerea/);
 assert.match(html,/<button[^>]*type="submit"/);
 assert.equal((html.match(/<fieldset/g)||[]).length,3);
 assert.equal((html.match(/type="radio"/g)||[]).length,8);
});
