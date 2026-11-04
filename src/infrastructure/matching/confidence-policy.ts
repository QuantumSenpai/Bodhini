import { FormField, FillStatus } from "../../domain/form/form.types";
import { isSignatureOrDeclarationLabel } from "./field-synonyms";

export interface PolicyEvaluation {
  status: FillStatus;
  confidence: number;
  reason: string;
}

export class ConfidencePolicy {

  public static evaluate(
    field: FormField,
    hasConfirmedValue: boolean,
    matchType?: "exact" | "synonym" | "partial"
  ): PolicyEvaluation {

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

    if (!hasConfirmedValue) {
      return {
        status: "NEEDS_USER",
        confidence: 0,
        reason: "No confirmed document value found for this field",
      };
    }

    let confidence = 0.7;
    let reason = "Matched via field name overlap";

    if (matchType === "exact") {
      confidence = 0.95;
      reason = "Exact trilingual dictionary match with confirmed document record";
    } else if (matchType === "synonym") {
      confidence = 0.9;
      reason = "Synonym match with confirmed document record";
    } else if (matchType === "partial") {
      confidence = 0.7;
      reason = "Partial label match with confirmed document record";
    }

    return {
      status: "FILLED",
      confidence,
      reason,
    };
  }
}