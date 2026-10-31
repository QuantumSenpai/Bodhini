import { DocumentRecord } from "../document/document.types";
import { FormField, FilledField } from "./form.types";

export interface FieldMatcher {
  match(fields: FormField[], docs: DocumentRecord[]): FilledField[];
}
