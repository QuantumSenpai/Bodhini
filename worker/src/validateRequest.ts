import type { AppLanguage } from "../../src/domain/document/document.types";
import type { SanitizedBatch } from "../../src/infrastructure/ai/aiTypes";
import { MAX_LABELS, MAX_LABEL_CHARS, MAX_REQUEST_BYTES, sanitizeLabels, utf8ByteLength } from "../../src/infrastructure/ai/sanitizeLabels";

const ID = /^f(?:[0-9]|[1-3][0-9])$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keys(value: Record<string, unknown>, expected: string[]): boolean {
  return Object.keys(value).length === expected.length &&
    expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

export function validateProxyRequest(raw: string): SanitizedBatch | null {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!record(parsed) || !keys(parsed, ["language", "labels"]) ||
    (parsed.language !== "en" && parsed.language !== "hi" && parsed.language !== "bn") ||
    !Array.isArray(parsed.labels) || parsed.labels.length > MAX_LABELS) return null;

  const seen = new Set<string>();
  const source: { fieldId: string; label: string }[] = [];
  for (const item of parsed.labels) {
    if (!record(item) || !keys(item, ["id", "label"]) ||
      typeof item.id !== "string" || !ID.test(item.id) || seen.has(item.id) ||
      typeof item.label !== "string" || Array.from(item.label).length > MAX_LABEL_CHARS) return null;
    seen.add(item.id);
    source.push({ fieldId: item.id, label: item.label });
  }

  const sanitized = sanitizeLabels(source, parsed.language as AppLanguage);
  if (!sanitized.ok) return null;
  const labels = sanitized.request.labels.map((item) => ({
    id: sanitized.sources[item.id].fieldId, label: item.label,
  }));
  const sources: SanitizedBatch["sources"] = Object.create(null);
  for (const label of labels) sources[label.id] = { fieldId: label.id, label: label.label };
  const request = { language: parsed.language as AppLanguage, labels };
  const body = JSON.stringify(request);
  if (utf8ByteLength(body) > MAX_REQUEST_BYTES) return null;
  return { ok: true, request, body, sources };
}
