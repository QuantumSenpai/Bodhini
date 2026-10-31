import { FormField, FillStatus } from "../../domain/form/form.types";
import { isSignatureOrDeclarationLabel } from "./field-synonyms";

export interface PolicyEvaluation {
  status: FillStatus;
  confidence: number;
  reason: string;
}

export class ConfidencePolicy {
  /**
   * Evaluates form field constraints to determine whether it should be skipped, filled, or marked for user attention.
   */
  public static evaluate(
    field: FormField,
    hasConfirmedValue: boolean,
    matchType?: "exact" | "synonym" | "partial"
  ): PolicyEvaluation {
    // 1. Mandatory safety invariant: Signatures and declarations are always SKIPPED
    // Checks field.type, field.label, and field.instruction
    if (
      field.type === "SIGNATURE" ||
      field.type === "DECLARATION" ||
      isSignatureOrDeclarationLabel(field.label) ||
      Boolean(field.instruction && isSignatureOrDeclarationLabel(field.instruction))
    ) {
      return {
        status: "SKIPPED",
        confidence: 0,
        reason: "Signature and declaration fields must always be signed or acknowledged manually",
      };
    }

    // 2. If no confirmed document value exists, never fabricate; require user input
    if (!hasConfirmedValue) {
      return {
        status: "NEEDS_USER",
        confidence: 0,
        reason: "No confirmed document value found for this field",
      };
    }

    // 3. Compute confidence based on match quality
    let confidence = 0.7;
    let reason = "Matched via field name overlap";

    if (matchType === "exact") {
      confidence = 0.95;
      reason = "Exact trilingual dictionary match with confirmed document record";
    } else if (matchType === "synonym") {
      confidence = 0.9;
      reason = "Synonym match with confirmed document record";
    } else if (matchType === "partial") {
      confidence = 0.75;
      reason = "Partial label match with confirmed document record";
    }

    return {
      status: "FILLED",
      confidence,
      reason,
    };
  }
}
