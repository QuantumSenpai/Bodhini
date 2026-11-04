import type { DocumentType } from "../../../domain/document/document.types";
import { isValidAadhaar } from "../../validation/verhoeff";
import { isValidPan } from "../../validation/formatChecks";

function hasAadhaarNumber(text: string): boolean {
  const matches = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/g);
  if (!matches) return false;
  return matches.some((m) => isValidAadhaar(m));
}

function hasValidPan(text: string): boolean {
  const matches = text.match(/\b[A-Z]{5}\d{4}[A-Z]\b/g);
  if (!matches) return false;
  return matches.some((m) => isValidPan(m));
}

function hasValidEpic(text: string): boolean {
  const matches = text.match(/\b[A-Z]{3}\d{7}\b/g);
  if (!matches) return false;
  return matches.some((m) => /^[A-Z]{3}\d{7}$/.test(m));
}

function hasValidDl(text: string): boolean {
  const matches = text.match(/\b[A-Z]{2}[ -]?[0-9]{2}[ -]?(19|20)[0-9]{2}[0-9]{7}\b/g);
  if (!matches) return false;
  return matches.some((m) => /^[A-Z]{2}[0-9]{13}$/.test(m.replace(/[ -]/g, "")));
}

export function classifyDocument(text: string): DocumentType {
  const lower = text.toLowerCase();

  if (lower.includes("aadhaar") || (lower.includes("government of india") && hasAadhaarNumber(text))) {
    return "AADHAAR";
  }
  if (hasValidPan(text)) return "PAN";
  if (lower.includes("pan") && lower.includes("income tax department")) {
    return "PAN";
  }
  if (lower.includes("birth") && lower.includes("certificate")) {
    return "BIRTH_CERTIFICATE";
  }
  if (lower.includes("ration")) {
    return "RATION_CARD";
  }
  if (lower.includes("marksheet")) {
    return "MARKSHEET";
  }
  if (lower.includes("domicile")) {
    return "DOMICILE";
  }
  if (lower.includes("election commission of india") || lower.includes("elector photo identity")) {
    return "VOTER_ID";
  }
  if (lower.includes("driving licence") || lower.includes("driving license") || (lower.includes("union of india") && lower.includes("motor vehicles"))) {
    return "DRIVING_LICENCE";
  }
  if (hasAadhaarNumber(text)) return "AADHAAR";
  if (hasValidEpic(text)) return "VOTER_ID";
  if (hasValidDl(text)) return "DRIVING_LICENCE";
  return "OTHER";
}
