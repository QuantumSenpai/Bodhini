import type { DocumentProcessor } from "../../../domain/document/document.ports";
import type { DocumentAnalysis, DocumentType, ExtractedField, FieldKey, AppLanguage, ExtractionSource } from "../../../domain/document/document.types";
import { CONFIDENCE_THRESHOLD } from "../../../domain/constants";

let callCount = 0;

function createField(id: string, key: FieldKey, label: string, value: string, confidence: number): ExtractedField {
  return {
    id,
    key,
    label,
    value,
    confidence,
    source: "DEMO",
  };
}

export const DemoDocumentProcessor: DocumentProcessor = {
  async analyze(uri: string, language: AppLanguage): Promise<DocumentAnalysis> {
    const index = callCount++ % 2;
    const baseId = `demo-doc-${index}`;
    
    if (index === 0) {
      const fields: ExtractedField[] = [
        createField(`${baseId}-1`, "FULL_NAME", "Full Name", "Priya Sharma", 0.92),
        createField(`${baseId}-2`, "FATHER_NAME", "Father's Name", "Rajesh Sharma", 0.88),
        createField(`${baseId}-3`, "DOB", "Date of Birth", "15/08/1995", 0.95),
        createField(`${baseId}-4`, "GENDER", "Gender", "Female", 0.97),
        createField(`${baseId}-5`, "ADDRESS", "Address", "123 MG Road, Bangalore, Karnataka", 0.85),
        createField(`${baseId}-6`, "PIN_CODE", "PIN Code", "560001", 0.91),
        createField(`${baseId}-7`, "AADHAAR_NO", "Aadhaar Number", "291837465026", 0.65),
        createField(`${baseId}-8`, "PHONE", "Phone", "+91 9876543210", 0.72),
      ];
      return {
        type: "AADHAAR",
        fields,
        source: "DEMO",
        warnings: ["DEMO output, not real OCR"],
      };
    } else {
      const fields: ExtractedField[] = [
        createField(`${baseId}-1`, "FULL_NAME", "Full Name", "Arjun Patel", 0.94),
        createField(`${baseId}-2`, "FATHER_NAME", "Father's Name", "Mahesh Patel", 0.89),
        createField(`${baseId}-3`, "MOTHER_NAME", "Mother's Name", "Sunita Patel", 0.87),
        createField(`${baseId}-4`, "DOB", "Date of Birth", "22/03/2010", 0.96),
        createField(`${baseId}-5`, "GENDER", "Gender", "Male", 0.98),
        createField(`${baseId}-6`, "ADDRESS", "Address", "45 Gandhi Nagar, Ahmedabad, Gujarat", 0.83),
        createField(`${baseId}-7`, "PIN_CODE", "PIN Code", "380001", 0.7),
      ];
      return {
        type: "BIRTH_CERTIFICATE",
        fields,
        source: "DEMO",
        warnings: ["DEMO output, not real OCR"],
      };
    }
  },
};