// Client-safe plan display metadata (no server imports — usable in the
// pricing page and the usage meter). Enforcement limits live in lib/rate-limit.ts.

import type { PlanId } from "./types";

export type PlanInfo = {
  label: string;
  price: string;
  period: string;
  monthly: number;
  features: string[];
  paid?: boolean;
  highlight?: boolean;
};

export const PLAN_INFO: Record<PlanId, PlanInfo> = {
  free: {
    label: "חינם",
    price: "₪0",
    period: "",
    monthly: 150,
    features: [
      "150 שאלות בחודש",
      "גישה מלאה למאגר מסמכי המיסים",
      "שמירת היסטוריית שיחות",
    ],
  },
  pro: {
    label: "PRO",
    price: "₪39.99",
    period: "לחודש",
    monthly: 1500,
    features: [
      "1,500 שאלות בחודש",
      "עד 300 שאלות ביום",
      "ללא מגבלת 14 יום",
      "כל מה שבתוכנית החינם",
    ],
    paid: true,
    highlight: true,
  },
  ultra: {
    label: "ULTRA",
    price: "₪99.99",
    period: "לחודש",
    monthly: 6000,
    features: [
      "6,000 שאלות בחודש",
      "ללא מגבלה יומית",
      "עד 20 שאלות בדקה",
      "כל מה שבתוכנית PRO",
    ],
    paid: true,
  },
};

/** Build a Lemon Squeezy checkout URL with the user's uid + email prefilled. */
export function checkoutUrl(
  base: string,
  uid: string,
  email: string | null,
): string {
  const params = [`checkout[custom][uid]=${encodeURIComponent(uid)}`];
  if (email) params.push(`checkout[email]=${encodeURIComponent(email)}`);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${params.join("&")}`;
}
