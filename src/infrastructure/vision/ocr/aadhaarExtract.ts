import { isValidAadhaar } from "../../validation/verhoeff";
import { isValidDate, isValidPin } from "../../validation/formatChecks";
import type { FieldKey, ExtractedField } from "../../../domain/document/document.types";
import { buildLines, detectScript, type OcrBlock, type OcrRow } from "./lineBuilder";

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

type PlainBlock = { text: string; box: { x: number; y: number; width: number; height: number } };

interface Hit {
  value: string;
  confidence: number;
  index: number;
}

interface DobHit {
  index: number;
  cut: number;
  value: string | null;
  confidence: number;
}

interface AddressHit {
  address: string;
  pin: string | null;
  indices: number[];
}

const HEADER_RE = /\b(?:government|govt|india|aadhaar|unique|identification|authority|uidai|help|www|mera|meri)\b/i;
const DOB_LABEL_RE = /\b(?:DOB|Date of Birth|Year of Birth|YOB)\b|जन्म\s*तिथि|जन्मतिथि|জন্ম\s*তারিখ|জন্মদিন/i;
const DATE_RE = /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/;
const YOB_RE = /\b(?:Year of Birth|YOB)\b\s*[:\uFF1A]?\s*(\d{4})\b/i;
const GENDER_RE = /\b(FEMALE|MALE|TRANSGENDER)\b/i;
const ADDRESS_LABEL_RE = /^(?:Address|पता|ঠিকানা)(?:\s*[:\-]\s*|\s+|$)(.*)$/i;
const CARE_OF_RE = /^(S\/O|D\/O|W\/O|C\/O)\s*[:.,]?\s*(.*)$/i;
const PIN_RE = /\b([1-9]\d{5})\b/;
const STOP_LABEL_RE = /\b(?:vid|mobile|phone)\b|enrol|\+\s*91/i;
const QR_RE = /^QR\b/i;
const TO_RE = /^To[,:.]?$/i;

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

function digitRuns(text: string): string[] {
  const runs = text.match(/\d(?:[ -]?\d)*/g) || [];
  return runs.map((run) => run.replace(/\D/g, ""));
}

function isStopRow(text: string): boolean {
  if (STOP_LABEL_RE.test(text)) return true;
  return digitRuns(text).some((digits) => digits.length >= 12);
}

function isNoiseRow(text: string): boolean {
  if (QR_RE.test(text)) return true;
  const compact = text.replace(/\s/g, "");
  if (!compact) return true;
  const symbols = compact.replace(/[A-Za-z0-9\u0900-\u097F\u0980-\u09FF]/g, "").length;
  return symbols / compact.length > 0.3;
}

