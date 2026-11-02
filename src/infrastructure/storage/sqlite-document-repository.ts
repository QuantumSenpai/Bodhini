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
  private dbOpenPromise: Promise<ISQLiteDatabase> | null = null;

  constructor(databaseOrName: ISQLiteDatabase | string = "bodhini.db") {
    if (typeof databaseOrName === "string") {
      this.dbName = databaseOrName;
      this.db = null;
    } else {
      this.db = databaseOrName;
      this.dbName = databaseOrName.databasePath || "bodhini.db";
    }
  }

  public async getDatabase(): Promise<ISQLiteDatabase> {
    if (!this.db) {
      if (!this.dbOpenPromise) {
        this.dbOpenPromise = (async () => {
          const SQLiteModule = await import("expo-sqlite");
          return await SQLiteModule.openDatabaseAsync(this.dbName) as unknown as ISQLiteDatabase;
        })();
      }
      try {
        this.db = await this.dbOpenPromise;
      } finally {
        this.dbOpenPromise = null;
      }
      this.isInitialized = false;
      this.initPromise = null;
    }
    const activeDb = this.db;
    if (!activeDb) throw new Error("SQLite database could not be opened.");
    await this.ensureInitialized(activeDb);
    return activeDb;
  }

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

  private async initDatabase(db: ISQLiteDatabase): Promise<void> {

    await db.execAsync("PRAGMA foreign_keys = ON;");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        image_uri TEXT,
        created_at INTEGER NOT NULL,
        confirmed_at INTEGER NOT NULL
      );
    `);

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

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_document_fields_document_id
      ON document_fields (document_id);
    `);
  }

  async save(doc: DocumentRecord): Promise<void> {
    const db = await this.getDatabase();

    await db.withTransactionAsync(async () => {

      await db.runAsync(
        `INSERT OR REPLACE INTO documents (id, type, image_uri, created_at, confirmed_at)
         VALUES (?, ?, ?, ?, ?);`,
        [doc.id, doc.type, doc.imageUri, new Date(doc.createdAt).toISOString(), new Date(doc.confirmedAt).toISOString()]
      );

      await db.runAsync(
        `DELETE FROM document_fields WHERE document_id = ?;`,
        [doc.id]
      );

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

  async getAll(): Promise<DocumentRecord[]> {
    const db = await this.getDatabase();

    const docRows = await db.getAllAsync<{
      id: string;
      type: string;
      image_uri: string | null;
      created_at: number | string;
      confirmed_at: number | string;
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

  async getById(id: string): Promise<DocumentRecord | null> {
    const db = await this.getDatabase();

    const docRow = await db.getFirstAsync<{
      id: string;
      type: string;
      image_uri: string | null;
      created_at: number | string;
      confirmed_at: number | string;
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

  async delete(id: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`DELETE FROM documents WHERE id = ?;`, [id]);
  }

  private toTimestamp(value: string | number): number {
    if (typeof value === "number") return value;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }
}