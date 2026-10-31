import { extractFields } from "./extractFields";
import { isValidAadhaar, maskAadhaar } from "../../validation/verhoeff";
import { isValidDate } from "../../validation/formatChecks";

let passCount = 0;
let failCount = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`PASS: ${name}`);
    passCount++;
  } else {
    console.log(`FAIL: ${name}`);
    failCount++;
  }
}

const cleanCard = `Government of India
Priya Sharma
DOB: 15/08/1995
2918 3746 5026
Male
Address: 123 MG Road, Bangalore`;

const cardWithSlogans = `Government of India
Unique Identification Authority of India
Anita Roy
Date of Birth: 22-03-2010
2000 0000 0013
Enrollment No: 1234/56789/12345
www.uidai.gov.in
Helpline: 1947`;

const cardInvalidAadhaar = `Government of India
Rahul Kumar
DOB: 10/12/1988
2918 3746 5027
Address: 45 Gandhi Nagar`;

const cardNoDOB = `Government of India
Sunita Devi
2918 3746 5026
Female
Address: 789 Park Street`;

function runTests() {
  // Clean card
  const r1 = extractFields(cleanCard);
  check("clean card: 3 fields returned", r1.length === 3);
  const a1 = r1.find(f => f.key === "AADHAAR_NO");
  check("clean card: Aadhaar found", a1?.value === "291837465026");
  check("clean card: Aadhaar high confidence", a1?.confidence === 0.95);
  const d1 = r1.find(f => f.key === "DOB");
  check("clean card: DOB found", d1?.value === "15/08/1995");
  check("clean card: DOB valid", isValidDate(d1?.value ?? ""));
  check("clean card: DOB confidence", d1?.confidence === 0.85);
  const n1 = r1.find(f => f.key === "FULL_NAME");
  check("clean card: Name found", n1?.value === "Priya Sharma");
  check("clean card: Name confidence", n1?.confidence === 0.5);

  // Card with slogans
  const r2 = extractFields(cardWithSlogans);
  check("slogan card: 3 fields returned", r2.length === 3);
  const a2 = r2.find(f => f.key === "AADHAAR_NO");
  check("slogan card: Aadhaar found", a2?.value === "200000000013");
  check("slogan card: Aadhaar high confidence", a2?.confidence === 0.95);
  const d2 = r2.find(f => f.key === "DOB");
  check("slogan card: DOB found", d2?.value === "22-03-2010");
  check("slogan card: DOB valid", isValidDate(d2?.value ?? ""));
  const n2 = r2.find(f => f.key === "FULL_NAME");
  check("slogan card: Name found", n2?.value === "Anita Roy");

  // Invalid Aadhaar
  const r3 = extractFields(cardInvalidAadhaar);
  const a3 = r3.find(f => f.key === "AADHAAR_NO");
  check("invalid aadhaar: returns candidate", a3?.value === "291837465027");
  check("invalid aadhaar: low confidence", a3?.confidence === 0.4);
  check("invalid aadhaar: fails check", !isValidAadhaar(a3?.value ?? ""));

  // No DOB
  const r4 = extractFields(cardNoDOB);
  const d4 = r4.find(f => f.key === "DOB");
  check("no dob: DOB value empty", d4?.value === "");
  check("no dob: Name not found (no DOB line)", r4.find(f => f.key === "FULL_NAME")?.value === "");

  console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

runTests();