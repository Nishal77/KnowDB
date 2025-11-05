export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  queryResult?: QueryResult;
}

export interface QueryResult {
  query: string;
  result: any;
  executionTime?: number;
  error?: string;
}

