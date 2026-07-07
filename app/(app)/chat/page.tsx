"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { newChatPath } from "@/lib/new-chat";

// Bare /chat has no id of its own — redirect to a fresh, unique chat URL so
// every new conversation lives at its own /chat/<uuid> route.
export default function NewChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(newChatPath());
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted">פותח שיחה חדשה…</div>
    </div>
  );
}
