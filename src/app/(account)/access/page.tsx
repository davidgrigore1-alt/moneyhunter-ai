import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";
import { ActivationPlanSelector } from "@/components/access/ActivationPlanSelector";
import { LiquidGlassAction } from "@/components/access/LiquidGlassAction";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Logo } from "@/components/ui/Logo";
import {
  getCurrentPaidAccessContext,
  getPaidAccessStatusLabel
} from "@/lib/billing/paid-access";
import { getPaidPlanLabel } from "@/lib/billing/plans";
import { formatDate } from "@/lib/utils";

function reasonMessage(reason?: string) {
  if (reason === "subscription_verification_unavailable") {
    return "Statutul abonamentului nu poate fi verificat momentan. Accesul rămâne blocat până la verificare.";
  }
  if (reason === "expired") {
    return "Perioada planului s-a încheiat. Poți verifica statutul sau continua procesul comercial pentru reactivare.";
  }
  if (reason === "payment_failed") {
    return "Confirmarea plății nu este disponibilă încă. Verifică din nou statutul sau consultă zona de facturare.";
  }
  if (reason === "trial_not_enabled") {
    return "Accesul operațional necesită un plan confirmat. Contul și spațiul de lucru rămân păstrate.";
  }
  if (reason === "cancelled") {
    return "Planul nu mai este activ. Datele contului rămân păstrate conform politicilor existente.";
  }
  return "Contul este creat. Accesul operațional se activează după confirmarea opțiunii comerciale potrivite.";
}

function previewPlanLabel(id?: string | null) {
  if (id === "audit") return "Pilot ReveNew";
  if (id === "managed") return "ReveNew Managed";
  return "Nicio opțiune selectată";
}

