import type { FormAnalyzer } from "../../../domain/document/document.ports";
import type { FormField, FormInput } from "../../../domain/form/form.types";
import { AppError } from "../../../domain/errors/app.errors";
import { resolveFieldKey, isSignatureOrDeclarationLabel } from "../../matching/field-synonyms";
import { recognizeText } from "./OcrTextRecognizer";
import { DemoFormAnalyzer } from "../demo/DemoFormAnalyzer";

export class OcrFormAnalyzer implements FormAnalyzer {
  async analyze(input: FormInput): Promise<FormField[]> {
    if (input.kind === "SAMPLE") return DemoFormAnalyzer.analyze(input);
    if (!input.uri) throw new AppError("UNSUPPORTED_INPUT", "Choose a form image first.");

    const result = await recognizeText(input.uri);
    const fields: FormField[] = [];
    const seen = new Set<string>();

    result.blocks.forEach((block, index) => {
      const label = block.text.replace(/\s+/g, " ").replace(/[:：]+$/, "").trim();
      if (label.length < 2 || label.length > 90) return;

      const skip = isSignatureOrDeclarationLabel(label);
      const resolution = resolveFieldKey(label);
      if (!skip && !resolution) return;
      const id = `ocr-form-${index + 1}`;
      if (seen.has(label.toLowerCase())) return;
      seen.add(label.toLowerCase());

      fields.push({
        id,
        label,
        key: resolution?.key,
        type: skip
          ? (/declar|ঘোষণা|घोषणा/i.test(label) ? "DECLARATION" : "SIGNATURE")
          : resolution?.key === "DOB" ? "DATE" : "TEXT",
        required: true,
        box: {
          x: block.box.x,
          y: block.box.y,
          w: block.box.width,
          h: block.box.height,
        },
        page: 1,
        instruction: skip ? "Complete this declaration or signature manually." : undefined,
      });
    });

    if (fields.length === 0) {
      throw new AppError("FORM_ANALYSIS_FAILED", "No supported form fields were detected. Try a clearer image or use the sample form.");
    }
    return fields;
  }
}
