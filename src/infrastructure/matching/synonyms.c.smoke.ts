import { resolveFieldKey } from "./field-synonyms";
import { report, run } from "./smokeHarness";

run("NEGATIVE: 'Application No' must not give DL_NO", () => {
  const r = resolveFieldKey("Application No");
  return r?.key !== "DL_NO";
});

run("NEGATIVE: 'Serial No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Serial No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Serial No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Serial No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Serial No' must not give DL_NO", () => {
  const r = resolveFieldKey("Serial No");
  return r?.key !== "DL_NO";
});

run("NEGATIVE: 'Roll No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Roll No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Roll No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Roll No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Roll No' must not give DL_NO", () => {
  const r = resolveFieldKey("Roll No");
  return r?.key !== "DL_NO";
});

run("NEGATIVE: 'Aadhaar No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Aadhaar No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Aadhaar No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Aadhaar No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Aadhaar No' must not give DL_NO", () => {
  const r = resolveFieldKey("Aadhaar No");
  return r?.key !== "DL_NO";
});

run("EXISTING: 'Applicant Name' resolves to FULL_NAME", () => {
  const r = resolveFieldKey("Applicant Name");
  return r?.key === "FULL_NAME";
});

run("EXISTING: \"Father's Name\" resolves to FATHER_NAME", () => {
  const r = resolveFieldKey("Father's Name");
  return r?.key === "FATHER_NAME";
});

run("EXISTING: 'Permanent Address' resolves to ADDRESS", () => {
  const r = resolveFieldKey("Permanent Address");
  return r?.key === "ADDRESS";
});

run("EXISTING: 'Date of Birth' resolves to DOB", () => {
  const r = resolveFieldKey("Date of Birth");
  return r?.key === "DOB";
});

report();
