"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowRightIcon, BoltIcon, ChartBarIcon, CheckIcon, ChevronDownIcon, DocumentTextIcon, EllipsisHorizontalIcon, FunnelIcon, LockClosedIcon, MagnifyingGlassIcon, PlusIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { landingDemo as d } from "@/lib/marketing/demo";
import { formatIllustrativeRON as money, portfolioHistory, portfolioTotal, portfolioRingSegments, reviewTotal, theatreCompanies, theatreQuestion } from "@/lib/marketing/theatre-portfolio";
import { CompanyMark, PersonAvatar } from "./MarketingEntityMark";
import { paintFlow } from "@/lib/marketing/flow-timing";
import s from "./theatre.module.css";

function SceneHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className={s.sceneHeading}><div><span>{eyebrow}</span><h2>{title}</h2></div>{children}</div>;
}

export function QueryScene({ queryRef }: { queryRef: RefObject<HTMLSpanElement | null> }) {
  return <div className={s.askScene}>
    <SceneHeading eyebrow="ANALIZĂ ȘI DECIZIE" title="Inteligență operațională" />
    <div className={s.productTabs} aria-label="Secțiuni ilustrative"><span data-selected="true">Întreabă</span><span>Descoperiri</span><span>Recomandări</span><span>Capabilități</span></div>
    <div className={s.askBody}>
      <div className={s.askIntro}><h3>Ce vrei să verifici?</h3><p>O întrebare clară. Un răspuns susținut de dovezi.</p></div>
      <div className={s.queryComposer}>
        <div className={s.queryScope}><span><ShieldCheckIcon />Context autorizat <i /> 4 surse</span><ChevronDownIcon /></div>
        <p className={s.typedQuestion} aria-label={theatreQuestion}><span ref={queryRef} aria-hidden="true">{theatreQuestion}</span><i aria-hidden="true" /></p>
        <div className={s.queryBottom}><span>Enter pentru analiză</span><span className={s.enterKey}>Analizează <span>↵</span></span></div>
        <div className={s.loadingLine}><span />Corelez contextul</div>
      </div>
      <div className={s.querySuggestions}><span>Oferte fără următor pas<ArrowRightIcon /></span><span>Ce dovadă lipsește?<ArrowRightIcon /></span></div>
      <div className={s.recentContext}><span>ÎN CONTEXT</span><div><CompanyMark /><span><b>{d.company}</b><small>{d.opportunity}</small></span><span className={s.contextAmount}>{d.amount}<small>{d.qualifier}</small></span><span className={s.warningChip}>Revenire de verificat</span></div></div>
    </div>
  </div>;
}

