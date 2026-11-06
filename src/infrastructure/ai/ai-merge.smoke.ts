import type { DocumentRecord, FieldKey } from "../../domain/document/document.types";
import type { FormField } from "../../domain/form/form.types";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";
import { CopyListBuilder } from "../export/copy-list-builder";
import { FieldMatcher } from "../matching/field-matcher";
import { report, run } from "../matching/smokeHarness";
import { confirmReviewField, editReviewField } from "../../state/form-review-explanation";
import { mergeAiSuggestions } from "./mergeSuggestions";
import { parseAiResponse } from "./parseAiResponse";
import { sanitizeLabels } from "./sanitizeLabels";

function form(id: string, label: string, type: FormField["type"] = "TEXT"): FormField {
  return { id, label, type, required: true };
}

function doc(key: FieldKey, value: string): DocumentRecord {
  return {
    id: "saved-1", type: "AADHAAR", imageUri: null, createdAt: 1, confirmedAt: 1,
    fields: [{ id: "value-1", key, label: key, value, confidence: 0.9, source: "DEMO" }],
  };
}

function proposals(labels: { fieldId: string; label: string }[], wire: object) {
  const batch = sanitizeLabels(labels, "en");
  if (!batch.ok) throw new Error("Bad synthetic request");
  const parsed = parseAiResponse(JSON.stringify(wire), batch);
  if (!parsed.ok) throw new Error("Bad synthetic response");
  return parsed.suggestions;
}

run("AI key adds an unmapped proposal without filling or copy eligibility", () => {
  const fields = new FieldMatcher().match([form("mystery", "Mystery Reference")], [doc("FULL_NAME", "Asha Rao")]);
  const before = JSON.stringify(fields);
  const merged = mergeAiSuggestions(fields, proposals([
    { fieldId: "mystery", label: "Mystery Reference" },
  ], { suggestions: [{ id: "f0", action: "map", key: "FULL_NAME" }] }));
  return JSON.stringify(fields) === before && merged.length === 1 && merged[0].field.id === "mystery" &&
    merged[0].matchedKey === "FULL_NAME" && merged[0].matchReasonCode === "aiSuggestion" &&
    merged[0].status === "NEEDS_USER" && merged[0].value === null && merged[0].confidence < CONFIDENCE_THRESHOLD &&
    new CopyListBuilder().buildCopyItems(merged).length === 0;
});

run("exact value, missing-value key, confirmation, and local skip stay authoritative", () => {
  const local = new FieldMatcher().match([
    form("exact", "Full Name"), form("missing", "Date of Birth"),
    form("skip", "Applicant Signature", "SIGNATURE"), form("unknown", "Mystery Reference"),
  ], [doc("FULL_NAME", "Asha Rao")]);
  const suggested = proposals(local.map((f) => ({ fieldId: f.field.id, label: f.field.label })), {
    suggestions: [
      { id: "f0", action: "map", key: "PAN_NO" },
      { id: "f1", action: "map", key: "FULL_NAME" },
      { id: "f2", action: "map", key: "FULL_NAME" },
      { id: "f3", action: "map", key: "ADDRESS" },
    ],
  });
  const merged = mergeAiSuggestions(local, suggested);
  return merged.length === local.length && merged[0] === local[0] && merged[1] === local[1] &&
    merged[2] === local[2] && merged[0].value === "Asha Rao" &&
    merged[0].confidence >= CONFIDENCE_THRESHOLD && merged[1].matchedKey === "DOB" &&
    merged[2].status === "SKIPPED" && merged[3].matchedKey === "ADDRESS";
});

run("manual completion actions use existing skip semantics", () => {
  const fields = new FieldMatcher().match([
    form("sig", "Ink mark area"), form("decl", "Acknowledgment box"),
  ], []);
  const merged = mergeAiSuggestions(fields, proposals([
    { fieldId: "sig", label: "Ink mark area" },
    { fieldId: "decl", label: "Acknowledgment box" },
  ], { suggestions: [
    { id: "f0", action: "manual", type: "SIGNATURE" },
    { id: "f1", action: "manual", type: "DECLARATION" },
  ] }));
  return fields.every((f) => f.status === "NEEDS_USER" && f.matchReasonCode === "unknownField") &&
    merged.every((f) => f.status === "SKIPPED" && f.value === null &&
    f.confidence === 0 && f.matchReasonCode === "skipped") &&
    merged[0].field.type === "SIGNATURE" && merged[1].field.type === "DECLARATION";
});

run("reapplying the same suggestion is repeatable and does not duplicate fields", () => {
  const fields = new FieldMatcher().match([form("unknown", "Mystery Reference")], []);
  const suggestion = proposals([{ fieldId: "unknown", label: "Mystery Reference" }], {
    suggestions: [{ id: "f0", action: "map", key: "PAN_NO" }],
  });
  const once = mergeAiSuggestions(fields, suggestion);
  const twice = mergeAiSuggestions(once, suggestion);
  return once.length === 1 && twice.length === 1 && JSON.stringify(once) === JSON.stringify(twice);
});

run("later manual edit or changed label makes an in-flight suggestion stale", () => {
  const fields = new FieldMatcher().match([form("unknown", "Mystery Reference")], []);
  const suggestion = proposals([{ fieldId: "unknown", label: "Mystery Reference" }], {
    suggestions: [{ id: "f0", action: "map", key: "PAN_NO" }],
  });
  const edited = editReviewField(fields[0], "Asha Rao");
  const relabeled = { ...fields[0], field: { ...fields[0].field, label: "New label" } };
  return mergeAiSuggestions([edited], suggestion)[0] === edited &&
    mergeAiSuggestions([relabeled], suggestion)[0] === relabeled;
});

run("an earlier local decision is not replaced by an AI suggestion", () => {
  const fields = new FieldMatcher().match([form("unknown", "Mystery Reference")], []);
  const suggestion = proposals([{ fieldId: "unknown", label: "Mystery Reference" }], {
    suggestions: [{ id: "f0", action: "map", key: "PAN_NO" }],
  });
  const localDecision = { ...fields[0], matchedKey: "FULL_NAME" as FieldKey };
  return mergeAiSuggestions([localDecision], suggestion)[0] === localDecision;
});

run("a confirmed fuzzy saved value is never replaced", () => {
  const fuzzy = new FieldMatcher().match([form("fuzzy", "applicant nmae")], [doc("FULL_NAME", "Asha Rao")])[0];
  const confirmed = confirmReviewField(fuzzy);
  const suggestion = proposals([{ fieldId: "fuzzy", label: "applicant nmae" }], {
    suggestions: [{ id: "f0", action: "map", key: "PAN_NO" }],
  });
  return fuzzy.confidence < CONFIDENCE_THRESHOLD && confirmed.confidence === 1 &&
    mergeAiSuggestions([confirmed], suggestion)[0] === confirmed &&
    confirmed.value === "Asha Rao" && confirmed.matchedKey === "FULL_NAME";
});

report();
