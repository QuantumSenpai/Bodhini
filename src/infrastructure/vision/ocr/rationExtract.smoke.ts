import { extractRationFields } from "./rationExtract";

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

const cleanText = `RATION CARD
Ration Card No
WB1234567890
Head of Family
SURESH KUMAR SHARMA
Category
BPL
Address
12 MG ROAD
BANGALORE
560001`;

const cleanBlocks = cleanText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("clean card", () => {
  const fields = extractRationFields(cleanText, cleanBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const category = fields.find(f => f.key === "CATEGORY");
  const address = fields.find(f => f.key === "ADDRESS");
  const pin = fields.find(f => f.key === "PIN_CODE");
  return ration?.value === "WB1234567890" && ration?.confidence === 0.8 &&
         name?.value === "SURESH KUMAR SHARMA" && name?.confidence === 0.6 &&
         category?.value === "BPL" && category?.confidence === 0.75 &&
         address?.value === "12 MG ROAD, BANGALORE, 560001" && address?.confidence === 0.65 &&
         pin?.value === "560001" && pin?.confidence === 0.85;
});

const sameRowText = `RATION CARD
Ration Card No WB1234567890
Head of Family SURESH KUMAR
Category APL`;

const sameRowBlocks = sameRowText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("same-row labels", () => {
  const fields = extractRationFields(sameRowText, sameRowBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  const category = fields.find(f => f.key === "CATEGORY");
  return ration?.value === "WB1234567890" && name?.value === "SURESH KUMAR" && category?.value === "APL";
});

const nextRowText = `RATION CARD
Ration Card No
WB1234567890
Head of Family
SURESH KUMAR`;

const nextRowBlocks = nextRowText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("next-row labels", () => {
  const fields = extractRationFields(nextRowText, nextRowBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return ration?.value === "WB1234567890" && name?.value === "SURESH KUMAR";
});

const colonText = `RATION CARD
Ration Card No:
WB1234567890
Head of Family:
SURESH KUMAR`;

const colonBlocks = colonText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("colon separators after labels", () => {
  const fields = extractRationFields(colonText, colonBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return ration?.value === "WB1234567890" && name?.value === "SURESH KUMAR";
});

const dotText = `RATION CARD
Ration Card Number.
WB1234567890
Name of Head.
SURESH KUMAR`;

const dotBlocks = dotText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("dot separators after labels", () => {
  const fields = extractRationFields(dotText, dotBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return ration?.value === "WB1234567890" && name?.value === "SURESH KUMAR";
});

const categoryAayText = `RATION CARD
Head of Family
SURESH KUMAR
Category
AAY`;

const categoryAayBlocks = categoryAayText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("category AAY", () => {
  const fields = extractRationFields(categoryAayText, categoryAayBlocks);
  const category = fields.find(f => f.key === "CATEGORY");
  return category?.value === "AAY";
});

const categoryBplText = `RATION CARD
Head of Family
SURESH KUMAR
Category
BPL`;

const categoryBplBlocks = categoryBplText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("category BPL", () => {
  const fields = extractRationFields(categoryBplText, categoryBplBlocks);
  const category = fields.find(f => f.key === "CATEGORY");
  return category?.value === "BPL";
});

const categoryPhhText = `RATION CARD
Head of Family
SURESH KUMAR
Category
PHH`;

const categoryPhhBlocks = categoryPhhText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("category PHH", () => {
  const fields = extractRationFields(categoryPhhText, categoryPhhBlocks);
  const category = fields.find(f => f.key === "CATEGORY");
  return category?.value === "PHH";
});

const antyodayaText = `RATION CARD
Head of Family
SURESH KUMAR
Category
ANTYODAYA`;

const antyodayaBlocks = antyodayaText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("ANTYODAYA normalized to AAY", () => {
  const fields = extractRationFields(antyodayaText, antyodayaBlocks);
  const category = fields.find(f => f.key === "CATEGORY");
  return category?.value === "AAY";
});

const addressText = `RATION CARD
Ration Card No
WB1234567890
Address
12 MG ROAD
BANGALORE
560001`;

const addressBlocks = addressText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("address with PIN", () => {
  const fields = extractRationFields(addressText, addressBlocks);
  const address = fields.find(f => f.key === "ADDRESS");
  const pin = fields.find(f => f.key === "PIN_CODE");
  return address?.value === "12 MG ROAD, BANGALORE, 560001" && pin?.value === "560001";
});

const addressStopsText = `RATION CARD
Ration Card No
WB1234567890
Address
12 MG ROAD
BANGALORE
560001
Head of Family
SURESH KUMAR`;

const addressStopsBlocks = addressStopsText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("address stops before a label row", () => {
  const fields = extractRationFields(addressStopsText, addressStopsBlocks);
  const address = fields.find(f => f.key === "ADDRESS");
  const name = fields.find(f => f.key === "FULL_NAME");
  return address?.value === "12 MG ROAD, BANGALORE, 560001" && name?.value === "SURESH KUMAR";
});

const emptyValueText = `RATION CARD
Ration Card No

Head of Family
SURESH KUMAR`;

const emptyValueBlocks = emptyValueText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("empty value followed by another label row gives no field", () => {
  const fields = extractRationFields(emptyValueText, emptyValueBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  const name = fields.find(f => f.key === "FULL_NAME");
  return !ration && name?.value === "SURESH KUMAR";
});

const missingText = `RATION CARD`;

const missingBlocks = missingText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("missing fields", () => {
  const fields = extractRationFields(missingText, missingBlocks);
  return fields.length === 0;
});

const noisyText = `QR NOISE @#$%^*&*
RATION CARD
Ration Card No
WB1234567890`;

const noisyBlocks = noisyText.split("\n").map((line, i) => makeBlock(line, 10, i * 30, 200, 25));

run("noisy row", () => {
  const fields = extractRationFields(noisyText, noisyBlocks);
  const ration = fields.find(f => f.key === "RATION_NO");
  return ration?.value === "WB1234567890";
});

const emptyText = "";
const emptyBlocks: { text: string; box: { x: number; y: number; width: number; height: number } }[] = [];

run("empty input", () => {
  const fields = extractRationFields(emptyText, emptyBlocks);
  return fields.length === 0;
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);