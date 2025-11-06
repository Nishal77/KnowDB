import mongoose, { Schema, model } from "mongoose";
import type { DatabaseSchema } from "../interfaces/Schema.js";

export interface ISchemaMeta extends mongoose.Document {
  schema: DatabaseSchema;
  lastUpdated: Date;
  version: number;
}

const SchemaMetaSchema = new Schema<ISchemaMeta>(
  {
    schema: {
      type: Schema.Types.Mixed,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Note: MongoDB automatically creates a unique index on _id
// We don't need to manually create an index on _id as it's already indexed by default
// If you need to ensure only one schema document, use a different approach like:
// SchemaMetaSchema.index({ version: 1 }, { unique: false });

export const SchemaMeta = model<ISchemaMeta>("SchemaMeta", SchemaMetaSchema);