export function AnswerScene({ inspectEvidence, pause }: { inspectEvidence: () => void; pause: () => void }) {
  const [draft, setDraft] = useState<string>(d.draft);
  return <div className={s.answerScene} onFocusCapture={pause}>
    <div className={s.answerQuestion}><MagnifyingGlassIcon /><span>{theatreQuestion}</span><span className={s.smallSource}>4 surse</span></div>
    <div className={s.answerLead}><span className={s.answerGlyph}><SparklesIcon /></span><div><span className={s.kicker}>REVENEW · CONTEXT → DECIZIE</span><h2>3 situații necesită verificare.</h2><p>Atelier Nord: termen promis depășit, fără o revenire stabilită.</p></div></div>
    <div className={s.answerSummary}><span><b>3</b> situații de revizuit</span><span><b>{money(reviewTotal)} RON</b> valoare estimată</span><span><DocumentTextIcon />Oferte · A8:F15</span></div>
    <div className={s.answerWorkbench}>
      <section className={s.priorityCase}>
        <div className={s.caseHeading}><CompanyMark /><span><b>{d.company}</b><small>{d.opportunity}</small></span><strong>42.000 <small>RON · expunere estimată</small></strong></div>
        <div className={s.caseInsight}><h3>O promisiune.<br />Nicio continuare stabilită.</h3><p>Revenirea era promisă pentru 4 septembrie.</p></div>
        <div id="theatre-source-facts" tabIndex={-1} className={s.sourceFacts} aria-label="Dovezile corelate pentru Atelier Nord">
          <button className={s.evidenceCitation} type="button" onClick={inspectEvidence} aria-controls="hero-evidence theatre-source-facts"><DocumentTextIcon /><span><b>Pipeline.xlsx</b><small>Confirmă termenul promis · A8:F8</small></span><ArrowRightIcon /></button>
          <div><Image src="/brands/google/gmail.svg" width={14} height={14} alt="" /><span><b>Gmail</b><small>Ultimul mesaj relevant este anterior termenului.</small></span></div>
          <div><Image src="/brands/google/calendar.svg" width={14} height={14} alt="" /><span><b>Calendar</b><small>Nicio revenire programată după termen.</small></span></div>
          <div><BoltIcon /><span><b>Oportunitate</b><small>Următorul pas explicit lipsește.</small></span></div>
        </div>
      </section>
      <section className={s.answerDraft}>
        <div className={s.draftTitle}><DocumentTextIcon /><b>RECOMANDARE</b></div>
        <p className={s.nextStep}>Confirmă responsabilul și pregătește revenirea.</p>
        <div className={s.draftMeta}><span>Pregătit</span><span>Editabil</span><span>Neexecutat</span></div>
        <label htmlFor="theatre-proposal">Re: Oferta de mentenanță</label>
        <textarea id="theatre-proposal" aria-label="Propunere de mesaj — exemplu editabil" value={draft} maxLength={1200} onChange={event => setDraft(event.target.value)} />
        <div className={s.draftTools}><span>Propunere de revenire</span><button type="button" onClick={() => setDraft(d.draft)} aria-label="Resetează propunerea"><ArrowPathIcon /></button></div>
        <div className={s.reviewGate}><PersonAvatar /><span><b>{d.owner}</b><small>Așteaptă revizuirea umană</small></span><LockClosedIcon /></div>
      </section>
    </div>
    <div className={s.evidenceStrip}>Pipeline.xlsx <i /> Gmail <i /> Calendar <i /> Oportunitate</div>
    <div className={s.otherPriorities}><span>ÎN ACELAȘI REGISTRU</span><div><CompanyMark variant={2} /><b>Vector Industrial</b><span>Responsabilul pasului de confirmat</span><small>180.000 RON</small></div><div><CompanyMark variant={7} /><b>Delta Facilities</b><span>Reînnoire de verificat</span><small>60.000 RON</small></div></div>
  </div>;
}

