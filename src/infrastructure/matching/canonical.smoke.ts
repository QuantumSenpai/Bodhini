import type { DocumentRecord, FieldKey } from "../../domain/document/document.types";
import type { FormField } from "../../domain/form/form.types";
import { canonicalValue } from "./canonical-value";
import { FieldMatcher } from "./field-matcher";

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

function same(key: FieldKey, a: string, b: string): boolean {
  return canonicalValue(key, a) === canonicalValue(key, b);
}

function doc(id: string, at: number, key: FieldKey, value: string): DocumentRecord {
  return {
    id,
    type: "AADHAAR",
    imageUri: "file:///sandbox/x.jpg",
    createdAt: at,
    confirmedAt: at,
    fields: [{ id: `${id}-f`, key, label: "x", value, confidence: 0.9, source: "OCR" }],
  };
}

function fill(label: string, docs: DocumentRecord[]) {
  const field: FormField = { id: "f1", label, type: "TEXT", required: true };
  return new FieldMatcher().matchDetailed([field], docs)[0];
}

run("Aadhaar with and without spaces is equal", () => same("AADHAAR_NO", "2918 3746 5026", "291837465026"));
run("Aadhaar with hyphens is equal", () => same("AADHAAR_NO", "2918-3746-5026", "291837465026"));
run("different Aadhaar numbers differ", () => !same("AADHAAR_NO", "2918 3746 5026", "2918 3746 5027"));
run("DOB slash and ISO are equal", () => same("DOB", "15/08/1985", "1985-08-15"));
run("DOB dash and ISO are equal", () => same("DOB", "15-08-1985", "1985-08-15"));
run("different DOB differ", () => !same("DOB", "15/08/1985", "16/08/1985"));
run("phone with country code is equal", () => same("PHONE", "+91 98765 43210", "9876543210"));
run("PAN case is ignored", () => same("PAN_NO", "abcde1234f", "ABCDE1234F"));
run("name case and spaces are ignored", () => same("FULL_NAME", "Anita  Roy", "ANITA ROY"));
run("different names differ", () => !same("FULL_NAME", "Anita Roy", "Anita Rao"));

run("same Aadhaar in two formats is not a conflict", () => {
  const r = fill("Aadhaar No.", [doc("a", 2, "AADHAAR_NO", "2918 3746 5026"), doc("b", 1, "AADHAAR_NO", "291837465026")]);
  return r.status === "FILLED" && r.value === "2918 3746 5026";
});
run("same DOB in two formats is not a conflict", () => {
  const r = fill("Date of Birth", [doc("a", 2, "DOB", "15/08/1985"), doc("b", 1, "DOB", "1985-08-15")]);
  return r.status === "FILLED" && r.value === "15/08/1985";
});
run("different Aadhaar numbers still need the user", () => {
  const r = fill("Aadhaar No.", [doc("a", 2, "AADHAAR_NO", "2918 3746 5026"), doc("b", 1, "AADHAAR_NO", "2918 3746 5027")]);
  return r.status === "NEEDS_USER" && r.value === null;
});
run("different names still need the user", () => {
  const r = fill("Full Name", [doc("a", 2, "FULL_NAME", "Anita Roy"), doc("b", 1, "FULL_NAME", "Anita Rao")]);
  return r.status === "NEEDS_USER" && r.value === null;
});
run("single document still fills", () => {
  const r = fill("Full Name", [doc("a", 1, "FULL_NAME", "Anita Roy")]);
  return r.status === "FILLED" && r.value === "Anita Roy";
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
