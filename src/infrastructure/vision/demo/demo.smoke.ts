import { DemoDocumentProcessor } from "./DemoDocumentProcessor";
import { DemoFormAnalyzer } from "./DemoFormAnalyzer";
import { CONFIDENCE_THRESHOLD } from "../../../domain/constants";
import { run, report } from "../ocr/smokeHarness";

async function main() {
  const doc1 = await DemoDocumentProcessor.analyze("uri1", "en");
  const doc2 = await DemoDocumentProcessor.analyze("uri2", "en");
  const form = await DemoFormAnalyzer.analyze({ kind: "SAMPLE", sampleId: "scholarship" });

  run("both docs returned", () => Boolean(doc1 && doc2));

  run("all sources DEMO", () =>
    [doc1, doc2].every((d) => d.source === "DEMO" && d.fields.every((f) => f.source === "DEMO"))
  );

  run("one low-confidence field exists", () =>
    [...doc1.fields, ...doc2.fields].some((f) => f.confidence < CONFIDENCE_THRESHOLD)
  );

  run("form has SIGNATURE and DECLARATION", () =>
    form.some((f) => f.type === "SIGNATURE") && form.some((f) => f.type === "DECLARATION")
  );

  report();
}

main().catch((e) => {
  console.log(`FAIL: ${e}`);
  process.exit(1);
});
