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

export class FieldMatcher implements IFieldMatcher {
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

      const resolution = resolveFieldKey(field.label);

      if (resolution) {
        const confirmedField = confirmedFieldsByKey.get(resolution.key);

        if (confirmedField && confirmedField.value && confirmedField.value.trim().length > 0) {
          const evaluation = ConfidencePolicy.evaluate(field, true, resolution.matchType);
          return {
            field,
            value: confirmedField.value,
            confidence: evaluation.confidence,
            status: evaluation.status,
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
        confidence: evaluation.confidence,
        status: evaluation.status,
        matchReason: evaluation.reason,
      };
    });
  }

  private indexConfirmedFields(docs: DocumentRecord[]): Map<FieldKey, ExtractedField> {
    const map = new Map<FieldKey, ExtractedField>();

    const sortedDocs = [...docs].sort((a, b) => {
      const timeA = a.confirmedAt || a.createdAt;
      const timeB = b.confirmedAt || b.createdAt;
      return timeB - timeA;
    });

    for (const doc of sortedDocs) {
      for (const field of doc.fields) {
        if (!map.has(field.key) && field.value && field.value.trim().length > 0) {
          map.set(field.key, field);
        }
      }
    }

    return map;
  }
}