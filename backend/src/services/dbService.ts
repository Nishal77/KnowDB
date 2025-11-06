import mongoose from "mongoose";
import { logger } from "../config/logger.js";
import { MAX_RESULT_SIZE } from "../utils/constants.js";

class DBService {
  async executeQuery(query: string): Promise<unknown> {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    try {
      // Validate query safety (basic check)
      this.validateQuery(query);

      // Execute query in isolated context
      const result = await this.executeInContext(query, db);
      
      // Limit result size
      return this.limitResultSize(result);
    } catch (error) {
      logger.error("Error executing query:", error);
      throw error;
    }
  }

  private validateQuery(query: string): void {
    // Prevent dangerous operations
    const dangerousPatterns = [
      /db\.dropDatabase/i,
      /db\.dropCollection/i,
      /\.remove\(/i,
      /\.deleteMany\(/i,
      /\.drop\(/i,
      /shutdown/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new Error("Dangerous operation detected. Query rejected for safety.");
      }
    }
  }

  private async executeInContext(query: string, db: mongoose.mongo.Db): Promise<unknown> {
    const safeQuery = this.sanitizeQuery(query);
    
    // Handle introspection operations (db.getName(), db.getCollectionNames(), etc.)
    if (safeQuery.includes("db.getName()")) {
      return db.databaseName;
    }
    
    if (safeQuery.includes("db.getCollectionNames()")) {
      // Return collections from ALL databases, not just current one
      const client = db.client;
      const adminDb = client.db().admin();
      const databasesList = await adminDb.listDatabases();
      
      const allCollections: string[] = [];
      const systemDbs = ["admin", "local", "config"];
      
      for (const dbInfo of databasesList.databases) {
        const dbName = dbInfo.name;
        if (systemDbs.includes(dbName)) continue;
        
        try {
          const targetDb = client.db(dbName);
          const collections = await targetDb.listCollections().toArray();
          collections
            .filter((col) => !col.name.startsWith("system."))
            .forEach((col) => {
              allCollections.push(`${dbName}.${col.name}`);
            });
        } catch (error) {
          // Continue with other databases
          continue;
        }
      }
      
      return allCollections;
    }
    
    // Handle db.getMongo().getDBNames() for listing all databases
    if (safeQuery.includes("db.getMongo().getDBNames()") || safeQuery.includes("getDBNames()")) {
      const adminDb = db.admin();
      const databases = await adminDb.listDatabases();
      const systemDbs = ["admin", "local", "config"];
      return databases.databases
        .map((dbInfo) => dbInfo.name)
        .filter((name) => !systemDbs.includes(name));
    }
    
    // Extract collection name and operation
    // Support: db.collection.operation() format
    // Collections in schema are prefixed with database (e.g., "knowdb.users")
    // Regex needs to handle collection names with dots (database.collection format)
    const collectionMatch = safeQuery.match(/db\.([^.]+)\.(\w+)\(/);
    if (!collectionMatch) {
      throw new Error("Invalid query format. Expected db.collection.operation()");
    }

    const [, collectionName, operation] = collectionMatch;
    
    // Check if collection name contains database prefix (e.g., "knowdb.users")
    // If so, extract database and collection name
    let targetDb = db;
    let actualCollectionName = collectionName;
    
    if (collectionName.includes(".")) {
      const parts = collectionName.split(".");
      if (parts.length === 2) {
        const [dbName, colName] = parts;
        const client = db.client;
        targetDb = client.db(dbName);
        actualCollectionName = colName;
      }
    }
    
    const collection = targetDb.collection(actualCollectionName);

    // Extract arguments - handle both single line and multi-line
    const argsMatch = safeQuery.match(/\(([\s\S]*?)\)(?:\s*;?\s*$|$)/);
    if (!argsMatch) {
      throw new Error("Invalid query format. Missing arguments.");
    }

    try {
      const argsStr = argsMatch[1].trim();
      
      if (operation === "find") {
        const filter = argsStr ? (this.parseQueryArgs(argsStr) as Record<string, unknown>) : {};
        const cursor = collection.find(filter);
        const results = await cursor.limit(100).toArray();
        return results;
      } else if (operation === "aggregate") {
        // Handle array syntax for aggregation pipeline
        const pipelineStr = argsStr.startsWith("[") ? argsStr : `[${argsStr}]`;
        const pipeline = this.parseQueryArgs(pipelineStr);
        if (!Array.isArray(pipeline)) {
          throw new Error("Aggregate operation requires an array pipeline");
        }
        const cursor = collection.aggregate(pipeline);
        const results = await cursor.limit(100).toArray();
        return results;
      } else if (operation === "findOne") {
        const filter = argsStr ? (this.parseQueryArgs(argsStr) as Record<string, unknown>) : {};
        return await collection.findOne(filter);
      } else if (operation === "countDocuments") {
        const filter = argsStr ? (this.parseQueryArgs(argsStr) as Record<string, unknown>) : {};
        return await collection.countDocuments(filter);
      } else {
        throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof Error) {
        throw new Error(`Invalid query syntax: ${error.message}`);
      }
      throw error;
    }
  }

  private parseQueryArgs(argsStr: string): unknown {
    try {
      // Try to parse as JSON first
      return JSON.parse(argsStr);
    } catch {
      // If JSON parsing fails, try to evaluate as JavaScript object literal
      // This handles cases like { field: "value" } without quotes on keys
      try {
        // Use Function constructor for safer evaluation (still needs improvement for production)
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        return new Function(`return ${argsStr}`)();
      } catch {
        throw new Error(`Unable to parse query arguments: ${argsStr}`);
      }
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove comments
    let sanitized = query.replace(/\/\/.*$/gm, "");
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, "");
    
    // Remove extra whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  private limitResultSize(result: unknown): unknown {
    if (Array.isArray(result)) {
      if (result.length > MAX_RESULT_SIZE) {
        return result.slice(0, MAX_RESULT_SIZE);
      }
      return result;
    }

    if (result && typeof result === "object") {
      const jsonStr = JSON.stringify(result);
      if (jsonStr.length > MAX_RESULT_SIZE) {
        return { error: "Result too large", truncated: true };
      }
    }

    return result;
  }
}

export const dbService = new DBService();

