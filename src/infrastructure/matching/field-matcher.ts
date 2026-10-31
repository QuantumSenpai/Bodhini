import { DocumentRecord, ExtractedField, FieldKey } from "../../domain/document/document.types";
import { FormField, FilledField, FillStatus } from "../../domain/form/form.types";
import { FieldMatcher as IFieldMatcher } from "../../domain/document/document.ports";
import { resolveFieldKey, isSignatureOrDeclarationLabel } from "./field-synonyms";
import { ConfidencePolicy, PolicyEvaluation } from "./confidence-policy";

export interface MatchedFieldDetail {
  field: FormField;
  value: string | null;
  confidence: number;
  status: FillStatus;
  matchedKey?: FieldKey;
  matchReason: string;
  sourceDocumentId?: string;
}

type ConfirmedField = { field: ExtractedField; documentId: string };

export class FieldMatcher implements IFieldMatcher {
<<<<<<< HEAD
  public async match(fields: FormField[], docs: DocumentRecord[]): Promise<FilledField[]> {
    const detailed = this.matchDetailed(fields, docs);
    return detailed.map((d) => ({
      field: d.field,
      value: d.value ?? "",
      confidence: d.confidence,
      status: d.status,
      sourceDocumentId: d.sourceDocumentId,
    }));
  }

  public matchDetailed(fields: FormField[], docs: DocumentRecord[]): MatchedFieldDetail[] {
=======
  /**
   * Matches incoming form fields against confirmed document records.
   * Enforces that signatures/declarations are skipped across field.type, field.label,
   * and field.instruction (in English, Hindi, and Bengali), and missing values are never fabricated.
   */
  public match(fields: FormField[], docs: DocumentRecord[]): FilledField[] {
    // Keep every confirmed value so conflicting records are surfaced for user resolution,
    // rather than silently selecting one document over another.
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
    const confirmedFieldsByKey = this.indexConfirmedFields(docs);

    return fields.map((field) => {
      const isSignatureOrDecl =
        field.type === "SIGNATURE" ||
        field.type === "DECLARATION" ||
        isSignatureOrDeclarationLabel(field.label) ||
        Boolean(field.instruction && isSignatureOrDeclarationLabel(field.instruction));

      if (isSignatureOrDecl) {
        const evaluation = ConfidencePolicy.evaluate(field, false);
        return {
          field,
          value: null,
<<<<<<< HEAD
=======
          status: "SKIPPED",
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
          confidence: 0,
          status: "SKIPPED",
          matchReason: evaluation.reason,
        };
      }

<<<<<<< HEAD
      const resolution = resolveFieldKey(field.label);
=======
      // 2. Resolve field label to canonical FieldKey using trilingual synonyms
      const resolution = field.key
        ? { key: field.key, matchType: "exact" as const }
        : resolveFieldKey(field.label);
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)

      if (resolution) {
        const confirmedCandidates = confirmedFieldsByKey.get(resolution.key) ?? [];
        const usableCandidates = confirmedCandidates.filter((candidate) => candidate.field.value.trim().length > 0);
        const distinctValues = new Set(usableCandidates.map((candidate) => candidate.field.value.trim().toLocaleLowerCase()));

        if (distinctValues.size > 1) {
          return {
            field,
            value: null,
            status: "NEEDS_USER",
            confidence: 0,
            matchedKey: resolution.key,
            matchReason: "Conflicting confirmed values exist in more than one saved document. Choose the correct value manually.",
          };
        }

        const confirmedField = usableCandidates[0];
        if (confirmedField) {
          const evaluation = ConfidencePolicy.evaluate(field, true, resolution.matchType);
          return {
            field,
<<<<<<< HEAD
            value: confirmedField.value,
            confidence: evaluation.confidence,
            status: evaluation.status,
=======
            value: confirmedField.field.value,
            status: evaluation.status,
            confidence: evaluation.confidence,
            sourceDocumentId: confirmedField.documentId,
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
            matchedKey: resolution.key,
            matchReason: evaluation.reason,
            sourceDocumentId: confirmedField.id,
          };
        }
      }

      const evaluation = ConfidencePolicy.evaluate(field, false);
      return {
        field,
        value: null,
<<<<<<< HEAD
=======
        status: evaluation.status,
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
        confidence: evaluation.confidence,
        status: evaluation.status,
        matchReason: evaluation.reason,
      };
    });
  }

<<<<<<< HEAD
  private indexConfirmedFields(docs: DocumentRecord[]): Map<FieldKey, ExtractedField> {
    const map = new Map<FieldKey, ExtractedField>();
=======
  /** Indexes every confirmed value with its owning document so matches retain provenance. */
  private indexConfirmedFields(docs: DocumentRecord[]): Map<FieldKey, ConfirmedField[]> {
    const map = new Map<FieldKey, ConfirmedField[]>();
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)

    const sortedDocs = [...docs].sort((a, b) => {
      const timeA = a.confirmedAt || a.createdAt;
      const timeB = b.confirmedAt || b.createdAt;
      return timeB - timeA;
    });

    for (const doc of sortedDocs) {
      for (const field of doc.fields) {
        if (field.value && field.value.trim().length > 0) {
          const current = map.get(field.key) ?? [];
          current.push({ field, documentId: doc.id });
          map.set(field.key, current);
        }
      }
    }

    return map;
  }
}