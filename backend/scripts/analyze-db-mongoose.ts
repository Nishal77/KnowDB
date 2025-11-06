import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://exot4396_db_user:0TaaaCjkHELW6paY@cluster0.ni3wr96.mongodb.net/?appName=Cluster0";

interface CollectionAnalysis {
  name: string;
  count: number;
  indexes: Array<{ name: string; key: Record<string, number> }>;
  sampleDocument?: Record<string, unknown>;
  fields: Array<{ name: string; type: string; sampleValue?: unknown }>;
}

interface DatabaseAnalysis {
  name: string;
  collections: CollectionAnalysis[];
  totalCollections: number;
  totalDocuments: number;
}

async function analyzeDatabase() {
  try {
    // Connect using mongoose with same options as the app
    const isAtlas = MONGODB_URI.startsWith("mongodb+srv://");
    
    const connectionOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000,
    };

    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log("✅ Connected to MongoDB Atlas\n");
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName || "unknown"}\n`);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    const adminDb = db.admin();
    const databases = await adminDb.listDatabases();

    console.log("=".repeat(80));
    console.log("MONGODB DATABASE ANALYSIS");
    console.log("=".repeat(80));
    console.log(`\n📊 Found ${databases.databases.length} database(s)\n`);

    const analyses: DatabaseAnalysis[] = [];

    for (const dbInfo of databases.databases) {
      // Skip system databases
      if (["admin", "local", "config"].includes(dbInfo.name)) {
        continue;
      }

      const currentDb = mongoose.connection.useDb(dbInfo.name);
      const collections = await currentDb.db.listCollections().toArray();

      console.log(`\n${"=".repeat(80)}`);
      console.log(`📁 DATABASE: ${dbInfo.name}`);
      console.log(`   Size: ${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Collections: ${collections.length}`);
      console.log("=".repeat(80));

      const collectionAnalyses: CollectionAnalysis[] = [];
      let totalDocs = 0;

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const collection = currentDb.db.collection(collectionName);

        // Get document count
        const count = await collection.countDocuments();

        // Get indexes
        const indexes = await collection.indexes();

        // Get sample document
        const sampleDoc = await collection.findOne({});

        // Analyze fields
        const fields: Array<{ name: string; type: string; sampleValue?: unknown }> = [];
        if (sampleDoc) {
          for (const [key, value] of Object.entries(sampleDoc)) {
            if (key.startsWith("_") && key !== "_id") continue;

            const type = inferType(value);
            fields.push({
              name: key,
              type,
              sampleValue: value !== null && typeof value !== "object" ? value : undefined,
            });
          }
        } else {
          fields.push({ name: "_id", type: "ObjectId" });
        }

        const analysis: CollectionAnalysis = {
          name: collectionName,
          count,
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key as Record<string, number>,
          })),
          sampleDocument: sampleDoc as Record<string, unknown> | undefined,
          fields,
        };

        collectionAnalyses.push(analysis);
        totalDocs += count;

        // Print collection info
        console.log(`\n📦 Collection: ${collectionName}`);
        console.log(`   Documents: ${count.toLocaleString()}`);
        console.log(`   Indexes: ${indexes.length}`);
        
        if (indexes.length > 0) {
          console.log(`   Index Details:`);
          indexes.forEach(idx => {
            const keys = Object.entries(idx.key)
              .map(([k, v]) => `${k}:${v === 1 ? "asc" : v === -1 ? "desc" : v}`)
              .join(", ");
            console.log(`     - ${idx.name}: { ${keys} }`);
          });
        }

        if (fields.length > 0) {
          console.log(`   Fields (${fields.length}):`);
          fields.forEach(field => {
            const sample = field.sampleValue !== undefined 
              ? ` = ${formatSampleValue(field.sampleValue)}` 
              : "";
            console.log(`     - ${field.name}: ${field.type}${sample}`);
          });
        }

        if (sampleDoc) {
          console.log(`   Sample Document (first 300 chars):`);
          const docStr = JSON.stringify(sampleDoc, null, 2);
          const preview = docStr.length > 300 ? docStr.substring(0, 300) + "..." : docStr;
          console.log(`     ${preview.split("\n").join("\n     ")}`);
        }
      }

      analyses.push({
        name: dbInfo.name,
        collections: collectionAnalyses,
        totalCollections: collections.length,
        totalDocuments: totalDocs,
      });
    }

    // Summary
    console.log(`\n\n${"=".repeat(80)}`);
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    
    analyses.forEach(dbAnalysis => {
      console.log(`\n${dbAnalysis.name}:`);
      console.log(`  Total Collections: ${dbAnalysis.totalCollections}`);
      console.log(`  Total Documents: ${dbAnalysis.totalDocuments.toLocaleString()}`);
      console.log(`  Collections:`);
      dbAnalysis.collections.forEach(col => {
        console.log(`    - ${col.name}: ${col.count.toLocaleString()} documents`);
      });
    });

    // Application-specific collections check
    console.log(`\n\n${"=".repeat(80)}`);
    console.log("🔍 APPLICATION COLLECTIONS CHECK");
    console.log("=".repeat(80));
    
    const expectedCollections = ["querylogs", "schemametas"];
    const allCollectionNames = analyses.flatMap(db => 
      db.collections.map(col => col.name.toLowerCase())
    );

    expectedCollections.forEach(expected => {
      const found = allCollectionNames.includes(expected);
      console.log(`  ${found ? "✅" : "❌"} ${expected}: ${found ? "Found" : "Not found"}`);
    });

    // Check for the specific database the app uses
    const appDbName = "knowdb";
    const appDb = analyses.find(db => db.name === appDbName);
    if (appDb) {
      console.log(`\n\n${"=".repeat(80)}`);
      console.log(`🎯 APPLICATION DATABASE: ${appDbName}`);
      console.log("=".repeat(80));
      console.log(`Collections used by the application:`);
      appDb.collections.forEach(col => {
        const isAppCollection = expectedCollections.includes(col.name.toLowerCase());
        console.log(`  ${isAppCollection ? "✅" : "📦"} ${col.name} (${col.count} docs)`);
      });
    }

  } catch (error) {
    console.error("❌ Error analyzing database:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Connection closed");
  }
}

function inferType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) {
    if (value.length > 0) {
      return `Array<${inferType(value[0])}>`;
    }
    return "Array";
  }
  if (value instanceof Date) return "Date";
  if (value instanceof RegExp) return "RegExp";
  if (typeof value === "object") {
    if (value && value.constructor && value.constructor.name !== "Object") {
      return value.constructor.name;
    }
    return "Object";
  }
  return typeof value;
}

function formatSampleValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 50 ? `"${value.substring(0, 50)}..."` : `"${value}"`;
  }
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

// Run the analysis
analyzeDatabase().catch(console.error);

