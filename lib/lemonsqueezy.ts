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

// Optional exact match by numeric variant id (if configured in env).
function variantToPlan(variantId: unknown): PlanId | null {
  const s = String(variantId);
  if (process.env.LS_VARIANT_PRO && s === process.env.LS_VARIANT_PRO) return "pro";
  if (process.env.LS_VARIANT_ULTRA && s === process.env.LS_VARIANT_ULTRA)
    return "ultra";
  return null;
}

// Fallback match by product/variant name — so setup only needs the checkout
// links + webhook secret, not the numeric variant ids. Check ULTRA first.
function nameToPlan(productName: unknown, variantName: unknown): PlanId | null {
  const name = `${productName ?? ""} ${variantName ?? ""}`.toUpperCase();
  if (name.includes("ULTRA")) return "ultra";
  if (name.includes("PRO")) return "pro";
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

export type SubscriptionAttrs = {
  status?: string;
  variant_id?: number;
  product_name?: string;
  variant_name?: string;
};

/** Resolve the plan a subscription grants, from its status + variant/product. */
export function resolvePlan(attrs: SubscriptionAttrs): PlanId {
  if (!attrs.status || !ENTITLED_STATUSES.has(attrs.status)) return "free";
  return (
    variantToPlan(attrs.variant_id) ??
    nameToPlan(attrs.product_name, attrs.variant_name) ??
    "free"
  );
}
