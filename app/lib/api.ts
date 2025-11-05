import type { Message, QueryResult } from "../types/message";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function sendQuery(
  query: string,
  conversationId?: string
): Promise<{ message: Message; result: QueryResult }> {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send query: ${response.statusText}`);
  }

  return response.json();
}

export async function getConversationHistory(conversationId: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation: ${response.statusText}`);
  }

  return response.json();
}

