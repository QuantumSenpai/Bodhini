import { isValidAadhaar, maskAadhaar } from "../../validation/verhoeff";
import { isValidDate, isValidPin } from "../../validation/formatChecks";
import type { FieldKey, ExtractedField } from "../../../domain/document/document.types";

const LABELS: Record<FieldKey, string> = {
  FULL_NAME: "Full Name",
  FATHER_NAME: "Father's Name",
  MOTHER_NAME: "Mother's Name",
  DOB: "Date of Birth",
  GENDER: "Gender",
  ADDRESS: "Address",
  PIN_CODE: "PIN Code",
  AADHAAR_NO: "Aadhaar Number",
  PAN_NO: "PAN Number",
  PHONE: "Phone Number",
  EMAIL: "Email Address",
  OTHER: "Other",
};

function addField(
  fields: Map<FieldKey, ExtractedField>,
  key: FieldKey,
  value: string,
  confidence: number,
): void {
  const cleaned = value.replace(/^[\s:–—-]+|[\s:;]+$/g, "").trim();
  if (!cleaned || fields.has(key)) return;
  fields.set(key, {
    id: `ocr-${key.toLowerCase()}-${fields.size + 1}`,
    key,
    label: LABELS[key],
    value: cleaned,
    confidence: Math.max(0, Math.min(1, confidence)),
    source: "OCR",
  });
}

const REJECT_WORDS = new Set([
  "government", "india", "aadhaar", "aadhar", "unique", "identification",
  "authority", "uidai", "male", "female", "dob", "birth", "year",
  "address", "enrolment", "vid", "help", "www", "gov", "mera", "meri",
]);

function cleanLatin(text: string): string {
  let t = text.replace(/[^A-Za-z\s.]/g, " ");
  t = t.replace(/\b(DOB|Date of Birth|YOB|Year of Birth|MALE|FEMALE|TRANSGENDER|Gender)\b/gi, " ");
  return t.replace(/\s+/g, " ").trim();
}

function hasVowel(word: string): boolean {
  return /[aeiou]/i.test(word);
}

function isGarbage(line: string): boolean {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  for (const w of words) {
    if (w.length < 2 || !hasVowel(w)) return true;
  }
  return false;
}

function scoreNameCandidate(line: string): number {
  const cleaned = cleanLatin(line);
  if (isGarbage(cleaned)) return -1;
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wc = words.length;
  if (wc < 2 || wc > 4) return -1;
  for (const w of words) {
    if (w.length < 2) return -1;
    if (REJECT_WORDS.has(w.toLowerCase())) return -1;
  }
  const letterRatio = words.join("").length / cleaned.replace(/\s/g, "").length;
  if (letterRatio < 0.8) return -1;
  return wc * 10 + Math.floor(letterRatio * 10);
}

function findDobLineIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (/\b(?:DOB|Date of Birth|Year of Birth|YOB)\b/i.test(lines[i]) ||
        /\b\d{2}[\/\-.]\d{2}[\/\-.]\d{4}\b/.test(lines[i])) {
      return i;
    }
  }
  return -1;
}

function findBestNameAboveDob(lines: string[]): string | null {
  const dobIdx = findDobLineIndex(lines);
  if (dobIdx === -1) return null;
  const start = Math.max(0, dobIdx - 4);
  let best: { line: string; score: number } | null = null;
  for (let i = start; i < dobIdx; i++) {
    const score = scoreNameCandidate(lines[i]);
    if (score > 0 && (!best || score > best.score)) {
      best = { line: cleanLatin(lines[i]), score };
    }
  }
  return best?.line ?? null;
}

function findNameAfterTo(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    if (/^To,?\s*$/i.test(lines[i].trim())) {
      for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
        const score = scoreNameCandidate(lines[j]);
        if (score > 0) return cleanLatin(lines[j]);
      }
    }
  }
  return null;
}

function findBestNameAnywhere(lines: string[]): string | null {
  let best: { line: string; score: number } | null = null;
  for (const line of lines) {
    const score = scoreNameCandidate(line);
    if (score > 0 && (!best || score > best.score)) {
      best = { line: cleanLatin(line), score };
    }
  }
  return best?.line ?? null;
}

function findName(lines: string[]): string | null {
  return findBestNameAboveDob(lines) ?? findNameAfterTo(lines) ?? findBestNameAnywhere(lines);
}

