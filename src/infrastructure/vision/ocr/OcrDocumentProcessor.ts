import type { DocumentProcessor } from "../../../domain/document/document.ports";
import type {
  AppLanguage,
  DocumentAnalysis,
  ExtractedField,
  FieldKey,
} from "../../../domain/document/document.types";
import { AppError } from "../../../domain/errors/app.errors";
import { FieldValidator } from "../../validation/field-validator";
import { classifyDocument } from "./DocumentClassifier";
import { recognizeText } from "./OcrTextRecognizer";
import { resolveFieldKey } from "../../matching/field-synonyms";
import { extractAadhaarFields } from "./aadhaarExtract";
import { extractPanFields } from "./panExtract";
import { extractVoterFields } from "./voterExtract";

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

function addField(
  fields: Map<FieldKey, ExtractedField>,
  key: FieldKey,
  value: string,
  confidence: number,
): void {
  const cleaned = value.replace(/^[\s:\-]+|[\s:;]+$/g, "").trim();
  if (!cleaned || fields.has(key)) return;
  if (key !== "OTHER" && !FieldValidator.validate(key, cleaned)) return;
  fields.set(key, {
    id: `ocr-${key.toLowerCase()}-${fields.size + 1}`,
    key,
    label: LABELS[key],
    value: cleaned,
    confidence: Math.max(0, Math.min(1, confidence)),
    source: "OCR",
  });
}

function documentFieldKey(label: string, documentType: DocumentAnalysis["type"]): FieldKey | null {
  const resolved = resolveFieldKey(label);
  if (resolved) return resolved.key;
  const normalized = label.trim().toLocaleLowerCase().replace(/[:：]$/, "");
  if ((documentType === "AADHAAR" || documentType === "PAN") && ["name", "नाम", "নাম"].includes(normalized)) {
    return "FULL_NAME";
  }
  return null;
}

function findFollowingValue(lines: string[], index: number, documentType: DocumentAnalysis["type"]): string | null {
  for (let next = index + 1; next < Math.min(lines.length, index + 3); next += 1) {
    const candidate = lines[next]?.trim();
    if (!candidate) continue;
    if (documentFieldKey(candidate, documentType)) break;
    if (/^(address|name|dob|date of birth|gender|male|female)$/i.test(candidate)) break;
    return candidate;
  }
  return null;
}

function parseFields(text: string, documentType: DocumentAnalysis["type"], blocks: { text: string; box: { x: number; y: number; width: number; height: number } }[]): ExtractedField[] {
  if (documentType === "AADHAAR") {
    return extractAadhaarFields(text, blocks);
  }
  if (documentType === "PAN") {
    return extractPanFields(text, blocks);
  }
  if (documentType === "VOTER_ID") {
    return extractVoterFields(text, blocks);
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[|•]/g, " ").trim())
    .filter(Boolean);
  const fields = new Map<FieldKey, ExtractedField>();

  lines.forEach((line, index) => {
    const split = line.match(/^(.{2,48}?)[\s:：\-\-]{1,4}(.+)$/);
    if (split) {
      const resolution = resolveFieldKey(split[1].trim());
      const fallbackKey = documentFieldKey(split[1].trim(), documentType);
      if (resolution) addField(fields, resolution.key, split[2], resolution.matchType === "exact" ? 0.88 : 0.78);
      else if (fallbackKey) addField(fields, fallbackKey, split[2], 0.82);
    }

    const normalizedLabel = line.replace(/[:：]$/, "");
    const resolved = resolveFieldKey(normalizedLabel);
    const fallbackKey = documentFieldKey(normalizedLabel, documentType);
    if (resolved || fallbackKey) {
      const nextValue = findFollowingValue(lines, index, documentType);
      if (nextValue) addField(fields, resolved?.key ?? fallbackKey!, nextValue, 0.78);
    }

    if (/father'?s? name|पिता का नाम|পিতার নাম/i.test(line)) {
      const value = line.split(/[:：]/).slice(1).join(":") || findFollowingValue(lines, index, documentType) || "";
      addField(fields, "FATHER_NAME", value, 0.78);
    }
    if (/mother'?s? name|माता का नाम|মাতার নাম/i.test(line)) {
      const value = line.split(/[:：]/).slice(1).join(":") || findFollowingValue(lines, index, documentType) || "";
      addField(fields, "MOTHER_NAME", value, 0.78);
    }
  });

  const completeText = lines.join(" ");
  const aadhaarCandidates = completeText.match(/\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g) ?? [];
  const validAadhaar = aadhaarCandidates.find((value) => FieldValidator.isValidAadhaar(value));
  if (validAadhaar) addField(fields, "AADHAAR_NO", validAadhaar, 0.9);

  const pan = completeText.match(/\b[A-Z]{5}\d{4}[A-Z]\b/i)?.[0];
  if (pan && FieldValidator.isValidPan(pan)) addField(fields, "PAN_NO", pan.toUpperCase(), 0.9);

  const pin = completeText.match(/\b[1-9]\d{5}\b/)?.[0];
  if (pin) addField(fields, "PIN_CODE", pin, 0.75);

  const email = completeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) addField(fields, "EMAIL", email, 0.9);

  const phone = completeText.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/)?.[0];
  if (phone) addField(fields, "PHONE", phone, 0.75);

  const gender = completeText.match(/\b(male|female|other)\b/i)?.[0];
  if (gender) addField(fields, "GENDER", gender, 0.82);

  return [...fields.values()];
}

export class OcrDocumentProcessor implements DocumentProcessor {
  async analyze(uri: string, language: AppLanguage): Promise<DocumentAnalysis> {
    if (!uri) throw new AppError("UNSUPPORTED_INPUT");
    const result = await recognizeText(uri);
    const documentType = classifyDocument(result.text);
    const fields = parseFields(result.text, documentType, result.blocks);
    if (fields.length === 0) {
      throw new AppError("EXTRACTION_FAILED", "We could read the image, but could not identify supported fields. Try a clearer, well-lit image.");
    }

    const warnings: string[] = [];
    if (fields.some((field) => field.confidence < 0.75)) {
      warnings.push("Some values need careful review before you save them.");
    }
    if (fields.some((field) => field.key === "AADHAAR_NO" || field.key === "PAN_NO")) {
      warnings.push("Identity numbers are sensitive. Confirm every character before saving.");
    }
    warnings.push(language === "bn"
      ? "বর্তমান OCR ব্যবস্থায় ল্যাটিন লিপির লেখা শনাক্ত হয়। বাংলা ও হিন্দি লিপির লেখা বাদ পড়তে পারে; সব তথ্য নিজে যাচাই করুন।"
      : language === "hi"
        ? "वर्तमान OCR केवल लैटिन लिपि पहचानता है। हिंदी और बंगाली लिपि छूट सकती है; सभी फ़ील्ड स्वयं जाँचें।"
        : "The current OCR adapter recognizes Latin-script text. Bengali and Hindi-script text may be missed; review all fields manually.");

    return {
      type: documentType,
      fields,
      source: "OCR",
      warnings,
    };
  }
}
