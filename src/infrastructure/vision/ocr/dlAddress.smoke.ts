import { findDlAddress } from "./dlFields";
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

run("address on following rows ends at PIN", () => {
  const a = findDlAddress(rows("Name SURESH KUMAR", "Address", "12 PARK STREET", "KOLKATA", "WEST BENGAL 700016", "Validity 01/01/2030"));
  return a?.value === "12 PARK STREET, KOLKATA, WEST BENGAL 700016" && a.pin === "700016";
});

run("address on same row as label with PIN", () => {
  const a = findDlAddress(rows("Address: 12 PARK STREET KOLKATA 700016", "Blood Group O+"));
  return a?.value === "12 PARK STREET KOLKATA 700016" && a.pin === "700016";
});

run("same row text continues on next row", () => {
  const a = findDlAddress(rows("Address: 12 PARK STREET", "KOLKATA 700016"));
  return a?.value === "12 PARK STREET, KOLKATA 700016" && a.pin === "700016";
});

run("stops before Validity row when no PIN", () => {
  const a = findDlAddress(rows("Address", "12 PARK STREET", "Validity 01/01/2030", "Blood Group O+"));
  return a?.value === "12 PARK STREET" && a.pin === null;
});

run("no address label returns null", () => findDlAddress(rows("Name SURESH KUMAR")) === null);

run("label with no rows returns null", () => findDlAddress(rows("Address")) === null);

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
