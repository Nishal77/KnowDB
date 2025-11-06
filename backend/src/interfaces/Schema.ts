export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  default?: unknown;
}

export interface SchemaCollection {
  name: string; // Collection name only (without database prefix)
  fields: SchemaField[];
  indexes?: string[];
}

export interface DatabaseInfo {
  name: string; // Database name
  collections: SchemaCollection[]; // Collections in this database
}

export interface DatabaseSchema {
  databases: DatabaseInfo[]; // Grouped by database
  collections: SchemaCollection[]; // Flat list for backward compatibility (with database prefix)
}



