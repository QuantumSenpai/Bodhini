import { extractRationFields } from "./rationExtract";
import { makeBlock, report, run } from "./smokeHarness";

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

report();
