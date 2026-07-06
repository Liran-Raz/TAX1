// Plan-aware, multi-window per-user rate limiting backed by Firestore.
//
// Windows enforced (calendar-aligned to Asia/Jerusalem):
//   per-minute, per-hour, per-day, per-14-days, per-month.
//
// Storage: users/{uid}/usage/counters
//   { minuteKey, minuteCount, hourKey, hourCount, days: { "YYYY-MM-DD": n } }
// The `days` map (pruned to ~45 days) backs the day / 14-day / month windows;
// separate keyed counters back the minute / hour burst windows. All updates
// run in a transaction, so concurrent requests from one user stay consistent.

import { adminDb } from "./firebase-admin";
import type { PlanId, UsageSnapshot } from "./types";

type Limits = {
  perMinute: number;
  perHour: number;
  perDay: number; // Infinity = unlimited
  per14Days: number; // Infinity = not enforced
  perMonth: number;
};

// Approved tier limits (₪0 / ₪39 / ₪99).
export const PLANS: Record<PlanId, Limits> = {
  free: { perMinute: 5, perHour: 20, perDay: 50, per14Days: 100, perMonth: 150 },
  basic: {
    perMinute: 10,
    perHour: 100,
    perDay: 300,
    per14Days: Infinity,
    perMonth: 1500,
  },
  pro: {
    perMinute: 20,
    perHour: 300,
    perDay: Infinity,
    per14Days: Infinity,
    perMonth: 6000,
  },
};

const TZ = "Asia/Jerusalem";

type LocalParts = {
  day: string; // YYYY-MM-DD
  hour: string; // YYYY-MM-DDTHH
  minute: string; // YYYY-MM-DDTHH:MM
  month: string; // YYYY-MM
  h: number;
  m: number;
  s: number;
};

function localParts(d: Date): LocalParts {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(d)) p[part.type] = part.value;
  const day = `${p.year}-${p.month}-${p.day}`;
  return {
    day,
    hour: `${day}T${p.hour}`,
    minute: `${day}T${p.hour}:${p.minute}`,
    month: `${p.year}-${p.month}`,
    h: Number(p.hour),
    m: Number(p.minute),
    s: Number(p.second),
  };
}

function last14DayKeys(now: Date): string[] {
  const set = new Set<string>();
  for (let i = 0; i < 14; i++) {
    set.add(localParts(new Date(now.getTime() - i * 86_400_000)).day);
  }
  return [...set];
}

function countersRef(uid: string) {
  return adminDb.collection("users").doc(uid).collection("usage").doc("counters");
}

type DaysMap = Record<string, number>;

function sumMonth(days: DaysMap, monthPrefix: string): number {
  let total = 0;
  for (const [key, v] of Object.entries(days)) {
    if (key.startsWith(monthPrefix)) total += v;
  }
  return total;
}

export async function getPlan(uid: string): Promise<PlanId> {
  const snap = await adminDb.collection("users").doc(uid).get();
  const plan = snap.exists ? (snap.data()?.plan as PlanId | undefined) : undefined;
  return plan === "basic" || plan === "pro" ? plan : "free";
}

export type RateResult =
  | { ok: true; plan: PlanId; usage: UsageSnapshot }
  | {
      ok: false;
      plan: PlanId;
      reason: "minute" | "hour" | "day" | "quota";
      retryAfterSec: number;
    };

export async function checkRateLimit(uid: string): Promise<RateResult> {
  const plan = await getPlan(uid);
  const lim = PLANS[plan];
  const ref = countersRef(uid);
  const now = new Date();
  const k = localParts(now);
  const last14 = last14DayKeys(now);
  const cutoff = localParts(new Date(now.getTime() - 45 * 86_400_000)).day;

  const secToMidnight = 86_400 - (k.h * 3600 + k.m * 60 + k.s);
  const secToHour = 3600 - (k.m * 60 + k.s);
  const secToMinute = Math.max(1, 60 - k.s);

  return adminDb.runTransaction<RateResult>(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as Record<string, unknown>) : {};
    const days: DaysMap = { ...((data.days as DaysMap) ?? {}) };

    const minuteCount =
      data.minuteKey === k.minute ? (data.minuteCount as number) ?? 0 : 0;
    const hourCount =
      data.hourKey === k.hour ? (data.hourCount as number) ?? 0 : 0;
    const dayCount = days[k.day] ?? 0;
    const sum14 = last14.reduce((s, key) => s + (days[key] ?? 0), 0);
    const monthUsed = sumMonth(days, k.month);

    if (monthUsed >= lim.perMonth)
      return { ok: false, plan, reason: "quota", retryAfterSec: secToMidnight };
    if (sum14 >= lim.per14Days)
      return { ok: false, plan, reason: "quota", retryAfterSec: secToMidnight };
    if (dayCount >= lim.perDay)
      return { ok: false, plan, reason: "day", retryAfterSec: secToMidnight };
    if (hourCount >= lim.perHour)
      return { ok: false, plan, reason: "hour", retryAfterSec: secToHour };
    if (minuteCount >= lim.perMinute)
      return { ok: false, plan, reason: "minute", retryAfterSec: secToMinute };

    // Allowed — increment and prune old day buckets.
    days[k.day] = dayCount + 1;
    const prunedDays: DaysMap = {};
    for (const [key, v] of Object.entries(days)) {
      if (key >= cutoff) prunedDays[key] = v;
    }

    tx.set(ref, {
      minuteKey: k.minute,
      minuteCount: minuteCount + 1,
      hourKey: k.hour,
      hourCount: hourCount + 1,
      days: prunedDays,
    });

    const usage: UsageSnapshot = {
      plan,
      month: { used: monthUsed + 1, limit: lim.perMonth },
      day: {
        used: dayCount + 1,
        limit: Number.isFinite(lim.perDay) ? lim.perDay : null,
      },
    };
    return { ok: true, plan, usage };
  });
}

/** Read-only usage snapshot for the /api/usage endpoint. */
export async function getUsage(uid: string): Promise<UsageSnapshot> {
  const plan = await getPlan(uid);
  const lim = PLANS[plan];
  const snap = await countersRef(uid).get();
  const days: DaysMap = snap.exists
    ? ((snap.data() as Record<string, unknown>).days as DaysMap) ?? {}
    : {};
  const k = localParts(new Date());
  return {
    plan,
    month: { used: sumMonth(days, k.month), limit: lim.perMonth },
    day: {
      used: days[k.day] ?? 0,
      limit: Number.isFinite(lim.perDay) ? lim.perDay : null,
    },
  };
}
