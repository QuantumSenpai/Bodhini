import { extractAadhaarFields } from "./aadhaarExtract";
import { isValidAadhaar } from "../../validation/verhoeff";
import { resolveFieldKey } from "../../matching/field-synonyms";

function makeBlock(text: string, x: number, y: number, w: number, h: number) {
  return { text, box: { x, y, width: w, height: h } };
}

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

const pvcFrontText = `सरकार ऑफ इंडिया
RAMESH KUMAR SHARMA
DOB: 15/08/1985
MALE
2918 3746 5026
Your Aadhaar is your identity`;

const pvcBlocks = [
  makeBlock("सरकार ऑफ इंडिया", 10, 10, 200, 30),
  makeBlock("RAMESH KUMAR SHARMA", 10, 50, 200, 30),
  makeBlock("DOB: 15/08/1985", 10, 90, 200, 30),
  makeBlock("MALE", 10, 130, 200, 30),
  makeBlock("2918 3746 5026", 10, 170, 200, 30),
  makeBlock("Your Aadhaar is your identity", 10, 210, 200, 30),
];

run("PVC front: extracts FULL_NAME", () => {
  const fields = extractAadhaarFields(pvcFrontText, pvcBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  return name?.value === "RAMESH KUMAR SHARMA" && name.confidence <= 0.7;
});

run("PVC front: extracts DOB", () => {
  const fields = extractAadhaarFields(pvcFrontText, pvcBlocks);
  const dob = fields.find(f => f.key === "DOB");
  return dob?.value === "15/08/1985" && dob.confidence === 0.85;
});

run("PVC front: extracts GENDER", () => {
  const fields = extractAadhaarFields(pvcFrontText, pvcBlocks);
  const gender = fields.find(f => f.key === "GENDER");
  return gender?.value === "MALE" && gender.confidence === 0.82;
});

run("PVC front: extracts valid AADHAAR_NO", () => {
  const fields = extractAadhaarFields(pvcFrontText, pvcBlocks);
  const aadhaar = fields.find(f => f.key === "AADHAAR_NO");
  return aadhaar?.value === "291837465026" && aadhaar.confidence === 0.95 && isValidAadhaar(aadhaar.value);
});

run("PVC front: no ADDRESS extracted", () => {
  const fields = extractAadhaarFields(pvcFrontText, pvcBlocks);
  const address = fields.find(f => f.key === "ADDRESS");
  return !address;
});

const eaadhaarText = `To,
RAMESH KUMAR SHARMA
S/O SHYAM LAL SHARMA
VILLAGE RAMPUR POST OFFICE
DISTRICT GHAZIABAD
UTTAR PRADESH 201001
Mobile: 9876543210
Enrolment No: 1234/56789/12345
VID: 1234 5678 9012 3456
Your Aadhaar No: 2918 3746 5026
Address:
S/O SHYAM LAL SHARMA
VILLAGE RAMPUR POST OFFICE
DISTRICT GHAZIABAD
UTTAR PRADESH 201001`;

const eaadhaarBlocks = eaadhaarText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 300, 25));

run("e-Aadhaar: extracts FULL_NAME from To,", () => {
  const fields = extractAadhaarFields(eaadhaarText, eaadhaarBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  return name?.value === "RAMESH KUMAR SHARMA" && name.confidence <= 0.7;
});

run("e-Aadhaar: extracts FATHER_NAME from S/O", () => {
  const fields = extractAadhaarFields(eaadhaarText, eaadhaarBlocks);
  const father = fields.find(f => f.key === "FATHER_NAME");
  return father?.value === "SHYAM LAL SHARMA";
});

run("e-Aadhaar: extracts ADDRESS with PIN", () => {
  const fields = extractAadhaarFields(eaadhaarText, eaadhaarBlocks);
  const address = fields.find(f => f.key === "ADDRESS");
  const pin = fields.find(f => f.key === "PIN_CODE");
  const hasAddress = !!address?.value?.includes("VILLAGE RAMPUR") && !!address?.value?.includes("GHAZIABAD") && !!address?.value?.includes("UTTAR PRADESH");
  const hasPin = !!pin && pin.value === "201001" && pin.confidence === 0.85;
  return hasAddress && hasPin;
});

run("e-Aadhaar: extracts valid AADHAAR_NO ignoring VID", () => {
  const fields = extractAadhaarFields(eaadhaarText, eaadhaarBlocks);
  const aadhaar = fields.find(f => f.key === "AADHAAR_NO");
  return aadhaar?.value === "291837465026" && isValidAadhaar(aadhaar.value) && aadhaar.confidence === 0.95;
});

run("e-Aadhaar: ignores 16-digit VID", () => {
  const fields = extractAadhaarFields(eaadhaarText, eaadhaarBlocks);
  const aadhaar = fields.find(f => f.key === "AADHAAR_NO");
  return aadhaar?.value?.length === 12;
});

const invalidAadhaarText = `RAMESH KUMAR
DOB: 15/08/1985
MALE
1234 5678 9012`;

const invalidBlocks = invalidAadhaarText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Invalid Aadhaar checksum: returns with confidence 0.4", () => {
  const fields = extractAadhaarFields(invalidAadhaarText, invalidBlocks);
  const aadhaar = fields.find(f => f.key === "AADHAAR_NO");
  return aadhaar?.value === "123456789012" && aadhaar.confidence === 0.4 && !isValidAadhaar(aadhaar.value);
});

const missingDobText = `RAMESH KUMAR
MALE
2918 3746 5026`;

const missingDobBlocks = missingDobText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Missing DOB: no DOB field returned", () => {
  const fields = extractAadhaarFields(missingDobText, missingDobBlocks);
  const dob = fields.find(f => f.key === "DOB");
  return !dob;
});

const formBlocks = [
  makeBlock("Addhar Card No:", 50, 50, 200, 40),
  makeBlock("Name:", 50, 150, 200, 40),
];

run("Form label: 'Addhar Card No:' resolves to AADHAAR_NO", () => {
  const resolution = resolveFieldKey("Addhar Card No:");
  return resolution?.key === "AADHAAR_NO";
});

run("Form label: 'Name:' resolves to FULL_NAME", () => {
  const resolution = resolveFieldKey("Name:");
  return resolution?.key === "FULL_NAME";
});

run("Form label: 'Aadhaar Card No:' resolves to AADHAAR_NO", () => {
  const resolution = resolveFieldKey("Aadhaar Card No:");
  return resolution?.key === "AADHAAR_NO";
});

run("Form label: 'UID' resolves to AADHAAR_NO", () => {
  const resolution = resolveFieldKey("UID");
  return resolution?.key === "AADHAAR_NO";
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);