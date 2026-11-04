import { extractRationFields } from "./rationExtract";
import { findRationAddress, findRationCategory } from "./rationFields";
import type { OcrRow } from "./ocr.types";

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean): void {
  let ok = false;
  try {
    ok = fn();
  } catch {
    ok = false;
  }
  if (ok) passCount++;
  else failCount++;
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
}

function rows(...texts: string[]): OcrRow[] {
  return texts.map((text, i) => ({ text, left: 0, top: i * 30, right: 300, bottom: i * 30 + 25, script: "latin" }));
}

function value(text: string, key: string): string | undefined {
  return extractRationFields(text).find((f) => f.key === key)?.value;
}

run("standalone date row is not the ration number", () => value("15/08/1985\nRation Card No: WB1234567890", "RATION_NO") === "WB1234567890");

run("standalone PIN row is not a ration number", () => value("700016\nHead of Family SURESH KUMAR SHARMA", "RATION_NO") === undefined);

run("standalone Aadhaar row is not a ration number", () => value("291837465026\nHead of Family SURESH KUMAR SHARMA", "RATION_NO") === undefined);

run("Aadhaar Card No row is not a ration number", () => value("Aadhaar Card No: 291837465026", "RATION_NO") === undefined);

run("valid token with 0 1 5 8 digits is not altered", () => value("Ration Card No: WB1051808515", "RATION_NO") === "WB1051808515");

run("numeric ration number is kept", () => value("Ration Card No: 1234567890", "RATION_NO") === "1234567890");

run("ration number on the next row", () => value("Ration Card No\nWB1234567890", "RATION_NO") === "WB1234567890");

run("ration number with dot separator", () => value("Card No. WB1234567890", "RATION_NO") === "WB1234567890");

run("address row with H NO is kept", () => {
  const a = findRationAddress(rows("Address:", "H NO 12 PARK STREET", "KOLKATA 700016"));
  return a?.value === "H NO 12 PARK STREET, KOLKATA 700016" && a.pin === "700016";
});

run("address stops before Head of Family row", () => {
  const a = findRationAddress(rows("Address:", "12 PARK STREET", "Head of Family SURESH KUMAR SHARMA"));
  return a?.value === "12 PARK STREET" && a.pin === null;
});

run("labeled category beats NFSA in the header", () => findRationCategory(rows("National Food Security Act (NFSA)", "Category: PHH")) === "PHH");

run("NFSA header alone gives no category", () => findRationCategory(rows("National Food Security Act (NFSA)", "Ration Card")) === null);

run("unlabeled BPL in the first rows", () => findRationCategory(rows("Ration Card", "BPL")) === "BPL");

run("ANTYODAYA is normalized to AAY", () => findRationCategory(rows("Category: Antyodaya")) === "AAY");

run("empty input", () => extractRationFields("").length === 0);

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
