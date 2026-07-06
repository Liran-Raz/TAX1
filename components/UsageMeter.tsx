"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { PlanId, UsageSnapshot } from "@/lib/types";

const PLAN_LABELS: Record<PlanId, string> = {
  free: "חינם",
  basic: "בסיסי",
  pro: "מקצועי",
};

/** Fires whenever a question is sent, so the meter refreshes promptly. */
export const USAGE_EVENT = "chattax:usage";

export function UsageMeter() {
  const { getIdToken } = useAuth();
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsage((await res.json()) as UsageSnapshot);
    } catch {
      // Non-critical — leave the previous value.
    }
  }, [getIdToken]);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener(USAGE_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener(USAGE_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [load]);

  if (!usage) return null;

  const { plan, month } = usage;
  const pct = Math.min(100, Math.round((month.used / month.limit) * 100));
  const near = pct >= 80;

  return (
    <div className="mb-2 rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">שאלות החודש</span>
        <span className="font-medium tabular-nums">
          {month.used}/{month.limit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full rounded-full transition-[width] ${
            near ? "bg-amber-500" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px]">
        <span className="text-muted">תוכנית: {PLAN_LABELS[plan]}</span>
        {plan === "free" && (
          <span className="font-medium text-accent">שדרג בקרוב</span>
        )}
      </div>
    </div>
  );
}
