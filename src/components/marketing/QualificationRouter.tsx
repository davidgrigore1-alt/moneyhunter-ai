"use client";

import { useState } from "react";
import { ChevronRightIcon, HandThumbUpIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { qualify, type Qualification } from "@/lib/marketing/qualification";
import s from "./commercial.module.css";

type Option = {
  value: string;
  label: string;
  helper: string;
};

type Group = {
  title: string;
  options: Option[];
  key: keyof Qualification;
};

const groups: readonly Group[] = [
  {
    title: "PROCES",
    key: "process",
    options: [
      { value: "offers", label: "Oferte care cer revenire", helper: "Oferta a fost trimisă, dar pasul următor nu e mereu clar." },
      { value: "handoff", label: "Predări între colegi", helper: "Conversația trece între responsabili fără o tranziție clară." },
      { value: "renewals", label: "Reînnoiri / aprobări", helper: "Relația continuă, dar revenirea nu are mereu un responsabil." }
    ],
  },
  {
    title: "UNDE TRĂIEȘTE CONTEXTUL",
    key: "context",
    options: [
      { value: "files", label: "Email + fișiere", helper: "Conversații, documente și atașamente relevante." },
      { value: "crm", label: "CRM + email", helper: "Date comerciale + note + corespondență." },
      { value: "mixed", label: "Mai multe sisteme", helper: "Combinăm surse care susțin aceeași situație." },
    ],
  },
  {
    title: "CINE ATINGE PROCESUL",
    key: "team",
    options: [
      { value: "several", label: "Mai mulți colegi", helper: "Există mai multe roluri implicate." },
      { value: "one", label: "Un responsabil", helper: "Un punct de decizie clar pentru aprobare." }
    ],
  },
];

function isValidValue<K extends keyof Qualification>(key: K, value: string): value is Qualification[K] {
  return groups.find(group => group.key === key)?.options.some(option => option.value === value) ?? false;
}

export function QualificationRouter() {
  const [input, setInput] = useState<Qualification>({
    process: "offers",
    context: "files",
    team: "several",
  });

  const result = qualify(input);

  function updateSelection<K extends keyof Qualification>(key: K, value: string) {
    if (!isValidValue(key, value)) return;
    setInput(previous => ({ ...previous, [key]: value } as Qualification));
  }

  return (
    <div className={s.router}>
      <div className={s.routerInputs}>
        <span className={s.eyebrow}>POTRIVIRE REVENew</span>
        <p className={s.routerLead}>Alege cum arată procesul tău. Rezultatul se generează din reguli predefinite.</p>

        {groups.map(group => (
          <div className={s.pickerGroup} key={group.title}>
            <span className={s.pickerTitle}>{group.title}</span>
            <div role="radiogroup" aria-label={group.title} className={s.pickerGrid}>
              {group.options.map(option => {
                const selected = option.value === input[group.key];
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={selected ? `${s.choice} ${s.choiceSelected}` : s.choice}
                    onClick={() => updateSelection(group.key, option.value)}
                  >
                    <span>{option.label}</span>
                    <small>{option.helper}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p className={s.guidance}>
          Ghid orientativ pe baza selecției. Fără transmitere de date. Fără AI pe acest pas.
        </p>
      </div>

      <div className={s.routerResult} aria-live="polite" aria-atomic="true">
        <span className={s.eyebrow}>REVENew ÎȚI ARATĂ</span>
        <h3>{result.fit}</h3>

        <dl className={s.resultGrid}>
          <div>
            <dt>RISC PROBABIL</dt>
            <dd>{result.risk}</dd>
          </div>
          <div>
            <dt>CE AR LEGA REVENew</dt>
            <dd>{result.reveal}</dd>
          </div>
          <div>
            <dt>CE AR SCOATE LA VEDERE</dt>
            <dd>{result.prepare}</dd>
          </div>
          <div>
            <dt>PAS PREGĂTIT</dt>
            <dd>{result.outcome}</dd>
          </div>
          <div>
            <dt>DECIZIA RĂMÂNE LA</dt>
            <dd>{result.decision}</dd>
          </div>
          <div>
            <dt>SURSELE RELEVANTE</dt>
            <dd>{result.sources}</dd>
          </div>
        </dl>

        <div className={s.resultStrip}>
          <div>
            <HandThumbUpIcon aria-hidden="true" />
            <span>Potrivit de la lansare</span>
          </div>
          <div>
            <ChevronRightIcon aria-hidden="true" />
            <strong>Ceva de verificat</strong>
            <small>{result.reveal}</small>
          </div>
          <div>
            <ShieldCheckIcon aria-hidden="true" />
            <strong>Decizie umană</strong>
            <small>{result.decision}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
