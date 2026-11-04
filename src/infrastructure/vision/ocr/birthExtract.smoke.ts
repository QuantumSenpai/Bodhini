import { extractBirthFields } from "./birthExtract";

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

const cleanText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI SHARMA
Father's Name
SURESH KUMAR SHARMA
Mother's Name
MEENA DEVI
Date of Birth
15/08/1985
Sex
FEMALE
Place of Birth
DELHI
Registration No
REG123456/2019`;

const cleanBlocks = cleanText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("clean certificate", () => {
  const fields = extractBirthFields(cleanText, cleanBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const mother = fields.find(f => f.key === "MOTHER_NAME");
  const dob = fields.find(f => f.key === "DOB");
  const gender = fields.find(f => f.key === "GENDER");
  const place = fields.find(f => f.key === "PLACE_OF_BIRTH");
  const reg = fields.find(f => f.key === "REGISTRATION_NO");
  return name?.value === "ANITA KUMARI SHARMA" && name?.confidence === 0.6 &&
         father?.value === "SURESH KUMAR SHARMA" && father?.confidence === 0.6 &&
         mother?.value === "MEENA DEVI" && mother?.confidence === 0.6 &&
         dob?.value === "15/08/1985" && dob?.confidence === 0.85 &&
         gender?.value === "FEMALE" && gender?.confidence === 0.8 &&
         place?.value === "DELHI" && place?.confidence === 0.6 &&
         reg?.value === "REG123456/2019" && reg?.confidence === 0.7;
});

const sameRowText = `BIRTH CERTIFICATE
Name of Child ANITA KUMARI
Father's Name SURESH KUMAR
Mother's Name MEENA DEVI
Date of Birth 15/08/1985
Sex FEMALE
Place of Birth DELHI
Registration No REG123456/2019`;

const sameRowBlocks = sameRowText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("same-row labels", () => {
  const fields = extractBirthFields(sameRowText, sameRowBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const mother = fields.find(f => f.key === "MOTHER_NAME");
  return name?.value === "ANITA KUMARI" && father?.value === "SURESH KUMAR" && mother?.value === "MEENA DEVI";
});

const nextRowText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI
Father's Name
SURESH KUMAR
Date of Birth
15/08/1985`;

const nextRowBlocks = nextRowText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("next-row labels", () => {
  const fields = extractBirthFields(nextRowText, nextRowBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  return name?.value === "ANITA KUMARI" && father?.value === "SURESH KUMAR";
});

const monthDateText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI
Date of Birth
15 August 1985`;

const monthDateBlocks = monthDateText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("month-name date", () => {
  const fields = extractBirthFields(monthDateText, monthDateBlocks);
  const dob = fields.find(f => f.key === "DOB");
  return dob?.value === "15/08/1985" && dob?.confidence === 0.8;
});

const dateRegText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI
Date of Birth
15/08/1985
Date of Registration
20/08/1985`;

const dateRegBlocks = dateRegText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Date of Registration not used as DOB", () => {
  const fields = extractBirthFields(dateRegText, dateRegBlocks);
  const dob = fields.find(f => f.key === "DOB");
  return dob?.value === "15/08/1985" && fields.length === 2;
});

const motherFatherText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI
Father's Name
SURESH KUMAR
Mother's Name
MEENA DEVI`;

const motherFatherBlocks = motherFatherText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("mother vs father vs child names", () => {
  const fields = extractBirthFields(motherFatherText, motherFatherBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const mother = fields.find(f => f.key === "MOTHER_NAME");
  return name?.value === "ANITA KUMARI" &&
         father?.value === "SURESH KUMAR" &&
         mother?.value === "MEENA DEVI" &&
         !(fields.find(f => f.key === "FULL_NAME")?.value === "MEENA DEVI");
});

const placeNextRowText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI
Place of Birth
MUMBAI`;

const placeNextRowBlocks = placeNextRowText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("place on next row", () => {
  const fields = extractBirthFields(placeNextRowText, placeNextRowBlocks);
  const place = fields.find(f => f.key === "PLACE_OF_BIRTH");
  return place?.value === "MUMBAI";
});

const regText = `BIRTH CERTIFICATE
Name of Child
ANITA KUMARI
Registration No
ABC123/2019`;

const regBlocks = regText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("registration number", () => {
  const fields = extractBirthFields(regText, regBlocks);
  const reg = fields.find(f => f.key === "REGISTRATION_NO");
  return reg?.value === "ABC123/2019";
});

const missingText = `BIRTH CERTIFICATE`;

const missingBlocks = missingText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("missing fields", () => {
  const fields = extractBirthFields(missingText, missingBlocks);
  return fields.length === 0;
});

const noisyText = `QR NOISE @#$%^*&*
BIRTH CERTIFICATE
Name of Child
ANITA KUMARI`;

const noisyBlocks = noisyText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("noisy row", () => {
  const fields = extractBirthFields(noisyText, noisyBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  return name?.value === "ANITA KUMARI";
});

const devanagariHeaderText = `जन्म प्रमाण पत्र
Name of Child
ANITA KUMARI
Father's Name
SURESH KUMAR`;

const devanagariBlocks = devanagariHeaderText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Devanagari header row", () => {
  const fields = extractBirthFields(devanagariHeaderText, devanagariBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  return name?.value === "ANITA KUMARI" && father?.value === "SURESH KUMAR";
});

const emptyText = "";
const emptyBlocks: { text: string; box: { x: number; y: number; width: number; height: number } }[] = [];

run("empty input", () => {
  const fields = extractBirthFields(emptyText, emptyBlocks);
  return fields.length === 0;
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);