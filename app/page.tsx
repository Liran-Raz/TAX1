import type { Metadata } from "next";
import Link from "next/link";
import { HeroCTA } from "@/components/HeroCTA";
import { PLAN_INFO } from "@/lib/plan-info";
import type { PlanId } from "@/lib/types";

export const metadata: Metadata = {
  title: "עוזר מיסוי חכם לעסקים בישראל | ChatTAX",
  description:
    "צ'אט חכם שעונה על שאלות מע\"מ, מס הכנסה, הוצאות מוכרות ומבני עסק — בעברית, מבוסס על מסמכי רשות המסים הרשמיים. חינם להתחלה.",
  openGraph: {
    title: "ChatTAX — עוזר מיסוי חכם לעסקים בישראל",
    description:
      "שאל בשפה חופשית וקבל תשובה מדויקת עם מקורות, מבוססת מסמכי רשות המסים.",
    locale: "he_IL",
    type: "website",
  },
};

const EXAMPLES = [
  "אני עוסק פטור — מה תקרת המחזור לשנה?",
  "אילו הוצאות רכב מוכרות לי כעצמאי?",
  "כמה מס משלמת חברה בע\"מ על הרווח?",
  "מה שיעור המע\"מ ואיך מקזזים תשומות?",
];

const FEATURES: { title: string; body: string }[] = [
  {
    title: "מבוסס מקורות רשמיים",
    body: "כל תשובה נשענת על פקודת מס הכנסה, מדריך רשות המסים 2025 וחוק החברות — לא ניחושים.",
  },
  {
    title: "בעברית, מיד",
    body: "שאלות בשפה חופשית, תשובות תמציתיות ומעשיות — בלי להמתין לתור או לשלם על שעת ייעוץ.",
  },
  {
    title: "מצטט את המקור",
    body: "לכל תשובה מצוין על איזה סעיף או מסמך היא מבוססת, כדי שתוכל לאמת.",
  },
  {
    title: "השיחות נשמרות",
    body: "כל שיחה נשמרת בחשבון שלך — חזור אליה בכל עת מכל מכשיר.",
  },
];

const STEPS = [
  { n: "1", title: "מתחברים", body: "כניסה מהירה עם חשבון Google — בלי סיסמאות." },
  { n: "2", title: "שואלים", body: "כותבים שאלה בשפה חופשית, כמו לרו\"ח." },
  { n: "3", title: "מקבלים תשובה", body: "תשובה מבוססת-מקורות עם הפניה לסעיפים הרלוונטיים." },
];

const PRICING_ORDER: PlanId[] = ["free", "pro", "ultra"];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-background">
      {/* Nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-semibold">ChatTAX</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-neutral-600 hover:text-neutral-900">
            תוכניות
          </Link>
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            התחברות
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-3xl px-4 pt-12 pb-8 text-center sm:px-6 sm:pt-20">
        <div className="mb-6 flex justify-center">
          <Logo className="h-16 w-16" />
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          התשובות שלך למיסים,
          <br />
          <span className="text-accent">בעברית תוך שניות</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          עוזר מיסוי חכם לבעלי עסקים בישראל. מע&quot;מ, מס הכנסה, הוצאות מוכרות
          ומבני עסק — שאל בשפה חופשית וקבל תשובה מדויקת, מבוססת על מסמכי רשות
          המסים הרשמיים.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <HeroCTA />
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium shadow-sm transition-colors hover:bg-neutral-50"
          >
            צפה בתוכניות
          </Link>
        </div>

        {/* Example chips */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((q) => (
            <span
              key={q}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-neutral-600 shadow-sm sm:text-sm"
            >
              {q}
            </span>
          ))}
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <CheckIcon />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">איך זה עובד</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">תוכניות פשוטות</h2>
        <p className="mt-2 text-center text-sm text-muted">התחל חינם. שדרג כשתצטרך יותר.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PRICING_ORDER.map((id) => {
            const p = PLAN_INFO[id];
            return (
              <div
                key={id}
                className={`rounded-2xl border bg-card p-6 shadow-sm ${
                  p.highlight ? "border-accent ring-1 ring-accent" : "border-border"
                }`}
              >
                <h3 className="font-semibold">{p.label}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{p.price}</span>
                  {p.period && <span className="text-sm text-muted">{p.period}</span>}
                </div>
                <p className="mt-3 text-sm text-muted">
                  {p.monthly.toLocaleString("he-IL")} שאלות בחודש
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <HeroCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-semibold">ChatTAX</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted">
              <Link href="/pricing" className="hover:text-neutral-900">תוכניות</Link>
              <Link href="/terms" className="hover:text-neutral-900">תנאי שימוש</Link>
              <Link href="/privacy" className="hover:text-neutral-900">מדיניות פרטיות</Link>
              <Link href="/login" className="hover:text-neutral-900">התחברות</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            ChatTAX מספק מידע כללי בלבד ואינו מהווה ייעוץ מקצועי או תחליף לרו&quot;ח
            מוסמך. שיעורי מס ותקרות מתעדכנים — יש לאמת במקורות הרשמיים (רשות המסים,
            ביטוח לאומי). © {new Date().getFullYear()} ChatTAX.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M9 11.5h14M16 11.5V23" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
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
