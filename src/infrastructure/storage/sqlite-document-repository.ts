import type * as SQLite from "expo-sqlite";
import {
  DocumentRecord,
  DocumentType,
  ExtractedField,
  ExtractionSource,
  FieldKey,
} from "../../domain/document/document.types";
import { DocumentRepository } from "../../domain/document/document.ports";

export interface ISQLiteDatabase {
  readonly databasePath?: string;
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: any[]): Promise<any>;
  getAllAsync<T>(source: string, ...params: any[]): Promise<T[]>;
  getFirstAsync<T>(source: string, ...params: any[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

export class SQLiteDocumentRepository implements DocumentRepository {
  private db: ISQLiteDatabase | null = null;
  private readonly dbName: string;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(databaseOrName: ISQLiteDatabase | string = "bodhini.db") {
    if (typeof databaseOrName === "string") {
      this.dbName = databaseOrName;
      this.db = null;
    } else {
      this.db = databaseOrName;
      this.dbName = databaseOrName.databasePath || "bodhini.db";
    }
  }

  /**
   * Returns active database instance, initializing schema and foreign keys if needed.
   * Uses safe concurrency guard to initialize only once per connection.
   */
  public async getDatabase(): Promise<ISQLiteDatabase> {
    if (!this.db) {
      const SQLiteModule = await import("expo-sqlite");
      this.db = await SQLiteModule.openDatabaseAsync(this.dbName);
      this.isInitialized = false;
      this.initPromise = null;
    }
    await this.ensureInitialized(this.db);
    return this.db;
  }

  /**
   * Safe initialization guard that ensures schema is initialized only once per connection,
   * safely handles concurrent first calls, allows retries if initialization fails,
   * and preserves foreign key enforcement.
   */
  private async ensureInitialized(db: ISQLiteDatabase): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          await this.initDatabase(db);
          this.isInitialized = true;
        } catch (err) {
          this.isInitialized = false;
          throw err;
        } finally {
          this.initPromise = null;
        }
      })();
    }

    await this.initPromise;
  }

  /**
   * Initializes foreign key enforcement and required tables.
   */
  private async initDatabase(db: ISQLiteDatabase): Promise<void> {
    // 1. Enforce SQLite foreign key constraints
    await db.execAsync("PRAGMA foreign_keys = ON;");

    // 2. Create documents table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        created_at TEXT NOT NULL,
        confirmed_at TEXT NOT NULL
      );
    `);

    // 3. Create document_fields table persisting all ExtractedField properties
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS document_fields (
        id TEXT PRIMARY KEY NOT NULL,
        document_id TEXT NOT NULL,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL NOT NULL,
        source TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
      );
    `);

    // 4. Index on document_id for fast cascading and join queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_document_fields_document_id
      ON document_fields (document_id);
    `);
  }

  /**
   * Saves or updates a confirmed DocumentRecord along with its ExtractedField items.
   */
  async save(doc: DocumentRecord): Promise<void> {
    const db = await this.getDatabase();

    await db.withTransactionAsync(async () => {
      // Upsert document record
      await db.runAsync(
        `INSERT OR REPLACE INTO documents (id, type, image_uri, created_at, confirmed_at)
         VALUES (?, ?, ?, ?, ?);`,
        [doc.id, doc.type, doc.imageUri, new Date(doc.createdAt).toISOString(), new Date(doc.confirmedAt).toISOString()]
      );

      // Remove any existing fields for this document prior to inserting updated ones
      await db.runAsync(
        `DELETE FROM document_fields WHERE document_id = ?;`,
        [doc.id]
      );

      // Persist all ExtractedField entries
      for (const field of doc.fields) {
        await db.runAsync(
          `INSERT INTO document_fields (id, document_id, key, label, value, confidence, source)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            field.id,
            doc.id,
            field.key,
            field.label,
            field.value,
            field.confidence,
            field.source,
          ]
        );
      }
    });
  }

  /**
   * Retrieves all confirmed DocumentRecords with their ExtractedField items.
   */
  async getAll(): Promise<DocumentRecord[]> {
    const db = await this.getDatabase();

    const docRows = await db.getAllAsync<{
      id: string;
      type: string;
      image_uri: string;
      created_at: string;
      confirmed_at: string;
    }>("SELECT * FROM documents ORDER BY created_at DESC;");

    if (docRows.length === 0) {
      return [];
    }

    const fieldRows = await db.getAllAsync<{
      id: string;
      document_id: string;
      key: string;
      label: string;
      value: string;
      confidence: number;
      source: string;
    }>("SELECT * FROM document_fields;");

    const fieldsByDocId = new Map<string, ExtractedField[]>();
    for (const f of fieldRows) {
      const list = fieldsByDocId.get(f.document_id) || [];
      list.push({
        id: f.id,
        key: f.key as FieldKey,
        label: f.label,
        value: f.value,
        confidence: Number(f.confidence),
        source: f.source as ExtractionSource,
      });
      fieldsByDocId.set(f.document_id, list);
    }

    return docRows.map((d) => ({
      id: d.id,
      type: d.type as DocumentType,
      imageUri: d.image_uri,
      fields: fieldsByDocId.get(d.id) || [],
      createdAt: new Date(d.created_at).getTime(),
      confirmedAt: new Date(d.confirmed_at).getTime(),
    }));
  }

  /**
   * Retrieves a single DocumentRecord by id with its ExtractedField items.
   */
  async getById(id: string): Promise<DocumentRecord | null> {
    const db = await this.getDatabase();

    const docRow = await db.getFirstAsync<{
      id: string;
      type: string;
      image_uri: string;
      created_at: string;
      confirmed_at: string;
    }>("SELECT * FROM documents WHERE id = ?;", [id]);

    if (!docRow) {
      return null;
    }

    const fieldRows = await db.getAllAsync<{
      id: string;
      document_id: string;
      key: string;
      label: string;
      value: string;
      confidence: number;
      source: string;
    }>("SELECT * FROM document_fields WHERE document_id = ?;", [id]);

    return {
      id: docRow.id,
      type: docRow.type as DocumentType,
      imageUri: docRow.image_uri,
      fields: fieldRows.map((f) => ({
        id: f.id,
        key: f.key as FieldKey,
        label: f.label,
        value: f.value,
        confidence: Number(f.confidence),
        source: f.source as ExtractionSource,
      })),
      createdAt: new Date(docRow.created_at).getTime(),
      confirmedAt: new Date(docRow.confirmed_at).getTime(),
    };
  }

  /**
   * Deletes a document by id. Because of ON DELETE CASCADE, its fields are deleted automatically.
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`DELETE FROM documents WHERE id = ?;`, [id]);
  }

  /**
   * Closes the active database connection (useful for simulating app restarts in tests).
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }
}
