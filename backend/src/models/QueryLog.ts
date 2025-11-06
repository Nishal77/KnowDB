import mongoose, { Schema, model } from "mongoose";

export interface IQueryLog extends mongoose.Document {
  conversationId: string;
  userId?: string;
  userQuery: string;
  generatedQuery: string;
  result: unknown;
  executionTime?: number;
  error?: string;
  timestamp: Date;
}

const QueryLogSchema = new Schema<IQueryLog>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userQuery: {
      type: String,
      required: true,
    },
    generatedQuery: {
      type: String,
      required: false, // Made optional to handle cases where AI returns error instead of query
    },
    result: {
      type: Schema.Types.Mixed,
    },
    executionTime: {
      type: Number,
    },
    error: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const QueryLog = model<IQueryLog>("QueryLog", QueryLogSchema);



