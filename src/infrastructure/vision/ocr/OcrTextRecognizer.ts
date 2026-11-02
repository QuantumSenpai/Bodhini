import TextRecognition, { TextRecognitionResult, TextBlock, Frame } from "@react-native-ml-kit/text-recognition";
import { AppError } from "../../../domain/errors/app.errors";
import type { OcrResult, OcrBlock, OcrBox, OcrLine, OcrElement } from "./ocr.types";
import { buildLines, rowsToText } from "./lineBuilder";

function mapFrame(frame: Frame | undefined): OcrBox {
  if (!frame) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: frame.left,
    y: frame.top,
    width: frame.width,
    height: frame.height,
  };
}

function mapElement(element: { text: string; frame: Frame }): OcrElement {
  return {
    text: element.text,
    box: mapFrame(element.frame),
  };
}

function mapLine(line: { text: string; frame?: Frame; elements?: { text: string; frame: Frame }[] }): OcrLine {
  const box = line.frame ? mapFrame(line.frame) : { x: 0, y: 0, width: 0, height: 0 };
  return {
    text: line.text,
    box,
    elements: (line.elements || []).map(mapElement),
  };
}

function mapBlock(block: TextBlock): OcrBlock {
  return {
    text: block.text,
    box: mapFrame(block.frame),
    lines: (block.lines || []).map(mapLine),
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
  const blocks = result.blocks.map(mapBlock);
  const rows = buildLines(blocks);
  return {
    text: result.text,
    blocks,
    rows,
  };
}

export { rowsToText };
