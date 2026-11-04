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
check("Voter ID text returns VOTER_ID", classifyDocument("ELECTION COMMISSION OF INDIA ELECTOR PHOTO IDENTITY CARD ABC1234567"), "VOTER_ID");
check("EPIC only with garbled heading returns VOTER_ID", classifyDocument("XYZ123 ABC1234567 random text"), "VOTER_ID");
check("Aadhaar text still AADHAAR", classifyDocument("Aadhaar Card Government of India 291837465026"), "AADHAAR");
check("PAN text still PAN", classifyDocument("PAN Card Income Tax Department ABCDE1234F"), "PAN");
check("ration card text unchanged", classifyDocument("Ration Card 291837465026"), "RATION_CARD");
check("ration card with EPIC-like token returns RATION_CARD", classifyDocument("Ration Card WBA1234567"), "RATION_CARD");
check("birth certificate with EPIC-like token returns BIRTH_CERTIFICATE", classifyDocument("Birth Certificate WBA1234567"), "BIRTH_CERTIFICATE");
check("Voter ID with Date of Birth and Sex returns VOTER_ID", classifyDocument("ELECTION COMMISSION OF INDIA Elector Name SURESH KUMAR Date of Birth 15/08/1985 Sex MALE ABC1234567"), "VOTER_ID");
check("DL text returns DRIVING_LICENCE", classifyDocument("Driving Licence DL0720191234567"), "DRIVING_LICENCE");
check("DL token with garbled heading returns DRIVING_LICENCE", classifyDocument("XYZ123 DL0720191234567 random text"), "DRIVING_LICENCE");
check("Voter text with Date of Birth still VOTER_ID", classifyDocument("ELECTION COMMISSION OF INDIA Elector Name SURESH KUMAR Date of Birth 15/08/1985 Sex MALE ABC1234567"), "VOTER_ID");
check("ration card with DL-like token returns RATION_CARD", classifyDocument("Ration Card DL0720191234567"), "RATION_CARD");
check("Aadhaar text still AADHAAR", classifyDocument("Aadhaar Card Government of India 291837465026"), "AADHAAR");
check("PAN text still PAN", classifyDocument("PAN Card Income Tax Department ABCDE1234F"), "PAN");
check("Voter text still VOTER_ID", classifyDocument("ELECTION COMMISSION OF INDIA Elector Photo Identity Card ABC1234567"), "VOTER_ID");
check("Birth Certificate with Date of Birth Father Name Registration returns BIRTH_CERTIFICATE", classifyDocument("Birth Certificate Date of Birth 15/08/1985 Father's Name SURESH KUMAR Registration No REG123456"), "BIRTH_CERTIFICATE");
check("Birth Certificate with valid Aadhaar still BIRTH_CERTIFICATE", classifyDocument("Birth Certificate 291837465026 Date of Birth 15/08/1985"), "BIRTH_CERTIFICATE");
check("Birth Certificate not VOTER_ID", classifyDocument("Birth Certificate Date of Birth 15/08/1985 Father's Name SURESH KUMAR"), "BIRTH_CERTIFICATE");
check("Birth Certificate not DRIVING_LICENCE", classifyDocument("Birth Certificate Date of Birth 15/08/1985"), "BIRTH_CERTIFICATE");

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
