// Server-side chat CRUD using Firebase Admin SDK.
// Called from the /api/chat route after authenticating the user's ID token.

import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { adminDb } from "./firebase-admin";
import type { MessagePart, MessageRole } from "./types";

const MAX_TITLE_CHARS = 60;

function collections(uid: string) {
  const userRef = adminDb.collection("users").doc(uid);
  return {
    userRef,
    chats: userRef.collection("chats"),
    chatDoc: (chatId: string) => userRef.collection("chats").doc(chatId),
    messages: (chatId: string) =>
      userRef.collection("chats").doc(chatId).collection("messages"),
  };
}

function partsToPreview(parts: MessagePart[]): string {
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text!)
    .join(" ")
    .trim();
}

function makeTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= MAX_TITLE_CHARS) return cleaned;
  return cleaned.slice(0, MAX_TITLE_CHARS - 1).trimEnd() + "…";
}

/** Create the user document lazily on first activity. Sets `plan: "free"` on
 *  creation but never overwrites an existing plan (upgrades set it elsewhere). */
export async function ensureUser(
  uid: string,
  meta: { email?: string | null; displayName?: string | null },
): Promise<void> {
  const { userRef } = collections(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    await userRef.set({
      email: meta.email ?? null,
      displayName: meta.displayName ?? null,
      plan: "free",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }
  await userRef.set(
    {
      email: meta.email ?? null,
      displayName: meta.displayName ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/** Create a new chat with a server-generated id, return its id. */
export async function createChat(
  uid: string,
  firstUserText?: string,
): Promise<string> {
  const chatId = randomUUID();
  const title = firstUserText ? makeTitle(firstUserText) : "שיחה חדשה";
  await collections(uid).chatDoc(chatId).set({
    title,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return chatId;
}

/** Ensure a chat exists at a client-provided id. No-op if already there. */
export async function ensureChat(
  uid: string,
  chatId: string,
  firstUserText?: string,
): Promise<void> {
  const ref = collections(uid).chatDoc(chatId);
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({
    title: firstUserText ? makeTitle(firstUserText) : "שיחה חדשה",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Update chat metadata (title, bumped updatedAt). */
export async function touchChat(
  uid: string,
  chatId: string,
  patch: { title?: string } = {},
): Promise<void> {
  await collections(uid).chatDoc(chatId).set(
    {
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/** Verify a chat exists and belongs to this user. Throws if not. */
export async function assertChatBelongsTo(
  uid: string,
  chatId: string,
): Promise<void> {
  const snap = await collections(uid).chatDoc(chatId).get();
  if (!snap.exists) {
    throw new Error("chat_not_found");
  }
}

export async function appendMessage(
  uid: string,
  chatId: string,
  message: { role: MessageRole; parts: MessagePart[] },
): Promise<string> {
  const ref = await collections(uid)
    .messages(chatId)
    .add({
      role: message.role,
      parts: message.parts,
      createdAt: FieldValue.serverTimestamp(),
    });
  return ref.id;
}

export async function renameChat(
  uid: string,
  chatId: string,
  title: string,
): Promise<void> {
  await collections(uid)
    .chatDoc(chatId)
    .set(
      {
        title: makeTitle(title),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function deleteChat(uid: string, chatId: string): Promise<void> {
  const msgs = await collections(uid).messages(chatId).listDocuments();
  const batch = adminDb.batch();
  for (const m of msgs) batch.delete(m);
  batch.delete(collections(uid).chatDoc(chatId));
  await batch.commit();
}
