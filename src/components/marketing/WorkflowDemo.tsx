"use client";
import { useEffect, useRef } from "react";
import { BoltIcon, DocumentTextIcon, QuestionMarkCircleIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import { paintFlow } from "@/lib/marketing/flow-timing";
import s from "./chapters.module.css";
const steps = [
 {title:"Revenire după termen",detail:"04 septembrie · termen promis",icon:BoltIcon,input:"Promisiune consemnată în Pipeline.xlsx",output:"Verifică dacă discuția a continuat."},
 {title:"Dovada este asociată",detail:"Oferte · A8:F8 · versiunea 3",icon:DocumentTextIcon,input:"Conversație Gmail și nota din registru",output:"Termenul este citat în sursă."},
 {title:"Context suficient?",detail:"Verifică înainte de pregătire",icon:QuestionMarkCircleIcon,input:"Termen, responsabil, continuare disponibilă",output:"În acest caz: context pentru un draft."},
 {title:"Revenire pregătită",detail:"Propunere editabilă",icon:SparklesIcon,input:"Contextul cazului Atelier Nord",output:"Confirmă următorul pas și interlocutorul."},
 {title:"Revizuire umană",detail:"Ana Popescu decide",icon:ShieldCheckIcon,input:"Draft și dovezile pe care se bazează",output:"Așteaptă verificarea și decizia Anei."}
];
export function WorkflowDemo() {
 const graph=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=graph.current; if(!root)return;
  const measure=()=>{
   const nodes=Array.from(root.querySelectorAll<HTMLElement>("[data-flow-node]"));
   const svg=root.querySelector("svg[data-connectors]"); if(!svg)return;
   svg.setAttribute("viewBox",`0 0 ${root.clientWidth} ${root.clientHeight}`);
   nodes.slice(0,-1).forEach((node,i)=>{
    const next=nodes[i+1], mobile=root.clientWidth<540;
    const x=node.offsetLeft+node.offsetWidth,y=node.offsetTop+node.offsetHeight/2;
    const nx=next.offsetLeft,ny=next.offsetTop+next.offsetHeight/2;
    const d=mobile ? `M${node.offsetLeft+28},${node.offsetTop+node.offsetHeight}V${next.offsetTop}` : ny===y ? `M${x},${y}H${nx}` : `M${x},${y}h16q8 0 8 8v${(ny-y)/2-16}q0 8 -8 8H${nx-16}q-8 0 -8 8v${(ny-y)/2-16}q0 8 8 8H${nx}`;
    root.querySelectorAll<SVGPathElement>(`[data-link="${i}"]`).forEach(path=>{path.setAttribute("d",d);if(path.hasAttribute("data-flow-edge"))path.dataset.length=String(path.getTotalLength());});
   });
   const question=nodes[2], branch=root.querySelector<HTMLElement>("[data-clarification-node]");
   if(branch) { const x=question.offsetLeft+question.offsetWidth/2,y=question.offsetTop+question.offsetHeight,nx=branch.offsetLeft+branch.offsetWidth/2,ny=branch.offsetTop; root.querySelector("path[data-clarification]")?.setAttribute("d",`M${x},${y}V${(y+ny)/2}H${nx}V${ny}`); }
  const clock=root.closest<HTMLElement>("[data-chapter-motion]"); if(clock?.dataset.flowDuration) paintFlow(clock,Number(clock.dataset.flowElapsed),Number(clock.dataset.flowDuration));
  };
  const observer=new ResizeObserver(measure);observer.observe(root);measure();return()=>observer.disconnect();
 },[]);
 return <ChapterMotion name="workflow" className={s.workflow} duration={10800}>
  <div className={s.workflowTop}><strong>Revenire după ofertă</strong><span>Un caz · cinci etape</span><span>Revizuire necesară</span></div>
  <div className={s.engineBody}><div className={s.engineCanvas}>
   <div className={s.flowCase}><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div><span>42.000 <small>RON · estimat</small></span></div>
   <div ref={graph} className={s.engineGraph}>
    <svg data-connectors className={s.engineWires} aria-hidden="true"><path data-clarification/>{steps.slice(1).map((_,i)=><path key={`base${i}`} data-link={i} />)}{steps.slice(1).map((_,i)=><path key={i} data-link={i} data-flow-edge={i} pathLength="1" />)}{steps.slice(1).map((_,i)=><circle key={`dot${i}`} data-flow-dot={i} r="3" opacity="0" />)}</svg>
    {steps.map((step,i)=><div className={s.engineNode} data-flow-node={i} data-flow-state={i===4?"review":"complete"} key={step.title}><i className={s.enginePortIn}/><step.icon aria-hidden="true"/><div><small>0{i+1} / {i===4?"DECIZIE" : i===2?"CONDIȚIE":"PROCES"}</small><h3>{step.title}</h3><p>{step.detail}</p></div><i className={s.enginePortOut}/></div>)}
    <div className={s.clarificationBranch} data-clarification-node><span>Nu · context insuficient</span><strong>Cere clarificări</strong><small>Pregătirea rămâne oprită.</small></div>
   </div>
  </div><aside className={s.engineInspector}>{steps.map((step,i)=><div key={step.title} data-flow-panel={i} hidden={i!==4}><span className={s.miniLabel}>ETAPA 0{i+1}</span><step.icon aria-hidden="true"/><h3>{step.title}</h3><dl><dt>Intrare</dt><dd>{step.input}</dd><dt>Ieșire</dt><dd>{step.output}</dd></dl></div>)}<div className={s.engineAuthority}><PersonAvatar/><span>Ana Popescu<small>Decizia îi aparține.</small></span></div></aside></div>
  <div className={s.engineFoot}><strong>La revizuire</strong><span>Aprobă intern · lucru pregătit</span><span>Cere context · revizuire deschisă</span><small>Alternative posibile, încă neselectate.</small></div>
 </ChapterMotion>;
}
