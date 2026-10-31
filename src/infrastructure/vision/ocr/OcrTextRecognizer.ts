<<<<<<< HEAD
import TextRecognition, { TextRecognitionResult, TextBlock, Frame } from "@react-native-ml-kit/text-recognition";
=======
import type { TextRecognitionResult, TextBlock, Frame } from "@react-native-ml-kit/text-recognition";
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
import { AppError } from "../../../domain/errors/app.errors";
import type { OcrResult, OcrBlock, OcrBox } from "./ocr.types";

function mapFrame(frame: Frame | undefined): OcrBox {
  if (!frame) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: frame.left,
    y: frame.top,
    width: frame.width,
    height: frame.height,
  };
}

function mapBlock(block: TextBlock): OcrBlock {
  return {
    text: block.text,
    box: mapFrame(block.frame),
  };
}

export async function recognizeText(uri: string): Promise<OcrResult> {
<<<<<<< HEAD
=======
  let TextRecognition: typeof import("@react-native-ml-kit/text-recognition").default;
  try {
    // Load the native module only when OCR is requested. This lets the rest of
    // the Expo Go UI and sample-form flow load even though ML Kit needs a dev build.
    const nativeModule = await import("@react-native-ml-kit/text-recognition");
    TextRecognition = nativeModule.default;
  } catch {
    throw new AppError(
      "MODEL_UNAVAILABLE",
      "On-device OCR requires the Bodhini development build. It is not included in the standard Expo Go client.",
    );
  }

>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
  let result: TextRecognitionResult;
  try {
    result = await TextRecognition.recognize(uri);
  } catch {
    throw new AppError("IMAGE_UNREADABLE");
  }
  if (!result.text || result.text.trim().length === 0) {
    throw new AppError("EXTRACTION_FAILED");
  }
  return {
    text: result.text,
    blocks: result.blocks.map(mapBlock),
  };
}