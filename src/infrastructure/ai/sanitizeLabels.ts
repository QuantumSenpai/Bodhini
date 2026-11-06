import type { AppLanguage } from "../../domain/document/document.types";
import type { AiLabel, SanitizeResult } from "./aiTypes";

export const MAX_LABELS = 40;
export const MAX_LABEL_CHARS = 120;
export const MAX_REQUEST_BYTES = 16384;

const MASK = "[REDACTED]";
const DIGIT = "0-9\u0966-\u096F\u09E6-\u09EF";
const DATE = new RegExp(`(?:[${DIGIT}]{4}[./-][${DIGIT}]{1,2}[./-][${DIGIT}]{1,2}|[${DIGIT}]{1,2}[./-][${DIGIT}]{1,2}[./-][${DIGIT}]{2,4})`, "g");
const LONG_DIGITS = new RegExp(`[${DIGIT}]{5,}`, "g");
const PAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi;
const MONTH_DATE = /\b(?:\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{2,4}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{2,4})\b/gi;

export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.codePointAt(i)!;
    if (code <= 0x7f) bytes++;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else { bytes += 4; i++; }
  }
  return bytes;
}

export function sanitizeLabels(input: readonly AiLabel[], language: AppLanguage): SanitizeResult {
  if (!Array.isArray(input)) return { ok: false, reason: "invalid_input" };
  if (language !== "en" && language !== "hi" && language !== "bn") {
    return { ok: false, reason: "invalid_language" };
  }
  if (input.length > MAX_LABELS) return { ok: false, reason: "too_many_labels" };

  const labels: { id: string; label: string }[] = [];
  const sources: Record<string, AiLabel> = Object.create(null);
  const seenIds = new Set<string>();
  let maskedCount = 0;

  for (const [index, item] of input.entries()) {
    if (!item || typeof item.fieldId !== "string" || !item.fieldId.trim() ||
      item.fieldId.length > 64 || typeof item.label !== "string") {
      return { ok: false, reason: "invalid_input" };
    }
    if (seenIds.has(item.fieldId)) return { ok: false, reason: "duplicate_field_id" };
    seenIds.add(item.fieldId);

    const normalized = item.label.replace(/\s+/gu, " ").trim();
    if (Array.from(normalized).length > MAX_LABEL_CHARS) {
      return { ok: false, reason: "label_too_long" };
    }
    if (!normalized || normalized.includes("@")) continue;

    const masked = normalized.replace(PAN, MASK).replace(DATE, MASK)
      .replace(MONTH_DATE, MASK).replace(LONG_DIGITS, MASK);
    if (masked !== normalized) maskedCount++;
    if (maskedCount >= 3) return { ok: false, reason: "too_many_masked_labels" };
    if (!/[\p{L}]/u.test(masked.replace(/\[REDACTED\]/g, ""))) continue;

    const id = `f${index}`;
    labels.push({ id, label: masked });
    sources[id] = { fieldId: item.fieldId, label: item.label };
  }

  const request = { language, labels };
  const body = JSON.stringify(request);
  if (utf8ByteLength(body) > MAX_REQUEST_BYTES) {
    return { ok: false, reason: "request_too_large" };
  }
  return { ok: true, request, body, sources };
}
