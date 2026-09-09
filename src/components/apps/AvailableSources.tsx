import { ApplicationLogo } from "./ApplicationLogo";
import { CapabilityStatus } from "./CapabilityStatus";
import { googleCapabilities } from "@/lib/integrations/presentation";
import type { GoogleWorkspacePublicState } from "@/lib/google-workspace/types";
import styles from "./Ecosystem.module.css";

export function AvailableSources({ state }: { state: GoogleWorkspacePublicState }) {
  const google = googleCapabilities(state);
  const sources = [
    { id: "gmail", name: "Gmail", description: "Conversații autorizate. Trimiterea cere confirmare separată.", href: "/apps#google-connection" },
    { id: "google-calendar", name: "Calendar", description: "Întâlniri și participanți. Acces pentru citire.", href: "/meetings" },
    { id: "google-drive", name: "Drive", description: "Documente selectate explicit. Acoperire de verificat.", href: "/documents/add" },
    { id: "csv", name: "CSV", description: "Sursă locală. Verificare și import explicit, separat.", href: "/documents/add" },
    { id: "xlsx", name: "XLSX", description: "Registru local versionat. Formulele nu sunt recalculate.", href: "/documents/add" },
  ];
  return <section aria-label="Disponibil acum" className={styles.available}>
    <header><h2>Disponibil acum</h2><p>Capabilitatea există. Starea accesului tău este afișată separat.</p></header>
    <div className={styles.sources}>{sources.map(source => {
      const operation = google.find(item => item.id === source.id)?.operations[0];
      return <a key={source.id} className={`focus-ring ${styles.source}`} href={source.href}>
        <ApplicationLogo item={source} /><h3>{source.name}</h3><p>{source.description}</p>
        {operation ? <CapabilityStatus status={operation.status} /> : <span className={styles.local}>Fișier local · fără sincronizare</span>}
        <span className={styles.open}>{source.id === "gmail" ? "Gestionează accesul" : source.id === "google-calendar" ? "Deschide întâlnirile" : "Deschide documentele"} →</span>
      </a>;
    })}</div>
  </section>;
}
