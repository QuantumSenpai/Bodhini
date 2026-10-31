import type { ExtractedField, FieldKey, ExtractionSource } from "../../../domain/document/document.types";
import { isValidAadhaar } from "../../validation/verhoeff";
import { isValidDate } from "../../validation/formatChecks";

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function findAadhaarNumber(text: string): { value: string | null; confidence: number } {
  const lines = text.split("\n");
  for (const line of lines) {
    const matches = line.match(/\d{4}\s?\d{4}\s?\d{4}/g);
    if (matches) {
      for (const m of matches) {
        const cleaned = m.replace(/\s/g, "");
        if (cleaned.length === 12 && isValidAadhaar(cleaned)) {
          return { value: cleaned, confidence: 0.95 };
        }
      }
      const first = matches[0].replace(/\s/g, "");
      if (first.length === 12) {
        return { value: first, confidence: 0.4 };
      }
    }
  }
  return { value: null, confidence: 0 };
}

function findDOB(text: string): { value: string | null; confidence: number; lineIndex: number } {
  const lines = text.split("\n");
  const dobKeywords = ["dob", "date of birth", "जन्म"];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasKeyword = dobKeywords.some(kw => line.includes(kw));
    
    if (hasKeyword) {
      const dateMatch = lines[i].match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        if (isValidDate(dateStr)) {
          return { value: dateStr, confidence: 0.85, lineIndex: i };
        }
      }
      if (i + 1 < lines.length) {
        const nextLineMatch = lines[i + 1].match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
        if (nextLineMatch && isValidDate(nextLineMatch[1])) {
          return { value: nextLineMatch[1], confidence: 0.85, lineIndex: i + 1 };
        }
      }
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const dateMatch = lines[i].match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
    if (dateMatch && isValidDate(dateMatch[1])) {
      return { value: dateMatch[1], confidence: 0.7, lineIndex: i };
    }
  }
  
  return { value: null, confidence: 0, lineIndex: -1 };
}

function findName(text: string, dobLineIndex: number): { value: string | null; confidence: number } {
  if (dobLineIndex <= 0) return { value: null, confidence: 0 };
  
  const lines = text.split("\n");
  const candidateLine = lines[dobLineIndex - 1].trim();
  
  if (!candidateLine) return { value: null, confidence: 0 };
  
  const words = candidateLine.split(/\s+/);
  if (words.length < 2 || words.length > 4) return { value: null, confidence: 0 };
  
  if (!/^[A-Za-z\s]+$/.test(candidateLine)) return { value: null, confidence: 0 };
  
  return { value: candidateLine, confidence: 0.5 };
}

export function extractFields(text: string): ExtractedField[] {
  const source: ExtractionSource = "OCR";
  const fields: ExtractedField[] = [];
  
  const aadhaar = findAadhaarNumber(text);
  fields.push({
    id: generateId("aadhaar"),
    key: "AADHAAR_NO",
    label: "Aadhaar Number",
    value: aadhaar.value ?? "",
    confidence: aadhaar.confidence,
    source,
  });
  
  const dob = findDOB(text);
  fields.push({
    id: generateId("dob"),
    key: "DOB",
    label: "Date of Birth",
    value: dob.value ?? "",
    confidence: dob.confidence,
    source,
  });
  
  const name = findName(text, dob.lineIndex);
  fields.push({
    id: generateId("name"),
    key: "FULL_NAME",
    label: "Full Name",
    value: name.value ?? "",
    confidence: name.confidence,
    source,
  });
  
  return fields;
}