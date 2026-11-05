import { FIELD_SYNONYMS, normalizeLabel, resolveFieldKey } from "./field-synonyms";
import { resolveFieldKeyFuzzy } from "./fuzzy-resolver";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";
import { FormField } from "../../domain/form/form.types";
import { FieldMatcher } from "./field-matcher";
import { CopyListBuilder } from "../export/copy-list-builder";
import { copyItemKey, filledFieldKey } from "../export/copy-key";
import { displayValue } from "../export/fieldDisplay";
import { DocumentRecord, ExtractedField } from "../../domain/document/document.types";
import { run, report } from "./smokeHarness";

function oneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  if (a.length === b.length) {
    const differences = [...a].flatMap((char, i) => char === b[i] ? [] : [i]);
    return differences.length === 1 ||
      (differences.length === 2 &&
        differences[1] === differences[0] + 1 &&
        a[differences[0]] === b[differences[1]] &&
        a[differences[1]] === b[differences[0]]);
  }
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  for (let i = 0; i < longer.length; i++) {
    if (shorter === longer.slice(0, i) + longer.slice(i + 1)) return true;
  }
  return false;
}

run("plausible missing letter: permanent adress resolves only by fuzzy", () => {
  const label = "permanent adress";
  const r = resolveFieldKeyFuzzy(label);
  return resolveFieldKey(label) === null && r?.key === "ADDRESS" && r.matchType === "partial";
});

run("adjacent swap: applicant nmae resolves only by fuzzy", () => {
  const label = "applicant nmae";
  const r = resolveFieldKeyFuzzy(label);
  return resolveFieldKey(label) === null && r?.key === "FULL_NAME" && r.matchType === "partial";
});

run("two missing letters in long label: permanet adress resolves", () => {
  const label = "permanet adress";
  const r = resolveFieldKeyFuzzy(label);
  return normalizeLabel(label).length > 8 && resolveFieldKey(label) === null &&
    r?.key === "ADDRESS" && r.matchType === "partial";
});

run("short tier: gendre is one edit from gender and resolves", () => {
  const label = "gendre";
  const normalized = normalizeLabel(label);
  const r = resolveFieldKeyFuzzy(label);
  return normalized.length >= 5 && normalized.length <= 8 &&
    FIELD_SYNONYMS.GENDER.includes("gender") &&
    normalizeLabel("gender").length >= 5 &&
    oneEditApart(normalized, "gender") &&
    resolveFieldKey(label) === null &&
    r?.key === "GENDER" && r.matchType === "partial";
});

run("short tier: gendrex is two edits from gender and is rejected", () => {
  const label = "gendrex";
  const normalized = normalizeLabel(label);
  return normalized.length >= 5 && normalized.length <= 8 &&
    FIELD_SYNONYMS.GENDER.includes("gender") &&
    !oneEditApart(normalized, "gender") &&
    normalized.slice(0, -1) === "gendre" && oneEditApart("gendre", "gender") &&
    resolveFieldKey(label) === null && resolveFieldKeyFuzzy(label) === null;
});

run("labels shorter than five characters do not fuzzy match", () =>
  ["dab", "pxn", "pon"].every((label) => normalizeLabel(label).length < 5 && resolveFieldKeyFuzzy(label) === null)
);

run("Hindi and Bengali labels do not fuzzy match", () =>
  resolveFieldKeyFuzzy("पूर नाम") === null && resolveFieldKeyFuzzy("পূর নাম") === null
);

run("an exact dictionary label is left to the ordinary resolver", () =>
  resolveFieldKey("applicant name")?.matchType === "exact" &&
  resolveFieldKeyFuzzy("applicant name") === null
);

