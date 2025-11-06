export interface QueryRequest {
  query: string;
  conversationId?: string;
}

export interface QueryResponse {
  conversationId: string;
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    queryResult?: QueryResult;
  };
  result: QueryResult;
}

export interface QueryResult {
  query: string;
  result: unknown;
  executionTime?: number;
  error?: string;
}

