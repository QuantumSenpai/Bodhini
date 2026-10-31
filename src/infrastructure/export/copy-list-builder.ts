import { FilledField, CopyItem, FormField } from "../../domain/form/form.types";
import { FieldKey } from "../../domain/document/document.types";
import { FormExporter } from "../../domain/document/document.ports";
import { isValidAadhaar, maskAadhaar } from "../validation/verhoeff";

export class CopyListBuilder implements FormExporter {
  public buildCopyItems(fields: FilledField[]): CopyItem[] {
    return fields
      .filter((filled) => filled.status === "FILLED")
      .map((filled, index) => {
        const field = filled.field as FormField;
        let displayValue = filled.value ?? "";

        if ((field.key === "AADHAAR_NO" || isValidAadhaar(displayValue)) && displayValue.trim().length > 0) {
          displayValue = maskAadhaar(displayValue);
        }

        let instruction: string | undefined;
        if (filled.status === "SKIPPED") {
          instruction = "Manual signature or personal declaration required";
        } else if (filled.status === "NEEDS_USER") {
          instruction = "Value not present in confirmed documents; fill manually";
        }

        return {
          fieldId: field.id,
          label: field.label,
          value: displayValue,
          status: filled.status,
          order: index + 1,
          instruction,
        };
      });
  }

  public formatPlainText(items: CopyItem[]): string {
    return items
      .map((item) => {
        if (item.status === "SKIPPED") {
          return `${item.order}. ${item.label}: [SKIPPED - ${item.instruction || "Manual entry required"}]`;
        }
        if (item.status === "NEEDS_USER") {
          return `${item.order}. ${item.label}: [NEEDS USER INPUT - ${item.instruction || "Fill manually"}]`;
        }
        return `${item.order}. ${item.label}: ${item.value} [FILLED]`;
      })
      .join("\n");
  }
}