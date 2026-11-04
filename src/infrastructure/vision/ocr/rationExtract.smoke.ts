import { extractRationFields } from "./rationExtract";
import { makeBlock, report, run } from "./smokeHarness";

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

report();
