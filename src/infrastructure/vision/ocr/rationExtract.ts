import type { FieldKey, ExtractedField } from "../../../domain/document/document.types";
import { buildLines, detectScript, type OcrBlock, type OcrRow } from "./lineBuilder";
import { findRationAddress, findRationCategory, findRationName, findRationNo } from "./rationFields";

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

export { buildRows };

export function extractRationFields(
  text: string,
  blocks: ReadonlyArray<{ text: string; box: { x: number; y: number; width: number; height: number } } | OcrBlock> = [],
): ExtractedField[] {
  const rows = buildRows(text, blocks);
  const fields = new Map<FieldKey, ExtractedField>();

  const rationNo = findRationNo(rows);
  if (rationNo) addField(fields, "RATION_NO", rationNo, 0.8);

  const name = findRationName(rows);
  if (name) addField(fields, "FULL_NAME", name, 0.6);

  const category = findRationCategory(rows);
  if (category) addField(fields, "CATEGORY", category, 0.75);

  const address = findRationAddress(rows);
  if (address) {
    if (address.pin) addField(fields, "PIN_CODE", address.pin, 0.85);
    addField(fields, "ADDRESS", address.value, 0.65);
  }

  return [...fields.values()];
}