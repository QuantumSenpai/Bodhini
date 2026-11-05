import { DocumentRecord, ExtractedField, FieldKey } from "../../domain/document/document.types";
import { FormField, FilledField, FillStatus } from "../../domain/form/form.types";
import { FieldMatcher as IFieldMatcher } from "../../domain/document/document.ports";
import { resolveFieldKey, isSignatureOrDeclarationLabel } from "./field-synonyms";
import { resolveFieldKeyFuzzy } from "./fuzzy-resolver";
import { ConfidencePolicy, PolicyEvaluation } from "./confidence-policy";
import { canonicalValue } from "./canonical-value";
import { detectDateFormat, formatDate, stripDateFormatHint } from "./date-format";

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
  public match(fields: FormField[], docs: DocumentRecord[]): FilledField[] {
    const detailed = this.matchDetailed(fields, docs);
    return detailed.map((d) => ({
      field: d.field,
      value: d.value,
      confidence: d.confidence,
      status: d.status,
      matchedKey: d.matchedKey,
      sourceDocumentId: d.sourceDocumentId,
      matchReason: d.matchReason,
    }));
  }

  public matchDetailed(fields: FormField[], docs: DocumentRecord[]): MatchedFieldDetail[] {
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
          confidence: 0,
          status: "SKIPPED",
          matchReason: evaluation.reason,
        };
      }

      const stripped = stripDateFormatHint(field.label);
      const resolution = resolveFieldKey(stripped) ?? resolveFieldKeyFuzzy(stripped);

      if (resolution) {
        const confirmedCandidates = confirmedFieldsByKey.get(resolution.key) ?? [];
        const usableCandidates = confirmedCandidates.filter((candidate) => candidate.field.value.trim().length > 0);
        const distinctValues = new Set(usableCandidates.map((candidate) => canonicalValue(resolution.key, candidate.field.value)));

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
            value: this.presentValue(field, resolution.key, confirmedField.field.value),
            confidence: evaluation.confidence,
            status: evaluation.status,
            matchedKey: resolution.key,
            matchReason: evaluation.reason,
            sourceDocumentId: confirmedField.documentId,
          };
        }
      }

      const evaluation = ConfidencePolicy.evaluate(field, false);
      return {
        field,
        value: null,
        confidence: evaluation.confidence,
        status: evaluation.status,
        matchReason: evaluation.reason,
      };
    });
  }

  private presentValue(field: FormField, key: FieldKey, raw: string): string {
    if (key !== "DOB" && field.type !== "DATE") return raw;
    const format = detectDateFormat(field.label) ?? (field.instruction ? detectDateFormat(field.instruction) : null);
    if (!format) return raw;
    return formatDate(raw, format) ?? raw;
  }

  private indexConfirmedFields(docs: DocumentRecord[]): Map<FieldKey, ConfirmedField[]> {
    const map = new Map<FieldKey, ConfirmedField[]>();

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
