// TEMPORARY diagnostic — reports env presence + tries a live firebase-admin
// call to surface the real init error. No secret values are leaked.

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
        private_key_len: pk.length,
        private_key_header_ok: pk.startsWith("-----BEGIN PRIVATE KEY-----"),
        private_key_footer_ok: pk.trimEnd().endsWith("-----END PRIVATE KEY-----"),
        private_key_has_real_newlines: pk.includes("\n"),
      };
    } catch (e) {
      parseError = String(e);
    }
  }

  // Try to actually use firebase-admin and capture the real error.
  let adminResult: string;
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    await adminDb.collection("users").limit(1).get();
    adminResult = "ok";
  } catch (e) {
    adminResult =
      e instanceof Error
        ? `${e.name}: ${e.message}`
        : `non-error: ${String(e)}`;
  }

  return Response.json({
    firebaseAdminJson: { present: !!j, length: j ? j.length : 0, parsed, parseError },
    adminResult,
  });
}
