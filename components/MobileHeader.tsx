"use client";

import { useRouter } from "next/navigation";
import { newChatPath } from "@/lib/new-chat";

export function MobileHeader({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  return (
    <header className="md:hidden safe-top sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card/90 px-3 py-2.5 backdrop-blur">
      <button
        type="button"
        onClick={onMenu}
        aria-label="פתח תפריט"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
      >
        <MenuIcon />
      </button>

      <div className="flex items-center gap-2">
        <LogoMark className="h-6 w-6" />
        <span className="font-semibold text-[15px]">עוזר מיסוי</span>
      </div>

      <button
        type="button"
        onClick={() => router.push(newChatPath())}
        aria-label="שיחה חדשה"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-accent hover:bg-accent-soft active:bg-accent-soft transition-colors"
      >
        <PlusIcon />
      </button>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9 11.5h14M16 11.5V23"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="8" r="0" fill="#fff" />
    </svg>
  );
}
