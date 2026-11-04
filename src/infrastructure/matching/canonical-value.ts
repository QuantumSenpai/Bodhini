import type { FieldKey } from "../../domain/document/document.types";
import { FieldValidator } from "../validation/field-validator";

const COMPACT_KEYS: ReadonlySet<FieldKey> = new Set<FieldKey>([
  "AADHAAR_NO",
  "PAN_NO",
  "EPIC_NO",
  "DL_NO",
  "RATION_NO",
  "PIN_CODE",
  "REGISTRATION_NO",
]);

export function canonicalValue(key: FieldKey, value: string): string {
  const trimmed = value.trim();
  if (key === "DOB") {
    return FieldValidator.normalizeDob(trimmed) ?? trimmed.toLocaleLowerCase();
  }
  if (key === "PHONE") {
    return FieldValidator.normalizePhone(trimmed) ?? trimmed.replace(/[\s-]/g, "");
  }
  if (COMPACT_KEYS.has(key)) {
    return trimmed.replace(/[\s\-./]/g, "").toLocaleUpperCase();
  }
  return trimmed.replace(/\s+/g, " ").toLocaleLowerCase();
}
