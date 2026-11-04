import type { OcrBlock, OcrElement, OcrLine, OcrRow, Script } from "./ocr.types";

export type { OcrBlock, OcrLine, OcrRow, Script };
export { detectScript };

function detectScript(text: string): Script {
  let hasLatin = false;
  let hasDevanagari = false;
  let hasBengali = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) {
      hasLatin = true;
    } else if (code >= 0x0900 && code <= 0x097F) {
      hasDevanagari = true;
    } else if (code >= 0x0980 && code <= 0x09FF) {
      hasBengali = true;
    }
  }
  const count = [hasLatin, hasDevanagari, hasBengali].filter(Boolean).length;
  if (count <= 1) {
    if (hasLatin) return "latin";
    if (hasDevanagari) return "devanagari";
    return "bengali";
  }
  return "mixed";
}

function stripZeroWidth(text: string): string {
  return text.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

const DEVANAGARI_DIGITS = "०१२३४५६७८९";
const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

function mapIndicDigitsToAscii(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const dIdx = DEVANAGARI_DIGITS.indexOf(ch);
    if (dIdx >= 0) {
      result += String(dIdx);
      continue;
    }
    const bIdx = BENGALI_DIGITS.indexOf(ch);
    if (bIdx >= 0) {
      result += String(bIdx);
      continue;
    }
    result += ch;
  }
  return result;
}

function fixOcrConfusionsInDigits(run: string): string {
  let result = "";
  for (let i = 0; i < run.length; i++) {
    const ch = run[i];
    if (ch === "O" || ch === "o") {
      result += "0";
    } else if (ch === "l" || ch === "I" || ch === "|") {
      result += "1";
    } else if (ch === "S" || ch === "s") {
      result += "5";
    } else if (ch === "B" || ch === "b") {
      result += "8";
    } else {
      result += ch;
    }
  }
  return result;
}

const EPIC_PATTERN = /^[A-Za-z0185]{3}\d{7}$/;
const DIGIT_FIXABLE_PATTERN = /^[\dOolI|SsBb ]+$/;

function normalizeDigitRuns(text: string): string {
  return text.replace(/[\w\W]{8,12}/g, (run) => {
    const digitCount = (run.match(/\d/g) || []).length;
    if (digitCount >= 8 && run.length >= 8 && run.length <= 12 && !EPIC_PATTERN.test(run) && DIGIT_FIXABLE_PATTERN.test(run)) {
      return fixOcrConfusionsInDigits(run);
    }
    return run;
  });
}

function normalizeText(text: string): string {
  let t = stripZeroWidth(text);
  t = t.replace(/\s+/g, " ").trim();
  t = mapIndicDigitsToAscii(t);
  t = normalizeDigitRuns(t);
  return t;
}

function elementCharWidth(element: OcrElement): number {
  const clean = element.text.trim();
  if (clean.length === 0) return element.box.width;
  return element.box.width / clean.length;
}

function medianOf(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function buildLines(blocks: OcrBlock[]): OcrRow[] {
  const allLines: OcrLine[] = [];
  for (const block of blocks) {
    for (const line of block.lines) {
      allLines.push(line);
    }
  }

  if (allLines.length === 0) return [];

  allLines.sort((a, b) => {
    const centerA = a.box.y + a.box.height / 2;
    const centerB = b.box.y + b.box.height / 2;
    return centerA - centerB;
  });

  const heights = allLines.map((l) => l.box.height);
  const medianHeight = medianOf(heights);

  const rows: OcrLine[][] = [];
  let currentRow: OcrLine[] = [allLines[0]];
  let currentCenter = allLines[0].box.y + allLines[0].box.height / 2;

  for (let i = 1; i < allLines.length; i++) {
    const line = allLines[i];
    const center = line.box.y + line.box.height / 2;
    if (Math.abs(center - currentCenter) < 0.6 * medianHeight) {
      currentRow.push(line);
    } else {
      rows.push(currentRow);
      currentRow = [line];
      currentCenter = center;
    }
  }
  rows.push(currentRow);

  const result: OcrRow[] = [];

  for (const rowLines of rows) {
    rowLines.sort((a, b) => a.box.x - b.box.x);

    const mergedText = rowLines.map((l) => l.text.trim()).filter(Boolean).join(" ");
    const left = Math.min(...rowLines.map((l) => l.box.x));
    const top = Math.min(...rowLines.map((l) => l.box.y));
    const right = Math.max(...rowLines.map((l) => l.box.x + l.box.width));
    const bottom = Math.max(...rowLines.map((l) => l.box.y + l.box.height));
    const script = detectScript(mergedText);

    const elements: OcrElement[] = [];
    for (const line of rowLines) {
      for (const el of line.elements) {
        elements.push(el);
      }
    }

    let splitIndex = -1;
    if (elements.length > 1) {
      const charWidths = elements.map((el) => elementCharWidth(el));
      const medianCharWidth = medianOf(charWidths);
      const gapThreshold = 3 * medianCharWidth;

      for (let i = 1; i < elements.length; i++) {
        const prev = elements[i - 1];
        const curr = elements[i];
        const gap = curr.box.x - (prev.box.x + prev.box.width);
        if (gap > gapThreshold) {
          const leftPart = rowLines.slice(0, i).map((l) => l.text).join(" ");
          const rightPart = rowLines.slice(i).map((l) => l.text).join(" ");
          if (detectScript(leftPart) !== detectScript(rightPart)) {
            splitIndex = i;
            break;
          }
        }
      }
    }

    if (splitIndex > 0) {
      const leftLines = rowLines.slice(0, splitIndex);
      const rightLines = rowLines.slice(splitIndex);

      const makeRow = (lines: OcrLine[]): OcrRow => {
        lines.sort((a, b) => a.box.x - b.box.x);
        const text = lines.map((l) => l.text.trim()).filter(Boolean).join(" ");
        return {
          text: normalizeText(text),
          left: Math.min(...lines.map((l) => l.box.x)),
          top: Math.min(...lines.map((l) => l.box.y)),
          right: Math.max(...lines.map((l) => l.box.x + l.box.width)),
          bottom: Math.max(...lines.map((l) => l.box.y + l.box.height)),
          script: detectScript(text),
        };
      };

      result.push(makeRow(leftLines));
      result.push(makeRow(rightLines));
    } else {
      result.push({
        text: normalizeText(mergedText),
        left,
        top,
        right,
        bottom,
        script,
      });
    }
  }

  return result;
}

export function rowsToText(rows: OcrRow[]): string {
  return rows.map((r) => r.text).filter(Boolean).join("\n");
}
