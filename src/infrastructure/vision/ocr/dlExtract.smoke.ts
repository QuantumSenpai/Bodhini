import { extractDlFields } from "./dlExtract";

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

const cleanText = `DRIVING LICENCE
DL0720191234567
Name
SURESH KUMAR SHARMA
S/D/W of
RAMESH KUMAR SHARMA
Date of Birth
15/08/1985
Blood Group
O+
Valid Till
15/06/2022
Address
12 MG ROAD
560001`;

const cleanBlocks = cleanText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("clean card", () => {
  const fields = extractDlFields(cleanText, cleanBlocks);
  const dl = fields.find(f => f.key === "DL_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const dob = fields.find(f => f.key === "DOB");
  const blood = fields.find(f => f.key === "BLOOD_GROUP");
  const validity = fields.find(f => f.key === "VALIDITY");
  const address = fields.find(f => f.key === "ADDRESS");
  const pin = fields.find(f => f.key === "PIN_CODE");
  return dl?.value === "DL0720191234567" && dl?.confidence === 0.95 &&
         name?.value === "SURESH KUMAR SHARMA" && name?.confidence === 0.6 &&
         father?.value === "RAMESH KUMAR SHARMA" && father?.confidence === 0.6 &&
         dob?.value === "15/08/1985" && dob?.confidence === 0.85 &&
         blood?.value === "O+" && blood?.confidence === 0.8 &&
         validity?.value === "15/06/2022" && validity?.confidence === 0.8 &&
         address?.value === "12 MG ROAD, 560001" && address?.confidence === 0.65 &&
         pin?.value === "560001" && pin?.confidence === 0.85;
});

const hyphenText = `DRIVING LICENCE
DL-07-20191234567
Name
SURESH KUMAR`;

const hyphenBlocks = hyphenText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("token with space and hyphen", () => {
  const fields = extractDlFields(hyphenText, hyphenBlocks);
  const dl = fields.find(f => f.key === "DL_NO");
  return dl?.value === "DL0720191234567" && dl?.confidence === 0.95;
});

const repairText = `DRIVING LICENCE
DL1220191234OI7
Name
SURESH KUMAR`;

const repairBlocks = repairText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("O/0 and I/1 repair in DL", () => {
  const fields = extractDlFields(repairText, repairBlocks);
  const dl = fields.find(f => f.key === "DL_NO");
  return dl?.value === "DL1220191234017" && dl?.confidence === 0.8;
});

const validText = `DRIVING LICENCE
DL0720191234567
Name
SURESH KUMAR`;

const validBlocks = validText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("valid token unchanged", () => {
  const fields = extractDlFields(validText, validBlocks);
  const dl = fields.find(f => f.key === "DL_NO");
  return dl?.value === "DL0720191234567" && dl?.confidence === 0.95;
});

const aadhaarText = `GOVERNMENT OF INDIA
291837465026`;

const aadhaarBlocks = aadhaarText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Aadhaar text returns no DL_NO", () => {
  const fields = extractDlFields(aadhaarText, aadhaarBlocks);
  const dl = fields.find(f => f.key === "DL_NO");
  return !dl;
});

const dateIssueText = `DRIVING LICENCE
DL0720191234567
Name
SURESH KUMAR
Date of Issue
15/08/1985`;

const dateIssueBlocks = dateIssueText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("Date of Issue not used as DOB", () => {
  const fields = extractDlFields(dateIssueText, dateIssueBlocks);
  const dob = fields.find(f => f.key === "DOB");
  return !dob;
});

const bloodText = `DRIVING LICENCE
DL0720191234567
Name
SURESH KUMAR
Blood Group
AB-`;

const bloodBlocks = bloodText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("blood group", () => {
  const fields = extractDlFields(bloodText, bloodBlocks);
  const blood = fields.find(f => f.key === "BLOOD_GROUP");
  return blood?.value === "AB-";
});

const validityText = `DRIVING LICENCE
DL0720191234567
Name
SURESH KUMAR
Valid Till
15/06/2022`;

const validityBlocks = validityText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("validity", () => {
  const fields = extractDlFields(validityText, validityBlocks);
  const validity = fields.find(f => f.key === "VALIDITY");
  return validity?.value === "15/06/2022";
});

const addressText = `DRIVING LICENCE
DL0720191234567
Address
12 MG ROAD
560001`;

const addressBlocks = addressText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("address with PIN", () => {
  const fields = extractDlFields(addressText, addressBlocks);
  const address = fields.find(f => f.key === "ADDRESS");
  const pin = fields.find(f => f.key === "PIN_CODE");
  return address?.value === "12 MG ROAD, 560001" && pin?.value === "560001";
});

const missingText = `DRIVING LICENCE
DL0720191234567`;

const missingBlocks = missingText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("missing fields", () => {
  const fields = extractDlFields(missingText, missingBlocks);
  const name = fields.find(f => f.key === "FULL_NAME");
  const dob = fields.find(f => f.key === "DOB");
  const blood = fields.find(f => f.key === "BLOOD_GROUP");
  const validity = fields.find(f => f.key === "VALIDITY");
  const father = fields.find(f => f.key === "FATHER_NAME");
  const address = fields.find(f => f.key === "ADDRESS");
  return fields.length === 1 && name === undefined && dob === undefined && blood === undefined && validity === undefined && father === undefined && address === undefined;
});

const noisyText = `QR NOISE @#$%^*&*
DRIVING LICENCE
DL0720191234567
Name
SURESH KUMAR`;

const noisyBlocks = noisyText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("noisy garbage row", () => {
  const fields = extractDlFields(noisyText, noisyBlocks);
  const dl = fields.find(f => f.key === "DL_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return dl?.value === "DL0720191234567" && name?.value === "SURESH KUMAR";
});

const emptyText = "";
const emptyBlocks: { text: string; box: { x: number; y: number; width: number; height: number } }[] = [];

run("empty input", () => {
  const fields = extractDlFields(emptyText, emptyBlocks);
  return fields.length === 0;
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);
