// Isolated synthetic marketing fixtures. No customer data, provider calls or persisted claims.
export const theatreQuestion = "Ce necesită atenție astăzi și pe ce dovezi se bazează?";
// Curated, authorized-source states in this synthetic theatre only.
export const theatreSources = Object.freeze([
  { name: "Gmail", logo: "/brands/google/gmail.svg", count: "12 mesaje relevante", state: "Conectat" },
  { name: "Calendar", logo: "/brands/google/calendar.svg", count: "2 întâlniri relevante", state: "Conectat" },
  { name: "Drive", logo: "/brands/applications/google-drive.svg", count: "1 document relevant", state: "Conectat" },
].map(source => Object.freeze(source)));
export const theatreCompanies = Object.freeze([
  { name: "Atelier Nord", domain: "atelier-nord.example", topic: "Contract de mentenanță", arr: 42000, connection: "Puternică", strength: 4, fit: "Ridicat", owner: "Ana Popescu", status: "De revizuit", mark: 0, row: 8 },
  { name: "Meridian Systems", domain: "meridian.example", topic: "Licențe enterprise", arr: 96000, connection: "Puternică", strength: 4, fit: "Ridicat", owner: "Radu Matei", status: "În discuție", mark: 1, row: 9 },
  { name: "Vector Industrial", domain: "vector.example", topic: "Furnizare echipamente", arr: 180000, connection: "Moderată", strength: 3, fit: "Ridicat", owner: "Mihai Ionescu", status: "De revizuit", mark: 2, row: 10 },
  { name: "Altis Medical", domain: "altis.example", topic: "Servicii de suport", arr: 72000, connection: "Puternică", strength: 4, fit: "Bun", owner: "Ana Popescu", status: "Pas stabilit", mark: 3, row: 11 },
  { name: "Novacore Logistics", domain: "novacore.example", topic: "Contract logistic", arr: 144000, connection: "Moderată", strength: 3, fit: "Bun", owner: "Radu Matei", status: "În discuție", mark: 4, row: 12 },
  { name: "Helix Energy", domain: "helix.example", topic: "Mentenanță tehnică", arr: 216000, connection: "Puternică", strength: 4, fit: "Ridicat", owner: "Mihai Ionescu", status: "Pas stabilit", mark: 5, row: 13 },
  { name: "Urban Construct", domain: "urban.example", topic: "Servicii de proiectare", arr: 120000, connection: "În formare", strength: 2, fit: "Bun", owner: "Radu Matei", status: "În discuție", mark: 6, row: 14 },
  { name: "Delta Facilities", domain: "delta.example", topic: "Reînnoire servicii", arr: 60000, connection: "Moderată", strength: 3, fit: "Ridicat", owner: "Ana Popescu", status: "De revizuit", mark: 7, row: 15 },
].map(company => Object.freeze(company)));
export const portfolioTotal = theatreCompanies.reduce((sum, company) => sum + company.arr, 0);
export const reviewTotal = theatreCompanies.filter(company => company.status === "De revizuit").reduce((sum, company) => sum + company.arr, 0);
export const portfolioDistribution = ["De revizuit", "În discuție", "Pas stabilit"].map(label => ({
  label, count: theatreCompanies.filter(company => company.status === label).length,
}));
/** Closed annular sectors share exact boundaries, including the 360-degree seam. */
export function portfolioRingSegments() {
  let start = -Math.PI / 2;
  const point = (radius: number, angle: number) => `${110 + radius * Math.cos(angle)},${110 + radius * Math.sin(angle)}`;
  return portfolioDistribution.map(({ label, count }) => {
    const sweep = count / theatreCompanies.length * Math.PI * 2;
    const end = start + sweep, largeArc = sweep > Math.PI ? 1 : 0;
    const path = `M${point(91,start)}A91,91 0 ${largeArc} 1 ${point(91,end)}L${point(64,end)}A64,64 0 ${largeArc} 0 ${point(64,start)}Z`;
    start = end;
    return { label, count, percent: count / theatreCompanies.length * 100, path };
  });
}
export const portfolioHistory = Object.freeze([
  { month: "Iulie", values: [210, 150, 90] },
  { month: "August", values: [260, 180, 120] },
  { month: "Septembrie", values: [480, 282, 168] },
]);
export function formatIllustrativeRON(value: number) { return new Intl.NumberFormat("ro-RO").format(value); }
