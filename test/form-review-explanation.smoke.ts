import { CONFIDENCE_THRESHOLD } from "../src/domain/constants";
import type { DocumentRecord, FieldKey } from "../src/domain/document/document.types";
import type { FilledField, FormField } from "../src/domain/form/form.types";
import { t, type TranslationKey } from "../src/i18n/translations";
import { copyItemKey, filledFieldKey } from "../src/infrastructure/export/copy-key";
import { CopyListBuilder } from "../src/infrastructure/export/copy-list-builder";
import { FieldMatcher } from "../src/infrastructure/matching/field-matcher";
import { resolveFieldKey } from "../src/infrastructure/matching/field-synonyms";
import { report, run } from "../src/infrastructure/matching/smokeHarness";
import { confirmReviewField, editReviewField, reviewFieldExplanation } from "../src/state/form-review-explanation";

function form(label: string, type: FormField["type"] = "TEXT"): FormField {
  return { id: label, label, type, required: true };
}

function document(id: string, key: FieldKey, value: string): DocumentRecord {
  return {
    id, type: "AADHAAR", imageUri: null, createdAt: 100, confirmedAt: 100,
    fields: [{ id: `${id}-field`, key, label: key, value, confidence: 0.9, source: "DEMO" }],
  };
}

function match(label: string, docs: DocumentRecord[], type?: FormField["type"]): FilledField {
  return new FieldMatcher().match([form(label, type)], docs)[0];
}

run("exact reason reaches match and the review explanation", () => {
  const field = match("applicant name", [document("one", "FULL_NAME", "Ravi Kumar")]);
  return resolveFieldKey("applicant name")?.matchType === "exact" &&
    field.matchReasonCode === "exact" && field.matchReason?.includes("Exact") === true &&
    reviewFieldExplanation(field, "en") === t("en", "matchExact");
});

run("synonym reason reaches match and the review explanation", () => {
  const label = "applicant name on form";
  const field = match(label, [document("one", "FULL_NAME", "Ravi Kumar")]);
  return resolveFieldKey(label)?.matchType === "synonym" &&
    field.matchReasonCode === "synonym" && field.value === "Ravi Kumar" &&
    reviewFieldExplanation(field, "en") === t("en", "matchSynonym");
});

run("fuzzy suggestion asks for confirmation and Confirm keeps its key", () => {
  const field = match("applicant nmae", [document("one", "FULL_NAME", "Ravi Kumar")]);
  const confirmed = confirmReviewField(field);
  return field.matchReasonCode === "fuzzy" && field.confidence < CONFIDENCE_THRESHOLD &&
    reviewFieldExplanation(field, "en") === t("en", "matchFuzzy") &&
    confirmed.matchedKey === "FULL_NAME" && confirmed.confidence === 1 &&
    confirmed.matchReasonCode === "fuzzy" &&
    reviewFieldExplanation(confirmed, "en") === t("en", "matchFuzzyConfirmed");
});

run("conflicting saved values get a distinct reason without a value", () => {
  const field = match("applicant name", [
    document("one", "FULL_NAME", "Ravi Kumar"),
    document("two", "FULL_NAME", "Ravi Sharma"),
  ]);
  return field.status === "NEEDS_USER" && field.value === null &&
    field.matchReasonCode === "conflict" && field.matchedKey === "FULL_NAME" &&
    field.matchReason?.includes("Conflicting") === true &&
    reviewFieldExplanation(field, "en") === t("en", "matchConflict");
});

run("recognized label without saved data is different from an unknown label", () => {
  const missing = match("date of birth", []);
  const unknown = match("mystery reference", []);
  return missing.status === "NEEDS_USER" && missing.matchReasonCode === "missingValue" &&
    missing.matchedKey === "DOB" && Boolean(missing.matchReason) &&
    reviewFieldExplanation(missing, "en") === t("en", "matchMissingValue") &&
    unknown.status === "NEEDS_USER" && unknown.matchReasonCode === "unknownField" &&
    unknown.matchedKey === undefined && Boolean(unknown.matchReason) &&
    reviewFieldExplanation(unknown, "en") === t("en", "matchUnknownField");
});

