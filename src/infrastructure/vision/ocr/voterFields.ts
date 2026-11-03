import type { OcrRow } from "./ocr.types";

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

export function findNameAfterLabel(rows: OcrRow[], labelRe: RegExp): string | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = labelRe.exec(text);
    if (!labelMatch) continue;
    const afterLabel = text.slice(labelMatch.index + labelMatch[0].length).trim();
    const cleaned = cleanName(afterLabel);
    if (cleaned) return cleaned;
    if (i + 1 < rows.length) {
      const nextCleaned = cleanName(rows[i + 1].text);
      if (nextCleaned) return nextCleaned;
    }
  }
  return null;
}

const GENDER_LABEL_RE = /\b(?:SEX|GENDER|लिंग|লিঙ্গ)\b/i;
const GENDER_RE = /\b(MALE|FEMALE)\b/i;

export function findGender(rows: OcrRow[]): { value: string; confidence: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text;
    const labelMatch = GENDER_LABEL_RE.exec(text);
    if (!labelMatch) continue;
    const afterLabel = text.slice(labelMatch.index + labelMatch[0].length).trim();
    const genderMatch = GENDER_RE.exec(afterLabel);
    if (genderMatch) return { value: genderMatch[1].toUpperCase(), confidence: 0.8 };
    if (i + 1 < rows.length) {
      const nextMatch = GENDER_RE.exec(rows[i + 1].text);
      if (nextMatch) return { value: nextMatch[1].toUpperCase(), confidence: 0.8 };
    }
  }
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text.trim();
    if (wordCount(text) <= 2 && /^(MALE|FEMALE)$/i.test(text)) {
      return { value: text.toUpperCase(), confidence: 0.8 };
    }
  }
  return null;
}

const DOB_LABEL_RE = /\b(?:DATE OF BIRTH|DOB|जन्म\s*तिथि|জন্ম\s*তারিখ|জন্মদিন)\b/i;
const DATE_RE = /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/;

export function findDob(rows: OcrRow[]): { value: string; confidence: number } | null {
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

function isValidDate(v: string): boolean {
  const m = v.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
  if (!m) return false;
  const d = Number(m[1]), m2 = Number(m[2]), y = Number(m[3]);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  if (m2 < 1 || m2 > 12) return false;
  const daysInMonth = new Date(y, m2, 0).getDate();
  return d >= 1 && d <= daysInMonth;
}
