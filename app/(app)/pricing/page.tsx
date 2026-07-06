"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { PLAN_INFO, checkoutUrl, type PlanInfo } from "@/lib/plan-info";
import type { PlanId, UsageSnapshot } from "@/lib/types";

const ORDER: PlanId[] = ["free", "pro", "ultra"];

// Static access so Next.js inlines these NEXT_PUBLIC_* values at build time
// (dynamic process.env[key] is NOT replaced in the browser bundle).
const CHECKOUT_URLS: Record<PlanId, string | undefined> = {
  free: undefined,
  pro: process.env.NEXT_PUBLIC_LS_CHECKOUT_PRO,
  ultra: process.env.NEXT_PUBLIC_LS_CHECKOUT_ULTRA,
};

export function usePlan() {
  const { getIdToken } = useAuth();
  const [plan, setPlan] = useState<PlanId | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch("/api/usage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setPlan(((await res.json()) as UsageSnapshot).plan);
      } catch {
        /* ignore */
      }
    })();
  }, [getIdToken]);
  return plan;
}

export default function PricingPage() {
  const { user } = useAuth();
  const currentPlan = usePlan();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">תוכניות ומחירים</h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            שדרג כדי לשאול יותר שאלות. ניתן לבטל בכל עת.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ORDER.map((id) => (
            <PlanCard
              key={id}
              info={PLAN_INFO[id]}
              checkoutBase={CHECKOUT_URLS[id]}
              isCurrent={currentPlan === id}
              email={user?.email ?? null}
              uid={user?.uid ?? null}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted">
          התשלום מאובטח ומעובד על-ידי Lemon Squeezy. המחירים כוללים מע&quot;מ
          כנדרש. שדרוג נכנס לתוקף מיד לאחר התשלום.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-accent hover:underline">
            → חזרה לצ&apos;אט
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  info,
  checkoutBase,
  isCurrent,
  email,
  uid,
}: {
  info: PlanInfo;
  checkoutBase: string | undefined;
  isCurrent: boolean;
  email: string | null;
  uid: string | null;
}) {
  const base = checkoutBase;

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${
        info.highlight ? "border-accent ring-1 ring-accent" : "border-border"
      }`}
    >
      {info.highlight && (
        <span className="mb-2 inline-block self-start rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
          הכי פופולרי
        </span>
      )}
      <h2 className="text-lg font-semibold">{info.label}</h2>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{info.price}</span>
        {info.period && (
          <span className="text-sm text-muted">{info.period}</span>
        )}
      </div>

      <ul className="mt-4 flex-1 space-y-2 text-sm">
        {info.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isCurrent ? (
          <div className="rounded-xl bg-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-muted">
            התוכנית הנוכחית שלך
          </div>
        ) : !info.paid ? (
          <div className="rounded-xl bg-neutral-100 px-4 py-2.5 text-center text-sm text-muted">
            —
          </div>
        ) : base && uid ? (
          <a
            href={checkoutUrl(base, uid, email)}
            className="block rounded-xl bg-accent px-4 py-2.5 text-center font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
          >
            שדרג ל-{info.label}
          </a>
        ) : (
          <div className="rounded-xl bg-neutral-100 px-4 py-2.5 text-center text-sm text-muted">
            בקרוב
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 shrink-0 text-accent"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
