import { ConfidencePolicy } from "./confidence-policy";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";
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

function field(label: string, type = "TEXT", instruction?: string): FormField {
  return { id: label, label, type, required: false, instruction } as unknown as FormField;
}

run("exact match passes the threshold", () => {
  const r = ConfidencePolicy.evaluate(field("Full Name"), true, "exact");
  return r.status === "FILLED" && r.confidence >= CONFIDENCE_THRESHOLD;
});
run("synonym match passes the threshold", () => {
  const r = ConfidencePolicy.evaluate(field("Full Name"), true, "synonym");
  return r.status === "FILLED" && r.confidence >= CONFIDENCE_THRESHOLD;
});
run("partial match needs review", () => {
  const r = ConfidencePolicy.evaluate(field("Full Name"), true, "partial");
  return r.status === "FILLED" && r.confidence < CONFIDENCE_THRESHOLD;
});
run("unknown match type needs review", () => {
  const r = ConfidencePolicy.evaluate(field("Full Name"), true);
  return r.status === "FILLED" && r.confidence < CONFIDENCE_THRESHOLD;
});
run("missing value needs the user", () => {
  const r = ConfidencePolicy.evaluate(field("Full Name"), false, "exact");
  return r.status === "NEEDS_USER" && r.confidence === 0;
});
run("signature type is skipped", () => ConfidencePolicy.evaluate(field("Applicant", "SIGNATURE"), true, "exact").status === "SKIPPED");
run("declaration type is skipped", () => ConfidencePolicy.evaluate(field("Applicant", "DECLARATION"), true, "exact").status === "SKIPPED");
run("signature label is skipped", () => ConfidencePolicy.evaluate(field("Signature of applicant"), true, "exact").status === "SKIPPED");

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
