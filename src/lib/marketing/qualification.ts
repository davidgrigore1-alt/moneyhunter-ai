/** Curated public guidance. No customer data, persistence or model call. */
export type Qualification = {
  process: "offers" | "handoff" | "renewals" | "retail";
  context: "files" | "crm" | "mixed";
  team: "one" | "several";
};

type QualificationMessage = {
  fit: string;
  leadership: string;
  risk: string;
  reveal: string;
  prepare: string;
  decision: string;
  sources: string;
  outcome: string;
};

const processPatterns: Record<Qualification["process"], Omit<QualificationMessage, "sources">> = {
  offers: {
    fit: "Ofertele cer o revenire, nu doar o înregistrare în pipeline.",
    leadership: "Vezi ce discuții cer atenție înainte să întrebi fiecare coleg.",
    risk: "Oferta pleacă, dar revenirea promisă poate rămâne fără următor pas.",
    reveal: "Cererea, oferta, termenul promis și ultima continuare pot fi reunite în același caz comercial.",
    prepare: "Ofertele fără continuare, cu termenul și responsabilul de verificat.",
    decision: "Responsabilul desemnat verifică situația și decide dacă revenirea trebuie făcută.",
    outcome: "O revenire comercială pregătită pentru revizuire, nu o acțiune trimisă automat.",
  },
  handoff: {
    fit: "Continuitatea depinde de ce se transmite între colegi.",
    leadership: "Vezi unde responsabilitatea trebuie clarificată, înainte ca un caz să rămână blocat.",
    risk: "Cazul trece la alt coleg, dar promisiunea poate rămâne la persoana inițială.",
    reveal: "Conversația, ultima promisiune și responsabilul curent pot fi legate într-un singur fir de lucru.",
    prepare: "Predările fără responsabil clar sau fără o continuare consemnată.",
    decision: "Echipa păstrează explicit cine preia cazul și cine aprobă continuarea.",
    outcome: "O predare clară, cu context și următor pas pregătit pentru persoana care îl preia.",
  },
  renewals: {
    fit: "Relațiile recurente cer pași pregătiți înainte de termen.",
    leadership: "Vezi ce relații au nevoie de atenție și cine pregătește continuarea.",
    risk: "Termenul de reînnoire se apropie, fără o revenire sau o aprobare stabilită.",
    reveal: "Termenul relevant, istoricul comercial și lipsa unei continuări confirmate pot fi puse în același context.",
    prepare: "Reînnoirile apropiate de termen, cu dovada și pasul de pregătit.",
    decision: "Persoana autorizată decide momentul și forma revenirii sau aprobării.",
    outcome: "Un pas de reînnoire sau aprobare pregătit pentru revizuire, cu sursa și motivul la vedere.",
  },
  retail: {
    fit: "Potrivire limitată dacă procesul este aproape instantaneu",
    leadership: "Delimitezi un proces util înainte de a investi în implementare.",
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
