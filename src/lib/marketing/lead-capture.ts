import { validateDemoRequest, type DemoRequestValues } from "./demo-request";

export type LeadCaptureInput = DemoRequestValues & { requestId: string; contactConsent: boolean; website: string };
export function parseLeadCapture(input: unknown): LeadCaptureInput | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const item = input as Record<string, unknown>;
  if (item.contactConsent !== true || item.website !== "" || typeof item.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.requestId)) return null;
  const fields = ["name", "email", "company", "phone", "goal"] as const;
  if (fields.some(key => typeof item[key] !== "string" || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(item[key] as string))) return null;
  const values = Object.fromEntries(fields.map(key => [key, (item[key] as string).trim()])) as DemoRequestValues;
  if (Object.keys(validateDemoRequest(values)).length) return null;
  values.email = values.email.toLowerCase();
  return { ...values, requestId: item.requestId, contactConsent: true, website: "" };
}
