import TextRecognition, { TextRecognitionResult, TextBlock, Frame } from "@react-native-ml-kit/text-recognition";
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
