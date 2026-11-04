import { resolveFieldKey } from "./field-synonyms";
import { report, run } from "./smokeHarness";

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

report();