export default async function AccessPage(props: {
  searchParams?: Promise<{ reason?: string }>;
}) {
  const searchParams = await props.searchParams;
  const context = await getCurrentPaidAccessContext({
    redirectIfMissingBusiness: false
  });

  if (!context) redirect("/onboarding");

  const isPreviewMode = context.accessMode === "preview";
  const periodEnd = context.subscription?.currentPeriodEnd
    ? formatDate(context.subscription.currentPeriodEnd)
    : "Nu este stabilită";

  const statusLabel = isPreviewMode
    ? context.hasAccess
      ? "Opțiune selectată"
      : "Activare necesară"
    : getPaidAccessStatusLabel(context.accessStatus);

  const planLabel = isPreviewMode
    ? previewPlanLabel(context.previewPlan?.id)
    : getPaidPlanLabel(context.subscription?.plan) ?? "Fără plan activ";

  const activationLabel = isPreviewMode
    ? "Mediu de evaluare"
    : context.hasAccess
      ? periodEnd
      : "Confirmare comercială necesară";

  return (
    <main className="account-light-theme min-h-screen overflow-hidden bg-[#f2f0e9] text-[#101210]">
      <header className="sticky top-0 z-40 border-b border-[#dedbd0] bg-[#faf9f4]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1220px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/billing"
              className="focus-ring inline-flex min-h-10 items-center rounded-button px-3 text-sm font-semibold text-[#5e645e] transition-colors duration-150 hover:bg-white/70 hover:text-[#101210]"
            >
              Cont<span className="hidden sm:inline"> și facturare</span>
            </Link>
            <div className="hidden sm:block">
              <LogoutButton className="min-h-10 px-3 py-2" />
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#242624] bg-[#0d0f0e] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-14%] top-[-38%] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(194,153,39,0.13)_0%,rgba(194,153,39,0.035)_42%,transparent_68%)]"
        />
        <div className="mx-auto max-w-[1220px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[4.5rem]">
          <div className="mb-10 flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#7f837e]">
            <span className="text-[#cdb052]">Cont</span>
            <span aria-hidden="true">—</span>
            <span className="text-[#cdb052]">Spațiu de lucru</span>
            <span aria-hidden="true">—</span>
            <span className="text-white">Activare</span>
            <span aria-hidden="true">—</span>
            <span>Primul caz</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.68fr)] lg:items-center">
            <div className="max-w-[44rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#d3b354]">
                Pasul 3 din 4 · Activare
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[3.65rem]">
                Alege punctul de pornire.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#b6bab5] sm:text-lg">
                ReveNew începe cu un proces comercial clar. Măsurăm ce există,
                ce intervenție are loc și ce rezultat este confirmat — fără să
                confundăm estimările cu venitul.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <LiquidGlassAction href="#planuri" tone="champagne" size="large">
                  Alege opțiunea
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </LiquidGlassAction>
                {context.hasAccess ? (
                  <LiquidGlassAction href="/dashboard" tone="dark" size="large">
                    Intră în Control Center
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </LiquidGlassAction>
                ) : null}
              </div>

              <p className="mt-5 flex max-w-2xl items-start gap-2 text-sm leading-6 text-[#8d918c]">
                <ShieldCheckIcon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#cfaf4d]"
                  aria-hidden="true"
                />
                Nicio opțiune nu promite rezultate garantate. Nicio acțiune
                comercială externă nu este aplicată fără control uman explicit.
              </p>
            </div>

            <aside
              aria-labelledby="activation-state-title"
              className="relative overflow-hidden border border-white/10 bg-white/[0.055] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d1b052]/70 to-transparent"
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#d2b253]">
                    Stare activare
                  </p>
                  <h2
                    id="activation-state-title"
                    className="mt-2 text-xl font-semibold tracking-[-0.025em]"
                  >
                    {context.currentBusiness.business.name}
                  </h2>
                </div>
                <CheckCircleIcon
                  className="h-6 w-6 shrink-0 text-[#cfaf4d]"
                  aria-hidden="true"
                />
              </div>

              <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                <div className="grid grid-cols-[104px_1fr] gap-4 py-3.5">
                  <dt className="text-sm text-[#858a84]">Status</dt>
                  <dd className="text-sm font-semibold text-white">{statusLabel}</dd>
                </div>
                <div className="grid grid-cols-[104px_1fr] gap-4 py-3.5">
                  <dt className="text-sm text-[#858a84]">Opțiune</dt>
                  <dd className="text-sm font-semibold text-white">{planLabel}</dd>
                </div>
                <div className="grid grid-cols-[104px_1fr] gap-4 py-3.5">
                  <dt className="text-sm text-[#858a84]">Mediu</dt>
                  <dd className="text-sm font-semibold text-white">{activationLabel}</dd>
                </div>
              </dl>

              <p className="mt-4 text-xs leading-5 text-[#8f948e]">
                {isPreviewMode
                  ? "În mediul local, selecția simulează activarea. Nu inițiază plăți și nu creează abonamente."
                  : context.hasAccess
                    ? "Accesul a fost confirmat pe server și este activ."
                    : reasonMessage(searchParams?.reason ?? context.reason)}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section id="planuri" className="scroll-mt-24 border-b border-[#dcd8cc] bg-[#f3f1ea]">
        <div className="mx-auto max-w-[1220px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#987716]">
                Opțiuni comerciale
              </p>
              <h2
                id="planuri-heading"
                tabIndex={-1}
                className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] outline-none sm:text-4xl"
              >
                Validează întâi. Scalează după dovadă.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#5d645e] lg:justify-self-end">
              Prețul este per companie, nu per utilizator. Pilotul reduce riscul
              inițial; operarea recurentă începe după ce există un business case
              suficient de clar.
            </p>
          </div>

          <div className="mt-9">
            <ActivationPlanSelector
              selectedPlanId={context.previewPlan?.id ?? null}
              previewMode={isPreviewMode}
            />
          </div>

          <div className="mt-5 grid gap-5 border border-[#d8d4c7] bg-white/45 p-6 shadow-[0_16px_50px_rgba(45,40,24,0.045)] backdrop-blur-xl sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#8f7015]">
                Enterprise
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                Integrare, volum și guvernanță stabilite după evaluare.
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#59605a]">
                Pentru mai multe procese comerciale, cerințe de securitate,
                integrare cu sisteme existente sau volume care necesită
                configurare dedicată.
              </p>
            </div>
            <LiquidGlassAction href="/solicita-demo" tone="light" size="large">
              Discută implementarea
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </LiquidGlassAction>
          </div>
        </div>
      </section>

      <section className="border-b border-[#282a27] bg-[#101211] text-white">
        <div className="mx-auto max-w-[1220px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#d0b151]">
                Business case
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Costul trebuie să poată fi apărat cu propriile date.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#aeb2ad]">
                ReveNew nu promite o recuperare. Construiește un fir verificabil
                de la situația inițială la intervenție și apoi la rezultatul
                confirmat.
              </p>
            </div>

            <div className="relative overflow-hidden border border-white/10 bg-white/[0.045] shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c6a137]/60 to-transparent"
              />
              <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  {
                    label: "Baseline",
                    title: "Situația inițială",
                    description:
                      "Valoare urmărită, cazuri fără responsabil și lipsa unui următor pas.",
                    icon: DocumentMagnifyingGlassIcon
                  },
                  {
                    label: "Intervenție",
                    title: "Ce s-a schimbat",
                    description:
                      "Ce a fost revizuit, pregătit, aprobat și atribuit.",
                    icon: WrenchScrewdriverIcon
                  },
                  {
                    label: "Rezultat",
                    title: "Ce poate fi susținut",
                    description:
                      "Ce s-a confirmat și ce impact comercial are dovadă.",
                    icon: CheckBadgeIcon
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="group relative p-6 transition-colors duration-200 hover:bg-white/[0.035]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex h-10 w-10 items-center justify-center border border-[#584b26] bg-[#171812] text-[#d2b253]">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[#777d76]">
                          {item.label}
                        </span>
                      </div>
                      <h3 className="mt-7 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#929791]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5ee]">
        <div className="mx-auto max-w-[1220px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#987716]">
                Control by design
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                Din dovadă până la decizie, fără salturi ascunse.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#616862]">
                Fiecare etapă păstrează clar ce știm, cine răspunde și ce poate
                fi aplicat.
              </p>
            </div>

            <div>
              <div className="overflow-hidden border border-[#d8d3c4] bg-white/55 shadow-[0_24px_70px_rgba(53,47,27,0.07)] backdrop-blur-xl">
                <div className="grid divide-y divide-[#dfdbcf] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                  {[
                    {
                      label: "Dovezi",
                      description: "Ce susține concluzia.",
                      icon: ClipboardDocumentCheckIcon
                    },
                    {
                      label: "Responsabil",
                      description: "Cine deține următorul pas.",
                      icon: UserCircleIcon
                    },
                    {
                      label: "Pas pregătit",
                      description: "Ce ar trebui să urmeze.",
                      icon: WrenchScrewdriverIcon
                    },
                    {
                      label: "Decizie umană",
                      description: "Ce se aprobă și ce nu.",
                      icon: CheckBadgeIcon
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="group relative min-h-44 p-5 transition-[background-color,transform] duration-200 hover:bg-[#fffdf7]"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#c6a137]/0 to-transparent transition-all duration-200 group-hover:via-[#c6a137]/65"
                        />
                        <span className="flex h-10 w-10 items-center justify-center border border-[#d6ccb0] bg-[#fffaf0]/80 text-[#8d6f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="mt-7 text-sm font-semibold">{item.label}</h3>
                        <p className="mt-2 text-xs leading-5 text-[#6b716c]">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 border border-[#d8d3c4] bg-white/50 px-4 py-3 text-sm font-medium text-[#303530] shadow-[0_12px_30px_rgba(53,47,27,0.045)] backdrop-blur-xl">
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[#9a7715]" aria-hidden="true" />
                Nicio acțiune comercială externă fără control uman explicit.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#292a28] bg-[#0f1010] text-white">
        <div className="mx-auto grid max-w-[1220px] gap-7 px-4 py-11 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#d0b151]">
              Următorul pas
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Începe cu un singur proces. Măsoară ce se schimbă.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#9ea29d]">
              Ipoteza, dovada, intervenția și rezultatul confirmat rămân stări
              distincte.
            </p>
          </div>

          <div className="grid min-w-[19rem] grid-cols-2 gap-3">
            <LiquidGlassAction href="#planuri" tone="champagne" size="large" fullWidth>
              Alege opțiunea
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </LiquidGlassAction>
            <LiquidGlassAction href="/billing" tone="dark" size="large" fullWidth>
              Vezi contul
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </LiquidGlassAction>
          </div>
        </div>
      </section>
    </main>
  );
}
