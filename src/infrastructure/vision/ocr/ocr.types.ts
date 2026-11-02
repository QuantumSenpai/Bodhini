export interface OcrBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrElement {
  text: string;
  box: OcrBox;
}

export interface OcrLine {
  text: string;
  box: OcrBox;
  elements: OcrElement[];
}

export type Script = "latin" | "devanagari" | "bengali" | "mixed";

export interface OcrRow {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  script: Script;
}

export interface OcrBlock {
  text: string;
  box: OcrBox;
  lines: OcrLine[];
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
  rows: OcrRow[];
}