export function CompaniesScene() {
  return <div className={s.companiesScene}>
    <SceneHeading eyebrow="RELAȚII COMERCIALE" title="Companii"><span className={s.viewTool}><PlusIcon />Adaugă companie</span></SceneHeading>
    <div className={s.tableToolbar}><span className={s.savedView}>Portofoliu comercial<ChevronDownIcon /></span><span><FunnelIcon />Prioritate <b>3</b></span><span className={s.tableSearch}><MagnifyingGlassIcon />Caută în companii</span><span><ArrowDownTrayIcon /></span></div>
    <div className={s.companyRegister}>
      <table><caption className={s.srOnly}>Opt companii. Valoarea comercială, relația și potrivirea ICP sunt estimări, nu rezultate confirmate.</caption>
        <thead><tr><th>Companie / domeniu</th><th>Context comercial</th><th>Valoare comercială <small>RON</small></th><th>Relație</th><th>ICP</th><th>Responsabil</th><th>Prioritate</th></tr></thead>
        <tbody>{theatreCompanies.map((company, index) => <tr key={company.name} data-highlight={index === 0} style={{ "--row": index } as CSSProperties}>
          <td><div className={s.registerIdentity}><span className={s.rowCheck}>{index === 0 ? <CheckIcon /> : null}</span><CompanyMark variant={company.mark} /><span><b>{company.name}</b><small>{company.domain}</small></span></div></td>
          <td><span className={s.topicChip}><DocumentTextIcon />{company.topic}</span></td>
          <td className={s.arrCell}>{money(company.arr)}</td>
          <td><span className={s.connection} title={company.connection}><span>{[0,1,2,3].map(i => <i key={i} data-filled={i < company.strength} />)}</span><small>{company.connection}</small></span></td>
          <td><span className={s.fitChip} data-high={company.fit === "Ridicat"}>{company.fit}</span></td>
          <td><span className={s.ownerCell} title={company.owner}><PersonAvatar variant={company.owner === "Ana Popescu" ? 0 : company.owner === "Radu Matei" ? 1 : 2} /><span>{company.owner.split(" ")[0]}<small>{company.owner.split(" ")[1]}</small></span></span></td>
          <td><span className={s.statusChip} data-review={company.status === "De revizuit"}><i />{company.status}</span></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className={s.tableTotals}><span><b>8</b> companii</span><span><b>{money(portfolioTotal)} RON</b> valoare estimată</span><span>Portofoliu comercial</span></div>
    <div className={s.registerSelection}><CompanyMark /><span><b>Atelier Nord</b><small>Un termen. O dovadă. Un pas de clarificat.</small></span><span className={s.selectionAction}>Pregătește revenirea<ArrowRightIcon /></span></div>
  </div>;
}

const workflowNodes = [
  { title: "Semnal observat", detail: "Revenire după termen", state: "Identificat", icon: BoltIcon },
  { title: "Context verificat", detail: "Oferte · A8:F8 · v3", state: "Sursă disponibilă", icon: DocumentTextIcon },
  { title: "Draft pregătit", detail: "Revenire comercială", state: "Pregătit", icon: SparklesIcon },
  { title: "Revizuire umană", detail: "Ana Popescu", state: "Așteaptă decizia", icon: ShieldCheckIcon },
];

export function WorkflowScene() {
  const graph = useRef<HTMLDivElement>(null);
  const wires = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = graph.current, svg = wires.current;
    if (!element || !svg) return;
    // Use layout coordinates so scene transforms never displace connection ports.
    const connect = () => {
      const nodes = Array.from(element.querySelectorAll<HTMLElement>("[data-node]"));
      if (nodes.length !== 4) return;
      const port = (node: HTMLElement, outgoing: boolean) => {
        const dot = node.querySelector<HTMLElement>(outgoing ? `.${s.nodePortOut}` : `.${s.nodePort}`)!;
        return [node.offsetLeft + dot.offsetLeft + dot.offsetWidth / 2, node.offsetTop + dot.offsetTop + dot.offsetHeight / 2];
      };
      const [a,b,c,d,e,f] = [port(nodes[0],true),port(nodes[1],false),port(nodes[1],true),port(nodes[2],false),port(nodes[2],true),port(nodes[3],false)];
      const middle = (c[1]+d[1])/2;
      const paths = [`M${a}H${b[0]}`, `M${c}H${element.clientWidth-14}q8 0 8 8V${middle-8}q0 8 -8 8H14q-8 0 -8 8V${d[1]-8}q0 8 8 8H${d[0]}`, `M${e}H${f[0]}`];
      svg.setAttribute("viewBox",`0 0 ${element.clientWidth} ${element.clientHeight}`);
      svg.querySelectorAll<SVGPathElement>("path").forEach((line,i) => { line.setAttribute("d",paths[i % 3]); if (line.hasAttribute("data-flow-edge")) line.dataset.length = String(line.getTotalLength()); });
      const branches = element.parentElement?.querySelector<HTMLElement>(`.${s.decisionBranches}`);
      if (branches) {
        const review = nodes[3];
        branches.style.setProperty("--branch-left", `${review.offsetLeft}px`);
        branches.style.setProperty("--branch-width", `${review.offsetWidth}px`);
        branches.style.setProperty("--branch-top", `${element.offsetTop + review.offsetTop + review.offsetHeight + 22}px`);
        branches.style.setProperty("--branch-stem", `${branches.offsetTop - element.offsetTop - review.offsetTop - review.offsetHeight}px`);
      }
      const clock=element.closest<HTMLElement>("figure"); if(clock) paintFlow(clock,clock.dataset.flowDuration ? Number(clock.dataset.flowElapsed) : matchMedia("(prefers-reduced-motion: reduce)").matches ? 5100 : 0,Number(clock.dataset.flowDuration || 5100));
    };
    const observer = new ResizeObserver(connect);
    observer.observe(element); connect();
    return () => observer.disconnect();
  }, []);
  return <div className={s.workflowScene}>
    <SceneHeading eyebrow="EXECUȚIE CU CONTROL" title="Revenire după ofertă"><span className={s.workflowState}><i />La revizuire</span></SceneHeading>
    <div className={s.productTabs}><span>Definiție</span><span data-selected="true">Parcursul cazului</span><span>Istoric</span></div>
    <div className={s.workflowBody}>
      <div className={s.flowCanvas}>
        <div className={s.flowContext}><CompanyMark /><span><b>Atelier Nord</b><small>Contract de mentenanță · 42.000 RON estimat</small></span><EllipsisHorizontalIcon /></div>
        <div ref={graph} className={s.flowGraph}>
          <svg ref={wires} className={s.flowWires} aria-hidden="true">{[0,1,2].map(i=><path key={`base${i}`} className={s.wireBase} />)}{[0,1,2].map(i=><path key={i} className={s.wireTrace} data-flow-edge={i} pathLength="1" />)}{[0,1,2].map(i=><circle key={`dot${i}`} data-flow-dot={i} r="2.5" fill="#dcc57e" opacity="0" />)}</svg>
          {workflowNodes.map((node,index) => <div key={node.title} className={s.flowNode} data-node={index} data-flow-node={index} data-flow-state="complete" style={{ "--node": index } as CSSProperties}><span className={s.nodePort} /><div className={s.nodeStatus}>{index < 3 ? <CheckIcon /> : <LockClosedIcon />}{node.state}<span className={s.nodeSequence}>0{index+1}</span></div><div className={s.nodeBody}><span className={s.nodeIcon}><node.icon /></span><span><b>{node.title}</b><small>{index===0?<Image src="/brands/google/gmail.svg" width={13} height={13} alt="Gmail"/>:index===1?<Image src="/marketing/excel-source.png" width={18} height={13} alt="Excel"/>:index===2?<DocumentTextIcon/>:<PersonAvatar/>}{node.detail}</small></span></div><span className={s.nodePortOut} /></div>)}
          <span className={s.branchLabel}>Pregătire internă</span>
        </div>
        <div className={s.decisionBranches} aria-label="Ramuri posibile, neselectate"><div><b>Aprobă intern</b><small>→ lucru pregătit</small></div><div><b>Cere context</b><small>→ revizuire deschisă</small></div></div>
        <div className={s.canvasFooter}><span><LockClosedIcon />Decizie în așteptare</span><span>− <b>100%</b> +</span></div>
      </div>
      <aside className={s.runPanel}><h3>Firul de verificare</h3><p>Același caz, până la decizie.</p><ol>{workflowNodes.map((node,index) => <li key={node.title} data-flow-rail={index} style={{ "--node": index } as CSSProperties}><span className={s.runDot} /><div><b>{node.title}</b><small>{node.detail}</small></div><span>0{index+1}</span></li>)}</ol><div className={s.runSummary}><ShieldCheckIcon /><span>Pregătit ≠ executat</span><h4>De aici, decide Ana.</h4><p>Propunerea poate fi revizuită, editată sau amânată.</p><div><PersonAvatar /><b>Ana Popescu</b></div></div></aside>
    </div>
  </div>;
}