run("pho number is tied at distance two to PAN_NO and PHONE", () => {
  const label = "pho number";
  const synonyms = Object.entries(FIELD_SYNONYMS).flatMap(([key, values]) =>
    values.map((value) => ({ key, normalized: normalizeLabel(value) }))
  ).filter(({ normalized }) => /^[a-z ]+$/.test(normalized) && normalized.length >= 5);
  const noCloserSynonym = synonyms.every(({ normalized }) =>
    normalized !== label && !oneEditApart(label, normalized)
  );
  const panTwoSubstitutions = [...label].filter((char, i) => char !== "pan number"[i]).length === 2;
  const phoneTwoInsertions = "phone number".replace("ne", "") === label &&
    "phone number".length === label.length + 2;
  return FIELD_SYNONYMS.PAN_NO.includes("pan number") &&
    FIELD_SYNONYMS.PHONE.includes("phone number") &&
    panTwoSubstitutions && phoneTwoInsertions && noCloserSynonym &&
    resolveFieldKey(label) === null && resolveFieldKeyFuzzy(label) === null;
});

run("number qualifier blocks roll number from PHONE at the same distance as toll number", () => {
  const candidate = "cell number";
  const toll = "toll number";
  const roll = "roll number";
  const differences = (label: string) =>
    [...label].filter((char, i) => char !== candidate[i]).length;
  return FIELD_SYNONYMS.PHONE.includes(candidate) &&
    differences(toll) === 2 && differences(roll) === 2 &&
    resolveFieldKey(toll) === null && resolveFieldKey(roll) === null &&
    resolveFieldKeyFuzzy(toll)?.key === "PHONE" &&
    resolveFieldKeyFuzzy(roll) === null;
});

run("fathe name resolves to FATHER_NAME rather than FULL_NAME", () => {
  const r = resolveFieldKeyFuzzy("fathe name");
  return FIELD_SYNONYMS.FATHER_NAME.includes("father name") &&
    resolveFieldKey("fathe name") === null &&
    r?.key === "FATHER_NAME" && r.matchType === "partial";
});

run("mothe name resolves to MOTHER_NAME rather than FULL_NAME", () => {
  const r = resolveFieldKeyFuzzy("mothe name");
  return FIELD_SYNONYMS.MOTHER_NAME.includes("mother name") &&
    resolveFieldKey("mothe name") === null &&
    r?.key === "MOTHER_NAME" && r.matchType === "partial";
});

run("spuse name stays unresolved while person nme can fuzzy-match FULL_NAME", () => {
  return resolveFieldKey("spuse name") === null &&
    resolveFieldKeyFuzzy("person nme")?.key === "FULL_NAME" &&
    resolveFieldKeyFuzzy("spuse name") === null;
});

run("unrelated word stays unresolved", () => resolveFieldKeyFuzzy("xyzabc") === null);

function makeDoc(fields: Partial<ExtractedField>[]): DocumentRecord {
  return {
    id: "doc1",
    type: "AADHAAR",
    imageUri: null,
    fields: fields.map((f, index) => ({
      id: f.id ?? `f${index + 1}`,
      key: f.key!,
      label: f.label ?? "",
      value: f.value ?? "",
      confidence: f.confidence ?? 0.9,
      source: f.source ?? "OCR",
    })),
    createdAt: 100,
    confirmedAt: 100,
  };
}

function form(label: string): FormField {
  return { id: label, label, type: "TEXT", required: true };
}

run("matcher keeps exact father's name key, value, and 0.95 confidence", () => {
  const doc = makeDoc([
    { key: "FULL_NAME", value: "John Doe" },
    { key: "FATHER_NAME", value: "Ravi Doe" },
  ]);
  const r = new FieldMatcher().matchDetailed([form("Father's Name")], [doc])[0];
  return r.status === "FILLED" && r.matchedKey === "FATHER_NAME" &&
    r.value === "Ravi Doe" && r.confidence === 0.95 &&
    r.matchReason.includes("Exact");
});

run("matcher gives genuine fuzzy match partial confidence below confirmation threshold", () => {
  const doc = makeDoc([{ key: "FULL_NAME", value: "John Doe" }]);
  const r = new FieldMatcher().matchDetailed([form("applicant nmae")], [doc])[0];
  return resolveFieldKey("applicant nmae") === null &&
    r.status === "FILLED" && r.matchedKey === "FULL_NAME" &&
    r.value === "John Doe" && r.confidence === 0.7 &&
    r.confidence < CONFIDENCE_THRESHOLD && r.matchReason.includes("Partial");
});

