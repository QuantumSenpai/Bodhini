import { isValidDate } from "../../validation/formatChecks";
import type { OcrRow } from "./ocr.types";

const NAME_LABEL_RE = /\bNAME\b/i;
const FATHER_LABEL_RE = /\b(?:S\/D\/W OF|SON\/DAUGHTER\/WIFE OF|FATHER'?S NAME|FATHER)\b/i;
const DOB_LABEL_RE = /\b(?:DOB|DATE OF BIRTH)\b/i;
const ADDRESS_LABEL_RE = /\bADDRESS\b/i;
const BLOOD_LABEL_RE = /\b(?:BLOOD GROUP|BG)\b/i;
const VALIDITY_LABEL_RE = /\b(?:VALID TILL|VALIDITY|NT)\b/i;
const DATE_RE = /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/;
const BLOOD_RE = /\b(?:AB|A|B|O)[+-]/;
const HEADER_RE = /\b(?:DRIVING LICENCE|DRIVING LICENSE|INDIAN UNION)\b/i;

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

export function findDlName(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (FATHER_LABEL_RE.test(row.text)) continue;
    if (row.script === "devanagari" || HEADER_RE.test(row.text)) continue;
    const labelMatch = NAME_LABEL_RE.exec(row.text);
    if (!labelMatch) continue;
    const afterLabel = row.text.slice(labelMatch.index + labelMatch[0].length).trim();
    const cleaned = cleanName(afterLabel);
    if (cleaned) return cleaned;
    if (i + 1 < rows.length) {
      const nextCleaned = cleanName(rows[i + 1].text);
      if (nextCleaned) return nextCleaned;
    }
  }
  return null;
}

export function findDlFather(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.script === "devanagari") continue;
    const labelMatch = FATHER_LABEL_RE.exec(row.text);
    if (!labelMatch) continue;
    const afterLabel = row.text.slice(labelMatch.index + labelMatch[0].length).trim();
    const cleaned = cleanName(afterLabel);
    if (cleaned) return cleaned;
    if (i + 1 < rows.length) {
      const nextCleaned = cleanName(rows[i + 1].text);
      if (nextCleaned) return nextCleaned;
    }
  }
  return null;
}

export function findDlDob(rows: OcrRow[]): { value: string; confidence: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = DOB_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const afterLabel = text.slice(labelMatch.index + labelMatch[0].length).trim();
    const dateMatch = DATE_RE.exec(afterLabel) || DATE_RE.exec(text);
    if (dateMatch) {
      const value = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
      if (isValidDate(value)) return { value, confidence: 0.85 };
    }
    if (i + 1 < rows.length) {
      const nextMatch = DATE_RE.exec(rows[i + 1].text);
      if (nextMatch) {
        const value = `${nextMatch[1]}/${nextMatch[2]}/${nextMatch[3]}`;
        if (isValidDate(value)) return { value, confidence: 0.85 };
      }
    }
  }
  return null;
}

const ADDRESS_STOP_RE = /\b(?:VALID|VALIDITY|BLOOD|BG|DOB|DATE OF|ISSUE|SIGNATURE|S\/D\/W|SON\/DAUGHTER)\b/i;
const PIN_RE = /\b[1-9][0-9]{5}\b/;

export function findDlAddress(rows: OcrRow[]): { value: string; pin: string | null } | null {
  for (let i = 0; i < rows.length; i++) {
    const labelMatch = ADDRESS_LABEL_RE.exec(rows[i].text);
    if (!labelMatch) continue;
    const parts: string[] = [];
    let pin: string | null = null;
    const sameRow = rows[i].text.slice(labelMatch.index + labelMatch[0].length).replace(/^[\s:\-]+/, "").trim();
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

export function findDlBloodGroup(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = BLOOD_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const afterLabel = text.slice(labelMatch.index + labelMatch[0].length).trim();
    const bloodMatch = BLOOD_RE.exec(afterLabel);
    if (bloodMatch) return bloodMatch[0];
    if (i + 1 < rows.length) {
      const nextMatch = BLOOD_RE.exec(rows[i + 1].text);
      if (nextMatch) return nextMatch[0];
    }
  }
  return null;
}

export function findDlValidity(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = VALIDITY_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const afterLabel = text.slice(labelMatch.index + labelMatch[0].length).trim();
    const dateMatch = DATE_RE.exec(afterLabel) || DATE_RE.exec(text);
    if (dateMatch) {
      const value = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
      if (isValidDate(value)) return value;
    }
    if (i + 1 < rows.length) {
      const nextMatch = DATE_RE.exec(rows[i + 1].text);
      if (nextMatch) {
        const value = `${nextMatch[1]}/${nextMatch[2]}/${nextMatch[3]}`;
        if (isValidDate(value)) return value;
      }
    }
  }
  return null;
}