run("signature and declaration skip reasons reach match", () => {
  const signature = match("Applicant signature", [], "SIGNATURE");
  const declaration = match("Declaration", [], "DECLARATION");
  return [signature, declaration].every((field) =>
    field.status === "SKIPPED" && field.matchReasonCode === "skipped" &&
    Boolean(field.matchReason) &&
    reviewFieldExplanation(field, "en") === t("en", "manualComplete")
  );
});

run("manual edit replaces saved-value provenance and keeps the sensitive key", () => {
  const field = match("aadhaar numbr", [document("one", "AADHAAR_NO", "291837465026")]);
  const edited = editReviewField(field, "291837465027");
  return field.matchReasonCode === "fuzzy" && edited.status === "FILLED" &&
    edited.confidence === 1 && edited.matchedKey === "AADHAAR_NO" &&
    edited.sourceDocumentId === undefined && edited.matchReasonCode === "manual" &&
    edited.matchReason === "Answer entered manually during review" &&
    reviewFieldExplanation(edited, "en") === t("en", "matchManual");
});

run("Aadhaar and PAN keep their keys and copy items after review actions", () => {
  const docs = [
    document("aadhaar", "AADHAAR_NO", "291837465026"),
    document("pan", "PAN_NO", "ABCDE1234F"),
  ];
  const matched = new FieldMatcher().match([form("aadhaar numbr"), form("pan numbr")], docs);
  const confirmed = matched.map(confirmReviewField);
  const edited = confirmed.map((field) => editReviewField(field, field.value!));
  const items = new CopyListBuilder().buildCopyItems(confirmed);
  return matched[0].confidence < CONFIDENCE_THRESHOLD && matched[1].confidence < CONFIDENCE_THRESHOLD &&
    confirmed.every((field) => field.confidence >= CONFIDENCE_THRESHOLD) &&
    confirmed[0].matchedKey === "AADHAAR_NO" && confirmed[1].matchedKey === "PAN_NO" &&
    edited[0].matchedKey === "AADHAAR_NO" && edited[1].matchedKey === "PAN_NO" &&
    edited.every((field) => field.matchReasonCode === "manual") &&
    filledFieldKey(edited[0]) === "AADHAAR_NO" && filledFieldKey(edited[1]) === "PAN_NO" &&
    copyItemKey(items[0]) === "AADHAAR_NO" && copyItemKey(items[1]) === "PAN_NO" &&
    items[0].value === "•••• •••• 5026" && items[1].value === "ABCDE1234F";
});

run("clearing an answer asks for manual input", () => {
  const field = match("applicant name", [document("one", "FULL_NAME", "Ravi Kumar")]);
  const cleared = editReviewField(field, "   ");
  return cleared.status === "NEEDS_USER" && cleared.confidence === 0 &&
    cleared.matchReasonCode === "manual" && cleared.matchedKey === "FULL_NAME" &&
    reviewFieldExplanation(cleared, "en") === t("en", "enterAnswer");
});

run("older fields without a reason use only a safe skipped fallback", () => {
  const old = { field: form("Old field"), status: "FILLED" as const,
    value: "old", confidence: 0.9, matchReason: "Partial label match with confirmed document record" };
  return reviewFieldExplanation(old, "en") === null &&
    reviewFieldExplanation({ ...old, status: "NEEDS_USER", value: null }, "en") === null &&
    reviewFieldExplanation({ ...old, status: "SKIPPED", value: null }, "en") === t("en", "manualComplete");
});

run("every new explanation has English, Hindi, and Bengali text", () => {
  const keys: TranslationKey[] = [
    "matchExact", "matchSynonym", "matchFuzzy", "matchFuzzyConfirmed",
    "matchConflict", "matchMissingValue", "matchUnknownField", "matchManual",
  ];
  return keys.every((key) => {
    const english = t("en", key);
    const hindi = t("hi", key);
    const bengali = t("bn", key);
    return english.trim().length > 0 && hindi.trim().length > 0 && bengali.trim().length > 0 &&
      hindi !== english && bengali !== english;
  });
});

report();
