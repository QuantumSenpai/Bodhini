import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { AiFormClient } from "../src/infrastructure/ai/AiFormClient";
import { FieldMatcher } from "../src/infrastructure/matching/field-matcher";

const endpoint = "https://runtime.test/v1/form-labels";
const body = (labels: { id: string; label: string }[] = [{ id: "f0", label: "Applicant Name" }], language = "en") =>
  JSON.stringify({ language, labels });
const post = (payload = body(), headers: Record<string, string> = {}) => ({
  method: "POST", body: payload, headers: { "content-type": "application/json", ...headers },
});
let passed = 0;
let failed = 0;

async function run(name: string, check: () => Promise<void>): Promise<void> {
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([check(), new Promise<never>((_resolve, reject) => {
      deadline = setTimeout(() => reject(new Error("runtime test deadline exceeded")), 12000);
    })]);
    passed++;
    console.log(`PASS: ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL: ${name}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (deadline) clearTimeout(deadline);
  }
}

async function runtime(entry: string): Promise<Miniflare> {
  const config = readFileSync(resolve("worker/wrangler.toml"), "utf8");
  const date = /^compatibility_date = "([^"]+)"$/m.exec(config)?.[1];
  const flags = /^compatibility_flags = (\[[^\n]+\])$/m.exec(config)?.[1];
  assert.equal(/^main = "([^"]+)"$/m.exec(config)?.[1], "src/index.ts");
  assert.ok(date && flags);
  const compatibilityFlags = JSON.parse(flags) as string[];
  const result = await build({
    entryPoints: [resolve("worker", entry)], bundle: true, platform: "browser", format: "esm",
    target: "es2022", write: false, logLevel: "silent",
  });
  assert.equal(result.outputFiles.length, 1);
  return new Miniflare({ modules: true, script: result.outputFiles[0].text,
    compatibilityDate: date, compatibilityFlags });
}

async function main(): Promise<void> {
  const production = await runtime("src/index.ts");
  try {
    const fake = await runtime("test/runtime-entry.ts");
    try {
      await run("production entrypoint stays disabled and preserves routing", async () => {
        const unavailable = await production.dispatchFetch(endpoint, post(body(), { "x-test-provider": "map" }));
        assert.equal(unavailable.status, 503);
        assert.deepEqual(await unavailable.json(), { error: "provider_unavailable" });
        assert.equal(unavailable.headers.get("cache-control"), "no-store");
        assert.equal(unavailable.headers.get("x-test-provider-calls"), null);
        const route = await production.dispatchFetch("https://runtime.test/other", post());
        const method = await production.dispatchFetch(endpoint);
        const media = await production.dispatchFetch(endpoint, post(body(), { "content-type": "text/plain" }));
        assert.deepEqual([route.status, method.status, media.status], [404, 405, 415]);
        assert.deepEqual(await route.json(), { error: "not_found" });
        assert.deepEqual(await method.json(), { error: "method_not_allowed" });
        assert.deepEqual(await media.json(), { error: "unsupported_media_type" });
      });

      await run("fake provider maps, returns empty results, and routes manual actions", async () => {
        const mapped = await fake.dispatchFetch(endpoint, post());
        assert.deepEqual(await mapped.json(), { suggestions: [{ id: "f0", action: "map", key: "FULL_NAME" }] });
        assert.equal(mapped.headers.get("x-test-provider-calls"), "1");
        assert.equal(mapped.headers.get("x-test-active-timers"), "0");
        const empty = await fake.dispatchFetch(endpoint, post(body(), { "x-test-provider": "empty" }));
        assert.deepEqual(await empty.json(), { suggestions: [] });
        const manual = await fake.dispatchFetch(endpoint, post(body([
          { id: "f0", label: "Ink mark" }, { id: "f2", label: "Acknowledgment" },
        ]), { "x-test-provider": "manual" }));
        assert.deepEqual(await manual.json(), { suggestions: [
          { id: "f0", action: "manual", type: "SIGNATURE" },
          { id: "f2", action: "manual", type: "DECLARATION" },
        ] });
      });

      await run("strict input rejects without provider and keeps opaque IDs after filtering", async () => {
        const invalid = ["{", JSON.stringify({ ...JSON.parse(body()), prompt: "synthetic" }),
          body([{ id: "f0", label: "Name" }], "fr"), body([{ id: "f0", label: "Name" }, { id: "f0", label: "Address" }])];
        for (const payload of invalid) {
          const response = await fake.dispatchFetch(endpoint, post(payload));
          assert.equal(response.status, 400);
          assert.equal(response.headers.get("x-test-provider-calls"), "0");
          assert.deepEqual(await response.json(), { error: "invalid_request" });
        }
        const filtered = await fake.dispatchFetch(endpoint, post(body([
          { id: "f0", label: "Contact a＠example.test" }, { id: "f2", label: "Applicant Name" },
        ])));
        assert.deepEqual(await filtered.json(), { suggestions: [{ id: "f2", action: "map", key: "FULL_NAME" }] });
      });

      await run("actual incoming byte limit counts multibyte text", async () => {
        const labels = Array.from({ length: 40 }, (_, index) => ({ id: `f${index}`, label: "অ".repeat(120) }));
        const base = body(labels, "bn");
        const padding = 16384 - new TextEncoder().encode(base).byteLength;
        assert.ok(padding > 0);
        const exact = await fake.dispatchFetch(endpoint, post(base + " ".repeat(padding)));
        assert.equal(exact.status, 200);
        const over = await fake.dispatchFetch(endpoint, post(base + " ".repeat(padding + 1)));
        assert.equal(over.status, 413);
        assert.equal(over.headers.get("x-test-provider-calls"), "0");
        assert.deepEqual(await over.json(), { error: "request_too_large" });
      });

      await run("missing and false-low lengths still reject oversized incoming chunks", async () => {
        for (const inputMode of ["chunk", "chunk-no-length"]) {
          const response = await fake.dispatchFetch(endpoint, post(body(), { "x-test-input": inputMode }));
          assert.equal(response.status, 413);
          assert.equal(response.headers.get("x-test-declared-length"), inputMode === "chunk" ? "1" : "absent");
          assert.equal(response.headers.get("x-test-provider-calls"), "0");
          assert.equal(response.headers.get("x-test-input-cancellations"), "1");
          assert.equal(response.headers.get("x-test-active-timers"), "0");
        }
      });

      await run("oversized multibyte provider chunk is cancelled with missing or false-low length", async () => {
        for (const mode of ["oversized", "oversized-no-length"]) {
          const response = await fake.dispatchFetch(endpoint, post(body(), { "x-test-provider": mode }));
          assert.equal(response.status, 502);
          assert.deepEqual(await response.json(), { error: "provider_failure" });
          assert.equal(response.headers.get("x-test-output-cancellations"), "1");
          assert.equal(response.headers.get("x-test-active-timers"), "0");
        }
      });

      await run("provider output accepts 8192 bytes and rejects one extra byte", async () => {
        const exact = await fake.dispatchFetch(endpoint, post(body(), { "x-test-provider": "boundary" }));
        const over = await fake.dispatchFetch(endpoint, post(body(), { "x-test-provider": "boundary-over" }));
        assert.equal(exact.status, 200);
        assert.deepEqual(await exact.json(), { suggestions: [] });
        assert.equal(over.status, 502);
        assert.deepEqual(await over.json(), { error: "provider_failure" });
        assert.equal(over.headers.get("x-test-active-timers"), "0");
      });

      await run("stalled incoming body reaches its separate two-second deadline", async () => {
        const response = await fake.dispatchFetch(endpoint, post(body(), { "x-test-input": "stall" }));
        assert.equal(response.status, 408);
        assert.deepEqual(await response.json(), { error: "request_timeout" });
        assert.equal(response.headers.get("x-test-provider-calls"), "0");
        assert.equal(response.headers.get("x-test-input-cancellations"), "1");
        assert.equal(response.headers.get("x-test-deadlines"), "2000");
        assert.equal(response.headers.get("x-test-active-timers"), "0");
      });

      await run("manual request abort cancels an incoming body", async () => {
        const response = await fake.dispatchFetch(endpoint, post(body(), { "x-test-input": "abort" }));
        assert.equal(response.status, 499);
        assert.deepEqual(await response.json(), { error: "cancelled" });
        assert.equal(response.headers.get("x-test-provider-calls"), "0");
        assert.equal(response.headers.get("x-test-input-cancellations"), "1");
        assert.equal(response.headers.get("x-test-active-timers"), "0");
      });

      await run("provider work reaches its separate five-second deadline", async () => {
        const response = await fake.dispatchFetch(endpoint, post(body(), { "x-test-provider": "stall" }));
        assert.equal(response.status, 504);
        assert.deepEqual(await response.json(), { error: "provider_timeout" });
        assert.equal(response.headers.get("x-test-provider-calls"), "1");
        assert.equal(response.headers.get("x-test-deadlines"), "2000,5000");
        assert.equal(response.headers.get("x-test-active-timers"), "0");
      });

      await run("Phase 3C client accepts runtime suggestions and retains local fallback", async () => {
        const scope = { formSessionId: "synthetic-form", revision: 0, attemptId: "runtime" };
        const local = new FieldMatcher().match([{ id: "local", label: "Mystery Reference", type: "TEXT", required: true }], []);
        const labels = [{ fieldId: "local", label: "Mystery Reference" }];
        const via = (worker: Miniflare, mode?: string) => new AiFormClient(endpoint,
          (url, init) => worker.dispatchFetch(url, { ...init,
            headers: { ...init.headers, ...(mode ? { "x-test-provider": mode } : {}) },
          }));
        const success = await via(fake).suggest(labels, "en", scope);
        const empty = await via(fake, "empty").suggest(labels, "en", scope);
        const manual = await via(fake, "manual").suggest([
          { fieldId: "signature", label: "Ink mark" },
          { fieldId: "declaration", label: "Acknowledgment" },
        ], "en", scope);
        const rejected = await via(production).suggest(labels, "en", scope);
        const failed = await via(fake, "http-failure").suggest(labels, "en", scope);
        assert.equal(success.status, "suggestions");
        if (success.status === "suggestions") {
          assert.equal(success.suggestions[0].fieldId, "local");
          assert.equal(success.suggestions[0].action, "map");
          if (success.suggestions[0].action === "map") assert.equal(success.suggestions[0].key, "FULL_NAME");
        }
        assert.deepEqual(empty, { status: "no_suggestions", suggestions: [] });
        assert.equal(manual.status, "suggestions");
        if (manual.status === "suggestions") {
          assert.deepEqual(manual.suggestions.map((item) => [item.fieldId, item.action, item.action === "manual" ? item.type : ""]), [
            ["signature", "manual", "SIGNATURE"], ["declaration", "manual", "DECLARATION"],
          ]);
        }
        assert.deepEqual(rejected, { status: "failure", reason: "http" });
        assert.deepEqual(failed, { status: "failure", reason: "http" });
        assert.equal(local[0].status, "NEEDS_USER");
        assert.equal(local[0].matchedKey, undefined);
      });
    } finally {
      await fake.dispose();
    }
  } finally {
    await production.dispose();
  }
  console.log(`\nPASS: ${passed}, FAIL: ${failed}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.log(`FAIL: Worker runtime setup: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
