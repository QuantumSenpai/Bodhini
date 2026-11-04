import { isValidDate } from "../../validation/formatChecks";
import type { OcrRow } from "./ocr.types";

const RATION_LABEL_RE = /\b(?:RATION\s+CARD\s+NO|RATION\s+CARD\s+NUMBER|CARD\s+NO|RC\s+NO)\b/i;
const NAME_LABEL_RE = /\b(?:HEAD\s+OF\s+FAMILY|NAME\s+OF\s+HEAD|CARD\s+HOLDER|NAME\s+OF\s+CARD\s+HOLDER|HEAD\s+OF\s+THE\s+FAMILY)\b/i;
const CATEGORY_LABEL_RE = /\b(?:CATEGORY|CARD\s+TYPE)\b/i;
const ADDRESS_LABEL_RE = /\bADDRESS\b/i;
const HEADER_RE = /\b(?:RATION\s+CARD|FOOD\s+SECURITY|NATIONAL\s+FOOD|PDS|FAIR\s+PRICE)\b/i;

const CATEGORY_RE = /\b(AAY|BPL|APL|PHH|NFSA|ANTYODAYA)\b/i;
const DATE_RE = /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/;
const LABEL_STOP_RE = /\b(?:NAME|HEAD|CATEGORY|CARD|DATE|FAMILY|MEMBER|AGE|RELATION|SEX|GENDER|FATHER|MOTHER|DOB|BIRTH|PLACE|REGISTRATION|ISSUE|VALID|EXPIRY|SIGNATURE|FINGER|PRINT|PHOTO|SERIAL|NUMBER|NO\b)\b/i;
const PIN_RE = /\b[1-9][0-9]{5}\b/;
const SEPARATORS_RE = /^[\s:.\-]+/;
const RATION_TOKEN_RE = /^[A-Za-z0-9\/\-]{6,25}$/;
const NON_RATION_ROW_RE = /\b(?:AADHAAR|AADHAR|UID|VID|EPIC|VOTER|PAN|MOBILE|PHONE|ENROL|ENROLMENT)\b/i;
const ADDRESS_STOP_RE = /\b(?:HEAD|CATEGORY|CARD HOLDER|CARD TYPE|NAME OF|FAMILY|MEMBER|RELATION|SEX|GENDER|FATHER|MOTHER|DOB|DATE OF|AGE|REGISTRATION|ISSUE|VALID|EXPIRY|SIGNATURE|FINGER|PHOTO)\b/i;
const CATEGORY_UNLABELED_RE = /\b(AAY|BPL|APL|PHH|ANTYODAYA)\b/;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function cleanName(text: string): string | null {
  const trimmed = text
    .replace(/^[^A-Za-z]+|[^A-Za-z.']+$/g, "")
    .replace(/\s+/g, " ");
  if (!/^[A-Za-z.' ]+$/.test(trimmed)) return null;
  const words = trimmed.split(" ");
  if (words.length < 2 || words.length > 4) return null;
  for (const word of words) {
    if (!/^[A-Za-z.']+$/.test(word) || word.length < 2 || !/[aeiou]/i.test(word)) return null;
  }
  return trimmed;
}

function nextValue(rows: OcrRow[], i: number, stop: RegExp): string | null {
  if (i + 1 >= rows.length) return null;
  const next = rows[i + 1].text.trim();
  if (!next || stop.test(next)) return null;
  return next;
}

function findNameAfter(rows: OcrRow[], labelRe: RegExp): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.script !== "latin" || HEADER_RE.test(row.text)) continue;
    const labelMatch = labelRe.exec(row.text);
    if (!labelMatch) continue;
    const afterLabel = row.text.slice(labelMatch.index + labelMatch[0].length).replace(SEPARATORS_RE, "").trim();
    const cleaned = cleanName(afterLabel);
    if (cleaned) return cleaned;
    const next = nextValue(rows, i, LABEL_STOP_RE);
    const nextCleaned = next ? cleanName(next) : null;
    if (nextCleaned) return nextCleaned;
  }
  return null;
}

export function findRationNo(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (NON_RATION_ROW_RE.test(row.text)) continue;
    const labelMatch = RATION_LABEL_RE.exec(row.text);
    if (!labelMatch) continue;
    const same = row.text.slice(labelMatch.index + labelMatch[0].length).replace(SEPARATORS_RE, "").trim();
    if (RATION_TOKEN_RE.test(same) && /\d/.test(same)) return same;
    const next = nextValue(rows, i, LABEL_STOP_RE);
    const nextToken = next ? next.replace(SEPARATORS_RE, "").trim() : "";
    if (RATION_TOKEN_RE.test(nextToken) && /\d/.test(nextToken)) return nextToken;
  }
  return null;
}

export function findRationName(rows: OcrRow[]): string | null {
  return findNameAfter(rows, NAME_LABEL_RE);
}

function normalizeCategory(raw: string): string {
  return raw === "ANTYODAYA" ? "AAY" : raw;
}

export function findRationCategory(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const labelMatch = CATEGORY_LABEL_RE.exec(rows[i].text);
    if (!labelMatch) continue;
    const same = rows[i].text.slice(labelMatch.index + labelMatch[0].length).replace(SEPARATORS_RE, "").trim().toUpperCase();
    const sameMatch = CATEGORY_RE.exec(same);
    if (sameMatch) return normalizeCategory(sameMatch[1]);
    const next = nextValue(rows, i, LABEL_STOP_RE);
    const nextMatch = next ? CATEGORY_RE.exec(next.toUpperCase()) : null;
    if (nextMatch) return normalizeCategory(nextMatch[1]);
  }
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const match = CATEGORY_UNLABELED_RE.exec(rows[i].text.toUpperCase());
    if (match) return normalizeCategory(match[1]);
  }
  return null;
}

export function findRationAddress(rows: OcrRow[]): { value: string; pin: string | null } | null {
  for (let i = 0; i < rows.length; i++) {
    const labelMatch = ADDRESS_LABEL_RE.exec(rows[i].text);
    if (!labelMatch) continue;
    const parts: string[] = [];
    let pin: string | null = null;
    const sameRow = rows[i].text.slice(labelMatch.index + labelMatch[0].length).replace(SEPARATORS_RE, "").trim();
    if (sameRow) {
      parts.push(sameRow);
      const sameRowPin = PIN_RE.exec(sameRow);
      if (sameRowPin) return { value: sameRow, pin: sameRowPin[0] };
    }
    for (let j = i + 1; j < Math.min(rows.length, i + 6); j++) {
      const rowText = rows[j].text.trim();
      if (!rowText) continue;
      if (ADDRESS_STOP_RE.test(rowText)) break;
      parts.push(rowText);
      const pinMatch = PIN_RE.exec(rowText);
      if (pinMatch) {
        pin = pinMatch[0];
        break;
      }
      if (parts.length >= 5) break;
    }
    if (parts.length > 0) return { value: parts.join(", "), pin };
  }
  return null;
}