"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { subscribeToChats } from "@/lib/chat-store-client";
import type { Chat } from "@/lib/types";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const params = useParams<{ chatId?: string }>();
  const activeChatId = params?.chatId;
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, setChats);
    return () => unsub();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent text-accent-foreground px-4 py-2.5 font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          <span>שיחה חדשה</span>
        </Link>
      </div>

      {/* Chat list */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {chats.length === 0 ? (
          <div className="text-xs text-muted text-center py-8">
            עדיין אין שיחות
          </div>
        ) : (
          <ul className="space-y-1">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <li key={chat.id}>
                  <Link
                    href={`/chat/${chat.id}`}
                    className={`block truncate rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 text-accent font-medium"
                        : "hover:bg-neutral-100 text-neutral-700"
                    }`}
                    title={chat.title}
                  >
                    {chat.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* User + sign out */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 mb-2 px-2">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-300" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {user?.displayName || user?.email}
            </div>
            {user?.displayName && user.email ? (
              <div className="text-xs text-muted truncate">{user.email}</div>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full text-right text-sm text-muted hover:text-neutral-900 hover:bg-neutral-100 rounded-lg px-3 py-2 transition-colors"
        >
          התנתק
        </button>
      </div>
    </aside>
  );
}

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
