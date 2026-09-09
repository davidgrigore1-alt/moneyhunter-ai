export type IntegrationStage = "implemented" | "next" | "planned";
export type IntegrationCategory = "Comunicare" | "CRM" | "Documente" | "Contracte" | "Platformă";

export type IntegrationCatalogItem = {
  id: string;
  name: string;
  category: IntegrationCategory;
  stage: IntegrationStage;
  description: string;
  capabilities: string[];
  useCases: Array<{ label: string; detail: string }>;
  permissions: string[];
  scope: "Utilizator" | "Workspace";
  logoUrl: string | null;
  logoMode?: "mark" | "wordmark";
  note?: string;
};

/** Catalogue describes capability availability, never an account authorization. */
const evaluation = (id: string, name: string, category: IntegrationCategory, logoUrl: string | null, description: string, logoMode: "mark" | "wordmark" = "mark"): IntegrationCatalogItem => ({
  id, name, category, stage: "planned", logoUrl, logoMode, description,
  capabilities: ["Proces", "Acces", "Date"],
  useCases: [{ label: "Potrivire cu procesul", detail: "Stabilim ce informație ar fi utilă și dacă poate fi conectată în siguranță." }],
  permissions: ["Permisiunile minime se stabilesc înainte de implementare. Nicio autorizare nu este solicitată aici."],
  scope: "Workspace", note: "Evaluare înainte de implementare. Acest sistem nu are un conector ReveNew activ."
});
export const integrationCatalog: IntegrationCatalogItem[] = [
  { id: "google-workspace", name: "Google Workspace", category: "Comunicare", stage: "implemented",
    description: "Gmail, Calendar și documente Drive selectate explicit, după configurare și autorizare.",
    capabilities: ["Gmail", "Calendar", "Drive"], useCases: [{ label: "Context autorizat", detail: "Conversații, întâlniri și documente pentru verificarea cazurilor comerciale." }],
    permissions: ["Citire Gmail", "Citire Calendar", "Fișiere Drive selectate", "Trimitere Gmail numai cu autorizare separată și confirmare"], scope: "Utilizator",
    logoUrl: "/brands/applications/google-symbol.svg", note: "Acoperirea surselor poate fi parțială. Conectarea unui cont nu autorizează toate serviciile." },
  evaluation("microsoft-365", "Microsoft 365", "Comunicare", "/brands/applications/microsoft-365.svg", "Spațiul de lucru al echipei: email, calendare și documente."),
  evaluation("outlook", "Outlook", "Comunicare", "/marketing/providers/microsoft-outlook.svg", "Conversații și calendare, în funcție de accesul disponibil."),
  evaluation("teams", "Teams", "Comunicare", "/marketing/providers/microsoft-teams.svg", "Discuțiile și întâlnirile echipei."),
  evaluation("onedrive", "OneDrive", "Documente", "/marketing/providers/microsoft-onedrive.svg", "Fișierele de lucru selectate de echipă."),
  evaluation("sharepoint", "SharePoint", "Documente", "/marketing/providers/microsoft-sharepoint.svg", "Documente și informații păstrate în companie."),
  evaluation("salesforce", "Salesforce", "CRM", "/brands/applications/salesforce.svg", "Companii, contacte și oportunități din CRM."),
  evaluation("hubspot", "HubSpot", "CRM", "/brands/applications/hubspot.svg", "Relații comerciale și stadiul discuțiilor."),
  evaluation("pipedrive", "Pipedrive", "CRM", "/brands/applications/pipedrive.svg", "Oportunități și activități comerciale.", "wordmark"),
  evaluation("dynamics", "Microsoft Dynamics 365", "CRM", "/marketing/providers/dynamics-current.svg", "Contextul comercial din sistemul echipei."),
  evaluation("zoho", "Zoho CRM", "CRM", "/marketing/providers/zoho-dark.svg", "Clienți, contacte și oferte.", "wordmark"),
  evaluation("slack", "Slack", "Comunicare", "/brands/applications/slack.svg", "Conversațiile relevante pentru procesul comercial."),
  evaluation("zoom", "Zoom", "Comunicare", "/marketing/providers/zoom.svg", "Întâlniri și contextul disponibil al discuției.", "wordmark"),
  evaluation("google-meet", "Google Meet", "Comunicare", "/marketing/providers/google-meet.svg", "Integrare dedicată în evaluare. Linkurile Meet pot exista deja în Calendar."),
  evaluation("notion", "Notion", "Documente", "/marketing/providers/notion.svg", "Documentație și cunoștințe ale echipei."),
  evaluation("dropbox", "Dropbox", "Documente", "/marketing/providers/dropbox.svg", "Fișiere și documente comerciale."),
  evaluation("confluence", "Confluence", "Documente", "/marketing/providers/confluence.svg", "Informația păstrată în companie."),
  evaluation("smartbill", "SmartBill", "Platformă", "/marketing/providers/smartbill.png", "Context de facturare pentru procesul stabilit cu echipa.", "wordmark"),
  evaluation("docusign", "Docusign", "Contracte", "/brands/applications/docusign.svg", "Starea documentelor contractuale.", "wordmark"),
  evaluation("webhooks-api", "API & Webhooks", "Platformă", null, "Conectarea sistemelor interne se evaluează pentru fiecare proces.")
];
export const integrationStageLabels: Record<IntegrationStage, string> = {
  implemented: "Disponibil acum", next: "Evaluare înainte de implementare", planned: "Evaluare înainte de implementare"
};
