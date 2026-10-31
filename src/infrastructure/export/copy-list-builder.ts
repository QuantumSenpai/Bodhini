import { FilledField, CopyItem } from "../../domain/form/form.types";
import { FormExporter } from "../../domain/form/form-exporter.port";
import { FieldValidator } from "../validation/field-validator";

export class CopyListBuilder implements FormExporter {
  /**
   * Builds ordered CopyItems from FilledFields.
   * Ensures Aadhaar values are masked when displayed.
   */
  public buildCopyItems(fields: FilledField[]): CopyItem[] {
    return fields.map((field, index) => {
      let displayValue = field.value;

      // Mask Aadhaar values for display/copy review
      if (
        (field.matchedKey === "AADHAAR_NO" || FieldValidator.isValidAadhaar(field.value)) &&
        field.value &&
        field.value.trim().length > 0
      ) {
        displayValue = FieldValidator.maskAadhaar(field.value);
      }

      let instruction: string | undefined;
      if (field.status === "SKIPPED") {
        instruction = "Manual signature or personal declaration required";
      } else if (field.status === "NEEDS_USER") {
        instruction = "Value not present in confirmed documents; fill manually";
      }

      return {
        fieldId: field.fieldId,
        label: field.label,
        value: displayValue,
        status: field.status,
        order: index + 1,
        instruction,
      };
    });
  }

  /**
   * Formats CopyItems into clear, structured plain text suitable for clipboard pasting.
   */
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
