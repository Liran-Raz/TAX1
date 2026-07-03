import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { randomUUID } from "node:crypto";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { retrieveContext } from "@/lib/rag";
import { adminAuth } from "@/lib/firebase-admin";
import {
  appendMessage,
  ensureChat,
  ensureUser,
  touchChat,
} from "@/lib/chat-store-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = (m.parts ?? []) as Array<{ type: string; text?: string }>;
    return parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text!)
      .join(" ")
      .trim();
  }
  return "";
}

function lastUserMessage(messages: UIMessage[]): UIMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i];
  }
  return null;
}

async function verifyAuth(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) return null;
  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = decoded.uid;

  // Per-user rate limiting — protects the shared AI quota from a single abuser.
  let rate;
  try {
    rate = await checkRateLimit(uid);
  } catch (err) {
    // Fail open: if the limiter itself errors, don't block the user.
    console.error("[chat] rate limiter error (failing open):", err);
    rate = { ok: true as const, dayRemaining: -1 };
  }
  if (!rate.ok) {
    const message =
      rate.reason === "day"
        ? "חרגת ממכסת השאלות היומית. נסה שוב מחר."
        : "יותר מדי שאלות בזמן קצר. המתן רגע ונסה שוב.";
    return new Response(JSON.stringify({ error: "rate_limited", message }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(rate.retryAfterSec),
      },
    });
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    chatId?: string | null;
  };
  const { messages } = body;
  const chatId = body.chatId || randomUUID();

  const query = lastUserText(messages);

  // Kick off Firestore writes in parallel with the stream setup. We DO NOT await
  // them here so the model starts responding immediately. onFinish awaits the
  // write promise before saving the assistant reply, ensuring correct ordering.
  const lastUser = lastUserMessage(messages);
  const userParts = ((lastUser?.parts ?? []) as Array<{
    type: string;
    text?: string;
  }>).map((p) => ({ type: p.type, text: p.text }));

  const writesReady = Promise.all([
    ensureUser(uid, {
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
    }),
    ensureChat(uid, chatId, query),
    lastUser
      ? appendMessage(uid, chatId, { role: "user", parts: userParts })
      : Promise.resolve(""),
  ]).catch((err) => {
    console.error("[chat] Firestore write failed:", err);
  });

  const { context } = retrieveContext(query, 6);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildSystemPrompt(context),
    messages: await convertToModelMessages(messages),
    // Don't auto-retry: on a 429 the SDK default (2 retries) triples the load
    // during a spike. Surface the error cleanly instead.
    maxRetries: 0,
    onFinish: async ({ text, usage }) => {
      console.log(
        `[chat] usage uid=${uid} chat=${chatId} in=${usage.inputTokens} out=${usage.outputTokens} total=${usage.totalTokens}`,
      );
      if (!text) return;
      try {
        // Ensure the user message + chat metadata land first, then save the reply
        await writesReady;
        await appendMessage(uid, chatId, {
          role: "assistant",
          parts: [{ type: "text", text }],
        });
        await touchChat(uid, chatId);
      } catch (err) {
        console.error("[chat] failed to persist assistant message:", err);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
