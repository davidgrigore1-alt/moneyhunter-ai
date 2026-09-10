"use client";

import {
  type PointerEvent,
  useRef,
  useState
} from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import {
  isDemoRequestAccepted,
  validateDemoRequest,
  type DemoRequestErrors,
  type DemoRequestResult,
  type DemoRequestValues,
  type DemoSubmitState
} from "@/lib/marketing/demo-request";
import type { LeadCaptureInput } from "@/lib/marketing/lead-capture";
import s from "./contact.module.css";

type Props = {
  submitRequest?: (values: LeadCaptureInput) => Promise<DemoRequestResult>;
};

const suggestions = [
  "Oferte fără revenire",
  "Următorul pas neclar",
  "Responsabilitate",
  "Reînnoiri / aprobări"
] as const;

function setButtonLight(event: PointerEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--request-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--request-y", `${event.clientY - rect.top}px`);
}

export function DemoSubmissionStatus({ state }: { state: DemoSubmitState }) {
  if (state === "success") {
    return (
      <div className={s.successState} role="status">
        <span className={s.statusIcon}>
          <CheckCircleIcon aria-hidden="true" />
        </span>
        <div>
          <p className={s.statusEyebrow}>Solicitare preluată</p>
          <h3>Mulțumim. Avem contextul de pornire.</h3>
          <p>
            Putem continua discuția folosind adresa de contact indicată.
          </p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={s.errorState} role="alert">
        <ExclamationCircleIcon aria-hidden="true" />
        <p>
          Solicitarea nu a fost preluată. Informațiile completate rămân în
          formular; încearcă din nou când trimiterea este disponibilă.
        </p>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <p className={s.pendingState} role="status">
        Solicitarea este în curs de trimitere.
      </p>
    );
  }

  return null;
}

