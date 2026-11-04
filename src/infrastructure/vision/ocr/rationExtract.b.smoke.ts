import { extractRationFields } from "./rationExtract";
import { makeBlock, report, run } from "./smokeHarness";

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

report();
