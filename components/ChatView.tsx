"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase-client";
import { USAGE_EVENT } from "@/components/UsageMeter";

const EXAMPLE_QUESTIONS = [
  "אני עוסק פטור. מה תקרת המחזור לשנה?",
  "מה שיעור המע\"מ ואיך אני מקזז תשומות?",
  "אילו הוצאות רכב מוכרות לי כעצמאי?",
  "יש לי חברה בע\"מ - כמה מס אני משלם על הרווח?",
];

type UIPart = { type: string; text?: string };
type HistoricMessage = {
  id: string;
  role: "user" | "assistant";
  parts: UIPart[];
};

/**
 * Loader — fetches history from Firestore once, then hands control off to the
 * inner component. This is important because useChat only reads its initial
 * messages at mount time.
 */
export function ChatView({ chatId: propChatId }: { chatId: string | null }) {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoricMessage[] | null>(
    propChatId ? null : [],
  );

  useEffect(() => {
    if (!user || !propChatId) return;
    let cancelled = false;
    (async () => {
      const snap = await getDocs(
        query(
          collection(db, "users", user.uid, "chats", propChatId, "messages"),
          orderBy("createdAt", "asc"),
        ),
      );
      if (cancelled) return;
      setHistory(
        snap.docs.map((d) => {
          const data = d.data() as {
            role?: string;
            parts?: UIPart[];
          };
          const role = data.role === "assistant" ? "assistant" : "user";
          return {
            id: d.id,
            role,
            parts: data.parts ?? [],
          };
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user, propChatId]);

  if (history === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted text-sm">טוען שיחה...</div>
      </div>
    );
  }

  // Fresh mount each time propChatId changes so useChat picks up the new initial messages
  return (
    <ChatViewInner
      key={propChatId ?? "new"}
      chatId={propChatId}
      initialMessages={history}
    />
  );
}

function ChatViewInner({
  chatId: propChatId,
  initialMessages,
}: {
  chatId: string | null;
  initialMessages: HistoricMessage[];
}) {
  const { getIdToken } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [effectiveChatId] = useState(
    () => propChatId ?? crypto.randomUUID(),
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async (opts) => {
          const token = await getIdToken();
          return {
            body: {
              ...(opts.body ?? {}),
              messages: opts.messages,
              chatId: effectiveChatId,
            },
            headers: {
              ...(opts.headers ?? {}),
              Authorization: `Bearer ${token ?? ""}`,
            },
          };
        },
      }),
    [getIdToken, effectiveChatId],
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    id: effectiveChatId,
    messages: initialMessages as unknown as UIMessage[],
    transport,
    onFinish: () => {
      // Mirror the chat id in the URL for a brand-new chat WITHOUT unmounting
      // (a real router.replace would remount and briefly wipe the visible messages).
      if (!propChatId && typeof window !== "undefined") {
        const desired = `/chat/${effectiveChatId}`;
        if (window.location.pathname !== desired) {
          window.history.replaceState(null, "", desired);
        }
      }
      // Refresh the usage meter now that a question was consumed.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(USAGE_EVENT));
      }
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-3 py-5 sm:px-6"
      >
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <EmptyState onPick={submit} />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  parts={m.parts as unknown as UIPart[]}
                />
              ))}
              {status === "submitted" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tr-md border border-border bg-card px-4 py-3 shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <ErrorBanner error={error} onDismiss={clearError} />}
        </div>
      </div>

      <div className="safe-bottom border-t border-border bg-card px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-3xl">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <textarea
              className="max-h-40 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="שאל שאלה על מיסוי, מע&quot;מ, הוצאות..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={() => stop()}
                aria-label="עצור"
                className="flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-neutral-800 px-4 font-medium text-white transition-colors hover:bg-neutral-700 sm:px-5"
              >
                <StopIcon />
                <span className="hidden sm:inline">עצור</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="שלח"
                className="flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-accent px-4 font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
              >
                <SendIcon />
                <span className="hidden sm:inline">שלח</span>
              </button>
            )}
          </form>
          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted sm:text-xs">
            מידע כללי בלבד ואינו מהווה ייעוץ מקצועי. בסוגיות מורכבות פנה
            לרו&quot;ח מוסמך.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center px-1 text-center">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <BigLogo />
        </div>
        <h2 className="mb-1.5 text-xl font-semibold sm:text-2xl">
          שלום 👋 איך אפשר לעזור?
        </h2>
        <p className="mb-7 text-sm text-muted sm:text-base">
          אני עוזר מיסוי לבעלי עסקים בישראל. בחר שאלה לדוגמה או כתוב את שלך.
        </p>
        <div className="grid gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="rounded-xl border border-border bg-card px-4 py-3 text-right text-sm shadow-sm transition-colors hover:border-accent hover:bg-accent-soft active:bg-accent-soft"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, parts }: { role: string; parts: UIPart[] }) {
  const isUser = role === "user";
  const text = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[88%] rounded-2xl rounded-tl-md bg-accent px-4 py-2.5 text-accent-foreground shadow-sm sm:max-w-[85%]"
            : "assistant-content max-w-[88%] rounded-2xl rounded-tr-md border border-border bg-card px-4 py-3 shadow-sm sm:max-w-[85%]"
        }
      >
        {text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex h-5 items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
    </div>
  );
}

function BigLogo() {
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14" aria-hidden>
      <rect width="56" height="56" rx="16" fill="var(--accent)" />
      <path
        d="M16 21h24M28 21v18"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transform: "scaleX(-1)" }}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function ErrorBanner({
  error,
  onDismiss,
}: {
  error: Error;
  onDismiss: () => void;
}) {
  const raw = error.message || "";
  let text =
    "אירעה שגיאה בשליחת ההודעה. ייתכן שהשירות עמוס כרגע — נסה שוב עוד רגע.";
  if (/rate_limited|יותר מדי שאלות/.test(raw)) {
    text = "יותר מדי שאלות בזמן קצר. המתן רגע ונסה שוב.";
  } else if (/מכסת השאלות היומית/.test(raw)) {
    text = "חרגת ממכסת השאלות היומית. נסה שוב מחר.";
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{text}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-3 py-1 font-medium hover:bg-red-100 transition-colors"
      >
        סגור
      </button>
    </div>
  );
}
