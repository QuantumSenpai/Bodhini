export interface OcrBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrBlock {
  text: string;
  box: OcrBox;
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
}