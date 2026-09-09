"use client";

import { AvailableSources } from "./AvailableSources";
import controls from "@/components/ui/PremiumControls.module.css";
import { useRef, useState } from "react";
import {
  ArrowPathRoundedSquareIcon,
  LinkIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { GoogleWorkspaceCard } from "@/components/apps/GoogleWorkspaceCard";
import { PageShell } from "@/components/dashboard/PageShell";
import { IntegrationCatalog } from "@/components/apps/IntegrationCatalog";
import { IntegrationActivity } from "@/components/apps/IntegrationActivity";
import { IntegrationDetailDrawer } from "@/components/apps/IntegrationDetailDrawer";
import { ApplicationStatus as StatusPill } from "@/components/apps/ApplicationStatus";
import type { GoogleWorkspacePublicState } from "@/lib/google-workspace/types";
import type { IntegrationCatalogItem } from "@/lib/integrations/catalog";
import {
  googleContextHealthy,
  googleProviderPresentation,
} from "@/lib/integrations/presentation";
import { cn } from "@/lib/utils";

type Tab = "connections" | "catalog" | "activity";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "connections", label: "Conexiuni" },
  { id: "catalog", label: "Catalog" },
  { id: "activity", label: "Activitate" },
];

const operationalRegion =
  "rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))]";

export function IntegrationHub({
  state,
  notice,
}: {
  state: GoogleWorkspacePublicState;
  notice?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("connections");
  const [selected, setSelected] =
    useState<IntegrationCatalogItem | null>(null);

  const connectionsTab = useRef<HTMLButtonElement>(null);

  const connection = state.connection;
  const connectionCount =
    connection && connection.status !== "disconnected" ? 1 : 0;

  const healthy = googleContextHealthy(state);
  const provider = googleProviderPresentation(state);

  return (
    <>
      <PageShell
        entity="apps"
        wide
        eyebrow="Aplicații"
        title="Aplicații și integrări"
        description="Surse disponibile și sisteme evaluate pentru procesul echipei."
        actions={
          <button
            type="button"
            onClick={() => setTab("catalog")}
            className={`focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 px-3.5 text-xs font-semibold ${controls.primary}`}
          >
            <PlusIcon
              className="h-4 w-4"
              aria-hidden="true"
            />
            Explorează aplicațiile
          </button>
        }
      >
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-4 border-b border-[rgb(var(--border))]">
            <nav
              className={controls.segments}
              aria-label="Secțiuni aplicații"
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  ref={
                    item.id === "connections"
                      ? connectionsTab
                      : undefined
                  }
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={
                    tab === item.id ? "page" : undefined
                  }
                  className={cn(
                    "focus-ring relative min-h-10 rounded-button px-3 text-sm font-semibold transition-colors",
                    tab === item.id
                      ? "text-[rgb(var(--foreground))]"
                      : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--foreground))]",
                  )}
                >
                  {item.label}


                </button>
              ))}
            </nav>

            <div className="hidden items-center gap-2 text-xs text-[rgb(var(--text-faint))] sm:flex">
              <LinkIcon
                className="h-4 w-4"
                aria-hidden="true"
              />
              {connectionCount}{" "}
              {connectionCount === 1
                ? "conexiune"
                : "conexiuni"}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] px-2 py-3 sm:px-4">
            <ShieldCheckIcon
              className="h-4 w-4 shrink-0 text-[rgb(var(--interaction))]"
              aria-hidden="true"
            />

            <div className="min-w-0 text-xs leading-5 text-[rgb(var(--text-muted))]">
              <strong className="font-semibold text-[rgb(var(--foreground))]">
                Control implicit.
              </strong>{" "}
              Contextul folosit depinde de sursele selectate și de accesul acordat.
              Acțiunile cu efect extern necesită control explicit.
            </div>

            <StatusPill
              tone={
                healthy
                  ? "success"
                  : connectionCount
                    ? "warning"
                    : "neutral"
              }
              className="ml-auto hidden shrink-0 sm:inline-flex"
            >
              {healthy
                ? "Context sănătos"
                : provider.status === "syncing"
                  ? "Sincronizare în curs"
                  : connectionCount
                    ? "Verifică sursele"
                    : "Fără conexiuni"}
            </StatusPill>
          </div>

          {tab === "connections" ? <AvailableSources state={state} /> : null}
          {tab === "connections" ? (
            <section
              className={`${operationalRegion} p-4 sm:p-5`}
              id="google-connection"
              aria-labelledby="connections-title"
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="micro-label">
                    Conexiuni
                  </p>

                  <h2
                    id="connections-title"
                    className="mt-1 text-lg font-semibold tracking-[-0.015em] text-[rgb(var(--foreground))]"
                  >
                    Cont Google și autorizări
                  </h2>

                  <p className="mt-1 max-w-[48rem] text-sm leading-6 text-[rgb(var(--text-muted))]">
                    Vezi contul, capabilitățile, ultima
                    sincronizare și unde este folosită fiecare
                    conexiune.
                  </p>
                </div>

                {connection ? (
                  <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-faint))]">
                    <ArrowPathRoundedSquareIcon
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Sincronizare controlată
                  </div>
                ) : null}
              </div>

              <div className="border-y border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]">
                <GoogleWorkspaceCard
                  state={state}
                  notice={notice}
                />
              </div>
            </section>
          ) : null}

          {tab === "catalog" ? (
            <section
              className={`${operationalRegion} p-4 sm:p-5`}
              aria-labelledby="catalog-title"
            >
              <div className="mb-5">
                <p className="micro-label">
                  Catalog
                </p>

                <h2
                  id="catalog-title"
                  className="mt-1 text-lg font-semibold tracking-[-0.015em] text-[rgb(var(--foreground))]"
                >
                  Aplicații care extind contextul comercial
                </h2>

                <p className="mt-1 max-w-[52rem] text-sm leading-6 text-[rgb(var(--text-muted))]">
                  Explorează ce poate fi conectat. Etichetele descriu
                  disponibilitatea reală; nimic nu este prezentat ca
                  disponibil înainte de implementare.
                </p>
              </div>
                <IntegrationCatalog
                  state={state}
                  onSelect={setSelected}
                />
            </section>
          ) : null}

          {tab === "activity" ? (
            <section
              className={`${operationalRegion} p-4 sm:p-5`}
              aria-labelledby="activity-title"
            >
              <div className="mb-5">
                <p className="micro-label">
                  Activitate
                </p>

                <h2
                  id="activity-title"
                  className="mt-1 text-lg font-semibold tracking-[-0.015em] text-[rgb(var(--foreground))]"
                >
                  Sincronizări și sănătatea conexiunilor
                </h2>

                <p className="mt-1 max-w-[48rem] text-sm leading-6 text-[rgb(var(--text-muted))]">
                  Doar evenimentele disponibile din conexiunile reale
                  sunt afișate aici.
                </p>
              </div>

              <div className="border-y border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]">
                <IntegrationActivity state={state} />
              </div>
            </section>
          ) : null}
        </div>
      </PageShell>

      <IntegrationDetailDrawer
        item={selected}
        state={state}
        onClose={() => setSelected(null)}
        onManageGoogle={() => {
          setSelected(null);
          setTab("connections");

          requestAnimationFrame(() =>
            connectionsTab.current?.focus({
              preventScroll: true,
            }),
          );
        }}
      />
    </>
  );
}
