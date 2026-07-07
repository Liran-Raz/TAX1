import { ChatView } from "@/components/ChatView";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  // key forces a clean remount (fresh history + state) whenever the chat changes.
  return <ChatView key={chatId} chatId={chatId} />;
}