function nameFrom(text: string): string | null {
  const trimmed = text
    .replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g, "")
    .replace(/\s+/g, " ");
  if (!/^[A-Za-z.' ]+$/.test(trimmed)) return null;
  const words = trimmed.split(" ");
  if (words.length < 2 || words.length > 4) return null;
  for (const word of words) {
    if (!/^[A-Za-z.']+$/.test(word) || word.length < 2 || !/[aeiou]/i.test(word)) return null;
  }
  if (HEADER_RE.test(trimmed)) return null;
  return trimmed;
}

function findAadhaar(rows: OcrRow[]): Hit | null {
  let weak: Hit | null = null;
  for (let i = 0; i < rows.length; i++) {
    if (STOP_LABEL_RE.test(rows[i].text)) continue;
    for (const digits of digitRuns(rows[i].text)) {
      if (digits.length !== 12) continue;
      if (isValidAadhaar(digits)) return { value: digits, confidence: 0.95, index: i };
      if (!weak) weak = { value: digits, confidence: 0.4, index: i };
    }
  }
  return weak;
}

function readDob(text: string): { value: string; confidence: number } | null {
  const date = DATE_RE.exec(text);
  if (date) {
    const value = `${date[1]}/${date[2]}/${date[3]}`;
    return isValidDate(value) ? { value, confidence: 0.85 } : null;
  }
  const year = YOB_RE.exec(text);
  if (year) {
    const value = `01/01/${year[1]}`;
    return isValidDate(value) ? { value, confidence: 0.55 } : null;
  }
  return null;
}

function findDob(rows: OcrRow[]): DobHit | null {
  for (let i = 0; i < rows.length; i++) {
    const label = DOB_LABEL_RE.exec(rows[i].text);
    if (!label) continue;
    const found = readDob(rows[i].text) || (i + 1 < rows.length ? readDob(rows[i + 1].text) : null);
    return {
      index: i,
      cut: label.index,
      value: found ? found.value : null,
      confidence: found ? found.confidence : 0,
    };
  }
  for (let i = 0; i < rows.length; i++) {
    const date = DATE_RE.exec(rows[i].text);
    if (!date) continue;
    const found = readDob(rows[i].text);
    return {
      index: i,
      cut: date.index,
      value: found ? found.value : null,
      confidence: found ? found.confidence : 0,
    };
  }
  return null;
}

function findGender(rows: OcrRow[], dobIndex: number): Hit | null {
  for (let i = 0; i < rows.length; i++) {
    if (wordCount(rows[i].text) > 5) continue;
    const match = GENDER_RE.exec(rows[i].text);
    if (match) return { value: match[1].toUpperCase(), confidence: 0.82, index: i };
  }
  if (dobIndex >= 0) {
    const start = Math.max(0, dobIndex - 1);
    const end = Math.min(rows.length - 1, dobIndex + 1);
    for (let i = start; i <= end; i++) {
      if (i === dobIndex) continue;
      const text = rows[i].text.trim();
      if (/^[MF]$/.test(text)) {
        return { value: text === "M" ? "MALE" : "FEMALE", confidence: 0.82, index: i };
      }
    }
  }
  return null;
}

function findAddress(rows: OcrRow[]): AddressHit | null {
  let start = -1;
  let first = "";
  let includeStart = false;

  for (let i = 0; i < rows.length; i++) {
    const match = ADDRESS_LABEL_RE.exec(rows[i].text.trim());
    if (match) {
      start = i;
      first = match[1].trim();
      break;
    }
  }
  if (start < 0) {
    for (let i = 0; i < rows.length; i++) {
      if (CARE_OF_RE.test(rows[i].text.trim())) {
        start = i;
        includeStart = true;
        break;
      }
    }
  }
  if (start < 0) return null;

  const raw: { text: string; index: number }[] = [];
  if (includeStart) raw.push({ text: rows[start].text.trim(), index: start });
  else if (first) raw.push({ text: first, index: start });

  for (let i = start + 1; i < rows.length && raw.length < 8; i++) {
    const text = rows[i].text.trim();
    if (!text) continue;
    if (isStopRow(text)) break;
    if (isNoiseRow(text)) continue;
    raw.push({ text, index: i });
  }

  const lines: string[] = [];
  const indices: number[] = [start];
  let pin: string | null = null;
  for (const entry of raw) {
    lines.push(entry.text.replace(/[\s,;]+$/, ""));
    indices.push(entry.index);
    const match = PIN_RE.exec(entry.text);
    if (match && isValidPin(match[1])) {
      pin = match[1];
      break;
    }
  }
  if (lines.length === 0) return null;
  return { address: lines.join(", "), pin, indices };
}

function findFather(rows: OcrRow[]): string | null {
  for (const row of rows) {
    const match = CARE_OF_RE.exec(row.text.trim());
    if (!match) continue;
    const kind = match[1].toUpperCase();
    if (kind !== "S/O" && kind !== "D/O") continue;
    const candidate = match[2]
      .split(",")[0]
      .replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g, "")
      .replace(/\s+/g, " ");
    if (/^[A-Za-z.' ]{3,}$/.test(candidate)) return candidate;
  }
  return null;
}

function nameAbove(rows: OcrRow[], from: number, blocked: Set<number>): string | null {
  const low = Math.max(0, from - 4);
  for (let i = from - 1; i >= low; i--) {
    if (blocked.has(i)) continue;
    const name = nameFrom(rows[i].text);
    if (name) return name;
  }
  return null;
}

function nameAfterTo(rows: OcrRow[], blocked: Set<number>): string | null {
  for (let i = 0; i < rows.length; i++) {
    if (!TO_RE.test(rows[i].text.trim())) continue;
    const high = Math.min(rows.length, i + 6);
    for (let j = i + 1; j < high; j++) {
      if (blocked.has(j)) continue;
      const name = nameFrom(rows[j].text);
      if (name) return name;
    }
  }
  return null;
}

function findName(
  rows: OcrRow[],
  dob: DobHit | null,
  gender: Hit | null,
  aadhaar: Hit | null,
  blocked: Set<number>,
): { value: string; confidence: number } | null {
  if (dob) {
    if (dob.cut > 0) {
      const own = nameFrom(rows[dob.index].text.slice(0, dob.cut));
      if (own) return { value: own, confidence: 0.6 };
    }
    const above = nameAbove(rows, dob.index, blocked);
    if (above) return { value: above, confidence: 0.6 };
  }
  const afterTo = nameAfterTo(rows, blocked);
  if (afterTo) return { value: afterTo, confidence: 0.6 };
  if (gender) {
    const above = nameAbove(rows, gender.index, blocked);
    if (above) return { value: above, confidence: 0.55 };
  }
  if (aadhaar) {
    const above = nameAbove(rows, aadhaar.index, blocked);
    if (above) return { value: above, confidence: 0.55 };
  }
  return null;
}

function buildRows(text: string, blocks: ReadonlyArray<PlainBlock | OcrBlock>): OcrRow[] {
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

export function extractAadhaarFields(
  text: string,
  blocks: ReadonlyArray<PlainBlock | OcrBlock> = [],
): ExtractedField[] {
  const rows = buildRows(text, blocks);
  const fields = new Map<FieldKey, ExtractedField>();

  const aadhaar = findAadhaar(rows);
  if (aadhaar) addField(fields, "AADHAAR_NO", aadhaar.value, aadhaar.confidence);

  const dob = findDob(rows);
  if (dob && dob.value) addField(fields, "DOB", dob.value, dob.confidence);

  const gender = findGender(rows, dob ? dob.index : -1);
  if (gender) addField(fields, "GENDER", gender.value, gender.confidence);

  const address = findAddress(rows);
  const blocked = new Set<number>(address ? address.indices : []);

  const name = findName(rows, dob, gender, aadhaar, blocked);
  if (name) addField(fields, "FULL_NAME", name.value, name.confidence);

  if (address) {
    addField(fields, "ADDRESS", address.address, 0.65);
    if (address.pin) addField(fields, "PIN_CODE", address.pin, 0.85);
  }

  const father = findFather(rows);
  if (father) addField(fields, "FATHER_NAME", father, 0.5);

  return [...fields.values()];
}
