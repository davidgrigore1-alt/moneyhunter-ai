"use client";

import { useTransition } from "react";
import {
  ArrowRightIcon,
  BeakerIcon,
  ChartBarSquareIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { LiquidGlassAction } from "@/components/access/LiquidGlassAction";
import { selectPreviewPlan } from "@/lib/billing/actions";
import type { PreviewPlanId } from "@/lib/billing/plans";

type ActivationPlanSelectorProps = {
  selectedPlanId?: PreviewPlanId | null;
  previewMode: boolean;
};

const plans: Array<{
  id: PreviewPlanId;
  eyebrow: string;
  title: string;
  price: string;
  billing: string;
  description: string;
  items: string[];
  note: string;
  dark?: boolean;
}> = [
  {
    id: "audit",
    eyebrow: "Pilot controlat",
    title: "Pilot ReveNew",
    price: "490 EUR",
    billing: "14 zile · o singură activare",
    description:
      "Validează ReveNew pe un proces comercial real înainte de un angajament lunar.",
    items: [
      "un proces comercial clar definit",
      "baseline inițial și cazuri prioritizate",
      "dovezi, responsabil și următorul pas",
      "review final cu rezultate confirmate separat"
    ],
    note:
      "Dacă treci direct la ReveNew Managed, valoarea pilotului poate fi creditată integral în prima lună."
  },
  {
    id: "managed",
    eyebrow: "Operare continuă",
    title: "ReveNew Managed",
    price: "890 EUR",
    billing: "de la / lună · per companie",
    description:
      "Control recurent asupra execuției comerciale, cu context, prioritizare și review uman.",
    items: [
      "Control Center și prioritizare recurentă",
      "Inteligență Operațională pe sursele autorizate",
      "prepared work, aprobări și auditabilitate",
      "raportare managerială și măsurarea impactului"
    ],
    note:
      "Prețul final depinde de volum, complexitatea procesului și integrările aprobate.",
    dark: true
  }
];

export function ActivationPlanSelector({
  selectedPlanId = null,
  previewMode
}: ActivationPlanSelectorProps) {
  const [pending, startTransition] = useTransition();

  function choosePlan(planId: PreviewPlanId) {
    if (!previewMode) return;
    startTransition(() => {
      void selectPreviewPlan(planId, "/dashboard");
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {plans.map((plan) => {
        const selected = selectedPlanId === plan.id;
        const dark = Boolean(plan.dark);
        const Icon = plan.id === "audit" ? BeakerIcon : ChartBarSquareIcon;

        return (
          <article
            key={plan.id}
            className={[
              "group relative flex min-h-[30rem] flex-col overflow-hidden border p-6 sm:p-7",
              "transition-[transform,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none",
              "hover:-translate-y-0.5",
              dark
                ? "border-[#2b2c29] bg-[#151615] text-white shadow-[0_26px_70px_rgba(17,18,17,0.18)]"
                : "border-[#d8d5ca] bg-[#fbfaf6] text-[#111311] shadow-[0_22px_60px_rgba(31,28,18,0.055)]",
              selected ? "ring-1 ring-[#c5a13b]" : ""
            ].join(" ")}
          >
            <div
              aria-hidden="true"
              className={[
                "absolute inset-x-0 top-0 h-px opacity-80",
                dark
                  ? "bg-[#c5a13b]"
                  : "bg-gradient-to-r from-transparent via-[#c5a13b] to-transparent"
              ].join(" ")}
            />

            <div className="flex min-h-12 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center border backdrop-blur-xl",
                    dark
                      ? "border-white/10 bg-white/[0.055] text-[#d8b753]"
                      : "border-[#d9d2ba] bg-white/60 text-[#8d6f16]"
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p
                  className={[
                    "text-[0.68rem] font-semibold uppercase tracking-[0.17em]",
                    dark ? "text-[#d5b85c]" : "text-[#987716]"
                  ].join(" ")}
                >
                  {plan.eyebrow}
                </p>
              </div>

              {selected ? (
                <span
                  className={[
                    "border px-2.5 py-1 text-[0.68rem] font-semibold",
                    dark
                      ? "border-[#554925] bg-[#1d1a11] text-[#dfc56d]"
                      : "border-[#d9c47b] bg-[#fff8de] text-[#7d6310]"
                  ].join(" ")}
                >
                  Selectat
                </span>
              ) : null}
            </div>

            <div className="mt-6">
              <h3 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[1.75rem]">
                {plan.title}
              </h3>

              <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                <strong className="text-[2.45rem] font-semibold tracking-[-0.055em] sm:text-[2.75rem]">
                  {plan.price}
                </strong>
                <span
                  className={[
                    "pb-1 text-sm",
                    dark ? "text-[#a6aaa4]" : "text-[#69706a]"
                  ].join(" ")}
                >
                  {plan.billing}
                </span>
              </div>

              <p
                className={[
                  "mt-4 max-w-xl text-sm leading-6",
                  dark ? "text-[#c6c9c4]" : "text-[#535a54]"
                ].join(" ")}
              >
                {plan.description}
              </p>
            </div>

            <div className={["mt-6 h-px", dark ? "bg-[#2a2c29]" : "bg-[#e2e1da]"].join(" ")} />

            <ul className="mt-6 grid flex-1 content-start gap-3.5">
              {plan.items.map((item) => (
                <li
                  key={item}
                  className={[
                    "flex items-start gap-3 text-sm leading-6",
                    dark ? "text-[#e7e8e5]" : "text-[#303530]"
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      dark
                        ? "border-[#564a25] bg-[#1c1910] text-[#dfc368]"
                        : "border-[#d9c473] bg-[#fff9e4] text-[#8a6b0f]"
                    ].join(" ")}
                  >
                    <CheckIcon className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p
              className={[
                "mt-6 border-t pt-4 text-xs leading-5",
                dark
                  ? "border-[#2a2c29] text-[#8d918c]"
                  : "border-[#e2e1da] text-[#717771]"
              ].join(" ")}
            >
              {plan.note}
            </p>

            <div className="mt-5">
              {previewMode ? (
                <LiquidGlassAction
                  type="button"
                  tone="champagne"
                  size="large"
                  fullWidth
                  loading={pending}
                  onClick={() => choosePlan(plan.id)}
                >
                  {pending
                    ? "Se salvează..."
                    : selected
                      ? "Continuă cu această opțiune"
                      : plan.id === "audit"
                        ? "Începe pilotul"
                        : "Alege ReveNew Managed"}
                  {!pending ? <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /> : null}
                </LiquidGlassAction>
              ) : (
                <LiquidGlassAction
                  href="/solicita-demo"
                  tone="champagne"
                  size="large"
                  fullWidth
                >
                  Solicită activarea
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </LiquidGlassAction>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
