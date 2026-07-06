"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { subscribeToChats } from "@/lib/chat-store-client";
import type { Chat } from "@/lib/types";
import { LogoMark } from "@/components/MobileHeader";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
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
  };

  return (
    <>
      {/* Backdrop — mobile only, when the drawer is open */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-border bg-card shadow-lg transition-transform duration-300 ease-out md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="safe-top border-b border-border p-3">
          <div className="mb-3 flex items-center justify-between md:justify-start md:gap-2">
            <div className="flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="font-semibold">עוזר מיסוי</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור תפריט"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 md:hidden"
            >
              <CloseIcon />
            </button>
          </div>

          <Link
            href="/"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent text-accent-foreground px-4 py-2.5 font-medium shadow-sm hover:bg-accent-hover transition-colors"
          >
            <PlusIcon />
            <span>שיחה חדשה</span>
          </Link>
        </div>

        {/* Chat list */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-3">
          {chats.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted">
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
                      onClick={onClose}
                      className={`block truncate rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-accent-soft font-medium text-accent"
                          : "text-neutral-700 hover:bg-neutral-100"
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
        <div className="safe-bottom border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="h-9 w-9 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-neutral-300" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {user?.displayName || user?.email}
              </div>
              {user?.displayName && user.email ? (
                <div className="truncate text-xs text-muted">{user.email}</div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-3 py-2 text-right text-sm text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            התנתק
          </button>
        </div>
      </aside>
    </>
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

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
