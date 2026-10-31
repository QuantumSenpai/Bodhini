export type AppLanguage = "en" | "bn" | "hi";

export type ExtractionSource = "OCR" | "GEMMA" | "DEMO";

export type DocumentType =
  | "AADHAAR"
  | "PAN"
  | "BIRTH_CERTIFICATE"
  | "RATION_CARD"
  | "MARKSHEET"
  | "DOMICILE"
  | "OTHER";

export type FieldKey =
  | "FULL_NAME"
  | "DOB"
  | "GENDER"
  | "ADDRESS"
  | "PIN_CODE"
  | "AADHAAR_NO"
  | "PAN_NO"
  | "PHONE"
  | "EMAIL"
  | "OTHER";

export interface ExtractedField {
  id: string;
  key: FieldKey;
  label: string;
  value: string;
  confidence: number;
  source: ExtractionSource;
}

export interface DocumentAnalysis {
  type: DocumentType;
  fields: ExtractedField[];
  source: ExtractionSource;
  warnings: string[];
}

export interface DocumentRecord {
  id: string;
  type: DocumentType;
  imageUri: string;
  fields: ExtractedField[];
  createdAt: string;
  confirmedAt: string;
}
