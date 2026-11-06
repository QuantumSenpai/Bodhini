import type { AppLanguage, FieldKey } from "../../domain/document/document.types";

export type AiMappedKey = Exclude<FieldKey, "OTHER">;
export type AiManualType = "SIGNATURE" | "DECLARATION";

export interface AiLabel {
  fieldId: string;
  label: string;
}

export interface AiWireRequest {
  language: AppLanguage;
  labels: { id: string; label: string }[];
}

export interface AiRequestScope {
  readonly formSessionId: string;
  readonly revision: number;
  readonly attemptId: string;
}

export function isValidAiScope(value: unknown): value is AiRequestScope {
  if (!value || typeof value !== "object") return false;
  const scope = value as Record<string, unknown>;
  return typeof scope.formSessionId === "string" && scope.formSessionId.trim().length > 0 &&
    scope.formSessionId.length <= 64 && typeof scope.revision === "number" &&
    Number.isSafeInteger(scope.revision) && scope.revision >= 0 && typeof scope.attemptId === "string" &&
    scope.attemptId.trim().length > 0 && scope.attemptId.length <= 64;
}

export type AiRejectReason =
  | "invalid_input"
  | "invalid_language"
  | "duplicate_field_id"
  | "too_many_labels"
  | "label_too_long"
  | "too_many_masked_labels"
  | "invalid_scope"
  | "request_too_large";

export type SanitizedBatch = {
  ok: true;
  request: AiWireRequest;
  body: string;
  sources: Record<string, AiLabel>;
};

export type SanitizeResult = SanitizedBatch | { ok: false; reason: AiRejectReason };

type AiSuggestionBase = {
  source: "AI";
  requestId: string;
  fieldId: string;
  sourceLabel: string;
};

export type AiSuggestion =
  | (AiSuggestionBase & {
      action: "map";
      key: AiMappedKey;
      requiresConfirmation: true;
    })
  | (AiSuggestionBase & {
      action: "manual";
      type: AiManualType;
      requiresConfirmation: false;
    });

export interface AiSuggestionBatch {
  readonly scope: AiRequestScope;
  readonly suggestions: readonly AiSuggestion[];
}

export type AiClientResult =
  | ({ status: "suggestions" } & AiSuggestionBatch)
  | { status: "no_suggestions"; suggestions: [] }
  | { status: "rejected"; reason: AiRejectReason }
  | { status: "cancelled" }
  | { status: "timeout" }
  | { status: "failure"; reason: "network" | "http" | "response" };
