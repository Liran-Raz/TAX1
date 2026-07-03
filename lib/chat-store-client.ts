"use client";

// Client-side read-only helpers backed by Firestore Web SDK.
// All writes go through the API route (Firebase Admin SDK).

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase-client";
import type { Chat, Message } from "./types";

type FirestoreTS = Timestamp | { toDate(): Date } | null | undefined;

function tsToISO(ts: FirestoreTS): string {
  if (!ts) return new Date(0).toISOString();
  const d = "toDate" in ts && typeof ts.toDate === "function" ? ts.toDate() : new Date();
  return d.toISOString();
}

export function subscribeToChats(
  uid: string,
  onChange: (chats: Chat[]) => void,
): () => void {
  const q = query(
    collection(db, "users", uid, "chats"),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const chats: Chat[] = snap.docs.map((d) => {
      const data = d.data() as {
        title?: string;
        createdAt?: FirestoreTS;
        updatedAt?: FirestoreTS;
      };
      return {
        id: d.id,
        title: data.title ?? "שיחה חדשה",
        createdAt: tsToISO(data.createdAt),
        updatedAt: tsToISO(data.updatedAt),
      };
    });
    onChange(chats);
  });
}

export function subscribeToMessages(
  uid: string,
  chatId: string,
  onChange: (messages: Message[]) => void,
): () => void {
  const q = query(
    collection(db, "users", uid, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    const messages: Message[] = snap.docs.map((d) => {
      const data = d.data() as {
        role: Message["role"];
        parts: Message["parts"];
        createdAt?: FirestoreTS;
      };
      return {
        id: d.id,
        role: data.role,
        parts: data.parts ?? [],
        createdAt: tsToISO(data.createdAt),
      };
    });
    onChange(messages);
  });
}
