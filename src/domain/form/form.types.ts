import { FieldKey } from "../document/document.types";

export type FormSource = "PAPER_PHOTO" | "SCREENSHOT" | "SAMPLE";

export type FormFieldType =
  | "TEXT"
  | "DATE"
  | "CHECKBOX"
  | "SIGNATURE"
  | "DECLARATION";

export type FillStatus = "FILLED" | "NEEDS_USER" | "SKIPPED";

export interface FormInput {
  id: string;
  source: FormSource;
  uri: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  instruction?: string;
}

export interface FilledField {
  fieldId: string;
  label: string;
  value: string;
  status: FillStatus;
  confidence: number;
  matchedKey?: FieldKey;
  matchReason?: string;
}

export interface CopyItem {
  fieldId: string;
  label: string;
  value: string;
  status: FillStatus;
  order: number;
  instruction?: string;
}
