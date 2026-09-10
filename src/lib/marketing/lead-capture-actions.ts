"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseLeadCapture } from "./lead-capture";
import type { DemoRequestResult } from "./demo-request";

function leadCaptureWarning(
  reason: string,
  detail?: { code?: string; message?: string }
) {
  console.warn("marketing_demo_request_not_accepted", {
    reason,
    ...(detail?.code ? { code: detail.code } : {}),
    ...(detail?.message ? { message: detail.message } : {})
  });
}

/** Public acquisition only. No tenant, workspace, outreach or model side effects. */
export async function submitDemoRequest(input: unknown): Promise<DemoRequestResult> {
  const values = parseLeadCapture(input);

  if (!values) {
    leadCaptureWarning("invalid_input");
    return { accepted: false };
  }

  try {
    const client = createSupabaseAdminClient();

    if (!client) {
      leadCaptureWarning("supabase_admin_unavailable");
      return { accepted: false };
    }

    const { requestId, name, email, company, phone, goal } = values;

    const { data, error } = await client.rpc("capture_marketing_demo_request", {
      p_id: requestId,
      p_payload: {
        name,
        email,
        company,
        phone,
        goal,
        contactConsent: true
      }
    });

    if (error) {
      leadCaptureWarning("rpc_error", {
        code: error.code,
        message: error.message
      });
      return { accepted: false };
    }

    if (data !== requestId) {
      leadCaptureWarning("unexpected_receipt");
      return { accepted: false };
    }

    return { accepted: true, receipt: data };
  } catch (error) {
    leadCaptureWarning("unexpected_exception", {
      message: error instanceof Error ? error.message : "unknown"
    });
    return { accepted: false };
  }
}
