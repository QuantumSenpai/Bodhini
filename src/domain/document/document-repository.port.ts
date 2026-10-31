import { DocumentRecord } from "./document.types";

export interface DocumentRepository {
  save(doc: DocumentRecord): Promise<void>;
  getAll(): Promise<DocumentRecord[]>;
  getById(id: string): Promise<DocumentRecord | null>;
  delete(id: string): Promise<void>;
}
