/** Isolated presentation fixture. A human-recorded outcome is not a cash receipt. */
type RevenueExample = { company:string; opportunity:string; estimated:number; recorded:number; currency:"RON"; basis:string; actor:string; recordedAt:string; status:"won"; reason:string; evidence:string; version:number };
export const revenueExample: RevenueExample = {
 company:"Orizont Service", opportunity:"Contract de suport anual", estimated:48000, recorded:46000,
 currency:"RON", basis:"Valoare comercială declarată", actor:"Radu Matei", recordedAt:"2026-09-06T14:30:00+03:00", status:"won",
 reason:"Contract acceptat; valoare finală înregistrată de responsabil.", evidence:"Contract de suport · referință consemnată", version:1
};