function findGender(text: string): string | null {
  const match = text.match(/\b(MALE|FEMALE|TRANSGENDER)\b/i);
  return match ? match[0].toUpperCase() : null;
}

function findDob(text: string): string | null {
  const dobPatterns = [
    /\b(?:DOB|Date of Birth)[\s:：]+(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/i,
    /\b(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\b/,
  ];
  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1] || match[0];
      if (isValidDate(candidate)) return candidate;
    }
  }
  const yobMatch = text.match(/\b(?:Year of Birth|YOB)[\s:：]+(\d{4})\b/i);
  if (yobMatch) return `01/01/${yobMatch[1]}`;
  return null;
}

function findAadhaarNumber(text: string): { value: string; valid: boolean } | null {
  const allCandidates = text.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g) ?? [];
  const vidMatches = text.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g) ?? [];
  const vidDigits = vidMatches.map(v => v.replace(/[\s-]/g, ""));
  const candidates: string[] = [];
  for (const c of allCandidates) {
    const digits = c.replace(/[\s-]/g, "");
    if (digits.length !== 12) continue;
    let isPartOfVid = false;
    for (const vd of vidDigits) {
      if (vd.includes(digits)) {
        isPartOfVid = true;
        break;
      }
    }
    if (!isPartOfVid) candidates.push(digits);
  }
  for (const digits of candidates) {
    if (digits.length === 12) {
      const isValid = isValidAadhaar(digits);
      return { value: digits, valid: isValid };
    }
  }
  return null;
}

function findAddressAndPin(lines: string[]): { address: string; pin: string | null; careOf: string | null } | null {
  let startIndex = -1;
  let careOfPrefix = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const careOfMatch = line.match(/^(S\/O|D\/O|W\/O|C\/O)\s+(.+)$/i);
    if (careOfMatch) {
      startIndex = i;
      careOfPrefix = careOfMatch[0];
      break;
    }
    if (/^Address:?\s*$/i.test(line)) {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) return null;

  const addressLines: string[] = [];
  let pin: string | null = null;
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/mobile|phone|enrol|vid|aadhaar/i.test(line)) break;
    const pinMatch = line.match(/\b([1-9]\d{5})\b/);
    if (pinMatch && isValidPin(pinMatch[1])) {
      pin = pinMatch[1];
      addressLines.push(line);
      break;
    }
    addressLines.push(line);
  }
  if (addressLines.length === 0) return null;
  const address = addressLines.join(", ").replace(careOfPrefix, "").trim().replace(/^,\s*/, "");
  return { address, pin, careOf: careOfPrefix || null };
}

function splitWideSpaces(text: string): string[] {
  return text.split(/\s{3,}/).map(s => s.trim()).filter(Boolean);
}

function preprocessLines(text: string): string[] {
  const raw = text.split(/\r?\n/).map(l => l.replace(/[|•]/g, " ").trim()).filter(Boolean);
  const expanded: string[] = [];
  for (const line of raw) {
    expanded.push(...splitWideSpaces(line));
  }
  return expanded;
}

export function extractAadhaarFields(text: string, blocks: { text: string; box: { x: number; y: number; width: number; height: number } }[]): ExtractedField[] {
  const lines = preprocessLines(text);
  const fields = new Map<FieldKey, ExtractedField>();

  const name = findName(lines);
  if (name) addField(fields, "FULL_NAME", name, 0.6);

  const gender = findGender(text);
  if (gender) addField(fields, "GENDER", gender, 0.82);

  const dob = findDob(text);
  if (dob) {
    const conf = isValidDate(dob) ? 0.85 : 0.4;
    addField(fields, "DOB", dob, conf);
  }

  const aadhaarResult = findAadhaarNumber(text);
  if (aadhaarResult) {
    const conf = aadhaarResult.valid ? 0.95 : 0.4;
    addField(fields, "AADHAAR_NO", aadhaarResult.value, conf);
  }

  const addressResult = findAddressAndPin(lines);
  if (addressResult) {
    addField(fields, "ADDRESS", addressResult.address, 0.6);
    if (addressResult.pin) addField(fields, "PIN_CODE", addressResult.pin, 0.85);
    if (addressResult.careOf) {
      const careOfValue = addressResult.careOf.replace(/^(S\/O|D\/O|W\/O|C\/O)\s+/i, "").trim();
      addField(fields, "FATHER_NAME", careOfValue, 0.5);
    }
  }

  return [...fields.values()];
}