import type { FieldKey } from "../document/document.types";

export type FormSource = "PAPER_PHOTO" | "SCREENSHOT" | "SAMPLE";

export type FormFieldType =
  | "TEXT"
  | "DATE"
  | "CHECKBOX"
  | "SIGNATURE"
  | "DECLARATION";

export type FillStatus = "FILLED" | "NEEDS_USER" | "SKIPPED";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FormInput {
  kind: FormSource;
  uri?: string;
  sampleId?: string;
}

export interface FormField {
  id: string;
  label: string;
  key?: FieldKey;
  type: FormFieldType;
  required: boolean;
  box?: Box;
  page?: number;
}

export interface FilledField {
  field: FormField;
  value: string | null;
  confidence: number;
  status: FillStatus;
  sourceDocumentId?: string;
}

export interface CopyItem {
  fieldId: string;
  label: string;
  value: string;
  status: FillStatus;
}