export function DemoRequestForm({ submitRequest }: Props) {
  const [values, setValues] = useState<DemoRequestValues>({
    name: "",
    email: "",
    company: "",
    phone: "",
    goal: ""
  });
  const [errors, setErrors] = useState<DemoRequestErrors>({});
  const [state, setState] = useState<DemoSubmitState>("idle");
  const [contactConsent, setContactConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [website, setWebsite] = useState("");

  const busy = useRef(false);
  const requestId = useRef("");

  const fields = [
    {
      key: "name",
      label: "Nume",
      type: "text",
      autoComplete: "name",
      maxLength: 120,
      required: true
    },
    {
      key: "email",
      label: "Email de contact",
      type: "email",
      autoComplete: "email",
      maxLength: 254,
      required: true
    },
    {
      key: "company",
      label: "Companie",
      type: "text",
      autoComplete: "organization",
      maxLength: 180,
      required: true
    },
    {
      key: "phone",
      label: "Telefon",
      type: "tel",
      autoComplete: "tel",
      maxLength: 50,
      required: false
    }
  ] as const;

  function update(key: keyof DemoRequestValues, value: string) {
    requestId.current = "";
    setValues((current) => ({ ...current, [key]: value }));

    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function validateField(key: keyof DemoRequestValues) {
    setErrors((current) => ({
      ...current,
      [key]: validateDemoRequest(values)[key]
    }));
  }

  function applySuggestion(value: string) {
    update("goal", value);
    requestAnimationFrame(() => document.getElementById("demo-goal")?.focus());
  }

  return (
    <form
      className={s.demoForm}
      noValidate
      aria-busy={state === "pending"}
      onSubmit={async (event) => {
        event.preventDefault();

        if (busy.current || state === "success") return;

        const nextErrors = validateDemoRequest(values);
        setErrors(nextErrors);

        const firstInvalid = Object.keys(nextErrors)[0];
        if (firstInvalid) {
          document.getElementById(`demo-${firstInvalid}`)?.focus();
          return;
        }

        if (!contactConsent) {
          setConsentError(true);
          document.getElementById("demo-consent")?.focus();
          return;
        }

        if (!submitRequest) {
          setState("error");
          return;
        }

        requestId.current ||= crypto.randomUUID();
        busy.current = true;
        setState("pending");

        try {
          const result = await submitRequest({
            ...values,
            requestId: requestId.current,
            contactConsent,
            website
          });

          setState(isDemoRequestAccepted(result) ? "success" : "error");
        } catch {
          setState("error");
        } finally {
          busy.current = false;
        }
      }}
    >
      {!submitRequest ? (
        <div id="demo-unavailable" className={s.unavailableState}>
          <ExclamationCircleIcon aria-hidden="true" />
          <div>
            <strong>Trimiterea nu este disponibilă momentan.</strong>
            <p>
              Formularul nu transmite date până la activarea canalului de
              contact.
            </p>
          </div>
        </div>
      ) : null}

      {state === "success" ? (
        <DemoSubmissionStatus state={state} />
      ) : (
        <>
          <div className={s.honeypot} aria-hidden="true">
            <label htmlFor="demo-website">
              Website
              <input
                id="demo-website"
                name="website"
                tabIndex={-1}
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>
          </div>

          <div className={s.formFields}>
            {fields.map((field) => (
              <div className={s.formField} key={field.key}>
                <label htmlFor={`demo-${field.key}`}>
                  {field.label}
                  {!field.required ? <span>Opțional</span> : null}
                </label>

                <input
                  id={`demo-${field.key}`}
                  name={field.key}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  required={field.required}
                  maxLength={field.maxLength}
                  disabled={state === "pending"}
                  value={values[field.key]}
                  aria-invalid={!!errors[field.key]}
                  aria-describedby={
                    errors[field.key] ? `demo-${field.key}-error` : undefined
                  }
                  onChange={(event) => update(field.key, event.target.value)}
                  onBlur={() => validateField(field.key)}
                />

                {errors[field.key] ? (
                  <p id={`demo-${field.key}-error`} className={s.fieldError}>
                    {errors[field.key]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className={s.contextField}>
            <div className={s.contextHeading}>
              <label htmlFor="demo-goal">Unde se rupe procesul acum?</label>
              <span>Opțional</span>
            </div>

            <p className={s.contextHint}>
              Poți scrie liber sau alege un punct de pornire.
            </p>

            <div className={s.suggestionRow} aria-label="Exemple de procese">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={s.suggestion}
                  disabled={state === "pending"}
                  onClick={() => applySuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <textarea
              id="demo-goal"
              name="goal"
              rows={4}
              maxLength={2000}
              disabled={state === "pending"}
              value={values.goal}
              aria-invalid={!!errors.goal}
              aria-describedby={
                errors.goal ? "demo-goal-error" : "demo-goal-help"
              }
              onChange={(event) => update("goal", event.target.value)}
              onBlur={() => validateField("goal")}
            />

            <p id="demo-goal-help" className={s.contextHelp}>
              De exemplu: oferta a plecat, dar următorul pas nu mai este clar.
            </p>

            {errors.goal ? (
              <p id="demo-goal-error" className={s.fieldError}>
                {errors.goal}
              </p>
            ) : null}
          </div>

          <DemoSubmissionStatus state={state} />

          <div className={s.consentBlock}>
            <label htmlFor="demo-consent" className={s.consentLabel}>
              <input
                id="demo-consent"
                type="checkbox"
                checked={contactConsent}
                disabled={state === "pending"}
                onChange={(event) => {
                  setContactConsent(event.target.checked);
                  setConsentError(false);
                }}
                aria-invalid={consentError}
                aria-describedby="demo-contact-notice"
              />
              <span className={s.checkboxVisual} aria-hidden="true" />
              <span>Doresc să fiu contactat în legătură cu această solicitare.</span>
            </label>

            <p id="demo-contact-notice" className={s.privacyNotice}>
              Datele sunt folosite pentru evaluarea cererii și sunt accesibile
              echipei autorizate ReveNew. Nu te abonăm la marketing.{" "}
              <a href="/privacy">Confidențialitate</a>
            </p>

            {consentError ? (
              <p role="alert" className={s.fieldError}>
                Confirmă că dorești să te contactăm despre cerere.
              </p>
            ) : null}
          </div>

          <div className={s.submitArea}>
            <button
              type="submit"
              className={s.submitButton}
              disabled={!submitRequest || state === "pending"}
              aria-describedby={!submitRequest ? "demo-unavailable" : undefined}
              onPointerMove={setButtonLight}
            >
              <span className={s.submitGlow} aria-hidden="true" />
              <span className={s.submitHighlight} aria-hidden="true" />
              <span className={s.submitLabel}>
                {state === "pending"
                  ? "Se trimite solicitarea…"
                  : "Trimite solicitarea"}

                {state !== "pending" ? (
                  <ArrowRightIcon aria-hidden="true" />
                ) : null}
              </span>
            </button>

            <div className={s.submitMeta} aria-label="Detalii despre solicitare">
              <span>Fără creare de cont</span>
              <span aria-hidden="true">·</span>
              <span>Fără programare automată</span>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
