// A new chat is just a fresh, unique /chat/<uuid> URL. Generating the id in the
// route (rather than inside the chat component) guarantees that every "new chat"
// action navigates to a distinct URL, forcing a clean remount.
export function newChatPath(): string {
  return `/chat/${crypto.randomUUID()}`;
}
