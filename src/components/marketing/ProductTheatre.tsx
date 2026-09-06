"use client";
import { paintFlow } from "@/lib/marketing/flow-timing";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { ArrowRightIcon, BoltIcon, BuildingOffice2Icon, ChartBarIcon, ChevronDownIcon, DocumentTextIcon, FolderIcon, InboxIcon, LockClosedIcon, MagnifyingGlassIcon, ShieldCheckIcon, Squares2X2Icon, UserGroupIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { landingDemo as d } from "@/lib/marketing/demo";
import { beatDuration, playbackReducer, staticPlayback, theatreBeats } from "@/lib/marketing/theatre-playback";
import { theatreQuestion, theatreSources } from "@/lib/marketing/theatre-portfolio";
import { MarketingBrand } from "./MarketingBrand";
import { CompanyMark, ExcelMark, ModuleMark, PersonAvatar } from "./MarketingEntityMark";
import { AnswerScene, CompaniesScene, QueryScene, ReportsScene, WorkflowScene } from "./TheatreScenes";
import s from "./hero.module.css";
import t from "./theatre.module.css";

const navigation = [
  { label: "Control Center", icon: Squares2X2Icon },
  { label: "Inteligență operațională", icon: BoltIcon, scene: 0 },
  { label: "Inbox Comercial", icon: InboxIcon },
  { label: "Aprobări", icon: ShieldCheckIcon },
  { label: "Lucru pregătit", icon: DocumentTextIcon },
  { label: "Companii", icon: BuildingOffice2Icon, scene: 2, module: "companies" as const },
  { label: "Contacte", icon: UserGroupIcon, module: "contacts" as const },
  { label: "Oportunități", icon: BoltIcon, module: "opportunities" as const },
  { label: "Documente", icon: FolderIcon },
  { label: "Secvențe", icon: ArrowRightIcon, module: "sequences" as const },
  { label: "Workflow-uri", icon: WrenchScrewdriverIcon, scene: 3 },
  { label: "Rapoarte", icon: ChartBarIcon, scene: 4 },
];
const sceneNames = ["Inteligență operațională", "Inteligență operațională", "Companii", "Workflow-uri", "Rapoarte"];

export function ProductTheatre() {
  const [playback, dispatch] = useReducer(playbackReducer, staticPlayback);
  const [enhanced, setEnhanced] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);
  const query = useRef<HTMLSpanElement>(null);
  const evidence = useRef<HTMLElement>(null);
  const clock = useRef({ beat: 0, remaining: beatDuration[0] as number });
  const phase = playback.beat;
  const beat = phase === 5 ? 4 : phase;
  const running = enhanced && !reduced && visible && foreground && playback.mode === "playing";
  const selectedIndex = navigation.findIndex(item => item.scene === (beat <= 1 ? 0 : beat));

  useEffect(() => {
    setEnhanced(true);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => {
      clock.current = { beat: -1, remaining: 0 };
      setReduced(media.matches);
      dispatch({ type: media.matches ? "reduce" : "start" });
    };
    const visibility = () => setForeground(!document.hidden);
    preference(); visibility();
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => {
      const meaningfulHeight = Math.min(entry.boundingClientRect.height, Math.max(1, window.innerHeight - 76));
      setVisible(entry.intersectionRect.height >= meaningfulHeight * .6);
    }, { threshold: Array.from({ length: 101 }, (_, index) => index / 100), rootMargin: "-76px 0px 0px 0px" });
    if (stage.current) observer.observe(stage.current);
    return () => { observer.disconnect(); media.removeEventListener("change", preference); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (clock.current.beat !== phase) clock.current = { beat: phase, remaining: beatDuration[phase] };
    // Prepare the next query while it is still hidden, before the loop returns.
    if (phase === 5 && query.current && figure.current) {
      query.current.textContent = "";
      figure.current.dataset.query = "typing";
      paintFlow(figure.current, 0, beatDuration[3]);
    }
    if (reduced && query.current && figure.current) {
      query.current.textContent = theatreQuestion;
      figure.current.dataset.query = "ready";
    }
    if (!running) return;
    const started = performance.now(), remaining = clock.current.remaining;
    let frame = 0;
    const paint = () => {
      const elapsed = beatDuration[phase] - Math.max(0, remaining - (performance.now() - started));
      figure.current?.style.setProperty("--beat-fill", String(elapsed / beatDuration[phase]));
      if (phase === 3 && figure.current) paintFlow(figure.current, elapsed, beatDuration[3]);
      if (phase === 0 && query.current && figure.current) {
        const length = Math.floor(theatreQuestion.length * Math.min(1, Math.max(0, (elapsed - 220) / 1350)));
        const text = theatreQuestion.slice(0, length);
        if (query.current.textContent !== text) query.current.textContent = text;
        figure.current.dataset.query = elapsed < 1900 ? "typing" : elapsed < 2200 ? "submitted" : "loading";
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    const timer = window.setTimeout(() => dispatch({ type: "advance" }), remaining);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); clock.current.remaining = Math.max(0, remaining - (performance.now() - started)); };
  }, [running, phase, reduced]);

  const pause = () => dispatch({ type: "pause" });
  function inspectEvidence() {
    dispatch({ type: "select", beat: 1 });
    // The external inspector is intentionally absent from the phone composition.
    if (evidence.current?.getClientRects().length) evidence.current.focus();
    else document.getElementById("theatre-source-facts")?.focus();
  }

  return <figure ref={figure} className={s.theatre} id="cum-functioneaza" aria-labelledby="theatre-caption" aria-describedby="theatre-keyboard" aria-keyshortcuts="Space" tabIndex={0} onKeyDown={event => { if (event.target === event.currentTarget && event.key === " " && !reduced) { event.preventDefault(); dispatch({ type: "toggle" }); } }} data-beat={phase} data-running={running} data-enhanced={enhanced}>
    <figcaption id="theatre-caption" className={s.theatreCaption}><span><span className={s.captionRule} />UN CAZ. TOT CONTEXTUL.</span><span>Scenariu de prezentare · companii și valori de exemplu</span></figcaption>
    <div ref={stage} className={s.stage}>
      <div className={s.device} data-theatre-viewport>
        <div className={s.deviceBar}><span className={s.windowDots} aria-hidden="true"><i /><i /><i /></span><span>ReveNew <span className={s.chromeSlash}>/</span> Spațiul echipei</span><span aria-hidden="true" /></div>
        <div className={t.appShell}>
          <aside className={t.sidebar} aria-label="Navigare ilustrativă, fără acțiuni">
            <MarketingBrand /><div className={t.workspaceLabel}>Portofoliu comercial<ChevronDownIcon /></div>
            <div className={t.search}><MagnifyingGlassIcon /><span>Caută</span><small>⌘ K</small></div>
            <div className={t.sideItems} style={{ "--selection-top": `${selectedIndex * 33 + (selectedIndex >= 5 ? 13 : 0) + (selectedIndex >= 8 ? 13 : 0)}px` } as CSSProperties}>{navigation.map((item,index) => <div key={item.label} className={t.sideItem} data-selected={item.scene === (beat <= 1 ? 0 : beat)} data-divider={index === 5 || index === 8}>{item.module ? <ModuleMark kind={item.module} /> : <item.icon />}<span>{item.label}</span>{item.scene === 2 ? <small>8</small> : null}</div>)}</div>
            <div className={t.sidebarUser}><PersonAvatar /><span>{d.owner}<small>Spațiul echipei</small></span><ChevronDownIcon /></div>
          </aside>
          <div className={t.appContent}>
            <div className={t.contextBar}><span><Squares2X2Icon /><span>Control Center</span><i>/</i><b>{sceneNames[beat]}</b></span><span><ShieldCheckIcon />Control uman<small>?</small></span></div>
            <div className={t.sceneViewport} data-scene={beat} data-reset={phase === 5}>
              <section className={t.scene} data-view="0" data-active={beat === 0} aria-hidden={beat !== 0} inert={beat !== 0}><QueryScene queryRef={query} /></section>
              <section className={t.scene} data-view="1" data-active={beat === 1} aria-hidden={beat !== 1} inert={beat !== 1}><AnswerScene inspectEvidence={inspectEvidence} pause={pause} /></section>
              <section className={t.scene} data-view="2" data-active={beat === 2} aria-hidden={beat !== 2} inert={beat !== 2}><CompaniesScene /></section>
              <section className={t.scene} data-view="3" data-active={beat === 3} aria-hidden={beat !== 3} inert={beat !== 3}><WorkflowScene /></section>
              <section className={t.scene} data-view="4" data-active={beat === 4} aria-hidden={beat !== 4} inert={beat !== 4}><ReportsScene /></section>
            </div>
            <div className={t.shellFooter}><span><LockClosedIcon />Pregătit · revizuire necesară</span><span className={t.sessionDot} /></div>
          </div>
        </div>
      </div>
      <aside className={s.contextWindow} data-active={beat <= 1 || beat === 2} aria-label="Sursele cazului demonstrativ">
        <div className={s.floatingHeader}><span className={s.contextIcon}><ShieldCheckIcon aria-hidden="true" /></span><div><b>Context conectat</b><small>4 surse · context autorizat</small></div></div>
        <div className={t.satelliteCompany}><CompanyMark /><span><b>{d.company}</b><small>{d.opportunity}</small></span></div>
        <div className={t.connectedSources}>{theatreSources.map(source => <div key={source.name}><span className={t.sourceLogo}><Image src={source.logo} width={20} height={20} alt="" /></span><div><b>{source.name}</b><small>{source.count}</small></div><span className={t.connectedState} aria-label={source.state}><i /></span></div>)}
          <div><ExcelMark /><div><b>{d.file}</b><small>1 interval citat</small></div><span className={t.localSource}>Sursă locală</span></div>
        </div>
      </aside>
      <aside ref={evidence} id="hero-evidence" tabIndex={-1} className={s.evidenceWindow} data-active={beat <= 1} aria-label="Dovada din Pipeline.xlsx">
        <div className={s.evidenceHeader}><ExcelMark /><div><b>{d.file}</b><small>{d.sheet} · {d.version}</small></div></div>
        <div className={s.sheetTabs}><span>Dovadă citată</span><span>{d.range}</span></div>
        <div className={s.miniSheet}><div className={s.sheetColumns}><span /><span>A · Companie</span><span>E · Revenire</span></div><div className={s.sheetRow}><span>7</span><span>…</span><span>…</span></div><div className={s.evidenceRow}><span>8</span><b>{d.company}</b><strong>04 sept.</strong></div></div>
        <div className={s.sourceNoteLabel}>F8 · NOTĂ DIN SURSĂ</div><blockquote>„Revenim până pe <mark>4 septembrie</mark> pentru confirmarea următorului pas.”</blockquote>
        <p className={s.evidenceFoot}><span className={s.evidencePort} aria-hidden="true" />Termen verificabil în sursă.</p>
      </aside>
      <aside className={s.reviewWindow} data-ready={beat === 3} aria-label="Limita deciziei umane">
        <div className={s.reviewTitle}><ShieldCheckIcon aria-hidden="true" /><span>CONTROL UMAN</span><span className={s.reviewLight} /></div>
        <h3>Revizuire necesară</h3>
        <div className={s.reviewOwner}><PersonAvatar /><span>{d.owner}<small>Responsabil comercial</small></span></div>
        <p>Pregătit · neexecutat</p>
        <div className={s.reviewOptions} aria-label="Opțiune ilustrativă, fără acțiune"><span>Revizuiește<ArrowRightIcon aria-hidden="true" /></span></div>
      </aside>
      <span className={s.contextBridge} data-active={beat === 0 || beat === 2} aria-hidden="true" />
      <span className={t.evidenceBridge} data-active={beat <= 1} aria-hidden="true" />
      <span className={t.reviewBridge} data-active={beat === 3} aria-hidden="true" />
    </div>
    <div className={s.playbackBar}><div className={s.beatControls} role="group" aria-label="Etapele demonstrației">{theatreBeats.map((label,index) => <span key={label} className={s.beatSegment} aria-label={label} aria-current={beat === index ? "step" : undefined} data-complete={index < beat} data-reset={phase === 5}><i /></span>)}</div></div>
    <span id="theatre-keyboard" className={s.keyboardHint}>Demonstrație automată. Cu demonstrația focalizată, apasă Spațiu pentru a opri sau relua mișcarea.</span>
  </figure>;
}
