// Server-only Lemon Squeezy helpers: webhook signature verification and
// mapping a subscription (status + variant) to one of our plan ids.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanId } from "./types";

/** Verify the `X-Signature` header (HMAC-SHA256 hex of the raw body). */
export function verifyLsSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function variantToPlan(variantId: unknown): PlanId | null {
  const s = String(variantId);
  if (process.env.LS_VARIANT_PRO && s === process.env.LS_VARIANT_PRO) return "pro";
  if (process.env.LS_VARIANT_ULTRA && s === process.env.LS_VARIANT_ULTRA)
    return "ultra";
  return null;
}

// Statuses that still grant access. `cancelled` keeps access until the period
// ends (Lemon Squeezy then sends `subscription_expired`).
const ENTITLED_STATUSES = new Set([
  "active",
  "on_trial",
  "past_due",
  "cancelled",
]);

/** Resolve the plan a subscription should grant, from its status + variant. */
export function resolvePlan(status: unknown, variantId: unknown): PlanId {
  if (typeof status === "string" && ENTITLED_STATUSES.has(status)) {
    return variantToPlan(variantId) ?? "free";
  }
  return "free";
}
