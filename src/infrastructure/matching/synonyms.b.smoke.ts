import { resolveFieldKey } from "./field-synonyms";
import { report, run } from "./smokeHarness";

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

report();
