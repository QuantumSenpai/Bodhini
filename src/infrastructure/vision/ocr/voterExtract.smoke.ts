import { extractVoterFields } from "./voterExtract";
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

const cleanCardText = `ELECTION COMMISSION OF INDIA
ELECTOR PHOTO IDENTITY CARD
Elector's Name
SURESH KUMAR SHARMA
Father's Name
RAMESH KUMAR SHARMA
Date of Birth
15/08/1985
Sex
MALE
ABC1234567`;

const cleanCardBlocks = cleanCardText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("clean card", () => {
  const fields = extractVoterFields(cleanCardText, cleanCardBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const dob = fields.find(f => f.key === "DOB");
  const gender = fields.find(f => f.key === "GENDER");
  return epic?.value === "ABC1234567" && epic?.confidence === 0.95 &&
         name?.value === "SURESH KUMAR SHARMA" && name?.confidence === 0.6 &&
         father?.value === "RAMESH KUMAR SHARMA" && father?.confidence === 0.6 &&
         dob?.value === "15/08/1985" && dob?.confidence === 0.85 &&
         gender?.value === "MALE" && gender?.confidence === 0.8;
});

const allCapsText = `ELECTION COMMISSION OF INDIA
ELECTOR PHOTO IDENTITY CARD
NAME
SURESH KUMAR
FATHER'S NAME
RAMESH KUMAR
DATE OF BIRTH
22/03/2010
SEX
FEMALE
DEF4567890`;

const allCapsBlocks = allCapsText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("all caps name", () => {
  const fields = extractVoterFields(allCapsText, allCapsBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return epic?.value === "DEF4567890" && name?.value === "SURESH KUMAR";
});

const devanagariHeaderText = `निर्वाचन आयोग
निर्वाचक फोटो पहचान पत्र
Elector's Name
SURESH KUMAR SHARMA
Father's Name
RAMESH KUMAR SHARMA
Date of Birth
15/08/1985
Sex
MALE
GHI7890123`;

const devanagariBlocks = devanagariHeaderText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Devanagari header row above", () => {
  const fields = extractVoterFields(devanagariHeaderText, devanagariBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return epic?.value === "GHI7890123" && name?.value === "SURESH KUMAR SHARMA";
});

const noisyGarbageText = `QR NOISE @#$%^&*
ELECTION COMMISSION OF INDIA
ELECTOR PHOTO IDENTITY CARD
Elector's Name
SURESH KUMAR
Date of Birth
15/08/1985
Sex
MALE
JKL0123456`;

const noisyBlocks = noisyGarbageText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("noisy garbage row above name", () => {
  const fields = extractVoterFields(noisyGarbageText, noisyBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return epic?.value === "JKL0123456" && name?.value === "SURESH KUMAR";
});

const missingDobText = `ELECTION COMMISSION OF INDIA
Elector's Name
SURESH KUMAR
Father's Name
RAMESH KUMAR
Sex
MALE
MNO3456789`;

const missingDobBlocks = missingDobText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("missing DOB", () => {
  const fields = extractVoterFields(missingDobText, missingDobBlocks);
  const dob = fields.find(f => f.key === "DOB");
  const epic = fields.find(f => f.key === "EPIC_NO");
  return !dob && epic?.value === "MNO3456789";
});

const oZeroRepairText = `ELECTION COMMISSION OF INDIA
Elector's Name
SURESH KUMAR
Father's Name
RAMESH KUMAR
Date of Birth
15/08/1985
Sex
MALE
AB01234567`;

const oZeroBlocks = oZeroRepairText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("O/0 repair in EPIC", () => {
  const fields = extractVoterFields(oZeroRepairText, oZeroBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  return epic?.value === "ABO1234567" && epic?.confidence === 0.8;
});

const iOneRepairText = `ELECTION COMMISSION OF INDIA
Elector's Name
SURESH KUMAR
Father's Name
RAMESH KUMAR
Date of Birth
15/08/1985
Sex
MALE
ABC1234l67`;

const iOneBlocks = iOneRepairText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("I/1 repair in EPIC", () => {
  const fields = extractVoterFields(iOneRepairText, iOneBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  return epic?.value === "ABC1234167" && epic?.confidence === 0.8;
});

const validUnchangedText = `ELECTION COMMISSION OF INDIA
Elector's Name
SURESH KUMAR
Date of Birth
15/08/1985
Sex
MALE
ABC1234567`;

const validUnchangedBlocks = validUnchangedText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("valid token unchanged", () => {
  const fields = extractVoterFields(validUnchangedText, validUnchangedBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  return epic?.value === "ABC1234567" && epic?.confidence === 0.95;
});

const aadhaarText = `ELECTION COMMISSION OF INDIA
Elector's Name
SURESH KUMAR
Date of Birth
15/08/1985
291837465026`;

const aadhaarBlocks = aadhaarText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Aadhaar text returns no EPIC_NO", () => {
  const fields = extractVoterFields(aadhaarText, aadhaarBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  return !epic;
});

const motherNameText = `ELECTION COMMISSION OF INDIA
Elector's Name
SURESH KUMAR
Mother's Name
LAXMI DEVI
Date of Birth
15/08/1985
Sex
FEMALE
PQR1234567`;

const motherNameBlocks = motherNameText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Mother's Name not FULL_NAME", () => {
  const fields = extractVoterFields(motherNameText, motherNameBlocks);
  const father = fields.find(f => f.key === "FATHER_NAME");
  return !father && !(fields.find(f => f.key === "FULL_NAME")?.value === "LAXMI DEVI");
});

const sameRowText = `ELECTION COMMISSION OF INDIA
Elector's Name SURESH KUMAR
Father's Name RAMESH KUMAR
Date of Birth 15/08/1985
Sex MALE
STU8901234`;

const sameRowBlocks = sameRowText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("label and value on same row", () => {
  const fields = extractVoterFields(sameRowText, sameRowBlocks);
  const epic = fields.find(f => f.key === "EPIC_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const dob = fields.find(f => f.key === "DOB");
  const gender = fields.find(f => f.key === "GENDER");
  return epic?.value === "STU8901234" &&
         name?.value === "SURESH KUMAR" &&
         father?.value === "RAMESH KUMAR" &&
         dob?.value === "15/08/1985" &&
         gender?.value === "MALE";
});

const emptyText = "";
const emptyBlocks: { text: string; box: { x: number; y: number; width: number; height: number } }[] = [];

run("empty input", () => {
  const fields = extractVoterFields(emptyText, emptyBlocks);
  return fields.length === 0;
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);