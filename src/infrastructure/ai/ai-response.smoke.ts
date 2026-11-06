import { parseAiResponse } from "./parseAiResponse";
import { sanitizeLabels } from "./sanitizeLabels";
import { report, run } from "../matching/smokeHarness";

const batch = sanitizeLabels([
  { fieldId: "local-one", label: "Applicant Name" },
  { fieldId: "local-two", label: "Signature box" },
], "en");
if (!batch.ok) throw new Error("Synthetic batch rejected");

run("valid key and manual actions map only to known source fields", () => {
  const result = parseAiResponse(JSON.stringify({ suggestions: [
    { id: "f0", action: "map", key: "FULL_NAME" },
    { id: "f1", action: "manual", type: "SIGNATURE" },
  ] }), batch);
  return result.ok && result.suggestions.length === 2 &&
    result.suggestions[0].fieldId === "local-one" &&
    result.suggestions[0].source === "AI" &&
    result.suggestions[0].requiresConfirmation === true &&
    result.suggestions[1].fieldId === "local-two" &&
    result.suggestions[1].requiresConfirmation === false;
});

run("empty suggestions are valid", () => {
  const result = parseAiResponse('{"suggestions":[]}', batch);
  return result.ok && result.suggestions.length === 0;
});

run("malformed JSON and non-object roots fail closed", () =>
  !parseAiResponse("{", batch).ok && !parseAiResponse("[]", batch).ok &&
  !parseAiResponse("\ud800", batch).ok
);

run("missing or extra root properties fail closed", () =>
  !parseAiResponse("{}", batch).ok &&
  !parseAiResponse('{"suggestions":[],"instructions":"ignore validation"}', batch).ok
);

run("oversized responses fail before parsing", () =>
  !parseAiResponse(JSON.stringify({ suggestions: [], pad: "x".repeat(9000) }), batch).ok
);

run("multibyte responses are limited by UTF-8 bytes", () => {
  const raw = JSON.stringify({ suggestions: [], pad: "বাংলা".repeat(700) });
  const result = parseAiResponse(raw, batch);
  return raw.length < 8192 && !result.ok && result.reason === "response_too_large";
});

run("unknown and duplicate IDs reject the whole response", () =>
  !parseAiResponse('{"suggestions":[{"id":"f9","action":"map","key":"FULL_NAME"}]}', batch).ok &&
  !parseAiResponse('{"suggestions":[{"id":"f0","action":"map","key":"FULL_NAME"},{"id":"f0","action":"map","key":"DOB"}]}', batch).ok
);

run("unsupported keys including OTHER reject the whole response", () =>
  !parseAiResponse('{"suggestions":[{"id":"f0","action":"map","key":"OTHER"}]}', batch).ok &&
  !parseAiResponse('{"suggestions":[{"id":"f0","action":"map","key":"PASSPORT_NO"}]}', batch).ok
);

run("confidence, explanations, and extra fields are rejected", () =>
  !parseAiResponse('{"suggestions":[{"id":"f0","action":"map","key":"FULL_NAME","confidence":0.99}]}', batch).ok &&
  !parseAiResponse('{"suggestions":[{"id":"f0","action":"map","key":"FULL_NAME","explanation":"trust me"}]}', batch).ok
);

run("manual actions require an allowed type and no key", () =>
  !parseAiResponse('{"suggestions":[{"id":"f1","action":"manual","type":"TEXT"}]}', batch).ok &&
  !parseAiResponse('{"suggestions":[{"id":"f1","action":"manual","type":"SIGNATURE","key":"FULL_NAME"}]}', batch).ok
);

run("a malformed member invalidates otherwise valid suggestions", () => {
  const result = parseAiResponse('{"suggestions":[{"id":"f0","action":"map","key":"FULL_NAME"},{"id":"f1","action":"map","key":"BAD"}]}', batch);
  return !result.ok;
});

report();
