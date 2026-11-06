import type { FilledField } from "../../domain/form/form.types";
import { FIELD_SYNONYMS, isSignatureOrDeclarationLabel } from "../matching/field-synonyms";
import { isValidAiScope } from "./aiTypes";
import type { AiRequestScope, AiSuggestionBatch } from "./aiTypes";

const VALID_KEYS = new Set(Object.keys(FIELD_SYNONYMS).filter((key) => key !== "OTHER"));

function isEligible(field: FilledField, expectedLabel: string): boolean {
  return field.field.label === expectedLabel &&
    field.status === "NEEDS_USER" && field.matchReasonCode === "unknownField" &&
    !field.value?.trim() && !field.matchedKey &&
    (!field.field.key || field.field.key === "OTHER") &&
    field.field.type !== "SIGNATURE" && field.field.type !== "DECLARATION" &&
    !isSignatureOrDeclarationLabel(field.field.label) &&
    !Boolean(field.field.instruction && isSignatureOrDeclarationLabel(field.field.instruction));
}

export function mergeAiSuggestions(
  fields: readonly FilledField[], batch: AiSuggestionBatch, currentScope: AiRequestScope,
): FilledField[] {
  if (!batch || !isValidAiScope(batch.scope) || !isValidAiScope(currentScope) ||
    batch.scope.formSessionId !== currentScope.formSessionId ||
    batch.scope.revision !== currentScope.revision ||
    batch.scope.attemptId !== currentScope.attemptId) return [...fields];
  const suggestions = batch.suggestions;
  const fieldCounts = new Map<string, number>();
  for (const field of fields) {
    fieldCounts.set(field.field.id, (fieldCounts.get(field.field.id) ?? 0) + 1);
  }
  const suggestionCounts = new Map<string, number>();
  for (const suggestion of suggestions) {
    suggestionCounts.set(suggestion.fieldId, (suggestionCounts.get(suggestion.fieldId) ?? 0) + 1);
  }
  const byId = new Map(suggestions.map((suggestion) => [suggestion.fieldId, suggestion]));

  return fields.map((field) => {
    const suggestion = byId.get(field.field.id);
    if (!suggestion || suggestion.source !== "AI" ||
      fieldCounts.get(field.field.id) !== 1 || suggestionCounts.get(field.field.id) !== 1 ||
      !isEligible(field, suggestion.sourceLabel)) return field;

    if (suggestion.action === "map" && suggestion.requiresConfirmation === true &&
      VALID_KEYS.has(suggestion.key)) {
      return {
        ...field,
        matchedKey: suggestion.key,
        value: null,
        status: "NEEDS_USER",
        confidence: 0,
        matchReason: "AI suggested a field key; add or confirm an answer before copying.",
        matchReasonCode: "aiSuggestion",
      };
    }
    if (suggestion.action === "manual" && suggestion.requiresConfirmation === false &&
      (suggestion.type === "SIGNATURE" || suggestion.type === "DECLARATION")) {
      return {
        ...field,
        field: { ...field.field, type: suggestion.type },
        value: null,
        status: "SKIPPED",
        confidence: 0,
        matchReason: "Signature and declaration fields must be completed manually",
        matchReasonCode: "skipped",
      };
    }
    return field;
  });
}
