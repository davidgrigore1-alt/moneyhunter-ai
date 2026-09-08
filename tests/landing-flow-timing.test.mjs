import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function compile(file, dependencies = {}) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:id=>dependencies[id]});
 return module.exports;
}
const theatre=compile('src/lib/marketing/flow-timing.ts');
const {flowFrame,paintFlow}=compile('src/lib/marketing/landing-flow-timing.ts',{'./flow-timing':theatre});
test('target is pending until arrival, then processes before the next edge advances',()=>{
 const before=flowFrame(899,5,4700), arrival=flowFrame(900,5,4700), after=flowFrame(1100,5,4700);
 assert.equal(before.nodes[1],'pending'); assert.ok(before.edges[0]<1);
 assert.equal(arrival.nodes[1],'processing'); assert.equal(arrival.edges[0],1); assert.equal(arrival.active,1);
 assert.equal(after.nodes[1],'processing'); assert.equal(after.edges[1],0);
 assert.equal(flowFrame(1200,5,4700).nodes[1],'complete');
 assert.ok(flowFrame(1500,5,4700).edges[1]>.0);
 assert.equal(flowFrame(4700,5,4700).nodes[4],'review');
 for (const [index,time] of [900,1800,2700,3800].entries()) {
  assert.equal(flowFrame(time-1,5,4700).nodes[index+1],'pending');
  assert.equal(flowFrame(time,5,4700).edges[index],1);
  assert.notEqual(flowFrame(time,5,4700).nodes[index+1],'pending');
 }
});
test('a held clock preserves line, node and panel; resizing changes geometry only',()=>{
 const nodes=Array.from({length:2},()=>({dataset:{},style:{setProperty(){}}})); const panels=[{},{}];
 let length=100;const dot={style:{},setAttribute(key,value){this[key]=value;}};
 const path={dataset:{length:'100'},style:{},getPointAtLength:p=>({x:p,y:0})};
 const root={dataset:{},querySelectorAll:q=>q==='[data-flow-node]'?nodes:q==='[data-flow-panel]'?panels:q==='[data-flow-edge]'?[path]:[],querySelector:()=>dot};
 paintFlow(root,1500,3000); assert.equal(dot.cx,'50');assert.equal(nodes[1].dataset.flowState,'pending');assert.equal(panels[1].hidden,true);
 paintFlow(root,1500,3000);assert.equal(dot.cx,'50');
 length=200;path.dataset.length=String(length);paintFlow(root,1500,3000);assert.equal(dot.cx,'100');assert.equal(path.style.strokeDashoffset,'0.5');
 paintFlow(root,2000,3000);assert.equal(nodes[1].dataset.flowState,'review');assert.equal(panels[1].hidden,false);assert.equal(dot.style.opacity,'0');
});

test('human review receives a readable final dwell after the last connector arrives',()=>{
 const arrival=flowFrame(3800,5,4700);
 assert.equal(arrival.edges[3],1);
 assert.equal(arrival.nodes[4],'review');
 assert.equal(flowFrame(3799,5,4700).nodes[4],'pending');
 assert.equal(flowFrame(4700,5,4700).active,4);
});
