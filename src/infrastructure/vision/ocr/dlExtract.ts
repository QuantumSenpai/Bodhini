import type { FieldKey, ExtractedField } from "../../../domain/document/document.types";
import { buildLines, detectScript, type OcrBlock, type OcrRow } from "./lineBuilder";
import { findDlAddress, findDlBloodGroup, findDlDob, findDlFather, findDlName, findDlValidity } from "./dlFields";

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
  PHONE: "Phone Number",
  EMAIL: "Email Address",
  OTHER: "Other",
};

const DL_RE = /\b([A-Z]{2})[ -]?([0-9]{2})[ -]?(19|20)[0-9]{2}[0-9]{7}\b/;
const DL_CANDIDATE_RE = /\b[A-Z0-9]{15}\b/;

function repairDlToken(token: string): string {
  const chars = token.split("");
  for (let i = 0; i < chars.length; i++) {
    if (i < 2) {
      if (chars[i] === "0") chars[i] = "O";
      else if (chars[i] === "1") chars[i] = "I";
    } else {
      if (chars[i] === "O" || chars[i] === "o") chars[i] = "0";
      else if (chars[i] === "I" || chars[i] === "l" || chars[i] === "L" || chars[i] === "|") chars[i] = "1";
    }
  }
  return chars.join("").replace(/[ -]/g, "");
}

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

export { buildRows, DL_RE, DL_CANDIDATE_RE };

export function extractDlFields(
  text: string,
  blocks: ReadonlyArray<{ text: string; box: { x: number; y: number; width: number; height: number } } | OcrBlock> = [],
): ExtractedField[] {
  const rows = buildRows(text, blocks);
  const fields = new Map<FieldKey, ExtractedField>();

  for (const row of rows) {
    const textUpper = row.text.toUpperCase();
    const strictMatch = DL_RE.exec(textUpper);
    const candidateMatch = DL_CANDIDATE_RE.exec(textUpper);
    const token = strictMatch ? strictMatch[0] : candidateMatch ? candidateMatch[0] : "";
    if (!token) continue;
    const stripped = token.replace(/[ -]/g, "");
    const repaired = repairDlToken(token);
    const repairedValid = /^[A-Z]{2}[0-9]{13}$/.test(repaired);
    const originalValid = /^[A-Z]{2}[0-9]{13}$/.test(stripped);
    if (repairedValid && repaired !== stripped) {
      addField(fields, "DL_NO", repaired, 0.8);
      break;
    }
    if (originalValid) {
      addField(fields, "DL_NO", stripped, 0.95);
      break;
    }
  }

  const name = findDlName(rows);
  if (name) addField(fields, "FULL_NAME", name, 0.6);

  const father = findDlFather(rows);
  if (father) addField(fields, "FATHER_NAME", father, 0.6);

  const dob = findDlDob(rows);
  if (dob) addField(fields, "DOB", dob.value, dob.confidence);

  const address = findDlAddress(rows);
  if (address) {
    if (address.pin) addField(fields, "PIN_CODE", address.pin, 0.85);
    addField(fields, "ADDRESS", address.value, 0.65);
  }

  const blood = findDlBloodGroup(rows);
  if (blood) addField(fields, "BLOOD_GROUP", blood, 0.8);

  const validity = findDlValidity(rows);
  if (validity) addField(fields, "VALIDITY", validity, 0.8);

  return [...fields.values()];
}
