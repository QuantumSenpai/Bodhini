import { classifyDocument } from "./DocumentClassifier";

let passCount = 0;
let failCount = 0;

function check(name: string, actual: string, expected: string) {
  if (actual === expected) {
    console.log(`PASS: ${name}`);
    passCount++;
  } else {
    console.log(`FAIL: ${name} (got ${actual})`);
    failCount++;
  }
}

check("Aadhaar keyword", classifyDocument("Aadhaar Card Government of India"), "AADHAAR");
check("Aadhaar with valid number", classifyDocument("Government of India 291837465026"), "AADHAAR");
check("PAN keyword", classifyDocument("PAN Card Income Tax Department"), "PAN");
check("Birth Certificate", classifyDocument("Birth Certificate"), "BIRTH_CERTIFICATE");
check("Ration Card", classifyDocument("Ration Card"), "RATION_CARD");
check("Marksheet", classifyDocument("Marksheet"), "MARKSHEET");
check("Domicile", classifyDocument("Domicile Certificate"), "DOMICILE");
check("Other garbage", classifyDocument("Random text without keywords"), "OTHER");
check("Case insensitive", classifyDocument("aadhaar card"), "AADHAAR");

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);