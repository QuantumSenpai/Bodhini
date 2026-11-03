import { extractPanFields } from "./panExtract";
import { isValidPan } from "../../validation/formatChecks";
import { isValidDate } from "../../validation/formatChecks";

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

function makeBlock(text: string, x: number, y: number, w: number, h: number) {
  return { text, box: { x, y, width: w, height: h } };
}

const cleanCardText = `INCOME TAX DEPARTMENT
GOVT OF INDIA
PERMANENT ACCOUNT NUMBER
NAME
RAMESH KUMAR SHARMA
FATHER'S NAME
SURESH KUMAR SHARMA
DATE OF BIRTH
15/08/1985
ABCDE1234F`;

const cleanCardBlocks = [
  makeBlock("INCOME TAX DEPARTMENT", 10, 10, 200, 30),
  makeBlock("GOVT OF INDIA", 10, 50, 200, 30),
  makeBlock("PERMANENT ACCOUNT NUMBER", 10, 90, 200, 30),
  makeBlock("NAME", 10, 130, 100, 30),
  makeBlock("RAMESH KUMAR SHARMA", 120, 130, 200, 30),
  makeBlock("FATHER'S NAME", 10, 170, 150, 30),
  makeBlock("SURESH KUMAR SHARMA", 170, 170, 200, 30),
  makeBlock("DATE OF BIRTH", 10, 210, 150, 30),
  makeBlock("15/08/1985", 170, 210, 150, 30),
  makeBlock("ABCDE1234F", 10, 250, 150, 30),
];

run("clean card", () => {
  const fields = extractPanFields(cleanCardText, cleanCardBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const dob = fields.find(f => f.key === "DOB");
  return pan?.value === "ABCDE1234F" && pan?.confidence === 0.95 &&
         name?.value === "RAMESH KUMAR SHARMA" && name?.confidence === 0.6 &&
         father?.value === "SURESH KUMAR SHARMA" && father?.confidence === 0.6 &&
         dob?.value === "15/08/1985" && dob?.confidence === 0.85 &&
         isValidPan(pan?.value ?? "");
});

const allCapsText = `INCOME TAX DEPARTMENT
GOVT OF INDIA
PERMANENT ACCOUNT NUMBER
NAME
RAJESH KUMAR
FATHER'S NAME
MAHESH KUMAR
DATE OF BIRTH
22/03/2010
FGHIJ5678K`;

const allCapsBlocks = allCapsText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("all caps name", () => {
  const fields = extractPanFields(allCapsText, allCapsBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return pan?.value === "FGHIJ5678K" && name?.value === "RAJESH KUMAR";
});

const devanagariHeaderText = `आयकर विभाग
भारत सरकार
स्थायी खाता संख्या
NAME
RAMESH KUMAR SHARMA
FATHER'S NAME
SURESH KUMAR SHARMA
DATE OF BIRTH
15/08/1985
KLMNO9012P`;

const devanagariBlocks = devanagariHeaderText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Devanagari header row above", () => {
  const fields = extractPanFields(devanagariHeaderText, devanagariBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return pan?.value === "KLMNO9012P" && name?.value === "RAMESH KUMAR SHARMA";
});

const noisyGarbageText = `QR NOISE @#$%^&*
INCOME TAX DEPARTMENT
GOVT OF INDIA
NAME
RAMESH KUMAR
DATE OF BIRTH
15/08/1985
PQRST3456Q`;

const noisyBlocks = noisyGarbageText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("noisy garbage row above name", () => {
  const fields = extractPanFields(noisyGarbageText, noisyBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return pan?.value === "PQRST3456Q" && name?.value === "RAMESH KUMAR";
});

const nameFatherAdjacentText = `INCOME TAX DEPARTMENT
NAME
RAMESH KUMAR
FATHER'S NAME
SURESH KUMAR
DATE OF BIRTH
15/08/1985
UVWXY7890Z`;

const nameFatherBlocks = nameFatherAdjacentText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("name and father name adjacent", () => {
  const fields = extractPanFields(nameFatherAdjacentText, nameFatherBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  return name?.value === "RAMESH KUMAR" && father?.value === "SURESH KUMAR";
});

const missingDobText = `INCOME TAX DEPARTMENT
NAME
RAMESH KUMAR
FATHER'S NAME
SURESH KUMAR
UVWXY7890Z`;

const missingDobBlocks = missingDobText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("missing DOB", () => {
  const fields = extractPanFields(missingDobText, missingDobBlocks);
  const dob = fields.find(f => f.key === "DOB");
  const pan = fields.find(f => f.key === "PAN_NO");
  return !dob && pan?.value === "UVWXY7890Z";
});

const invalidPanText = `INCOME TAX DEPARTMENT
NAME
RAMESH KUMAR
DATE OF BIRTH
15/08/1985
ABCD1234`;

const invalidPanBlocks = invalidPanText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("invalid PAN pattern returns no PAN_NO", () => {
  const fields = extractPanFields(invalidPanText, invalidPanBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  return !pan;
});

const oZeroConfusionText = `INCOME TAX DEPARTMENT
NAME
RAMESH KUMAR
DATE OF BIRTH
15/08/1985
ABC0E1234F`;

const oZeroBlocks = oZeroConfusionText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("O/0 confusion inside token repaired", () => {
  const fields = extractPanFields(oZeroConfusionText, oZeroBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  return pan?.value === "ABCOE1234F" && pan?.confidence === 0.8 && isValidPan(pan?.value ?? "");
});

const iOneConfusionText = `INCOME TAX DEPARTMENT
NAME
RAMESH KUMAR
DATE OF BIRTH
15/08/1985
ABCDl1234F`;

const iOneBlocks = iOneConfusionText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("I/1 confusion inside token repaired", () => {
  const fields = extractPanFields(iOneConfusionText, iOneBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  return pan?.value === "ABCDI1234F" && pan?.confidence === 0.8 && isValidPan(pan?.value ?? "");
});

const aadhaarText = `INCOME TAX DEPARTMENT
NAME
RAMESH KUMAR
DATE OF BIRTH
15/08/1985
291837465026`;

const aadhaarBlocks = aadhaarText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("12 digit Aadhaar text returns no PAN_NO", () => {
  const fields = extractPanFields(aadhaarText, aadhaarBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  return !pan;
});

const sameRowLabelValueText = `INCOME TAX DEPARTMENT
NAME RAMESH KUMAR
FATHER'S NAME SURESH KUMAR
DATE OF BIRTH 15/08/1985
ABCDE1234F`;

const sameRowBlocks = sameRowLabelValueText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("label and value on same row", () => {
  const fields = extractPanFields(sameRowLabelValueText, sameRowBlocks);
  const pan = fields.find(f => f.key === "PAN_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const dob = fields.find(f => f.key === "DOB");
  return pan?.value === "ABCDE1234F" &&
         name?.value === "RAMESH KUMAR" &&
         father?.value === "SURESH KUMAR" &&
         dob?.value === "15/08/1985";
});

const emptyInputText = "";
const emptyBlocks: { text: string; box: { x: number; y: number; width: number; height: number } }[] = [];

run("empty input", () => {
  const fields = extractPanFields(emptyInputText, emptyBlocks);
  return fields.length === 0;
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);