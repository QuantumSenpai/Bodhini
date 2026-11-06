import type { FieldKey } from "../../domain/document/document.types";
import { FIELD_SYNONYMS } from "../matching/field-synonyms";
import type { AiMappedKey, AiSuggestion, SanitizedBatch } from "./aiTypes";
import { utf8ByteLength } from "./sanitizeLabels";

export const MAX_RESPONSE_BYTES = 8192;

type ParseResult =
  | { ok: true; suggestions: AiSuggestion[] }
  | { ok: false; reason: "invalid_response" | "response_too_large" };

const VALID_KEYS = new Set<FieldKey>(Object.keys(FIELD_SYNONYMS) as FieldKey[]);
VALID_KEYS.delete("OTHER");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

export function parseAiResponse(raw: string, batch: SanitizedBatch): ParseResult {
  if (typeof raw !== "string") return { ok: false, reason: "invalid_response" };
  if (raw.length > MAX_RESPONSE_BYTES || utf8ByteLength(raw) > MAX_RESPONSE_BYTES) {
    return { ok: false, reason: "response_too_large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_response" };
  }
  if (!isRecord(parsed) || !hasOnlyKeys(parsed, ["suggestions"]) ||
    !Array.isArray(parsed.suggestions) ||
    parsed.suggestions.length > batch.request.labels.length) {
    return { ok: false, reason: "invalid_response" };
  }

  const seen = new Set<string>();
  const suggestions: AiSuggestion[] = [];
  for (const item of parsed.suggestions) {
    if (!isRecord(item) || typeof item.id !== "string" ||
      !Object.prototype.hasOwnProperty.call(batch.sources, item.id) ||
      seen.has(item.id)) {
      return { ok: false, reason: "invalid_response" };
    }
    seen.add(item.id);
    const source = batch.sources[item.id];
    const base = {
      source: "AI" as const,
      requestId: item.id,
      fieldId: source.fieldId,
      sourceLabel: source.label,
    };

    if (item.action === "map" && hasOnlyKeys(item, ["id", "action", "key"]) &&
      typeof item.key === "string" && VALID_KEYS.has(item.key as FieldKey)) {
      suggestions.push({ ...base, action: "map", key: item.key as AiMappedKey, requiresConfirmation: true });
    } else if (item.action === "manual" && hasOnlyKeys(item, ["id", "action", "type"]) &&
      (item.type === "SIGNATURE" || item.type === "DECLARATION")) {
      suggestions.push({ ...base, action: "manual", type: item.type, requiresConfirmation: false });
    } else {
      return { ok: false, reason: "invalid_response" };
    }
  }

  return { ok: true, suggestions };
}
