export type DemoRequestValues = { name: string; email: string; company: string; phone: string; goal: string };
export type DemoRequestErrors = Partial<Record<keyof DemoRequestValues, string>>;
export type DemoRequestResult = { accepted: true; receipt: string } | { accepted: false };
export type DemoSubmitState = "idle" | "pending" | "error" | "success";

export function validateDemoRequest(values: DemoRequestValues): DemoRequestErrors {
  const errors: DemoRequestErrors = {};
  if (!values.name.trim()) errors.name = "Completează numele.";
  else if (values.name.trim().length > 120) errors.name = "Folosește cel mult 120 de caractere.";
  if (!values.email.trim()) errors.email = "Completează adresa de email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.trim().length > 254) errors.email = "Verifică adresa de email.";
  if (!values.company.trim()) errors.company = "Completează numele companiei.";
  else if (values.company.trim().length > 180) errors.company = "Folosește cel mult 180 de caractere.";
  if (values.phone.length > 50) errors.phone = "Folosește cel mult 50 de caractere.";
  if (values.goal.length > 2000) errors.goal = "Folosește cel mult 2.000 de caractere.";
  return errors;
}

// Only an approved server adapter may provide this result. No adapter is wired yet.
export function isDemoRequestAccepted(result: unknown): result is { accepted: true; receipt: string } {
  if (!result || typeof result !== "object") return false;
  const item = result as Record<string, unknown>;
  return item.accepted === true && typeof item.receipt === "string" && item.receipt.trim().length > 0;
}
