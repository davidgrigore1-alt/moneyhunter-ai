"use client";
import { useEffect, useRef } from "react";
import { BoltIcon, DocumentTextIcon, QuestionMarkCircleIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import { paintFlow } from "@/lib/marketing/landing-flow-timing";
import s from "./reference.module.css";
import Image from "next/image";
import { ExcelMark } from "./MarketingEntityMark";
const steps = [
 {title:"Revenire după termen",detail:"04 septembrie · termen promis",icon:BoltIcon,input:"Promisiune consemnată în Pipeline.xlsx",check:"Compară termenul citat cu data cazului.",output:"Revenire după termen, de verificat."},
 {title:"Dovada este asociată",detail:"Oferte · A8:F8 · versiunea 3",icon:DocumentTextIcon,input:"Conversație Gmail și nota din registru",check:"Identifică versiunea și fragmentul exact.",output:"Termenul este citat în sursă."},
 {title:"Există un pas confirmat?",detail:"Continuarea nu este consemnată",icon:QuestionMarkCircleIcon,input:"Termen, responsabil, continuare disponibilă",check:"Caută un pas ulterior confirmat în contextul permis.",output:"Lipsa unei continuări cere o clarificare în draft."},
 {title:"Revenire pregătită",detail:"Propunere editabilă",icon:SparklesIcon,input:"Contextul cazului Atelier Nord",check:"Păstrează lipsurile explicite; nu presupune răspunsul.",output:"Confirmă următorul pas și interlocutorul."},
 {title:"Revizuire umană",detail:"Ana Popescu decide",icon:ShieldCheckIcon,input:"Draft și dovezile pe care se bazează",check:"Persoana autorizată verifică propunerea și sursele.",output:"Așteaptă verificarea și decizia Anei."}
];
export function WorkflowDemo() {
 const graph=useRef<HTMLDivElement>(null);
 const inspect = (index: number) => {
  const clock=graph.current?.closest<HTMLElement>("[data-chapter-motion]");
  if (!clock || clock.dataset.phase !== "6") return;
  clock.dataset.inspectedNode=String(index);
  paintFlow(clock,Number(clock.dataset.flowDuration),Number(clock.dataset.flowDuration));
 };
 useEffect(()=>{
  const root=graph.current; if(!root)return;
  const measure=()=>{
   const nodes=Array.from(root.querySelectorAll<HTMLElement>("[data-flow-node]"));
   const svg=root.querySelector("svg[data-connectors]"); if(!svg)return;
   svg.setAttribute("viewBox",`0 0 ${root.clientWidth} ${root.clientHeight}`);
   nodes.slice(0,-1).forEach((node,i)=>{
    const next=nodes[i+1], mobile=getComputedStyle(root).display==="flex";
    const x=node.offsetLeft+node.offsetWidth,y=node.offsetTop+node.offsetHeight/2;
    const nx=next.offsetLeft,ny=next.offsetTop+next.offsetHeight/2;
    const d=mobile ? `M${node.offsetLeft+30},${node.offsetTop+node.offsetHeight}V${next.offsetTop}` : ny===y ? `M${x},${y}H${nx}` : `M${x},${y}h16q8 0 8 8v${(ny-y)/2-16}q0 8 -8 8H${nx-16}q-8 0 -8 8v${(ny-y)/2-16}q0 8 8 8H${nx}`;
    root.querySelectorAll<SVGPathElement>(`[data-link="${i}"]`).forEach(path=>{path.setAttribute("d",d);if(path.hasAttribute("data-flow-edge"))path.dataset.length=String(path.getTotalLength());});
   });
  const clock=root.closest<HTMLElement>("[data-chapter-motion]"); if(clock?.dataset.flowDuration) paintFlow(clock,Number(clock.dataset.flowElapsed),Number(clock.dataset.flowDuration));
  };
  const observer=new ResizeObserver(measure);observer.observe(root);measure();return()=>observer.disconnect();
 },[]);
 return <ChapterMotion name="workflow" className={s.workflow} duration={4700}>
  <div className={s.workflowTop}><strong>Revenire după ofertă</strong><span>Un caz · cinci etape</span><span>Revizuire necesară</span></div>
  <div className={s.engineBody}><div className={s.engineCanvas}>
   <div className={s.flowCase}><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div><span>42.000 <small>RON · estimat</small></span></div>
   <div ref={graph} className={s.engineGraph}>
    <svg data-connectors className={s.engineWires} aria-hidden="true">{steps.slice(1).map((_,i)=><path key={`base${i}`} data-link={i} />)}{steps.slice(1).map((_,i)=><path key={i} data-link={i} data-flow-edge={i} pathLength="1" />)}{steps.slice(1).map((_,i)=><circle key={`dot${i}`} data-flow-dot={i} r="3" opacity="0" />)}</svg>
    {steps.map((step,i)=><div className={s.engineNode} data-flow-node={i} data-flow-state={i===4?"review":"complete"} key={step.title}><i className={s.enginePortIn}/><step.icon aria-hidden="true"/><div><small>0{i+1} / {["SEMNAL","DOVADĂ","VERIFICARE","PAS PREGĂTIT","DECIZIE"][i]}</small><h3><button type="button" onClick={()=>inspect(i)} aria-label={`Inspectează etapa ${i+1}: ${step.title}`}>{step.title}</button></h3><p>{step.detail}</p><span className={s.nodeOutput}>{i===0?<><Image src="/brands/google/gmail.svg" width={22} height={22} alt="Gmail"/>„Ne puteți trimite o ofertă?”</>:i===1?<><ExcelMark/>„Revenim până pe 4 septembrie.”</>:i===2?"Pas absent · necesită clarificare":i===3?"Draft și dovezile pe care se bazează":"Propunere → decizie"}</span></div><i className={s.enginePortOut}/></div>)}

   </div>
  </div><aside className={s.engineInspector}>{steps.map((step,i)=><div key={step.title} data-flow-panel={i} hidden={i!==4}><span className={s.miniLabel}>ETAPA 0{i+1}</span><step.icon aria-hidden="true"/><h3>{step.title}</h3><dl><dt>Intrare</dt><dd>{step.input}</dd><dt>Ce verifică</dt><dd>{step.check}</dd><dt>Ieșire</dt><dd>{step.output}</dd></dl></div>)}<div className={s.engineAuthority}><PersonAvatar/><span>Ana Popescu<small>Decizia îi aparține.</small></span></div></aside></div>
  <div className={s.engineFoot}><strong>La revizuire</strong><span>Aprobă intern · lucru pregătit</span><span>Cere context · revizuire deschisă</span><small>Alternative posibile, încă neselectate.</small></div>
 </ChapterMotion>;
}
