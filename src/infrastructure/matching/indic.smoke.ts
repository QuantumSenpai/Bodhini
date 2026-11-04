import { normalizeLabel, resolveFieldKey } from "./field-synonyms";

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean) {
  let ok = false;
  try {
    ok = fn();
  } catch (e) {
    console.log(`FAIL: ${name} - ${e}`);
    failCount++;
    return;
  }
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (ok) passCount++; else failCount++;
}

function key(label: string): string | null {
  const r = resolveFieldKey(label);
  return r ? r.key : null;
}

function is(label: string, expected: string | null) {
  run(`${label} -> ${expected}`, () => key(label) === expected);
}

run("normalizer keeps Hindi vowel signs", () => normalizeLabel("पिन") === "पिन");
run("normalizer keeps Bengali vowel signs", () => normalizeLabel("ঠিকানা") === "ঠিকানা");
run("Hindi PIN and PAN do not collide", () => normalizeLabel("पिन") !== normalizeLabel("पैन"));

is("पिन", "PIN_CODE");
is("पैन", "PAN_NO");
is("पिन कोड", "PIN_CODE");
is("PIN", "PIN_CODE");
is("Pin Code", "PIN_CODE");
is("PAN", "PAN_NO");
is("Address", "ADDRESS");
is("पता", "ADDRESS");
is("ঠিকানা", "ADDRESS");
is("Correspondence Address", "ADDRESS");
is("Postal Address", "ADDRESS");
is("Phone", "PHONE");
is("Phone No", "PHONE");
is("फोन", "PHONE");
is("ফোন", "PHONE");
is("Applicant's Name", "FULL_NAME");
is("नाम", "FULL_NAME");
is("নাম", "FULL_NAME");
is("Name", "FULL_NAME");
is("Father's Name", "FATHER_NAME");
is("पिता का नाम", "FATHER_NAME");
is("पिताजी का नाम", "FATHER_NAME");
is("Mother's Name", "MOTHER_NAME");
is("माता का नाम", "MOTHER_NAME");
is("মাতার নাম", "MOTHER_NAME");
is("পিতার নাম", "FATHER_NAME");
is("Aadhaar No.", "AADHAAR_NO");
is("आधार संख्या", "AADHAAR_NO");
is("আধার নম্বর", "AADHAAR_NO");
is("जन्म तिथि", "DOB");
is("জন্ম তারিখ", "DOB");
is("मोबाइल नंबर", "PHONE");
is("Application No", null);
is("Serial No", null);
is("Registration No", null);
is("Category", null);
is("No", null);
is("Number", null);
is("Date", null);
is("नंबर", null);
is("तारीख", null);
run("Application Date is not DOB", () => key("Application Date") !== "DOB");
run("आवेदन तिथि is not DOB", () => key("आवेदन तिथि") !== "DOB");

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
