// Per-user rate limiting backed by Firestore.
// Fixed-window counters: one per wall-clock minute and one per UTC day.
// Written server-side via the Admin SDK, so it bypasses security rules and is
// atomic via a transaction (safe under concurrent requests from the same user).

import { adminDb } from "./firebase-admin";

// Tunable ceilings. A tax answer takes ~5-15s to stream, so a human realistically
// cannot exceed a handful per minute — these are abuse ceilings, not UX limits.
export const MAX_PER_MINUTE = 12;
export const MAX_PER_DAY = 120;

export type RateLimitResult =
  | { ok: true; dayRemaining: number }
  | { ok: false; reason: "minute" | "day"; retryAfterSec: number };

type RateDoc = {
  minuteWindow?: string;
  minuteCount?: number;
  dayWindow?: string;
  dayCount?: number;
};

function secondsUntilNextUtcMidnight(now: Date): number {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

export async function checkRateLimit(uid: string): Promise<RateLimitResult> {
  const ref = adminDb
    .collection("users")
    .doc(uid)
    .collection("usage")
    .doc("rate");

  const now = new Date();
  const iso = now.toISOString();
  const minuteKey = iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
  const dayKey = iso.slice(0, 10); // "YYYY-MM-DD"

  return adminDb.runTransaction<RateLimitResult>(async (tx) => {
    const snap = await tx.get(ref);
    const data: RateDoc = snap.exists ? (snap.data() as RateDoc) : {};

    const minuteCount = data.minuteWindow === minuteKey ? data.minuteCount ?? 0 : 0;
    const dayCount = data.dayWindow === dayKey ? data.dayCount ?? 0 : 0;

    if (dayCount >= MAX_PER_DAY) {
      return {
        ok: false,
        reason: "day",
        retryAfterSec: secondsUntilNextUtcMidnight(now),
      };
    }
    if (minuteCount >= MAX_PER_MINUTE) {
      return {
        ok: false,
        reason: "minute",
        retryAfterSec: Math.max(1, 60 - now.getUTCSeconds()),
      };
    }

    tx.set(
      ref,
      {
        minuteWindow: minuteKey,
        minuteCount: minuteCount + 1,
        dayWindow: dayKey,
        dayCount: dayCount + 1,
      },
      { merge: true },
    );

    return { ok: true, dayRemaining: MAX_PER_DAY - (dayCount + 1) };
  });
}
