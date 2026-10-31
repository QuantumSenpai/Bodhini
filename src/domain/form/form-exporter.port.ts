import { FilledField, CopyItem } from "./form.types";

export interface FormExporter {
  buildCopyItems(fields: FilledField[]): CopyItem[];
}
