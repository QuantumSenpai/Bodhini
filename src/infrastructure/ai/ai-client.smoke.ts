import type { AiFetch, AiHttpResponse, AiClock } from "./AiFormClient";
import { mergeAiSuggestions } from "./mergeSuggestions";
import { FieldMatcher } from "../matching/field-matcher";

let passCount = 0;
let failCount = 0;

async function run(name: string, fn: () => Promise<boolean>): Promise<void> {
  try {
    const ok = await fn();
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
    if (ok) passCount++; else failCount++;
  } catch (error) {
    console.log(`FAIL: ${name} - ${error}`);
    failCount++;
  }
}

class FakeClock implements AiClock {
  private next = 1;
  tasks = new Map<number, { fire: () => void; ms: number }>();
  cleared = 0;

  schedule = (fire: () => void, ms: number): ReturnType<typeof setTimeout> => {
    const id = this.next++;
    this.tasks.set(id, { fire, ms });
    return id as unknown as ReturnType<typeof setTimeout>;
  };

  cancel = (id: ReturnType<typeof setTimeout>): void => {
    this.cleared++;
    this.tasks.delete(id as unknown as number);
  };

  fireOne(): void {
    const next = this.tasks.values().next().value;
    if (!next) throw new Error("No timer to fire");
    next.fire();
  }
}

const endpoint = "https://proxy.example.test/form-keys";
const labels = [{ fieldId: "local-identity", label: "Applicant Name" }];
const validResponse = JSON.stringify({ suggestions: [{ id: "f0", action: "map", key: "FULL_NAME" }] });
const reply = (body: string, ok = true): AiHttpResponse => ({ ok, text: async () => body });

