import { resolveFieldKey } from "./field-synonyms";

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

run("EPIC_NO: English 'voter id no' resolves", () => {
  const r = resolveFieldKey("voter id no");
  return r?.key === "EPIC_NO";
});

run("EPIC_NO: Hindi 'मतदाता पहचान पत्र संख्या' resolves", () => {
  const r = resolveFieldKey("मतदाता पहचान पत्र संख्या");
  return r?.key === "EPIC_NO";
});

run("EPIC_NO: Bengali 'ভোটার আইডি নম্বর' resolves", () => {
  const r = resolveFieldKey("ভোটার আইডি নম্বর");
  return r?.key === "EPIC_NO";
});

run("DL_NO: English 'driving licence no' resolves", () => {
  const r = resolveFieldKey("driving licence no");
  return r?.key === "DL_NO";
});

run("DL_NO: Hindi 'ड्राइविंग लाइसेंस नंबर' resolves", () => {
  const r = resolveFieldKey("ड्राइविंग लाइसेंस नंबर");
  return r?.key === "DL_NO";
});

run("DL_NO: Bengali 'ড্রাইভিং লাইসেন্স নম্বর' resolves", () => {
  const r = resolveFieldKey("ড্রাইভিং লাইসেন্স নম্বর");
  return r?.key === "DL_NO";
});

run("RATION_NO: English 'ration card no' resolves", () => {
  const r = resolveFieldKey("ration card no");
  return r?.key === "RATION_NO";
});

run("RATION_NO: Hindi 'राशन कार्ड नंबर' resolves", () => {
  const r = resolveFieldKey("राशन कार्ड नंबर");
  return r?.key === "RATION_NO";
});

run("RATION_NO: Bengali 'রেশন কার্ড নম্বর' resolves", () => {
  const r = resolveFieldKey("রেশন কার্ড নম্বর");
  return r?.key === "RATION_NO";
});

run("CATEGORY: English 'ration category' resolves", () => {
  const r = resolveFieldKey("ration category");
  return r?.key === "CATEGORY";
});

run("CATEGORY: Hindi 'राशन श्रेणी' resolves", () => {
  const r = resolveFieldKey("राशन श्रेणी");
  return r?.key === "CATEGORY";
});

run("CATEGORY: Bengali 'রেশন শ্রেণি' resolves", () => {
  const r = resolveFieldKey("রেশন শ্রেণি");
  return r?.key === "CATEGORY";
});

run("BLOOD_GROUP: English 'blood group' resolves", () => {
  const r = resolveFieldKey("blood group");
  return r?.key === "BLOOD_GROUP";
});

run("BLOOD_GROUP: Hindi 'रक्त समूह' resolves", () => {
  const r = resolveFieldKey("रक्त समूह");
  return r?.key === "BLOOD_GROUP";
});

run("BLOOD_GROUP: Bengali 'রক্তের গ্রুপ' resolves", () => {
  const r = resolveFieldKey("রক্তের গ্রুপ");
  return r?.key === "BLOOD_GROUP";
});

run("VALIDITY: English 'valid upto' resolves", () => {
  const r = resolveFieldKey("valid upto");
  return r?.key === "VALIDITY";
});

run("VALIDITY: Hindi 'वैध तिथि तक' resolves", () => {
  const r = resolveFieldKey("वैध तिथि तक");
  return r?.key === "VALIDITY";
});

run("VALIDITY: Bengali 'মেয়াদ' resolves", () => {
  const r = resolveFieldKey("মেয়াদ");
  return r?.key === "VALIDITY";
});

run("PLACE_OF_BIRTH: English 'place of birth' resolves", () => {
  const r = resolveFieldKey("place of birth");
  return r?.key === "PLACE_OF_BIRTH";
});

run("PLACE_OF_BIRTH: Hindi 'जन्म स्थान' resolves", () => {
  const r = resolveFieldKey("जन्म स्थान");
  return r?.key === "PLACE_OF_BIRTH";
});

run("PLACE_OF_BIRTH: Bengali 'জন্মস্থান' resolves", () => {
  const r = resolveFieldKey("জন্মস্থান");
  return r?.key === "PLACE_OF_BIRTH";
});

run("REGISTRATION_NO: English 'birth registration no' resolves", () => {
  const r = resolveFieldKey("birth registration no");
  return r?.key === "REGISTRATION_NO";
});

run("REGISTRATION_NO: Hindi 'जन्म पंजीकरण नंबर' resolves", () => {
  const r = resolveFieldKey("जन्म पंजीकरण नंबर");
  return r?.key === "REGISTRATION_NO";
});

run("REGISTRATION_NO: Bengali 'জন্ম নিবন্ধন নম্বর' resolves", () => {
  const r = resolveFieldKey("জন্ম নিবন্ধন নম্বর");
  return r?.key === "REGISTRATION_NO";
});

run("NEGATIVE: 'Category' alone must not give CATEGORY", () => {
  const r = resolveFieldKey("Category");
  return r?.key !== "CATEGORY";
});

run("NEGATIVE: 'Registration No' alone must not give REGISTRATION_NO", () => {
  const r = resolveFieldKey("Registration No");
  return r?.key !== "REGISTRATION_NO";
});

run("NEGATIVE: 'Application No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Application No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Application No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Application No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Application No' must not give DL_NO", () => {
  const r = resolveFieldKey("Application No");
  return r?.key !== "DL_NO";
});

run("NEGATIVE: 'Serial No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Serial No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Serial No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Serial No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Serial No' must not give DL_NO", () => {
  const r = resolveFieldKey("Serial No");
  return r?.key !== "DL_NO";
});

run("NEGATIVE: 'Roll No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Roll No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Roll No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Roll No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Roll No' must not give DL_NO", () => {
  const r = resolveFieldKey("Roll No");
  return r?.key !== "DL_NO";
});

run("NEGATIVE: 'Aadhaar No' must not give RATION_NO", () => {
  const r = resolveFieldKey("Aadhaar No");
  return r?.key !== "RATION_NO";
});

run("NEGATIVE: 'Aadhaar No' must not give EPIC_NO", () => {
  const r = resolveFieldKey("Aadhaar No");
  return r?.key !== "EPIC_NO";
});

run("NEGATIVE: 'Aadhaar No' must not give DL_NO", () => {
  const r = resolveFieldKey("Aadhaar No");
  return r?.key !== "DL_NO";
});

run("EXISTING: 'Applicant Name' resolves to FULL_NAME", () => {
  const r = resolveFieldKey("Applicant Name");
  return r?.key === "FULL_NAME";
});

run("EXISTING: \"Father's Name\" resolves to FATHER_NAME", () => {
  const r = resolveFieldKey("Father's Name");
  return r?.key === "FATHER_NAME";
});

run("EXISTING: 'Permanent Address' resolves to ADDRESS", () => {
  const r = resolveFieldKey("Permanent Address");
  return r?.key === "ADDRESS";
});

run("EXISTING: 'Date of Birth' resolves to DOB", () => {
  const r = resolveFieldKey("Date of Birth");
  return r?.key === "DOB";
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);