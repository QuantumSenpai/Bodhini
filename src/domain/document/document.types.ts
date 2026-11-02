export type AppLanguage = "en" | "bn" | "hi";

export type ExtractionSource = "OCR" | "GEMMA" | "DEMO";

export type Script = "latin" | "devanagari" | "bengali" | "mixed";

export interface OcrRow {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  script: Script;
}

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
  | "FATHER_NAME"
  | "MOTHER_NAME"
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
  rows?: OcrRow[];
}

export interface DocumentRecord {
  id: string;
  type: DocumentType;
  imageUri: string | null;
  fields: ExtractedField[];
  createdAt: number;
  confirmedAt: number;
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export interface DocumentConflict {
  key: FieldKey;
  documentIds: string[];
  values: string[];
}