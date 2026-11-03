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
check("PAN number only with garbled heading", classifyDocument("XYZ123 ABCDE1234F random text"), "PAN");
check("PAN keyword without number still returns PAN", classifyDocument("PAN Card Income Tax Department"), "PAN");
check("Aadhaar card text still returns AADHAAR", classifyDocument("Aadhaar Card Government of India 291837465026"), "AADHAAR");
check("random 10 char token that fails isValidPan returns Other", classifyDocument("ABCD1234EF random text"), "OTHER");
check("text with valid PAN and valid Aadhaar returns AADHAAR", classifyDocument("Aadhaar ABCDE1234F and 291837465026"), "AADHAAR");
check("ration card text with a valid Aadhaar number printed returns Ration Card", classifyDocument("Ration Card 291837465026"), "RATION_CARD");
check("birth certificate text with a valid Aadhaar number returns Birth Certificate", classifyDocument("Birth Certificate 291837465026"), "BIRTH_CERTIFICATE");

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);