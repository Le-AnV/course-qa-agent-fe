export type ChatTicketMessage = { role: "user" | "ai"; content: string };

export function associatedQuestion(messages: ChatTicketMessage[], answerIndex: number): string | null {
  const previous = messages[answerIndex - 1];
  if (messages[answerIndex]?.role !== "ai" || previous?.role !== "user") return null;
  return previous.content.trim() || null;
}
