export interface Query {
  id: string;
  text: string;
  timestamp: Date;
  result?: any;
  error?: string;
}

export interface QueryHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

