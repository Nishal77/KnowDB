export interface AIQueryResponse {
  query: string; // MongoDB query string
  explanation?: string; // Human-readable explanation
  confidence?: number; // 0-1 confidence score
  collection?: string; // Collection name
  operation?: string; // Operation type (find, aggregate, etc.)
  error?: string; // Error message if AI returned an error response
  message?: string; // Greeting/conversation message (e.g., for "hello" responses)
}

export interface AIPrompt {
  systemPrompt: string;
  userPrompt: string;
}



