import { DatabaseSchema } from "../interfaces/Schema.js";

/**
 * Formats schema for prompt (kept for backward compatibility if needed elsewhere)
 * The main prompt building is now done directly in llmService.ts following the example format
 */
export function formatSchemaForPrompt(schema: DatabaseSchema): string {
  // Format schema as JSON-like structure for better AI understanding
  const schemaObj: Record<string, Record<string, string>> = {};
  
  schema.collections.forEach((collection) => {
    const fields: Record<string, string> = {};
    collection.fields.forEach((field) => {
      fields[field.name] = field.type;
    });
    schemaObj[collection.name] = fields;
  });
  
  return JSON.stringify(schemaObj, null, 2);
}



