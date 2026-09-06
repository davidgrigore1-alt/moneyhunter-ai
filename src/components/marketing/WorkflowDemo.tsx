import { BoltIcon, CheckIcon, DocumentTextIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import s from "./chapters.module.css";
const steps = [
  { title:"Semnal observat", detail:"Revenire după termen", state:"Identificat", icon:BoltIcon },
  { title:"Context verificat", detail:"Oferte · A8:F8 · v3", state:"Dovadă asociată", icon:DocumentTextIcon },
  { title:"Draft pregătit", detail:"Revenire comercială", state:"Editabil · neexecutat", icon:SparklesIcon },
  { title:"Revizuire umană", detail:"Ana Popescu", state:"Așteaptă decizia", icon:ShieldCheckIcon }
] as const;
export function WorkflowDemo() {
  return <ChapterMotion name="workflow" className={s.workflow} duration={7200}>
    <div className={s.workflowTop}><div><span className={s.statusDot} />Revenire după ofertă</div><span>Parcursul cazului <i>/</i> 4 etape</span><span className={s.goldText}><LockClosedIcon aria-hidden="true" />La revizuire</span></div>
    <div className={s.workflowBody}><div className={s.flowCanvas}>
      <div className={s.flowCase}><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div><span>42.000 <small>RON · estimat</small></span></div>
      <ol className={s.flowPath}>{steps.map((step,index)=><li key={step.title} data-enter={index+1} className={index===3?s.humanNode:index===1?s.contextNode:undefined}><span className={s.nodeState}>{index===3?<LockClosedIcon aria-hidden="true" />:<CheckIcon aria-hidden="true" />}{step.state}</span><div className={s.flowNode}><i className={s.portIn} /><step.icon aria-hidden="true" /><div><h3>{step.title}</h3><p>{step.detail}</p></div><span className={s.nodeNumber}>0{index+1}</span><i className={s.portOut} /></div></li>)}</ol>
      <div className={s.flowBranches} data-enter="5"><p><span>Aprobă intern</span><i aria-hidden="true" />Lucru pregătit</p><p><span>Cere context</span><i aria-hidden="true" />Revizuire deschisă</p></div>
      <p className={s.canvasFoot}><LockClosedIcon aria-hidden="true" />Pregătirea se oprește aici. Nicio execuție externă.</p>
    </div><aside className={s.decisionRail} data-enter="4"><span className={s.miniLabel}>Punctul de decizie</span><div className={s.railShield}><ShieldCheckIcon aria-hidden="true" /></div><h3>De aici,<br />decide Ana.</h3><p>Verifică dovada, ajustează propunerea și alege continuarea.</p><div className={s.railPerson}><PersonAvatar /><span>Ana Popescu<small>Responsabil de revizuire</small></span></div><div className={s.railState}><span className={s.statusDot} />Pregătit · neexecutat</div></aside></div>
  </ChapterMotion>;
}
