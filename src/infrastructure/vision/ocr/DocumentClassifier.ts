import type { DocumentType } from "../../../domain/document/document.types";
import { isValidAadhaar } from "../../validation/verhoeff";

function hasAadhaarNumber(text: string): boolean {
  const matches = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/g);
  if (!matches) return false;
  return matches.some((m) => isValidAadhaar(m));
}

export function classifyDocument(text: string): DocumentType {
  const lower = text.toLowerCase();
  
  if (lower.includes("aadhaar") || (lower.includes("government of india") && hasAadhaarNumber(text))) {
    return "AADHAAR";
  }
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
  return "OTHER";
}