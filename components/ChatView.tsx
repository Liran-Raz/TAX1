"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase-client";

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

  const { messages, sendMessage, status, stop } = useChat({
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
    <div className="flex flex-col h-screen w-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scroll px-4 py-6 sm:px-6"
      >
        <div className="max-w-3xl mx-auto">
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
                  <div className="bg-card border border-border rounded-2xl px-4 py-3">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <textarea
              className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors max-h-40"
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
                className="rounded-xl bg-neutral-800 text-white px-5 py-3 font-medium hover:bg-neutral-700 transition-colors"
              >
                עצור
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-xl bg-accent text-accent-foreground px-5 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                שלח
              </button>
            )}
          </form>
          <p className="text-xs text-muted text-center mt-3">
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-8">
      <div className="max-w-md">
        <h2 className="text-2xl font-semibold mb-2">שלום 👋</h2>
        <p className="text-muted mb-8">
          אני עוזר מיסוי לבעלי עסקים בישראל. בחר שאלה לדוגמה או כתוב את שלך.
        </p>
        <div className="grid gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="text-right rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-accent hover:bg-blue-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  parts,
}: {
  role: string;
  parts: UIPart[];
}) {
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
            ? "bg-accent text-accent-foreground rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]"
            : "bg-card border border-border rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] assistant-content"
        }
      >
        {text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
    </div>
  );
}
