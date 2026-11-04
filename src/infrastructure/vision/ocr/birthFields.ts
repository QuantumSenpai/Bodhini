import { isValidDate } from "../../validation/formatChecks";
import type { OcrRow } from "./ocr.types";

const NAME_LABEL_RE = /\b(?:NAME OF CHILD|CHILD'?S NAME|NAME)\b/i;
const FATHER_LABEL_RE = /\b(?:FATHER'?S NAME|NAME OF FATHER)\b/i;
const MOTHER_LABEL_RE = /\b(?:MOTHER'?S NAME|NAME OF MOTHER)\b/i;
const DOB_LABEL_RE = /\b(?:DATE OF BIRTH|DOB)\b/i;
const GENDER_LABEL_RE = /\b(?:SEX|GENDER)\b/i;
const PLACE_LABEL_RE = /\bPLACE OF BIRTH\b/i;
const REG_LABEL_RE = /\b(?:REGISTRATION\s*NO|REG\.?\s*NO|CERTIFICATE\s*NO)\b\.?/i;
const DATE_RE = /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/;
const MONTH_DATE_RE = /\b(\d{1,2})\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{4})\b/i;
const HEADER_RE = /\b(?:BIRTH CERTIFICATE|GOVERNMENT|MUNICIPAL|REGISTRAR)\b/i;
const GENDER_RE = /\b(MALE|FEMALE)\b/i;

const MONTH_MAP: Record<string, string> = {
  JANUARY: "01", FEBRUARY: "02", MARCH: "03", APRIL: "04",
  MAY: "05", JUNE: "06", JULY: "07", AUGUST: "08",
  SEPTEMBER: "09", OCTOBER: "10", NOVEMBER: "11", DECEMBER: "12",
};

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

const NAME_STOP_RE = /\b(?:NAME|SEX|GENDER|DATE|BIRTH|DOB|PLACE|FATHER|MOTHER|REGISTRATION|CERTIFICATE|ADDRESS|HOSPITAL|INFORMANT|REGISTRAR)\b/i;
const NAME_ROW_SKIP_RE = /\b(?:HOSPITAL|INFORMANT|REGISTRAR)\b/i;
const DATE_STOP_RE = /\b(?:REGISTRATION|REGISTERED|ISSUE|ISSUED|REG)\b/i;
const PLACE_STOP_RE = /\b(?:NAME|SEX|GENDER|DATE OF|DOB|FATHER|MOTHER|REGISTRATION|CERTIFICATE|ADDRESS)\b/i;
const SEPARATORS_RE = /^[\s:.\-]+/;
const REG_TOKEN_RE = /^[A-Za-z0-9\/\-]{4,25}$/;

function nextValue(rows: OcrRow[], i: number, stop: RegExp): string | null {
  if (i + 1 >= rows.length) return null;
  const next = rows[i + 1].text.trim();
  if (!next || stop.test(next)) return null;
  return next;
}

function findNameAfter(rows: OcrRow[], labelRe: RegExp, skip: (text: string) => boolean): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.script !== "latin" || skip(row.text)) continue;
    const labelMatch = labelRe.exec(row.text);
    if (!labelMatch) continue;
    const cleaned = cleanName(row.text.slice(labelMatch.index + labelMatch[0].length).trim());
    if (cleaned) return cleaned;
    const next = nextValue(rows, i, NAME_STOP_RE);
    const nextCleaned = next ? cleanName(next) : null;
    if (nextCleaned) return nextCleaned;
  }
  return null;
}

function toDate(text: string): string | null {
  const dateMatch = DATE_RE.exec(text);
  if (dateMatch) {
    const value = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
    if (isValidDate(value)) return value;
  }
  const monthMatch = MONTH_DATE_RE.exec(text);
  if (monthMatch) {
    const value = `${monthMatch[1].padStart(2, "0")}/${MONTH_MAP[monthMatch[2].toUpperCase()]}/${monthMatch[3]}`;
    if (isValidDate(value)) return value;
  }
  return null;
}

export function findBirthName(rows: OcrRow[]): string | null {
  return findNameAfter(
    rows,
    NAME_LABEL_RE,
    (text) => FATHER_LABEL_RE.test(text) || MOTHER_LABEL_RE.test(text) || HEADER_RE.test(text) || NAME_ROW_SKIP_RE.test(text),
  );
}

export function findBirthFather(rows: OcrRow[]): string | null {
  return findNameAfter(rows, FATHER_LABEL_RE, () => false);
}

export function findBirthMother(rows: OcrRow[]): string | null {
  return findNameAfter(rows, MOTHER_LABEL_RE, () => false);
}

export function findBirthDob(rows: OcrRow[]): { value: string; confidence: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = DOB_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const same = toDate(text.slice(labelMatch.index + labelMatch[0].length)) ?? toDate(text);
    if (same) return { value: same, confidence: DATE_RE.test(text) ? 0.85 : 0.8 };
    const next = nextValue(rows, i, DATE_STOP_RE);
    const nextDate = next ? toDate(next) : null;
    if (nextDate) return { value: nextDate, confidence: DATE_RE.test(next ?? "") ? 0.85 : 0.8 };
  }
  return null;
}

export function findBirthGender(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = GENDER_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const sameMatch = GENDER_RE.exec(text.slice(labelMatch.index + labelMatch[0].length));
    if (sameMatch) return sameMatch[1].toUpperCase();
    const next = nextValue(rows, i, NAME_STOP_RE);
    const nextMatch = next ? GENDER_RE.exec(next) : null;
    if (nextMatch) return nextMatch[1].toUpperCase();
  }
  return null;
}

export function findBirthPlace(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = PLACE_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const same = text.slice(labelMatch.index + labelMatch[0].length).replace(SEPARATORS_RE, "").trim();
    if (same && !PLACE_STOP_RE.test(same)) return same;
    const next = nextValue(rows, i, PLACE_STOP_RE);
    if (next) return next;
  }
  return null;
}

export function findBirthRegistration(rows: OcrRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = REG_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const same = text.slice(labelMatch.index + labelMatch[0].length).replace(SEPARATORS_RE, "").trim();
    if (REG_TOKEN_RE.test(same) && /\d/.test(same)) return same;
    const next = nextValue(rows, i, NAME_STOP_RE);
    const nextToken = next ? next.replace(SEPARATORS_RE, "").trim() : "";
    if (REG_TOKEN_RE.test(nextToken) && /\d/.test(nextToken)) return nextToken;
  }
  return null;
}
