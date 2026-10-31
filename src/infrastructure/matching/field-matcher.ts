import { DocumentRecord, ExtractedField, FieldKey } from "../../domain/document/document.types";
import { FormField, FilledField } from "../../domain/form/form.types";
import { FieldMatcher as IFieldMatcher } from "../../domain/form/field-matcher.port";
import { resolveFieldKey, isSignatureOrDeclarationLabel } from "./field-synonyms";
import { ConfidencePolicy } from "./confidence-policy";

export class FieldMatcher implements IFieldMatcher {
  /**
   * Matches incoming form fields against confirmed document records.
   * Enforces that signatures/declarations are skipped across field.type, field.label,
   * and field.instruction (in English, Hindi, and Bengali), and missing values are never fabricated.
   */
  public match(fields: FormField[], docs: DocumentRecord[]): FilledField[] {
    // Build quick lookup of confirmed extracted fields across documents (latest confirmed takes precedence)
    const confirmedFieldsByKey = this.indexConfirmedFields(docs);

    return fields.map((field) => {
      // 1. Mandatory check: Check all three: field.type, field.label, field.instruction
      const isSignatureOrDecl =
        field.type === "SIGNATURE" ||
        field.type === "DECLARATION" ||
        isSignatureOrDeclarationLabel(field.label) ||
        Boolean(field.instruction && isSignatureOrDeclarationLabel(field.instruction));

      if (isSignatureOrDecl) {
        const evaluation = ConfidencePolicy.evaluate(field, false);
        return {
          fieldId: field.id,
          label: field.label,
          value: "",
          status: "SKIPPED",
          confidence: 0,
          matchReason: evaluation.reason,
        };
      }

      // 2. Resolve field label to canonical FieldKey using trilingual synonyms
      const resolution = resolveFieldKey(field.label);

      if (resolution) {
        const confirmedField = confirmedFieldsByKey.get(resolution.key);

        if (confirmedField && confirmedField.value && confirmedField.value.trim().length > 0) {
          const evaluation = ConfidencePolicy.evaluate(field, true, resolution.matchType);
          return {
            fieldId: field.id,
            label: field.label,
            value: confirmedField.value,
            status: evaluation.status,
            confidence: evaluation.confidence,
            matchedKey: resolution.key,
            matchReason: evaluation.reason,
          };
        }
      }

      // 3. Unmatched or missing value in confirmed documents -> NEEDS_USER (never fabricate)
      const evaluation = ConfidencePolicy.evaluate(field, false);
      return {
        fieldId: field.id,
        label: field.label,
        value: "",
        status: evaluation.status,
        confidence: evaluation.confidence,
        matchReason: evaluation.reason,
      };
    });
  }

  /**
   * Indexes the most recent confirmed value for each FieldKey from the provided documents.
   */
  private indexConfirmedFields(docs: DocumentRecord[]): Map<FieldKey, ExtractedField> {
    const map = new Map<FieldKey, ExtractedField>();

    // Sort documents so most recently confirmed documents come first
    const sortedDocs = [...docs].sort((a, b) => {
      const timeA = new Date(a.confirmedAt || a.createdAt).getTime();
      const timeB = new Date(b.confirmedAt || b.createdAt).getTime();
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
