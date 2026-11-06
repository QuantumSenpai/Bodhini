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

export type AiRejectReason =
  | "invalid_input"
  | "invalid_language"
  | "duplicate_field_id"
  | "too_many_labels"
  | "label_too_long"
  | "too_many_masked_labels"
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

export type AiClientResult =
  | { status: "suggestions"; suggestions: AiSuggestion[] }
  | { status: "no_suggestions"; suggestions: [] }
  | { status: "rejected"; reason: AiRejectReason }
  | { status: "cancelled" }
  | { status: "timeout" }
  | { status: "failure"; reason: "network" | "http" | "response" };
