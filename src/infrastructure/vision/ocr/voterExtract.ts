import { isValidDate } from "../../validation/formatChecks";
import type { FieldKey, ExtractedField } from "../../../domain/document/document.types";
import { buildLines, detectScript, type OcrBlock, type OcrRow } from "./lineBuilder";
import { repairEpic } from "./voterRepair";
import { wordCount, cleanName, findNameAfterLabel, findGender, findDob } from "./voterFields";

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
  PHONE: "Phone Number",
  EMAIL: "Email Address",
  OTHER: "Other",
};

const EPIC_RE = /\b([A-Z]{3})(\d{7})\b/;
const EPIC_CANDIDATE_RE = /\b([A-Za-z0-9]{10})\b/;
const HEADER_RE = /\b(?:ELECTION COMMISSION OF INDIA|ELECTOR PHOTO IDENTITY CARD|निर्वाचन आयोग|निर्वाचक फोटो पहचान पत्र|निर्वाचन कमिशन|निर्वाचक फोटो पहचान पत्र)\b/i;
const NAME_LABEL_RE = /\b(?:ELECTOR'?S?\s*NAME|NAME|नाम|নাম)\b/i;
const FATHER_LABEL_RE = /\b(?:FATHER'?S?\s*NAME|HUSBAND'?S?\s*NAME|FATHER|HUSBAND|पिता का नाम|পিতার নাম)\b/i;

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

export { buildRows, EPIC_RE, EPIC_CANDIDATE_RE, repairEpic };
export function extractVoterFields(
  text: string,
  blocks: ReadonlyArray<{ text: string; box: { x: number; y: number; width: number; height: number } } | OcrBlock> = [],
): ExtractedField[] {
  const rows = buildRows(text, blocks);
  const fields = new Map<FieldKey, ExtractedField>();

  for (const row of rows) {
    const textUpper = row.text.toUpperCase();
    let match = EPIC_RE.exec(textUpper);
    let token: string | null = null;
    let originalToken: string | null = null;
    if (match) {
      token = match[0];
      originalToken = row.text.slice(match.index, match.index + match[0].length);
    } else {
      const candidateMatch = EPIC_CANDIDATE_RE.exec(textUpper);
      if (candidateMatch && candidateMatch[0].length === 10) {
        token = candidateMatch[0];
        originalToken = row.text.slice(candidateMatch.index, candidateMatch.index + candidateMatch[0].length);
      }
    }
    if (token && token.length === 10 && originalToken) {
      const repaired = repairEpic(token, originalToken);
      const repairedValid = repaired.match(/^[A-Z]{3}\d{7}$/);
      const originalValid = token.match(/^[A-Z]{3}\d{7}$/);
      if (repairedValid && repaired !== token) {
        addField(fields, "EPIC_NO", repaired, 0.8);
        break;
      } else if (originalValid) {
        addField(fields, "EPIC_NO", token, 0.95);
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

  const gender = findGender(rows);
  if (gender) addField(fields, "GENDER", gender.value, gender.confidence);

  return [...fields.values()];
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
