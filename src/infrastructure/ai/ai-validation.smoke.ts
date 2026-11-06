import { MAX_LABELS, MAX_LABEL_CHARS, MAX_REQUEST_BYTES, sanitizeLabels, utf8ByteLength } from "./sanitizeLabels";
import { report, run } from "../matching/smokeHarness";

run("two labels keep opaque position IDs after an email-like label is dropped", () => {
  const result = sanitizeLabels([
    { fieldId: "local-a", label: "  Applicant   Name  " },
    { fieldId: "local-b", label: "Contact a@example.test" },
    { fieldId: "local-c", label: "Permanent Address" },
  ], "en");
  return result.ok && JSON.stringify(result.request) === JSON.stringify({
    language: "en",
    labels: [
      { id: "f0", label: "Applicant Name" },
      { id: "f2", label: "Permanent Address" },
    ],
  }) && result.sources.f2.fieldId === "local-c";
});

run("40 labels are accepted and 41 are rejected before any drops", () => {
  const forty = Array.from({ length: MAX_LABELS }, (_, i) => ({ fieldId: `local-${i}`, label: "Applicant Name" }));
  return sanitizeLabels(forty, "en").ok &&
    JSON.stringify(sanitizeLabels([...forty, { fieldId: "extra", label: "contact@test.invalid" }], "en")) ===
      JSON.stringify({ ok: false, reason: "too_many_labels" });
});

run("120 normalized characters are accepted and 121 rejected", () => {
  const accepted = sanitizeLabels([{ fieldId: "a", label: "A".repeat(MAX_LABEL_CHARS) }], "en");
  const rejected = sanitizeLabels([{ fieldId: "a", label: "A".repeat(MAX_LABEL_CHARS + 1) }], "en");
  return accepted.ok && accepted.request.labels[0].label.length === MAX_LABEL_CHARS &&
    !rejected.ok && rejected.reason === "label_too_long";
});

run("overall UTF-8 request size is bounded", () => {
  const labels = Array.from({ length: 40 }, (_, i) => ({ fieldId: `id-${i}`, label: "𐐀".repeat(120) }));
  const result = sanitizeLabels(labels, "bn");
  return !result.ok && result.reason === "request_too_large";
});

run("exact 16384-byte request passes and one extra byte rejects", () => {
  const labels = Array.from({ length: 40 }, (_, i) => ({ fieldId: `id-${i}`, label: "অ".repeat(120) }));
  const requestBytes = () => utf8ByteLength(JSON.stringify({ language: "bn", labels: labels.map((item, i) => ({
    id: `f${i}`, label: item.label,
  })) }));
  const needed = MAX_REQUEST_BYTES - requestBytes();
  if (needed <= 0 || needed >= 4800) return false;
  for (let i = 0; i < needed; i++) {
    const index = Math.floor(i / 120);
    const position = i % 120;
    const chars = Array.from(labels[index].label);
    chars[position] = "𐐀";
    labels[index].label = chars.join("");
  }
  const atLimit = sanitizeLabels(labels, "bn");
  const chars = Array.from(labels[39].label);
  chars[119] = "𐐀";
  labels[39].label = chars.join("");
  const overLimit = sanitizeLabels(labels, "bn");
  return atLimit.ok && utf8ByteLength(atLimit.body) === MAX_REQUEST_BYTES &&
    !overLimit.ok && overLimit.reason === "request_too_large";
});

run("numeric dates, PAN patterns, and long digit runs are masked", () => {
  const result = sanitizeLabels([
    { fieldId: "one", label: "Birth date 12/03/2001 PAN ABCDE1234F number 1234567890" },
  ], "en");
  return result.ok && result.request.labels[0].label ===
    "Birth date [REDACTED] PAN [REDACTED] number [REDACTED]" &&
    !result.body.includes("12/03/2001") && !result.body.includes("ABCDE1234F") &&
    !result.body.includes("1234567890");
});

run("ISO and month-name dates and Indic long digit runs are masked", () => {
  const result = sanitizeLabels([
    { fieldId: "one", label: "Issued 2001-03-12 and 12 Jan 2001 and १२३४५६" },
  ], "hi");
  return result.ok && result.request.labels[0].label ===
    "Issued [REDACTED] and [REDACTED] and [REDACTED]";
});

run("two affected labels pass but three reject, counting each label once", () => {
  const two = [
    { fieldId: "one", label: "DOB 12/03/2001 PAN ABCDE1234F" },
    { fieldId: "two", label: "Number 1234567890" },
  ];
  const accepted = sanitizeLabels(two, "en");
  const rejected = sanitizeLabels([...two, { fieldId: "three", label: "Issued 2002-04-13" }], "en");
  return accepted.ok && accepted.request.labels.length === 2 &&
    !rejected.ok && rejected.reason === "too_many_masked_labels";
});

run("empty and fully redacted labels are dropped without renumbering", () => {
  const result = sanitizeLabels([
    { fieldId: "blank", label: " \n " },
    { fieldId: "numeric", label: "1234567890" },
    { fieldId: "remaining", label: "Full Name" },
  ], "en");
  return result.ok && result.request.labels.length === 1 &&
    result.request.labels[0].id === "f2" && result.sources.f2.fieldId === "remaining";
});

run("duplicate source IDs and invalid language reject the batch", () => {
  const labels = [{ fieldId: "same", label: "Name" }, { fieldId: "same", label: "Address" }];
  const duplicate = sanitizeLabels(labels, "en");
  const language = sanitizeLabels([{ fieldId: "one", label: "Name" }], "fr" as "en");
  return !duplicate.ok && duplicate.reason === "duplicate_field_id" &&
    !language.ok && language.reason === "invalid_language";
});

report();
