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
    fit: "Proces potrivit pentru a face continuitatea vizibilă",
    risk: "Oferta pleacă, există o promisiune de revenire, dar următorul pas poate rămâne între inbox, fișier și responsabil.",
    reveal: "Cererea, oferta, termenul promis și ultima continuare pot fi reunite în același caz comercial.",
    prepare: "Cazurile în care promisiunea nu are o continuare confirmată devin vizibile înainte să se piardă ritmul.",
    decision: "Responsabilul desemnat verifică situația și decide dacă revenirea trebuie făcută.",
    outcome: "O revenire comercială pregătită pentru revizuire, nu o acțiune trimisă automat.",
  },
  handoff: {
    fit: "Proces potrivit când cazul trece prin mai multe mâini",
    risk: "La predarea între colegi, contextul poate rămâne la persoana inițială, iar noul responsabil nu vede clar ce s-a promis.",
    reveal: "Conversația, ultima promisiune și responsabilul curent pot fi legate într-un singur fir de lucru.",
    prepare: "Cazurile fără proprietar sau fără o continuare explicită sunt scoase în față pentru clarificare.",
    decision: "Echipa păstrează explicit cine preia cazul și cine aprobă continuarea.",
    outcome: "O predare clară, cu context și următor pas pregătit pentru persoana care îl preia.",
  },
  renewals: {
    fit: "Proces potrivit pentru relații recurente și termene care trebuie urmărite",
    risk: "O relație bună poate continua fără ca termenul de reînnoire sau aprobarea următoare să devină o acțiune clară.",
    reveal: "Termenul relevant, istoricul comercial și lipsa unei continuări confirmate pot fi puse în același context.",
    prepare: "Cazurile care se apropie de termen fără următor pas devin vizibile pentru echipă.",
    decision: "Persoana autorizată decide momentul și forma revenirii sau aprobării.",
    outcome: "Un pas de reînnoire sau aprobare pregătit pentru revizuire, cu sursa și motivul la vedere.",
  },
  retail: {
    fit: "Potrivire limitată dacă procesul este aproape instantaneu",
    risk: "Dacă există foarte puține etape și un singur moment de decizie, ReveNew poate avea mai puțină continuitate de urmărit.",
    reveal: "Mai întâi delimităm dacă există excepții, reveniri sau relații recurente care chiar merită urmărite.",
    prepare: "Doar cazurile cu mai multe puncte de control sunt aduse în revizuire.",
    decision: "Compania decide dacă există suficientă complexitate pentru ca implementarea să aducă valoare.",
    outcome: "Un proces eligibil bine delimitat, înainte de orice implementare mai amplă.",
  },
};

const contextPatterns: Record<Qualification["context"], string> = {
  files: "Conversații relevante, documente și registre CSV/XLSX selectate pentru proces.",
  crm: "Evidențe comerciale și corespondență; conectarea CRM se validează înainte de activare.",
  mixed: "Conversații, întâlniri, documente și evidențe comerciale — numai sursele utile cazului.",
};

export function qualify(input: Qualification): QualificationMessage {
  const process = processPatterns[input.process];
  const context = contextPatterns[input.context];
  const decisionOwner = input.team === "one"
    ? "Un responsabil unic păstrează decizia finală."
    : "Mai mulți colegi pot contribui, dar responsabilitatea și aprobarea rămân explicite.";

  return {
    ...process,
    sources: `${context} ${decisionOwner}`,
    decision: `${process.decision} ${decisionOwner}`,
  };
}
