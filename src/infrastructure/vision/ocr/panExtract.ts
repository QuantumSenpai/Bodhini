import { isValidPan } from "../../validation/formatChecks";
import { isValidDate } from "../../validation/formatChecks";
import type { FieldKey, ExtractedField } from "../../../domain/document/document.types";
import { buildLines, detectScript, type OcrBlock, type OcrRow } from "./lineBuilder";
import { repairPan } from "./panRepair";

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
  EPIC_NO: "EPIC Number",
  DL_NO: "Driving Licence Number",
  BLOOD_GROUP: "Blood Group",
  VALIDITY: "Validity",
  PLACE_OF_BIRTH: "Place of Birth",
  REGISTRATION_NO: "Registration Number",
  RATION_NO: "Ration Card Number",
  CATEGORY: "Category",
  PHONE: "Phone Number",
  EMAIL: "Email Address",
  OTHER: "Other",
};

const PAN_RE = /\b([A-Z]{5})(\d{4})([A-Z])\b/;
const PAN_CANDIDATE_RE = /\b([A-Z0-9]{10})\b/;
const HEADER_RE = /\b(?:INCOME TAX DEPARTMENT|GOVT OF INDIA|GOVERNMENT OF INDIA|PERMANENT ACCOUNT NUMBER|पैन कार्ड|आयकर विभाग|প্যান কার্ড|আয়কার বিভাগ)\b/i;
const NAME_LABEL_RE = /\b(?:NAME|NAME OF|NAME\s*:\s*)\b|नाम|নাম/i;
const FATHER_LABEL_RE = /\b(?:FATHER'?S?\s*NAME|FATHER|पिता का नाम|পিতার নাম)\b/i;
const DOB_LABEL_RE = /\b(?:DOB|DATE OF BIRTH|DATE\s*:\s*)\b|जन्म\s*तिथि|जन्मतिथि|জন্ম\s*তারিখ|জন্মদিন/i;
const DATE_RE = /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/;

function addField(
  fields: Map<FieldKey, ExtractedField>,
  key: FieldKey,
  value: string,
  confidence: number,
): void {
  const cleaned = value.replace(/^[\s:\-]+|[\s:;]+$/g, "").trim();
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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isHeaderRow(text: string): boolean {
  return HEADER_RE.test(text);
}

function cleanName(text: string): string | null {
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

function findNameAfterLabel(rows: OcrRow[], labelRe: RegExp): string | null {
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

function findDob(rows: OcrRow[]): { value: string; confidence: number } | null {
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
  for (let i = 0; i < rows.length; i++) {
    const dateMatch = DATE_RE.exec(rows[i].text);
    if (dateMatch) {
      const value = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
      if (isValidDate(value)) return { value, confidence: 0.55 };
    }
  }
  return null;
}

function buildRows(text: string, blocks: ReadonlyArray<{ text: string; box: { x: number; y: number; width: number; height: number } } | OcrBlock>): OcrRow[] {
  const ocrBlocks: OcrBlock[] = blocks.map((block) =>
    "lines" in block
      ? block
      : {
          text: block.text,
          box: block.box,
          lines: [
            {
              text: block.text,
              box: block.box,
              elements: [{ text: block.text, box: block.box }],
            },
          ],
        },
  );
  const rows = buildLines(ocrBlocks);
  if (rows.length > 0) return rows;
  return text
    .split("\n")
    .map((line, i) => ({
      text: line.trim(),
      left: 0,
      top: i * 30,
      right: 300,
      bottom: i * 30 + 25,
      script: detectScript(line.trim()),
    }))
    .filter((row) => row.text.length > 0);
}

export function extractPanFields(
  text: string,
  blocks: ReadonlyArray<{ text: string; box: { x: number; y: number; width: number; height: number } } | OcrBlock> = [],
): ExtractedField[] {
  const rows = buildRows(text, blocks);
  const fields = new Map<FieldKey, ExtractedField>();

  for (const row of rows) {
    const textUpper = row.text.toUpperCase();
    let match = PAN_RE.exec(textUpper);
    let token: string | null = null;
    let originalToken: string | null = null;
    if (match) {
      token = match[0];
      originalToken = row.text.slice(match.index, match.index + match[0].length);
    } else {
      const candidateMatch = PAN_CANDIDATE_RE.exec(textUpper);
      if (candidateMatch && candidateMatch[0].length === 10) {
        token = candidateMatch[0];
        originalToken = row.text.slice(candidateMatch.index, candidateMatch.index + candidateMatch[0].length);
      }
    }
    if (token && token.length === 10 && originalToken) {
      const repaired = repairPan(token, originalToken);
      const repairedValid = isValidPan(repaired);
      const originalValid = isValidPan(token);
      if (repairedValid && repaired !== token) {
        addField(fields, "PAN_NO", repaired, 0.8);
        break;
      } else if (originalValid) {
        addField(fields, "PAN_NO", token, 0.95);
        break;
      }
    }
  }

  const name = findNameAfterLabel(rows, NAME_LABEL_RE);
  if (name) addField(fields, "FULL_NAME", name, 0.6);

  const father = findNameAfterLabel(rows, FATHER_LABEL_RE);
  if (father) addField(fields, "FATHER_NAME", father, 0.6);

  const dob = findDob(rows);
  if (dob) addField(fields, "DOB", dob.value, dob.confidence);

  return [...fields.values()];
}