export function ReportsScene() {
  return <div className={s.reportsScene}>
    <SceneHeading eyebrow="RAPOARTE / ACTIVITATE COMERCIALĂ" title="Indicatori comerciali"><span className={s.viewTool}><ChartBarIcon />Portofoliu B2B<ChevronDownIcon /></span></SceneHeading>
    <div className={s.reportFilters}><span>Iulie – Septembrie 2026<ChevronDownIcon /></span><span>RON</span><span>Valori estimate</span></div>
    <div className={s.reportGrid}>
      <section className={s.barPanel}><div className={s.chartHeading}><div><h3>Valoarea ofertelor</h3><p>Estimări comerciale, pe tip de contract</p></div><EllipsisHorizontalIcon /></div>
        <div className={s.chartLegend}><span><i />Contracte</span><span><i />Servicii</span><span><i />Licențe</span></div>
        <div className={s.barChart}>
          <div className={s.chartAxis}><span>500k</span><span>375k</span><span>250k</span><span>125k</span><span>0</span></div>
          <div className={s.chartPlot}><div className={s.gridLines} aria-hidden="true"><i /><i /><i /><i /><i /></div>{portfolioHistory.map((month,index) => <div key={month.month} className={s.barGroup}><div>{month.values.map((value,series) => <span key={series} className={s.chartBar} data-series={series} style={{ height: `${value/5}%`, "--bar": index*3+series } as CSSProperties} aria-label={`${month.month}, ${["Contracte","Servicii","Licențe"][series]}: ${value}.000 RON estimat`} />)}</div><span>{month.month}</span></div>)}
          <div className={s.chartTooltip}><span><i />Septembrie · portofoliu</span><b>{money(portfolioTotal)} <small>RON</small></b><p>Valoare estimată · 8 companii</p></div></div>
        </div>
        <div className={s.chartFoot}><span>Valori estimate · mii RON</span><span>Vezi detaliile<ArrowRightIcon /></span></div>
      </section>
      <section className={s.donutPanel}><div className={s.chartHeading}><div><h3>Unde continuă conversația</h3><p>Companii după starea comercială</p></div><EllipsisHorizontalIcon /></div>
        <div className={s.donutWrap}><svg viewBox="0 0 220 220" className={s.donut} role="img" aria-label="8 companii: 3 de revizuit, 3 în discuție, 2 cu pas stabilit"><g>{portfolioRingSegments().map(segment => <path key={segment.label} d={segment.path} />)}</g></svg><div className={s.donutValue}><b>8</b><span>companii</span></div></div>
        <div className={s.donutLegend}><div><i /><span>De revizuit</span><b>3</b><small>37,5%</small></div><div><i /><span>În discuție</span><b>3</b><small>37,5%</small></div><div><i /><span>Pas stabilit</span><b>2</b><small>25%</small></div></div>
      </section>
      <section className={s.coveragePanel}><div className={s.chartHeading}><div><h3>Continuitate comercială</h3><p>Portofoliu · 8 companii</p></div><ShieldCheckIcon /></div><div className={s.coverageSteps}><div><b>8</b><span>Cu responsabil</span><i style={{"--coverage":"100%"} as CSSProperties} /></div><div><b>5</b><span>Cu pas consemnat</span><i style={{"--coverage":"62.5%"} as CSSProperties} /></div><div><b>3</b><span>De verificat</span><i style={{"--coverage":"37.5%"} as CSSProperties} /></div></div></section>
      <section className={s.reportPriority}><span>ATENȚIE COMERCIALĂ</span><strong>{money(reviewTotal)} <small>RON</small></strong><p>Valoare estimată în cele 3 cazuri de revizuit.</p><div><CompanyMark /><CompanyMark variant={2} /><CompanyMark variant={7} /><span>Decizia rămâne la echipă.</span></div></section>
    </div>
  </div>;
}
