import type { Message, QueryResult } from "../types/message";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper function to parse dates from API responses
function parseMessage(message: any): Message {
  return {
    ...message,
    timestamp: typeof message.timestamp === "string" 
      ? new Date(message.timestamp) 
      : message.timestamp instanceof Date 
      ? message.timestamp 
      : new Date(),
  };
}

export async function sendQuery(
  query: string,
  conversationId?: string
): Promise<{ conversationId: string; message: Message; result: QueryResult }> {
  // Validate query before sending
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error("Query cannot be empty");
  }

  try {
    const requestBody = {
      query: query.trim(),
      ...(conversationId && { conversationId }),
    };

    const response = await fetch(`${API_BASE_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to send query: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        // Handle nested error structure
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = typeof errorJson.error === 'string' 
            ? errorJson.error 
            : errorMessage;
        }
      } catch {
        // If error response is not JSON, use the text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Parse the message to ensure timestamp is a Date object
    return {
      conversationId: data.conversationId || data.message?.id || "",
      message: parseMessage(data.message),
      result: data.result,
    };
  } catch (error) {
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend server is running on port 3001.`);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to send query: Unknown error");
  }
}

export async function getConversationHistory(conversationId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch conversation: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Parse all messages to ensure timestamps are Date objects
    if (Array.isArray(data)) {
      return data.map(parseMessage);
    }
    
    // If response is a single object with messages array
    if (data.messages && Array.isArray(data.messages)) {
      return data.messages.map(parseMessage);
    }
    
    return [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch conversation: Unknown error");
  }
}

export async function getSchema(refresh?: boolean): Promise<any> {
  try {
    const url = `${API_BASE_URL}/api/schema${refresh ? "?refresh=true" : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch schema: Unknown error");
  }
}

export async function refreshSchema(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/schema/refresh`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh schema: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to refresh schema: Unknown error");
  }
}

