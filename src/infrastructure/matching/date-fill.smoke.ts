import { FieldMatcher } from "./field-matcher";
import { DocumentRecord, FieldKey } from "../../domain/document/document.types";
import { FormField } from "../../domain/form/form.types";

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean) {
  let ok = false;
  try {
    ok = fn();
  } catch (e) {
    console.log(`FAIL: ${name} - ${e}`);
    failCount++;
    return;
  }
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (ok) passCount++; else failCount++;
}

function doc(id: string, key: FieldKey, value: string, confirmedAt: number): DocumentRecord {
  return {
    id,
    type: "AADHAAR",
    imageUri: null,
    createdAt: confirmedAt,
    confirmedAt,
    fields: [{ id: `${id}-f`, key, label: key, value, confidence: 0.9, source: "OCR" }],
  } as unknown as DocumentRecord;
}

function form(label: string, type: string, instruction?: string): FormField {
  return { id: label, label, type, required: false, instruction } as unknown as FormField;
}

function fill(label: string, stored: string, type = "TEXT", instruction?: string, key: FieldKey = "DOB") {
  const out = new FieldMatcher().match([form(label, type, instruction)], [doc("d1", key, stored, 100)]);
  return out[0];
}

run("hint DD/MM/YYYY converts dash source", () => fill("Date of Birth (DD/MM/YYYY)", "15-08-1985").value === "15/08/1985");
run("hint YYYY-MM-DD converts slash source", () => fill("Date of Birth (YYYY-MM-DD)", "15/08/1985").value === "1985-08-15");
run("hint dd.mm.yyyy converts slash source", () => fill("Date of Birth (dd.mm.yyyy)", "15/08/1985").value === "15.08.1985");
run("no hint keeps the stored value", () => fill("Date of Birth", "15-08-1985").value === "15-08-1985");
run("hint in instruction applies", () => fill("Date of Birth", "15-08-1985", "TEXT", "Enter as DD/MM/YYYY").value === "15/08/1985");
run("short label DOB with hint resolves and converts", () => fill("DOB (DD-MM-YYYY)", "15/08/1985").value === "15-08-1985");
run("unparseable stored value stays raw", () => fill("Date of Birth (DD/MM/YYYY)", "not a date").value === "not a date");
run("non date key is never reformatted", () => fill("Full Name (DD/MM/YYYY)", "Ramesh Kumar", "TEXT", undefined, "FULL_NAME").value === "Ramesh Kumar");
run("conflicting dates stay unresolved", () => {
  const out = new FieldMatcher().match(
    [form("Date of Birth (DD/MM/YYYY)", "TEXT")],
    [doc("d1", "DOB", "15/08/1985", 100), doc("d2", "DOB", "16/08/1985", 200)],
  );
  return out[0].status === "NEEDS_USER" && out[0].value === null;
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
