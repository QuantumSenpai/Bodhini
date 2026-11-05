import { CONFIDENCE_THRESHOLD } from "../domain/constants";
import type { AppLanguage } from "../domain/document/document.types";
import type { FilledField } from "../domain/form/form.types";
import { t } from "../i18n/translations";

export function reviewFieldExplanation(field: FilledField, language: AppLanguage): string | null {
  if (field.status === "SKIPPED") return t(language, "manualComplete");

  switch (field.matchReasonCode) {
    case "exact":
      return field.status === "FILLED" ? t(language, "matchExact") : null;
    case "synonym":
      return field.status === "FILLED" ? t(language, "matchSynonym") : null;
    case "fuzzy":
      return field.status === "FILLED"
        ? t(language, field.confidence < CONFIDENCE_THRESHOLD ? "matchFuzzy" : "matchFuzzyConfirmed")
        : null;
    case "conflict":
      return field.status === "NEEDS_USER" ? t(language, "matchConflict") : null;
    case "missingValue":
      return field.status === "NEEDS_USER" ? t(language, "matchMissingValue") : null;
    case "unknownField":
      return field.status === "NEEDS_USER" ? t(language, "matchUnknownField") : null;
    case "manual":
      return field.status === "FILLED" && field.value?.trim()
        ? t(language, "matchManual")
        : t(language, "enterAnswer");
    default:
      return null;
  }
}

export function editReviewField(field: FilledField, value: string): FilledField {
  if (field.status === "SKIPPED") return field;
  const hasValue = Boolean(value.trim());
  return {
    ...field,
    value,
    status: hasValue ? "FILLED" : "NEEDS_USER",
    confidence: hasValue ? 1 : 0,
    sourceDocumentId: undefined,
    matchReason: hasValue
      ? "Answer entered manually during review"
      : "Answer needs to be entered manually during review",
    matchReasonCode: "manual",
  };
}

export function confirmReviewField(field: FilledField): FilledField {
  return field.status === "FILLED" ? { ...field, confidence: 1 } : field;
}
