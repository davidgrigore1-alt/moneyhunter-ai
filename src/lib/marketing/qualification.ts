/** Curated public guidance. No customer data, persistence or model call. */
export type Qualification = {
  process: "offers" | "handoff" | "renewals" | "retail";
  context: "files" | "crm" | "mixed";
  team: "one" | "several";
};

type QualificationMessage = {
  fit: string;
  risk: string;
  reveal: string;
  prepare: string;
  decision: string;
  sources: string;
  outcome: string;
};

const processPatterns: Record<Qualification["process"], Omit<QualificationMessage, "sources">> = {
  offers: {
    fit: "Potrivire clară pentru ofertele care cer revenire",
    risk: "Oferta trece de la promisiune la uitare dacă termenul nu este confirmat cu responsabil.",
    reveal: "Conversația inițială, oferta trimisă și următorul pas promis se văd în evidențe diferite.",
    prepare: "Revenirea de verificat devine o recomandare pregătită, cu persoana responsabilă menționată.",
    decision: "Rezultatul final și continuarea rămân la persoana autorizată din echipă.",
    outcome: "Cazul devine concret pentru revizuire, nu o acțiune automată.",
  },
  handoff: {
    fit: "Potrivire bună pentru procesele cu predare între colegi",
    risk: "Cazurile pot rămâne fără „proprietar clar” după schimbarea responsabilului.",
    reveal: "În conversații apar urmele precedente, dar următorul pas nu este reatașat automat noului responsabil.",
    prepare: "Apare o variantă de continuitate pregătită pentru cine îl preia pe flux.",
    decision: "Decizia nu trece automat; rămâne clar cine aprobă reluarea.",
    outcome: "Rezultatul devine verificabil doar dacă o persoană autorizată îl confirmă.",
  },
  renewals: {
    fit: "Potrivire bună pentru reluări și relații recurente",
    risk: "O relație bună nu înseamnă automat o revenire confirmată; termenul poate rămâne neclar.",
    reveal: "Se identifică contactul, termenul real și pașii care lipsesc între stadiile de reluare.",
    prepare: "Revenirea este formulată ca pas separat, cu explicația de urmat înainte de reluare.",
    decision: "Rezultatul procesului rămâne sub aprobarea echipei comerciale.",
    outcome: "Se obține o listă de puncte concrete care pot fi validate în echipă.",
  },
  retail: {
    fit: "Potrivire pentru tranzacții rapide sau volume mari",
    risk: "Fără minim două puncte de control, lanțul comercial poate fi prea subțire.",
    reveal: "Evidențele apar fragmentat, iar revenirea nu se leagă automat la obiectiv.",
    prepare: "Se recomandă un traseu monitorizat doar acolo unde există dovezi suficiente.",
    decision: "Decizia finală rămâne pe controlul tău uman.",
    outcome: "Rezultatul se limitează la cazurile care merită tratate cu echipa.",
  },
};

const contextPatterns: Record<Qualification["context"], string> = {
  files: "Conversații relevante + atașamente + documente CSV/XLSX.",
  crm: "Date comerciale + oportunități + istoric, unde integrarea CRM este autorizată înainte de activare.",
  mixed: "Conversații + întâlniri + documente + evidențe comerciale. Combinăm doar sursele utile.",
};

export function qualify(input: Qualification): QualificationMessage {
  const process = processPatterns[input.process];
  const context = contextPatterns[input.context];
  const decisionOwner =
    input.team === "one"
      ? "Un responsabil unic ține controlul final."
      : "Mai mulți actori contribuie, iar rolurile sunt explicit delimitate.";

  return {
    ...process,
    sources: `${context} ${decisionOwner}`,
    decision: `${process.decision} ${decisionOwner}`,
    risk: process.risk,
    reveal: `${process.reveal}${input.context === "crm" ? " Conectarea la CRM se validează pe flux, nu e automată." : ""}`,
    prepare: process.prepare,
    outcome: process.outcome,
    fit: process.fit,
  };
}
