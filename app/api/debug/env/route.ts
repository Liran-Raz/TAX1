// TEMPORARY diagnostic — reports whether env vars are present/parseable without
// leaking any secret values. Remove after debugging the production 500s.

export const runtime = "nodejs";

export async function GET() {
  const j = process.env.FIREBASE_ADMIN_JSON;
  let parsed: unknown = null;
  let parseError: string | null = null;
  if (j) {
    try {
      const o = JSON.parse(j) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      const pk = o.private_key ?? "";
      parsed = {
        project_id: o.project_id ?? null,
        client_email_present: !!o.client_email,
        private_key_present: !!pk,
        private_key_len: pk.length,
        private_key_header_ok: pk.startsWith("-----BEGIN PRIVATE KEY-----"),
        private_key_has_real_newlines: pk.includes("\n"),
        private_key_has_escaped_newlines: pk.includes("\\n"),
      };
    } catch (e) {
      parseError = String(e);
    }
  }

  return Response.json({
    firebaseAdminJson: {
      present: !!j,
      length: j ? j.length : 0,
      parsed,
      parseError,
    },
    lemonSqueezy: {
      webhookSecretPresent: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
      checkoutProPresent: !!process.env.NEXT_PUBLIC_LS_CHECKOUT_PRO,
      checkoutUltraPresent: !!process.env.NEXT_PUBLIC_LS_CHECKOUT_ULTRA,
    },
    googleKeyPresent: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
}