async function main(): Promise<void> {
  let importCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { importCalls++; throw new Error("Unexpected network"); }) as typeof fetch;
  const { AiFormClient } = await import("./AiFormClient");
  globalThis.fetch = originalFetch;

  await run("import and construction make no transport call", async () => {
    const client = new AiFormClient(endpoint, async () => reply('{"suggestions":[]}'));
    return importCalls === 0 && Boolean(client);
  });

  await run("outbound body contains only sanitized labels and opaque IDs", async () => {
    const clock = new FakeClock();
    let body = "";
    let headers: Record<string, string> | undefined;
    let url = "";
    let method = "";
    const fetcher: AiFetch = async (target, init) => {
      url = target; body = init.body; headers = init.headers; method = init.method;
      return reply(validResponse);
    };
    const client = new AiFormClient(endpoint, fetcher, clock);
    const result = await client.suggest([
      { fieldId: "secret-source-id", label: " Applicant   Name " },
      { fieldId: "dropped", label: "email person@example.test" },
      { fieldId: "date", label: "Birth date 12/03/2001 PAN ABCDE1234F number 1234567890" },
    ], "en");
    return result.status === "suggestions" && result.suggestions[0].fieldId === "secret-source-id" &&
      body === JSON.stringify({ language: "en", labels: [
        { id: "f0", label: "Applicant Name" },
        { id: "f2", label: "Birth date [REDACTED] PAN [REDACTED] number [REDACTED]" },
      ] }) && url === endpoint && method === "POST" && headers?.["Content-Type"] === "application/json" &&
      !body.includes("secret-source-id") && !body.includes("person@example.test") &&
      !body.includes("12/03/2001") && !body.includes("ABCDE1234F") &&
      !body.includes("1234567890") && clock.tasks.size === 0 && clock.cleared === 1;
  });

  await run("client rejects non-HTTPS and credential-bearing proxy URLs", async () => {
    const invalid = ["http://proxy.example.test/form", "https://user:pass@proxy.example.test/form", "https://proxy.example.test/form?key=secret"];
    return invalid.every((url) => {
      try { new AiFormClient(url, async () => reply(validResponse)); return false; }
      catch { return true; }
    });
  });

  await run("empty sanitized batch and rejected batch never call transport", async () => {
    let calls = 0;
    const fetcher: AiFetch = async () => { calls++; return reply(validResponse); };
    const client = new AiFormClient(endpoint, fetcher, new FakeClock());
    const empty = await client.suggest([{ fieldId: "one", label: "a@example.test" }], "en");
    const rejected = await client.suggest(Array.from({ length: 41 }, (_, i) => ({
      fieldId: `id-${i}`, label: "Name",
    })), "en");
    return empty.status === "no_suggestions" && rejected.status === "rejected" && calls === 0;
  });

  await run("valid empty response is distinct from an HTTP failure", async () => {
    const empty = await new AiFormClient(endpoint, async () => reply('{"suggestions":[]}'), new FakeClock())
      .suggest(labels, "en");
    const http = await new AiFormClient(endpoint, async () => reply("unavailable", false), new FakeClock())
      .suggest(labels, "en");
    return empty.status === "no_suggestions" && http.status === "failure" && http.reason === "http";
  });

  await run("network rejection leaves local matching usable with no retry", async () => {
    let calls = 0;
    const fetcher: AiFetch = async () => { calls++; throw new Error("synthetic transport failure"); };
    const client = new AiFormClient(endpoint, fetcher, new FakeClock());
    const result = await client.suggest(labels, "en");
    const local = new FieldMatcher().match([{ id: "local-identity", label: "Applicant Name", type: "TEXT", required: true }], []);
    const merged = mergeAiSuggestions(local, result.status === "suggestions" ? result.suggestions : []);
    return result.status === "failure" && result.reason === "network" && calls === 1 && merged[0] === local[0];
  });

  await run("malformed and oversized response bodies fail closed", async () => {
    const malformed = await new AiFormClient(endpoint, async () => reply("{"), new FakeClock()).suggest(labels, "en");
    const oversized = await new AiFormClient(endpoint, async () => reply("x".repeat(9000)), new FakeClock()).suggest(labels, "en");
    return malformed.status === "failure" && malformed.reason === "response" &&
      oversized.status === "failure" && oversized.reason === "response";
  });

  await run("oversized content length fails before body read", async () => {
    let reads = 0;
    const fetcher: AiFetch = async () => ({
      ok: true,
      headers: { get: () => "9000" },
      text: async () => { reads++; return validResponse; },
    });
    const result = await new AiFormClient(endpoint, fetcher, new FakeClock()).suggest(labels, "en");
    return result.status === "failure" && result.reason === "response" && reads === 0;
  });

  await run("failure paths clear timers and caller listeners", async () => {
    const clock = new FakeClock();
    const caller = new AbortController();
    let removed = 0;
    const originalRemove = caller.signal.removeEventListener.bind(caller.signal);
    caller.signal.removeEventListener = ((...args: Parameters<AbortSignal["removeEventListener"]>) => {
      removed++;
      return originalRemove(...args);
    }) as AbortSignal["removeEventListener"];
    const network = await new AiFormClient(endpoint, async () => { throw new Error("offline"); }, clock)
      .suggest(labels, "en", caller.signal);
    const http = await new AiFormClient(endpoint, async () => reply("no", false), clock)
      .suggest(labels, "en", caller.signal);
    const body = await new AiFormClient(endpoint, async () => ({ ok: true, text: async () => { throw new Error("read"); } }), clock)
      .suggest(labels, "en", caller.signal);
    return network.status === "failure" && http.status === "failure" && body.status === "failure" &&
      removed === 3 && clock.cleared === 3 && clock.tasks.size === 0;
  });

  await run("timeout at 8000 ms aborts transport and clears the timer", async () => {
    const clock = new FakeClock();
    let transportSignal: AbortSignal | undefined;
    const fetcher: AiFetch = async (_url, init) => {
      transportSignal = init.signal;
      return await new Promise<AiHttpResponse>(() => undefined);
    };
    const pending = new AiFormClient(endpoint, fetcher, clock).suggest(labels, "en");
    await Promise.resolve();
    const duration = [...clock.tasks.values()][0]?.ms;
    clock.fireOne();
    const result = await pending;
    return duration === 8000 && result.status === "timeout" && transportSignal?.aborted === true &&
      clock.tasks.size === 0 && clock.cleared === 1;
  });

  await run("caller cancellation differs from timeout and removes its listener", async () => {
    const clock = new FakeClock();
    const caller = new AbortController();
    let removed = 0;
    const originalRemove = caller.signal.removeEventListener.bind(caller.signal);
    caller.signal.removeEventListener = ((...args: Parameters<AbortSignal["removeEventListener"]>) => {
      removed++;
      return originalRemove(...args);
    }) as AbortSignal["removeEventListener"];
    let transportSignal: AbortSignal | undefined;
    const fetcher: AiFetch = async (_url, init) => {
      transportSignal = init.signal;
      return await new Promise<AiHttpResponse>(() => undefined);
    };
    const pending = new AiFormClient(endpoint, fetcher, clock).suggest(labels, "en", caller.signal);
    caller.abort();
    const result = await pending;
    return result.status === "cancelled" && transportSignal?.aborted === true &&
      removed === 1 && clock.tasks.size === 0 && clock.cleared === 1;
  });

  await run("already cancelled request allocates no timer and sends nothing", async () => {
    const clock = new FakeClock();
    const caller = new AbortController();
    caller.abort();
    let calls = 0;
    const fetcher: AiFetch = async () => { calls++; return reply(validResponse); };
    const result = await new AiFormClient(endpoint, fetcher, clock).suggest(labels, "en", caller.signal);
    return result.status === "cancelled" && calls === 0 && clock.tasks.size === 0;
  });

  await run("cancellation during timer setup skips transport and cleans up", async () => {
    const caller = new AbortController();
    let cancelled = 0;
    let calls = 0;
    const clock: AiClock = {
      schedule: () => {
        caller.abort();
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
      cancel: () => { cancelled++; },
    };
    const fetcher: AiFetch = async () => { calls++; return reply(validResponse); };
    const result = await new AiFormClient(endpoint, fetcher, clock).suggest(labels, "en", caller.signal);
    return result.status === "cancelled" && calls === 0 && cancelled === 1;
  });

  console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
  if (failCount > 0) process.exitCode = 1;
}

main().catch((error) => { console.log(`FAIL: suite - ${error}`); process.exitCode = 1; });
