"use server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseLeadCapture } from "./lead-capture";
import type { DemoRequestResult } from "./demo-request";

/** Public acquisition only. No tenant, workspace, outreach or model side effects. */
export async function submitDemoRequest(input: unknown): Promise<DemoRequestResult> {
  const values = parseLeadCapture(input);
  if (!values) return { accepted: false };
  try {
    const client = createSupabaseAdminClient();
    if (!client) return { accepted: false };
    const { requestId, name, email, company, phone, goal } = values;
    const { data, error } = await client.rpc("capture_marketing_demo_request", {
      p_id: requestId, p_payload: { name, email, company, phone, goal, contactConsent: true }
    });
    return !error && data === requestId ? { accepted: true, receipt: data } : { accepted: false };
  } catch { return { accepted: false }; }
}
