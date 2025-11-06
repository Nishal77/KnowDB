import mongoose from "mongoose";
import { parseDatabaseSchema } from "../utils/schemaParser.js";
import { SchemaMeta } from "../models/SchemaMeta.js";
import { logger } from "../config/logger.js";
import type { DatabaseSchema } from "../interfaces/Schema.js";

class SchemaService {
  private cachedSchema: DatabaseSchema | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getSchema(forceRefresh = false): Promise<DatabaseSchema> {
    // Check cache
    if (!forceRefresh && this.cachedSchema && Date.now() < this.cacheExpiry) {
      return this.cachedSchema;
    }

    try {
      // Parse schema from database
      const schema = await parseDatabaseSchema();
      
      // Cache it
      this.cachedSchema = schema;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      // Save to database for persistence
      await this.saveSchemaToDB(schema);

      return schema;
    } catch (error) {
      logger.error("Error fetching schema:", error);
      
      // Try to load from database cache
      const cached = await this.loadSchemaFromDB();
      if (cached) {
        return cached;
      }

      throw error;
    }
  }

  async refreshSchema(): Promise<DatabaseSchema> {
    return this.getSchema(true);
  }

  /**
   * Gets list of collection names from ALL databases
   * Useful for introspection queries like "show all collections"
   * Returns format: ["database.collection", ...]
   */
  async getCollectionNames(): Promise<string[]> {
    try {
      const client = mongoose.connection.getClient();
      if (!client) {
        throw new Error("MongoDB client not available");
      }

      const adminDb = client.db().admin();
      const databasesList = await adminDb.listDatabases();
      
      const allCollections: string[] = [];
      const systemDbs = ["admin", "local", "config"];
      
      // Iterate through all databases
      for (const dbInfo of databasesList.databases) {
        const dbName = dbInfo.name;
        
        // Skip system databases
        if (systemDbs.includes(dbName)) {
          continue;
        }
        
        try {
          const db = client.db(dbName);
          const collections = await db.listCollections().toArray();
          
          // Add collections with database prefix
          collections
            .filter((col) => !col.name.startsWith("system."))
            .forEach((col) => {
              allCollections.push(`${dbName}.${col.name}`);
            });
        } catch (error) {
          logger.warn(`Error fetching collections from database ${dbName}:`, error);
          continue;
        }
      }
      
      return allCollections;
    } catch (error) {
      logger.error("Error fetching collection names:", error);
      throw error;
    }
  }

  /**
   * Gets list of all database names (excluding system databases)
   */
  async getAllDatabaseNames(): Promise<string[]> {
    try {
      const client = mongoose.connection.getClient();
      if (!client) {
        throw new Error("MongoDB client not available");
      }

      const adminDb = client.db().admin();
      const databasesList = await adminDb.listDatabases();
      
      const systemDbs = ["admin", "local", "config"];
      
      return databasesList.databases
        .map((db) => db.name)
        .filter((name) => !systemDbs.includes(name));
    } catch (error) {
      logger.error("Error fetching database names:", error);
      throw error;
    }
  }

  /**
   * Gets the current database name
   * Useful for introspection queries like "get database name"
   */
  async getDatabaseName(): Promise<string> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not available");
      }
      return db.databaseName;
    } catch (error) {
      logger.error("Error fetching database name:", error);
      throw error;
    }
  }

  private async saveSchemaToDB(schema: DatabaseSchema): Promise<void> {
    try {
      await SchemaMeta.findOneAndUpdate(
        {},
        {
          schema,
          lastUpdated: new Date(),
          $inc: { version: 1 },
        },
        {
          upsert: true,
          new: true,
        }
      );
    } catch (error) {
      logger.error("Error saving schema to DB:", error);
      // Don't throw - schema fetching should still work
    }
  }

  private async loadSchemaFromDB(): Promise<DatabaseSchema | null> {
    try {
      const meta = await SchemaMeta.findOne().sort({ version: -1 });
      if (meta && meta.schema) {
        this.cachedSchema = meta.schema as DatabaseSchema;
        this.cacheExpiry = Date.now() + this.CACHE_TTL;
        return meta.schema as DatabaseSchema;
      }
    } catch (error) {
      logger.error("Error loading schema from DB:", error);
    }
    return null;
  }
}

export const schemaService = new SchemaService();



