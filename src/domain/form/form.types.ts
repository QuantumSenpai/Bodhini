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
  instruction?: string;
}

export interface FilledField {
  /** Original form field, retained for preview and field-level actions. */
  field: FormField;
  value: string | null;
  confidence: number;
  status: FillStatus;
  sourceDocumentId?: string;
  /** Canonical key of the confirmed document field used for this match. */
  matchedKey?: FieldKey;
  /** Human-readable explanation suitable for an accessible review UI. */
  matchReason?: string;
}

export interface CopyItem {
  fieldId: string;
  label: string;
  value: string;
  status: FillStatus;
  order?: number;
  instruction?: string;
}