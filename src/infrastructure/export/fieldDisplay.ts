import type { FieldKey } from "../../domain/document/document.types";

const BULLET = "\u2022";

export function displayValue(key: FieldKey, value: string, revealed: boolean): string {
  if (key === "AADHAAR_NO") {
    const cleaned = value.replace(/\s+/g, "");
    if (cleaned.length !== 12 || !/^\d{12}$/.test(cleaned)) {
      return value;
    }
    if (!revealed) {
      return `${BULLET.repeat(4)} ${BULLET.repeat(4)} ${cleaned.slice(-4)}`;
    }
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  return value;
}