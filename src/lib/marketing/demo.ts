// Curated public illustration, never connected to customer data or a provider.
export const landingDemo = Object.freeze({
  company: "Atelier Nord", opportunity: "Contract de mentenanță", owner: "Ana Popescu", initials: "AP",
  amount: "42.000 RON", qualifier: "Valoare estimată", observed: "6 septembrie 2026",
  offered: "2 septembrie", deadline: "4 septembrie", file: "Pipeline.xlsx", version: "v3", sheet: "Oferte", range: "A8:F8", row: 8,
  excerpt: "Ofertă transmisă pe 2 septembrie. Revenim până pe 4 septembrie pentru confirmarea următorului pas.",
  conclusion: "Termenul de revenire a trecut. Următorul pas nu este consemnat în sursa disponibilă.",
  uncertainty: "Nu știm dacă a existat o discuție în afara acestei surse.",
  nextStep: "Verifică discuțiile recente și confirmă revenirea către Atelier Nord.",
  draft: "Bună ziua! Revin în legătură cu oferta de mentenanță. Ne puteți confirma următorul pas și persoana cu care continuăm discuția?",
  preparedState: "prepared_not_executed"
} as const);
export const theatreScenes = ["Semnal", "Dovezi", "Acțiune"] as const;
export type TheatreScene = 0 | 1 | 2;
export function nextTheatreScene(current: TheatreScene, key: string): TheatreScene {
  if (key === "Home") return 0;
  if (key === "End") return 2;
  if (key === "ArrowRight") return ((current + 1) % 3) as TheatreScene;
  if (key === "ArrowLeft") return ((current + 2) % 3) as TheatreScene;
  return current;
}
