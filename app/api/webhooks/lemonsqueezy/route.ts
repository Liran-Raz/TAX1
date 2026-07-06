import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { resolvePlan, verifyLsSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

// Lemon Squeezy subscription webhook. Verifies the signature, then maps the
// subscription's status + variant to a plan and writes it to users/{uid}.plan.
// The uid is passed through checkout custom data (see the pricing page).
export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[ls webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set");
    return new Response("not configured", { status: 500 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";
  if (!verifyLsSignature(raw, signature, secret)) {
    return new Response("invalid signature", { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { uid?: string } };
    data?: { id?: string; attributes?: { status?: string; variant_id?: number } };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "unknown";
  const uid = payload.meta?.custom_data?.uid;
  const attrs = payload.data?.attributes ?? {};

  // Only subscription events carry what we need; acknowledge the rest.
  if (!eventName.startsWith("subscription")) {
    return new Response("ok (ignored)");
  }
  if (!uid) {
    console.warn(`[ls webhook] ${eventName}: missing custom_data.uid — skipping`);
    return new Response("ok (no uid)");
  }

  const plan = resolvePlan(attrs.status, attrs.variant_id);
  await adminDb
    .collection("users")
    .doc(uid)
    .set(
      {
        plan,
        lsStatus: attrs.status ?? null,
        lsSubscriptionId: payload.data?.id ?? null,
        lsUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log(
    `[ls webhook] ${eventName} uid=${uid} status=${attrs.status} → plan=${plan}`,
  );
  return new Response("ok");
}
