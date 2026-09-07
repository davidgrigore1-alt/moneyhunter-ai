"use client";

import { useState } from "react";
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
    title: "Proces",
    key: "process",
    options: [
      { value: "offers", label: "Oferte care cer revenire", helper: "Oferta a plecat, dar următorul pas nu este mereu confirmat." },
      { value: "handoff", label: "Predări între colegi", helper: "Contextul trebuie să treacă odată cu responsabilitatea." },
      { value: "renewals", label: "Reînnoiri / aprobări", helper: "Relația continuă, dar termenul poate rămâne fără acțiune clară." },
    ],
  },
  {
    title: "Unde trăiește contextul",
    key: "context",
    options: [
      { value: "files", label: "Email + fișiere", helper: "Conversații, documente și registre comerciale." },
      { value: "crm", label: "CRM + email", helper: "Evidențe comerciale și corespondență." },
      { value: "mixed", label: "Mai multe sisteme", helper: "Contextul util este împărțit între mai multe surse." },
    ],
  },
  {
    title: "Cine atinge procesul",
    key: "team",
    options: [
      { value: "several", label: "Mai mulți colegi", helper: "Există mai multe roluri, predări sau aprobări." },
      { value: "one", label: "Un responsabil", helper: "Un singur rol ține controlul final." },
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
        <div className={s.routerIntro}>
          <span className={s.eyebrow}>POTRIVIRE REVENew</span>
          <h3>Configurează un proces apropiat de realitatea ta.</h3>
          <p>Alege trei lucruri. ReveNew îți arată unde s-ar putea pierde continuitatea și ce ar primi echipa.</p>
        </div>

        {groups.map(group => {
          const selectedOption = group.options.find(option => option.value === input[group.key]) ?? group.options[0];
          const twoColumns = group.options.length === 2;

          return (
            <fieldset className={s.pickerGroup} key={group.title}>
              <legend className={s.pickerTitle}>{group.title}</legend>
              <p className={s.pickerHelper}>{selectedOption.helper}</p>
              <div
                role="radiogroup"
                aria-label={group.title}
                className={twoColumns ? `${s.pickerGrid} ${s.pickerGridTwo}` : s.pickerGrid}
              >
                {group.options.map(option => {
                  const selected = option.value === input[group.key];
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${option.label}. ${option.helper}`}
                      className={selected ? `${s.choice} ${s.choiceSelected}` : s.choice}
                      onClick={() => updateSelection(group.key, option.value)}
                    >
                      <span className={s.choiceDot} aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <p className={s.guidance}>Ghid orientativ pe baza selecțiilor. Fără transmitere de date și fără analiză AI pe acest pas.</p>
      </div>

      <div className={s.routerResult} aria-live="polite" aria-atomic="true">
        <div className={s.resultHeading}>
          <span className={s.eyebrow}>REVENew ÎȚI ARATĂ</span>
          <span className={s.resultState}>Diagnostic ghidat</span>
        </div>
        <h3>{result.fit}</h3>

        <div className={s.riskPanel}>
          <span>Unde se poate rupe execuția</span>
          <p>{result.risk}</p>
        </div>

        <div className={s.diagnosisGrid}>
          <article>
            <span>Ce ar lega ReveNew</span>
            <p>{result.reveal}</p>
          </article>
          <article>
            <span>Ce devine vizibil</span>
            <p>{result.prepare}</p>
          </article>
          <article>
            <span>Pas pregătit</span>
            <p>{result.outcome}</p>
          </article>
          <article>
            <span>Decizia rămâne la</span>
            <p>{result.decision}</p>
          </article>
        </div>

        <div className={s.sourcesLine}>
          <span>Surse relevante</span>
          <p>{result.sources}</p>
        </div>
      </div>
    </div>
  );
}
