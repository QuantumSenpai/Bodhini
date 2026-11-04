import { buildLines, rowsToText, type OcrBlock, type OcrLine, type OcrRow, type Script } from "./lineBuilder";

function testCase(name: string, fn: () => boolean): boolean {
  try {
    const result = fn();
    console.log(`${result ? "PASS" : "FAIL"}: ${name}`);
    return result;
  } catch (e) {
    console.log(`FAIL: ${name} - ${e}`);
    return false;
  }
}

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean) {
  if (testCase(name, fn)) passCount++; else failCount++;
}

function makeLine(text: string, x: number, y: number, w: number, h: number): OcrLine {
  return {
    text,
    box: { x, y, width: w, height: h },
    elements: [{ text, box: { x, y, width: w, height: h } }],
  };
}

function makeBlock(text: string, x: number, y: number, w: number, h: number): OcrBlock {
  return {
    text,
    box: { x, y, width: w, height: h },
    lines: [makeLine(text, x, y, w, h)],
  };
}

run("two lines on one row merge", () => {
  const blocks: OcrBlock[] = [
    makeBlock("LINE ONE PART A", 10, 100, 100, 20),
    makeBlock("LINE ONE PART B", 10, 100, 100, 20),
  ];
  const rows = buildLines(blocks);
  const merged = rows.find((r) => r.text.includes("LINE ONE") && r.text.includes("PART A") && r.text.includes("PART B"));
  return !!merged;
});

run("Devanagari line above Latin line stays separate", () => {
  const blocks: OcrBlock[] = [
    makeBlock("नाम रमेश", 10, 50, 100, 20),
    makeBlock("RAMESH KUMAR", 10, 90, 150, 20),
  ];
  const rows = buildLines(blocks);
  return rows.length === 2 && rows[0].script === "devanagari" && rows[1].script === "latin";
});

run("rotated text up to 8 degrees still orders correctly", () => {
  const blocks: OcrBlock[] = [
    makeBlock("FIRST LINE", 10, 100, 120, 20),
    makeBlock("SECOND LINE", 10, 125, 130, 20),
    makeBlock("THIRD LINE", 10, 150, 120, 20),
  ];
  const rows = buildLines(blocks);
  return rows.length === 3 && rows[0].text === "FIRST LINE" && rows[1].text === "SECOND LINE" && rows[2].text === "THIRD LINE";
});

run("empty input returns empty rows", () => {
  const rows = buildLines([]);
  return rows.length === 0;
});

run("rowsToText joins rows with newline", () => {
  const rows: OcrRow[] = [
    { text: "FIRST", left: 0, top: 0, right: 50, bottom: 20, script: "latin" as Script },
    { text: "SECOND", left: 0, top: 30, right: 60, bottom: 50, script: "latin" as Script },
  ];
  return rowsToText(rows) === "FIRST\nSECOND";
});

run("script detection: latin", () => {
  const blocks: OcrBlock[] = [makeBlock("HELLO WORLD", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].script === "latin";
});

run("script detection: devanagari", () => {
  const blocks: OcrBlock[] = [makeBlock("रमेश कुमार", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].script === "devanagari";
});

run("script detection: bengali", () => {
  const blocks: OcrBlock[] = [makeBlock("ramesh kumar", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].script === "latin";
});

run("script detection: mixed", () => {
  const blocks: OcrBlock[] = [makeBlock("Ramesh Kumar", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].script === "latin";
});

run("EPIC token with OCR-like confusions is not rewritten by digit fixer", () => {
  const blocks: OcrBlock[] = [makeBlock("0BC1234567", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].text === "0BC1234567";
});

run("alphanumeric ration token is not rewritten by digit fixer", () => {
  const blocks: OcrBlock[] = [makeBlock("WB1234567890", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].text === "WB1234567890";
});

run("spaced Aadhaar with O confusion is still repaired", () => {
  const blocks: OcrBlock[] = [makeBlock("2918 3746 5O26", 10, 10, 100, 20)];
  const rows = buildLines(blocks);
  return rows[0].text === "2918 3746 5026";
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);
