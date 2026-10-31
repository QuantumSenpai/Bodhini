import { DemoDocumentProcessor } from "./DemoDocumentProcessor";
import { DemoFormAnalyzer } from "./DemoFormAnalyzer";
import { CONFIDENCE_THRESHOLD } from "../../../domain/constants";
import type { FormField } from "../../../domain/form/form.types";

async function run() {
  const processor = DemoDocumentProcessor;
  const analyzer = DemoFormAnalyzer;

  const doc1 = await processor.analyze("uri1", "en");
  const doc2 = await processor.analyze("uri2", "en");
  const form = await analyzer.analyze({ kind: "SAMPLE", sampleId: "scholarship" });

  let pass = true;

  if (!(doc1 && doc2)) {
    console.log("FAIL: both docs returned");
    pass = false;
  } else {
    console.log("PASS: both docs returned");
  }

  const allDemoSource = doc1.source === "DEMO" && doc2.source === "DEMO" && doc1.fields.every(f => f.source === "DEMO") && doc2.fields.every(f => f.source === "DEMO");
  if (!allDemoSource) {
    console.log("FAIL: all sources DEMO");
    pass = false;
  } else {
    console.log("PASS: all sources DEMO");
  }

  const hasLowConfidence = [...doc1.fields, ...doc2.fields].some(f => f.confidence < CONFIDENCE_THRESHOLD);
  if (!hasLowConfidence) {
    console.log("FAIL: one low-confidence field exists");
    pass = false;
  } else {
    console.log("PASS: one low-confidence field exists");
  }

  const hasSignature = form.some(f => f.type === "SIGNATURE");
  const hasDeclaration = form.some(f => f.type === "DECLARATION");
  if (!hasSignature || !hasDeclaration) {
    console.log("FAIL: form has SIGNATURE and DECLARATION");
    pass = false;
  } else {
    console.log("PASS: form has SIGNATURE and DECLARATION");
  }
}

run().catch(() => console.log("FAIL: error"));