import mongoose from "mongoose";
import type { DatabaseSchema, DatabaseInfo, SchemaCollection, SchemaField } from "../interfaces/Schema.js";

/**
 * Parses schema from ALL databases in the MongoDB cluster, not just the current one
 * Returns schema grouped by database with collections as sub-items
 */
export async function parseDatabaseSchema(): Promise<DatabaseSchema> {
  const databases: DatabaseInfo[] = [];
  const flatCollections: SchemaCollection[] = []; // For backward compatibility
  
  const client = mongoose.connection.getClient();
  if (!client) {
    throw new Error("MongoDB client not available");
  }

  // Get admin database to list all databases
  const adminDb = client.db().admin();
  const databasesList = await adminDb.listDatabases();
  
  // Skip system databases
  const systemDbs = ["admin", "local", "config"];
  
  // Iterate through all databases
  for (const dbInfo of databasesList.databases) {
    const dbName = dbInfo.name;
    
    // Skip system databases
    if (systemDbs.includes(dbName)) {
      continue;
    }
    
    try {
      // Switch to this database
      const db = client.db(dbName);
      const collectionNames = await db.listCollections().toArray();
      
      const dbCollections: SchemaCollection[] = [];
      
      // Parse collections from this database
      for (const collectionInfo of collectionNames) {
        const collectionName = collectionInfo.name;
        
        // Skip system collections
        if (collectionName.startsWith("system.")) {
          continue;
        }

        const collection = db.collection(collectionName);
        const sampleDoc = await collection.findOne({});
        
        // Collection name WITHOUT database prefix (for display)
        const collectionData: SchemaCollection = {
          name: collectionName, // Just the collection name, no database prefix
          fields: [],
        };
        
        if (sampleDoc) {
          collectionData.fields = parseDocumentFields(sampleDoc);
        } else {
          // Empty collection - add basic _id field
          collectionData.fields = [
            { name: "_id", type: "ObjectId", required: true },
          ];
        }
        
        dbCollections.push(collectionData);
        
        // Also add to flat list with database prefix (for backward compatibility)
        flatCollections.push({
          name: `${dbName}.${collectionName}`, // Full name with prefix
          fields: collectionData.fields,
        });
      }
      
      // Add database with its collections
      if (dbCollections.length > 0) {
        databases.push({
          name: dbName,
          collections: dbCollections,
        });
      }
    } catch (error) {
      // Log error but continue with other databases
      console.warn(`Error parsing schema from database ${dbName}:`, error);
      continue;
    }
  }

  return { 
    databases, // Grouped by database
    collections: flatCollections, // Flat list for backward compatibility
  };
}

function parseDocumentFields(doc: Record<string, unknown>): SchemaField[] {
  const fields: SchemaField[] = [];
  
  for (const [key, value] of Object.entries(doc)) {
    // Skip MongoDB internal fields except _id
    if (key.startsWith("_") && key !== "_id") {
      continue;
    }
    
    const field: SchemaField = {
      name: key,
      type: inferFieldType(value),
    };
    
    if (value === null || value === undefined) {
      field.required = false;
    } else {
      field.required = true;
    }
    
    fields.push(field);
  }
  
  return fields;
}

function inferFieldType(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  
  if (Array.isArray(value)) {
    if (value.length > 0) {
      return `Array<${inferFieldType(value[0])}>`;
    }
    return "Array";
  }
  
  if (value instanceof Date) {
    return "Date";
  }
  
  if (typeof value === "object") {
    return "Object";
  }
  
  return typeof value;
}



