import type { DocumentValidator } from "../../domain/document/document.ports";
import type { DocumentConflict, DocumentRecord, ExtractedField } from "../../domain/document/document.types";
import { FieldValidator } from "./field-validator";

export class LocalDocumentValidator implements DocumentValidator {
  validate(field: ExtractedField) {
    const ok = FieldValidator.validate(field.key, field.value);
    return ok ? { ok: true } : { ok: false, reason: `Please check ${field.label}.` };
  }

  crossCheck(documents: DocumentRecord[]): DocumentConflict[] {
    const valuesByKey = new Map<string, { documentId: string; value: string }[]>();
    for (const document of documents) {
      for (const field of document.fields) {
        const entries = valuesByKey.get(field.key) ?? [];
        entries.push({ documentId: document.id, value: field.value.trim() });
        valuesByKey.set(field.key, entries);
      }
    }

    return [...valuesByKey.entries()]
      .filter(([, entries]) => new Set(entries.map((entry) => entry.value.toLocaleLowerCase())).size > 1)
      .map(([key, entries]) => ({
        key: key as DocumentConflict["key"],
        documentIds: entries.map((entry) => entry.documentId),
        values: entries.map((entry) => entry.value),
      }));
  }
}
