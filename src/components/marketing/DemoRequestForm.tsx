"use client";
import { useRef, useState } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { isDemoRequestAccepted, validateDemoRequest, type DemoRequestErrors, type DemoRequestResult, type DemoRequestValues, type DemoSubmitState } from "@/lib/marketing/demo-request";
import s from "./landing.module.css";

// The optional boundary exists for isolated state tests and a future approved server action.
// The public page supplies no adapter: no endpoint, storage or fake success is used.
type Props = { submitRequest?: (values: DemoRequestValues) => Promise<DemoRequestResult> };

export function DemoSubmissionStatus({ state }: { state: DemoSubmitState }) {
  if (state === "success") return <div className={s.formSuccess} role="status"><CheckCircleIcon aria-hidden="true" /><div><h2>Solicitarea a fost preluată.</h2><p>Mulțumim. Putem continua discuția folosind adresa de contact indicată.</p></div></div>;
  if (state === "error") return <div className={s.formError} role="alert"><ExclamationCircleIcon aria-hidden="true" /><p>Solicitarea nu a fost preluată. Informațiile completate sunt păstrate aici; încearcă din nou când trimiterea este disponibilă.</p></div>;
  if (state === "pending") return <p className={s.formPending} role="status">Solicitarea este în curs de trimitere.</p>;
  return null;
}

export function DemoRequestForm({ submitRequest }: Props) {
  const [values, setValues] = useState<DemoRequestValues>({ name: "", email: "", company: "", phone: "", goal: "" });
  const [errors, setErrors] = useState<DemoRequestErrors>({});
  const [state, setState] = useState<DemoSubmitState>("idle");
  const busy = useRef(false);
  const fields = [
    { key: "name", label: "Nume", type: "text", autoComplete: "name", maxLength: 120, required: true },
    { key: "email", label: "Email de contact", type: "email", autoComplete: "email", maxLength: 254, required: true },
    { key: "company", label: "Companie", type: "text", autoComplete: "organization", maxLength: 180, required: true },
    { key: "phone", label: "Telefon", type: "tel", autoComplete: "tel", maxLength: 50, required: false }
  ] as const;
  function update(key: keyof DemoRequestValues, value: string) {
    setValues(current => ({ ...current, [key]: value }));
    if (errors[key]) setErrors(current => ({ ...current, [key]: undefined }));
  }
  function validateField(key: keyof DemoRequestValues) { setErrors(current => ({ ...current, [key]: validateDemoRequest(values)[key] })); }

  return <form className={s.demoForm} noValidate aria-busy={state === "pending"} onSubmit={async event => {
    event.preventDefault();
    if (busy.current || state === "success") return;
    const nextErrors = validateDemoRequest(values); setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) { document.getElementById(`demo-${firstInvalid}`)?.focus(); return; }
    if (!submitRequest) { setState("error"); return; }
    busy.current = true; setState("pending");
    try { const result = await submitRequest(values); setState(isDemoRequestAccepted(result) ? "success" : "error"); }
    catch { setState("error"); }
    finally { busy.current = false; }
  }}>
    {!submitRequest ? <div id="demo-unavailable" className={s.formUnavailable}><ExclamationCircleIcon aria-hidden="true" /><div><strong>Trimiterea nu este disponibilă momentan.</strong><p>Acest formular nu transmite date. Solicitările online vor fi disponibile după activarea canalului de contact.</p></div></div> : null}
    {state === "success" ? <DemoSubmissionStatus state={state} /> : <>
      <p className={s.formIntro}>Numele, emailul și compania sunt obligatorii.</p>
      <div className={s.formFields}>{fields.map(field => <div className={s.formField} key={field.key}><label htmlFor={`demo-${field.key}`}>{field.label}{!field.required ? <span>opțional</span> : null}</label><input id={`demo-${field.key}`} name={field.key} type={field.type} autoComplete={field.autoComplete} required={field.required} maxLength={field.maxLength} disabled={state === "pending"} value={values[field.key]} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `demo-${field.key}-error` : undefined} onChange={event => update(field.key,event.target.value)} onBlur={() => validateField(field.key)} />{errors[field.key] ? <p id={`demo-${field.key}-error`} className={s.fieldError}>{errors[field.key]}</p> : null}</div>)}</div>
      <div className={s.formField}><label htmlFor="demo-goal">Ce ai vrea să îmbunătățești?<span>opțional</span></label><textarea id="demo-goal" name="goal" rows={4} maxLength={2000} disabled={state === "pending"} value={values.goal} aria-invalid={!!errors.goal} aria-describedby={errors.goal ? "demo-goal-error" : undefined} onChange={event => update("goal",event.target.value)} onBlur={() => validateField("goal")} />{errors.goal ? <p id="demo-goal-error" className={s.fieldError}>{errors.goal}</p> : null}</div>
      <DemoSubmissionStatus state={state} />
      <div className={s.formSubmit}><button type="submit" className={`${s.liquid} ${s.primary}`} disabled={!submitRequest || state === "pending"} aria-describedby={!submitRequest ? "demo-unavailable" : undefined}>{state === "pending" ? "Se trimite solicitarea…" : "Trimite solicitarea"}</button><p>Fără creare de cont. Fără programare automată.</p></div>
    </>}
  </form>;
}
