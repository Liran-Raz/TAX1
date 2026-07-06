"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function HeroCTA({ size = "lg" }: { size?: "lg" | "md" }) {
  const { user, loading } = useAuth();
  const href = user ? "/chat" : "/login";
  const label = loading ? "טוען…" : user ? "לצ'אט שלי" : "התחל עכשיו — חינם";

  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover ${pad}`}
    >
      {label}
    </Link>
  );
}
