import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/marketing/flow-timing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});
const {flowFrame,paintFlow}=module.exports;
test('target is pending until arrival, then processes before the next edge advances',()=>{
 const before=flowFrame(1999,5,9000), arrival=flowFrame(2000,5,9000), after=flowFrame(2500,5,9000);
 assert.equal(before.nodes[1],'pending'); assert.ok(before.edges[0]<1);
 assert.equal(arrival.nodes[1],'processing'); assert.equal(arrival.edges[0],1); assert.equal(arrival.active,1);
 assert.equal(after.nodes[1],'processing'); assert.equal(after.edges[1],0);
 assert.equal(flowFrame(3000,5,9000).nodes[1],'complete');
 assert.ok(flowFrame(3500,5,9000).edges[1]>.0);
 assert.equal(flowFrame(9000,5,9000).nodes[4],'review');
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
