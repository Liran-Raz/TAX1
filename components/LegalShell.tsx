import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-semibold">ChatTAX</span>
          </Link>
          <Link href="/" className="text-sm text-accent hover:underline">
            → לעמוד הבית
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">עודכן לאחרונה: {updated}</p>

        {/* Attorney-review banner */}
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          <strong>הערה:</strong> מסמך זה הוא טיוטה שהוכנה כבסיס איכותי, אך אינו
          מהווה ייעוץ משפטי. יש להשלים את הפרטים המסומנים ב-[סוגריים] ולהעביר את
          המסמך לאישור עורך/ת דין מוסמך/ת בישראל טרם פרסום מחייב.
        </div>

        <article className="legal mt-6">{children}</article>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-muted sm:px-6">
          <div className="flex justify-center gap-4">
            <Link href="/terms" className="hover:text-neutral-900">
              תנאי שימוש
            </Link>
            <Link href="/privacy" className="hover:text-neutral-900">
              מדיניות פרטיות
            </Link>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} ChatTAX</p>
        </div>
      </footer>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9 11.5h14M16 11.5V23"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
