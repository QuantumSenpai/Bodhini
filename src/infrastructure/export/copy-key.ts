import type { FieldKey } from "../../domain/document/document.types";
import type { CopyItem, FilledField } from "../../domain/form/form.types";

export function filledFieldKey(field: FilledField): FieldKey | undefined {
  return field.matchedKey ?? field.field.key;
}

export function copyItemKey(item: CopyItem): FieldKey {
  if (item.key === "AADHAAR_NO" || item.key === "PAN_NO") return item.key;
  if (item.label.includes("Aadhaar") || item.label.includes("आधार") || item.label.includes("আধার")) return "AADHAAR_NO";
  if (item.label.includes("PAN") || item.label.includes("पैन")) return "PAN_NO";
  return item.key ?? "OTHER";
}