run("app match retains fuzzy Aadhaar and PAN keys below confirmation threshold", () => {
  const doc = makeDoc([
    { key: "AADHAAR_NO", value: "291837465026" },
    { key: "PAN_NO", value: "ABCDE1234F" },
  ]);
  const [aadhaar, pan] = new FieldMatcher().match([form("aadhaar numbr"), form("pan numbr")], [doc]);
  return aadhaar.matchedKey === "AADHAAR_NO" && aadhaar.value === "291837465026" &&
    aadhaar.confidence === 0.7 && aadhaar.confidence < CONFIDENCE_THRESHOLD &&
    pan.matchedKey === "PAN_NO" && pan.value === "ABCDE1234F" &&
    pan.confidence === 0.7 && pan.confidence < CONFIDENCE_THRESHOLD;
});

run("confirmed fuzzy sensitive values keep keys and copy-item display rules", () => {
  const doc = makeDoc([
    { key: "AADHAAR_NO", value: "291837465026" },
    { key: "PAN_NO", value: "ABCDE1234F" },
  ]);
  const matched = new FieldMatcher().match([form("aadhaar numbr"), form("pan numbr")], [doc]);
  const confirmed = matched.map((field) => ({ ...field, confidence: 1 }));
  const items = new CopyListBuilder().buildCopyItems(confirmed);
  return confirmed[0].matchedKey === "AADHAAR_NO" && confirmed[1].matchedKey === "PAN_NO" &&
    filledFieldKey(confirmed[0]) === "AADHAAR_NO" && filledFieldKey(confirmed[1]) === "PAN_NO" &&
    displayValue("AADHAAR_NO", confirmed[0].value!, false) === "•••• •••• 5026" &&
    displayValue("AADHAAR_NO", confirmed[0].value!, true) === "2918 3746 5026" &&
    displayValue("PAN_NO", confirmed[1].value!, false) === "ABCDE1234F" &&
    items[0].key === "AADHAAR_NO" && items[1].key === "PAN_NO" &&
    items[0].value === "•••• •••• 5026" && items[1].value === "ABCDE1234F" &&
    copyItemKey(items[0]) === "AADHAAR_NO" && copyItemKey(items[1]) === "PAN_NO";
});

run("copy paths prefer matched keys and retain legacy key fallback", () => {
  const aadhaar = { field: { ...form("aadhaar numbr"), key: "PAN_NO" as const },
    matchedKey: "AADHAAR_NO" as const, value: "291837465026", status: "FILLED" as const, confidence: 1 };
  const legacyPan = { field: { ...form("PAN Number"), key: "PAN_NO" as const },
    value: "ABCDE1234F", status: "FILLED" as const, confidence: 1 };
  const [aadhaarItem, panItem] = new CopyListBuilder().buildCopyItems([aadhaar, legacyPan]);
  return filledFieldKey(aadhaar) === "AADHAAR_NO" && filledFieldKey(legacyPan) === "PAN_NO" &&
    copyItemKey(aadhaarItem) === "AADHAAR_NO" && copyItemKey(panItem) === "PAN_NO" &&
    copyItemKey({ fieldId: "old", label: "PAN Number", value: "ABCDE1234F", status: "FILLED" }) === "PAN_NO";
});

run("fuzzy label without a saved value needs the user", () => {
  const doc = makeDoc([{ key: "FULL_NAME", value: "" }]);
  const r = new FieldMatcher().matchDetailed([form("applicant nmae")], [doc])[0];
  return r.status === "NEEDS_USER" && r.value === null;
});

run("signature type with a typo remains skipped", () => {
  const field: FormField = { ...form("signture"), type: "SIGNATURE" };
  const r = new FieldMatcher().matchDetailed([field], [makeDoc([])])[0];
  return r.status === "SKIPPED" && r.value === null;
});

report();
