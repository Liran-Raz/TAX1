// Serialized types used across client + server.
// `createdAt` / `updatedAt` are stored as Firestore Timestamps server-side,
// and converted to ISO strings when returned to the client.

export type PlanId = "free" | "basic" | "pro";

export type UsageSnapshot = {
  plan: PlanId;
  month: { used: number; limit: number };
  day: { used: number; limit: number | null }; // null = unlimited
};

export type MessageRole = "user" | "assistant" | "system";

export type MessagePart = {
  type: string; // "text" for now; leaves room for images/tools later
  text?: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  createdAt: string; // ISO
};

export type Chat = {
  id: string;
  title: string; // auto-generated from first user message
  createdAt: string; // ISO
  updatedAt: string; // ISO, bumped on every new message
};

// UI message shape expected by @ai-sdk/react useChat
export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
};
