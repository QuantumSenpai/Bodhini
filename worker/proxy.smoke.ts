import { AiFormClient } from "../src/infrastructure/ai/AiFormClient";
import type { AiFetch } from "../src/infrastructure/ai/AiFormClient";
import { FieldMatcher } from "../src/infrastructure/matching/field-matcher";
import type { ProxyClock, ProviderAdapter } from "./src/handler";
import { BODY_READ_TIMEOUT_MS, ENDPOINT, PROVIDER_INSTRUCTION, PROVIDER_TIMEOUT_MS, handleProxy, serializeSuggestions } from "./src/handler";
import { readBoundedText } from "./src/boundedBody";
import { utf8ByteLength } from "../src/infrastructure/ai/sanitizeLabels";

let passed = 0;
let failed = 0;
async function run(name: string, test: () => Promise<boolean> | boolean): Promise<void> {
  try {
    const ok = await test();
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
    if (ok) passed++; else failed++;
  } catch {
    console.log(`FAIL: ${name}`);
    failed++;
  }
}

const base = "https://worker.test" + ENDPOINT;
const labels = [{ id: "f0", label: "Applicant Name" }];
const wire = (items: object[] = labels, language = "en") => JSON.stringify({ language, labels: items });
const request = (body = wire(), options: { contentType?: string; length?: string; signal?: AbortSignal } = {}) =>
  new Request(base, { method: "POST", headers: {
    "content-type": options.contentType ?? "application/json",
    ...(options.length === undefined ? {} : { "content-length": options.length }),
  }, body, signal: options.signal });
const reply = (body: string, status = 200, contentType = "application/json", length?: string) =>
  new Response(body, { status, headers: {
    "content-type": contentType,
    ...(length === undefined ? {} : { "content-length": length }),
  } });
const map = (id = "f0", key = "FULL_NAME") => ({ id, action: "map", key });
const provider: ProviderAdapter = async () => reply(JSON.stringify({ suggestions: [map()] }));
const content = async (response: Response) => ({ status: response.status, body: await response.json() as Record<string, unknown> });

class FakeClock implements ProxyClock {
  private next = 1;
  tasks = new Map<number, { callback: () => void; ms: number }>();
  cancelled = 0;
  schedule = (callback: () => void, ms: number) => {
    const id = this.next++;
    this.tasks.set(id, { callback, ms });
    return id as unknown as ReturnType<typeof setTimeout>;
  };
  cancel = (timer: ReturnType<typeof setTimeout>) => {
    this.tasks.delete(timer as unknown as number);
    this.cancelled++;
  };
  fire(): void {
    const task = this.tasks.values().next().value;
    if (!task) throw Error("Missing timer");
    task.callback();
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => { resolve = finish; });
  return { promise, resolve };
}

async function main(): Promise<void> {
  await run("bounded reader releases a completed stream lock", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode("Name")); controller.close(); },
    });
    const text = await readBoundedText(stream, 4, new AbortController().signal);
    return text === "Name" && !stream.locked;
  });

  await run("valid mapping uses fixed instruction and no cache", async () => {
    let seen: unknown;
    const response = await handleProxy(request(), async (input) => {
      seen = input;
      return reply(JSON.stringify({ suggestions: [map()] }));
    });
    const result = await content(response);
    const input = seen as { instruction: string; request: object; outputByteLimit: number };
    return result.status === 200 && JSON.stringify(result.body) === JSON.stringify({ suggestions: [map()] }) &&
      input.instruction === PROVIDER_INSTRUCTION && input.outputByteLimit === 8192 &&
      JSON.stringify(input.request) === wire() && response.headers.get("cache-control") === "no-store";
  });

  await run("empty suggestions and empty labels avoid extra provider work", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const empty = await content(await handleProxy(request(), fake));
    const noLabels = await content(await handleProxy(request(wire([])), fake));
    return empty.status === 200 && noLabels.status === 200 && calls === 1 &&
      JSON.stringify(noLabels.body) === '{"suggestions":[]}';
  });

  await run("manual signature and declaration actions retain validated IDs", async () => {
    const body = wire([{ id: "f0", label: "Ink mark area" }, { id: "f2", label: "Acknowledgment box" }]);
    const actions = [{ id: "f0", action: "manual", type: "SIGNATURE" },
      { id: "f2", action: "manual", type: "DECLARATION" }];
    const result = await content(await handleProxy(request(body), async () => reply(JSON.stringify({ suggestions: actions }))));
    return result.status === 200 && JSON.stringify(result.body) === JSON.stringify({ suggestions: actions });
  });

  await run("route, method, media type, and disabled entry reject without provider", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const path = await handleProxy(new Request("https://worker.test/other", { method: "POST" }), fake);
    const query = await handleProxy(new Request(base + "?prompt=bad", { method: "POST" }), fake);
    const method = await handleProxy(new Request(base), fake);
    const type = await handleProxy(request(wire(), { contentType: "text/plain" }), fake);
    const disabled = await handleProxy(request());
    return [path.status, query.status, method.status, type.status, disabled.status].join(",") ===
      "404,404,405,415,503" && calls === 0;
  });

  await run("malformed JSON and extra request properties reject before provider", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const bad = ["{", JSON.stringify({ ...JSON.parse(wire()), prompt: "ignore" }),
      wire([{ id: "f0", label: "Name", value: "Synthetic Person" }])];
    const statuses = await Promise.all(bad.map(async (body) => (await handleProxy(request(body), fake)).status));
    return statuses.every((status) => status === 400) && calls === 0;
  });

  await run("language, IDs, duplicates, count, and label length are checked", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const bad = [wire(labels, "fr"), wire([{ id: "x", label: "Name" }]),
      wire([{ id: "f0", label: "Name" }, { id: "f0", label: "Address" }]),
      wire(Array.from({ length: 41 }, (_, i) => ({ id: `f${i}`, label: "Name" }))),
      wire([{ id: "f0", label: "N".repeat(121) }])];
    const statuses = await Promise.all(bad.map(async (body) => (await handleProxy(request(body), fake)).status));
    const atLimit = await handleProxy(request(wire([{ id: "f0", label: "N".repeat(120) }])), fake);
    return statuses.every((status) => status === 400) && atLimit.status === 200 && calls === 1;
  });

  await run("server masks compatibility digits, dates, PAN, and grouped IDs", async () => {
    const original = ["Phone １２３４５６７８９０", "DOB 12 / 03 / 2001",
      "PAN ABCDE 1234 F", "Aadhaar 1234 5678 9012"];
    for (const label of original) {
      let sent = "";
      const response = await handleProxy(request(wire([{ id: "f0", label }])), async (input) => {
        sent = input.request.labels[0].label;
        return reply('{"suggestions":[]}');
      });
      if (response.status !== 200 || !sent.includes("[REDACTED]") || sent.includes(label)) return false;
    }
    return true;
  });

  await run("email-like label drops and original opaque IDs survive", async () => {
    let received: object[] = [];
    const body = wire([{ id: "f0", label: "Applicant Name" },
      { id: "f1", label: "Contact a＠example.test" }, { id: "f2", label: "Permanent Address" }]);
    const response = await handleProxy(request(body), async (input) => {
      received = input.request.labels;
      return reply(JSON.stringify({ suggestions: [map("f2", "ADDRESS")] }));
    });
    const result = await content(response);
    return received.map((item) => (item as { id: string }).id).join(",") === "f0,f2" &&
      JSON.stringify(result.body) === JSON.stringify({ suggestions: [map("f2", "ADDRESS")] });
  });

  await run("third distinct masked label rejects and ordinary labels pass", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const bad = wire([{ id: "f0", label: "DOB 12/03/2001 PAN ABCDE1234F" },
      { id: "f1", label: "Phone 1234567890" }, { id: "f2", label: "ID 1234 5678 9012" }]);
    const rejected = await handleProxy(request(bad), fake);
    const accepted = await handleProxy(request(wire([{ id: "f0", label: "Applicant Name" },
      { id: "f1", label: "Permanent Address" }])), fake);
    return rejected.status === 400 && accepted.status === 200 && calls === 1;
  });

  await run("post-mask transmitted label limit rejects expansion", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const atLimit = await handleProxy(request(wire([{ id: "f0", label: "A".repeat(109) + " 12345" }])), fake);
    const tooLong = await handleProxy(request(wire([{ id: "f0", label: "A".repeat(110) + " 12345" }])), fake);
    return atLimit.status === 200 && tooLong.status === 400 && calls === 1;
  });

  await run("actual request bytes reject missing and false-low length headers", async () => {
    let calls = 0;
    const fake: ProviderAdapter = async () => { calls++; return reply('{"suggestions":[]}'); };
    const large = wire([{ id: "f0", label: "N".repeat(17000) }]);
    const missing = await handleProxy(request(large), fake);
    const low = await handleProxy(request(large, { length: "1" }), fake);
    const declared = await handleProxy(request(wire(), { length: "17000" }), fake);
    return [missing.status, low.status, declared.status].join(",") === "413,413,413" && calls === 0;
  });

  await run("oversized declared length cancels unread body without waiting for cancel", async () => {
    const clock = new FakeClock();
    let calls = 0;
    let cancellations = 0;
    const stream = new ReadableStream<Uint8Array>({
      cancel() { cancellations++; return new Promise<void>(() => undefined); },
    });
    const incoming = new Request(base, { method: "POST", headers: {
      "content-type": "application/json", "content-length": "17000",
    }, body: stream, duplex: "half" } as RequestInit);
    let response: Response | undefined;
    void handleProxy(incoming, async () => { calls++; return reply('{"suggestions":[]}'); }, clock)
      .then((value) => { response = value; });
    for (let i = 0; i < 20 && !response; i++) await Promise.resolve();
    return response?.status === 413 && cancellations === 1 && calls === 0 &&
      Array.from(clock.tasks).length === 0 && clock.cancelled === 1;
  });

  await run("body timeout does not wait for an uncooperative reader cancel", async () => {
    const clock = new FakeClock();
    let calls = 0;
    let cancellations = 0;
    const stream = new ReadableStream<Uint8Array>({
      cancel() { cancellations++; return new Promise<void>(() => undefined); },
    });
    const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
      body: stream, duplex: "half" } as RequestInit);
    let response: Response | undefined;
    void handleProxy(incoming, async () => { calls++; return reply('{"suggestions":[]}'); }, clock)
      .then((value) => { response = value; });
    for (let i = 0; i < 20 && !stream.locked; i++) await Promise.resolve();
    if (!stream.locked || clock.tasks.size !== 1) return false;
    clock.fire();
    for (let i = 0; i < 20 && !response; i++) await Promise.resolve();
    return response?.status === 408 && cancellations === 1 && calls === 0 &&
      !stream.locked && Array.from(clock.tasks).length === 0 && clock.cancelled === 1;
  });

  await run("early media rejection cancels unread body without a timer", async () => {
    const clock = new FakeClock();
    let cancellations = 0;
    const stream = new ReadableStream<Uint8Array>({ cancel() { cancellations++; } });
    const incoming = new Request(base, { method: "POST", headers: { "content-type": "text/plain" },
      body: stream, duplex: "half" } as RequestInit);
    const response = await handleProxy(incoming, provider, clock);
    return response.status === 415 && cancellations === 1 && clock.tasks.size === 0;
  });

  await run("pre-read timeout and abort cancel unread bodies without provider work", async () => {
    for (const mode of ["timeout", "abort"] as const) {
      const caller = new AbortController();
      let cancellations = 0;
      let timersCleared = 0;
      let calls = 0;
      const stream = new ReadableStream<Uint8Array>({ cancel() { cancellations++; } });
      const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
        body: stream, signal: caller.signal, duplex: "half" } as RequestInit);
      const clock: ProxyClock = {
        schedule: (callback) => {
          if (mode === "timeout") callback(); else caller.abort();
          return 1 as unknown as ReturnType<typeof setTimeout>;
        },
        cancel: () => { timersCleared++; },
      };
      const response = await handleProxy(incoming, async () => {
        calls++;
        return reply('{"suggestions":[]}');
      }, clock);
      if (response.status !== (mode === "timeout" ? 408 : 499) ||
        cancellations !== 1 || timersCleared !== 1 || calls !== 0) return false;
    }
    return true;
  });

  await run("actual request body accepts 16384 bytes and rejects one extra byte", async () => {
    const entries = Array.from({ length: 40 }, (_, i) => ({ id: `f${i}`, label: "অ".repeat(120) }));
    const needed = 16384 - utf8ByteLength(wire(entries, "bn"));
    if (needed < 0 || needed > 4800) return false;
    for (let i = 0; i < needed; i++) {
      const index = Math.floor(i / 120);
      const position = i % 120;
      const chars = Array.from(entries[index].label);
      chars[position] = "𐐀";
      entries[index].label = chars.join("");
    }
    const exact = wire(entries, "bn");
    const accepted = await handleProxy(request(exact), async () => reply('{"suggestions":[]}'));
    const chars = Array.from(entries[39].label);
    chars[119] = "𐐀";
    entries[39].label = chars.join("");
    const excess = wire(entries, "bn");
    const rejected = await handleProxy(request(excess, { length: "1" }), provider);
    return utf8ByteLength(exact) === 16384 && utf8ByteLength(excess) === 16385 &&
      accepted.status === 200 && rejected.status === 413;
  });

  await run("incoming stream is cancelled as soon as its byte budget is exceeded", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(16385)); },
      cancel() { cancelled = true; },
    });
    const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
      body: stream, duplex: "half" } as RequestInit);
    const response = await handleProxy(incoming, provider);
    return response.status === 413 && cancelled;
  });

  await run("request cancellation while reading a stalled body cancels its reader", async () => {
    const caller = new AbortController();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
    const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
      body: stream, signal: caller.signal, duplex: "half" } as RequestInit);
    const pending = handleProxy(incoming, provider);
    for (let i = 0; i < 20 && !stream.locked; i++) await Promise.resolve();
    if (!stream.locked) return false;
    caller.abort();
    const response = await pending;
    return response.status === 499 && cancelled;
  });

  await run("stalled body times out before provider work and cleans up", async () => {
    const clock = new FakeClock();
    let calls = 0;
    let cancellations = 0;
    const stream = new ReadableStream<Uint8Array>({ cancel() { cancellations++; } });
    const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
      body: stream, duplex: "half" } as RequestInit);
    const pending = handleProxy(incoming, async () => { calls++; return reply('{"suggestions":[]}'); }, clock);
    for (let i = 0; i < 20 && !stream.locked; i++) await Promise.resolve();
    if (!stream.locked || clock.tasks.size !== 1) return false;
    const duration = [...clock.tasks.values()][0].ms;
    clock.fire();
    const result = await content(await pending);
    await Promise.resolve();
    return duration === BODY_READ_TIMEOUT_MS && result.status === 408 &&
      result.body.error === "request_timeout" && calls === 0 && cancellations === 1 &&
      Array.from(clock.tasks).length === 0 && clock.cancelled === 1;
  });

  await run("abort and timeout races retain the first body outcome", async () => {
    for (const first of ["abort", "timeout"] as const) {
      const clock = new FakeClock();
      const caller = new AbortController();
      let calls = 0;
      let cancellations = 0;
      const stream = new ReadableStream<Uint8Array>({ cancel() { cancellations++; } });
      const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
        body: stream, signal: caller.signal, duplex: "half" } as RequestInit);
      const pending = handleProxy(incoming, async () => { calls++; return reply('{"suggestions":[]}'); }, clock);
      for (let i = 0; i < 20 && !stream.locked; i++) await Promise.resolve();
      if (!stream.locked) return false;
      const fire = [...clock.tasks.values()][0].callback;
      if (first === "abort") { caller.abort(); fire(); }
      else { fire(); caller.abort(); }
      const result = await content(await pending);
      if (result.status !== (first === "abort" ? 499 : 408) || calls !== 0 ||
        cancellations !== 1 || clock.tasks.size !== 0 || clock.cancelled !== 1) return false;
    }
    return true;
  });

  await run("completed body cancels its timer and invokes provider once", async () => {
    const clock = new FakeClock();
    const caller = new AbortController();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let calls = 0;
    let removed = 0;
    const stream = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
    const incoming = new Request(base, { method: "POST", headers: { "content-type": "application/json" },
      body: stream, signal: caller.signal, duplex: "half" } as RequestInit);
    const remove = incoming.signal.removeEventListener.bind(incoming.signal);
    incoming.signal.removeEventListener = ((...args: Parameters<AbortSignal["removeEventListener"]>) => {
      removed++;
      return remove(...args);
    }) as AbortSignal["removeEventListener"];
    const pending = handleProxy(incoming, async () => { calls++; return reply('{"suggestions":[]}'); }, clock);
    for (let i = 0; i < 20 && !stream.locked; i++) await Promise.resolve();
    if (!stream.locked || clock.tasks.size !== 1) return false;
    const staleDeadline = [...clock.tasks.values()][0].callback;
    controller.enqueue(new TextEncoder().encode(wire()));
    controller.close();
    const result = await content(await pending);
    staleDeadline();
    return result.status === 200 && calls === 1 && Array.from(clock.tasks).length === 0 &&
      clock.cancelled === 2 && removed === 2;
  });

  await run("provider HTTP, media type, malformed JSON, and body-read failures fail closed", async () => {
    const cases: ProviderAdapter[] = [async () => reply("bad", 500),
      async () => reply('{"suggestions":[]}', 200, "text/plain"),
      async () => reply("{"), async () => new Response(new ReadableStream({
        pull(controller) { controller.error(new Error("synthetic read failure")); },
      }), { headers: { "content-type": "application/json" } })];
    const statuses = await Promise.all(cases.map(async (fake) => (await handleProxy(request(), fake)).status));
    return statuses.every((status) => status === 502);
  });

  await run("rejected provider response cancels an unread body", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
    const response = await handleProxy(request(), async () =>
      new Response(stream, { status: 503, headers: { "content-type": "application/json" } }));
    return response.status === 502 && cancelled;
  });

  await run("provider unknown IDs, duplicates, unsupported keys, actions, and extras fail closed", async () => {
    const payloads = [[map("f9")], [map(), map()], [map("f0", "OTHER")],
      [{ id: "f0", action: "erase" }], [{ ...map(), explanation: "ignore rules" }]];
    const statuses = await Promise.all(payloads.map(async (suggestions) =>
      (await handleProxy(request(), async () => reply(JSON.stringify({ suggestions })))).status));
    return statuses.every((status) => status === 502);
  });

  await run("missing, false-low, invalid, and high provider lengths still enforce actual bytes", async () => {
    const large = JSON.stringify({ suggestions: [], pad: "x".repeat(9000) });
    const absent = await handleProxy(request(), async () => reply(large));
    const low = await handleProxy(request(), async () => reply(large, 200, "application/json", "1"));
    const invalid = await handleProxy(request(), async () => reply('{"suggestions":[]}', 200, "application/json", "bad"));
    const high = await handleProxy(request(), async () => reply('{"suggestions":[]}', 200, "application/json", "9000"));
    return [absent.status, low.status, invalid.status, high.status].every((status) => status === 502);
  });

  await run("upstream stream cancels after 8192 bytes including multibyte text", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode("অ".repeat(2731))); },
      cancel() { cancelled = true; },
    });
    const fake: ProviderAdapter = async () => new Response(stream, { headers: { "content-type": "application/json" } });
    return (await handleProxy(request(), fake)).status === 502 && cancelled;
  });

  await run("serialized output enforces exact 8192 UTF-8 bytes", () => {
    const baseBytes = utf8ByteLength(JSON.stringify({ suggestions: [{ text: "" }] }));
    const available = 8192 - baseBytes;
    const text = "অ".repeat(Math.floor(available / 3)) + "x".repeat(available % 3);
    const accepted = serializeSuggestions([{ text }]);
    const rejected = serializeSuggestions([{ text: text + "x" }]);
    return accepted !== null && utf8ByteLength(accepted) === 8192 && rejected === null;
  });

  await run("provider timeout cancels work and clears timer", async () => {
    const clock = new FakeClock();
    let signal: AbortSignal | undefined;
    const pending = handleProxy(request(), async (_input, value) => {
      signal = value;
      return new Promise<Response>(() => undefined);
    }, clock);
    for (let i = 0; i < 8 && !signal; i++) await Promise.resolve();
    if (!signal) return false;
    const duration = [...clock.tasks.values()][0]?.ms;
    clock.fire();
    const response = await pending;
    return response.status === 504 && duration === PROVIDER_TIMEOUT_MS && signal.aborted &&
      clock.tasks.size === 0 && clock.cancelled === 2;
  });

  await run("request cancellation during provider work ignores late result", async () => {
    const clock = new FakeClock();
    const caller = new AbortController();
    const late = deferred<Response>();
    let signal: AbortSignal | undefined;
    const pending = handleProxy(request(wire(), { signal: caller.signal }), async (_input, value) => {
      signal = value;
      return late.promise;
    }, clock);
    for (let i = 0; i < 8 && !signal; i++) await Promise.resolve();
    if (!signal) return false;
    caller.abort();
    const response = await pending;
    late.resolve(reply(JSON.stringify({ suggestions: [map()] })));
    await Promise.resolve();
    return response.status === 499 && signal.aborted && clock.tasks.size === 0 && clock.cancelled === 2;
  });

  await run("late provider response after timeout is discarded", async () => {
    const clock = new FakeClock();
    const late = deferred<Response>();
    let invoked = false;
    let cancelled = false;
    const pending = handleProxy(request(), async () => { invoked = true; return late.promise; }, clock);
    for (let i = 0; i < 20 && !invoked; i++) await Promise.resolve();
    if (!invoked) return false;
    clock.fire();
    const result = await pending;
    const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
    late.resolve(new Response(stream, { headers: { "content-type": "application/json" } }));
    await Promise.resolve();
    await Promise.resolve();
    return result.status === 504 && cancelled && clock.tasks.size === 0;
  });

  await run("provider body stall times out and cancels reader", async () => {
    const clock = new FakeClock();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      cancel() { cancelled = true; },
    });
    const pending = handleProxy(request(), async () =>
      new Response(stream, { headers: { "content-type": "application/json" } }), clock);
    for (let i = 0; i < 20 && !stream.locked; i++) await Promise.resolve();
    if (!stream.locked || clock.tasks.size !== 1) return false;
    clock.fire();
    const response = await pending;
    await Promise.resolve();
    return response.status === 504 && cancelled && Array.from(clock.tasks).length === 0;
  });

  await run("client accepts Worker suggestions and rejection keeps local fallback", async () => {
    const fetcher: AiFetch = async (url, init) => handleProxy(new Request(url, init),
      async () => reply(JSON.stringify({ suggestions: [map()] })));
    const client = new AiFormClient(base, fetcher);
    const scope = { formSessionId: "synthetic-form", revision: 0, attemptId: "once" };
    const success = await client.suggest([{ fieldId: "local-one", label: "Mystery Reference" }], "en", scope);
    const rejectedClient = new AiFormClient(base, async (url, init) =>
      handleProxy(new Request(url, init), async () => reply("{")));
    const rejected = await rejectedClient.suggest([{ fieldId: "local-one", label: "Mystery Reference" }], "en", scope);
    const local = new FieldMatcher().match([{ id: "local-one", label: "Mystery Reference", type: "TEXT", required: true }], []);
    return success.status === "suggestions" && success.suggestions[0].fieldId === "local-one" &&
      rejected.status === "failure" && local[0].status === "NEEDS_USER" && local[0].matchedKey === undefined;
  });

  await run("error bodies and diagnostics contain no labels or credentials", async () => {
    const original = console.log;
    const captured: string[] = [];
    console.log = (...parts: unknown[]) => { captured.push(parts.join(" ")); };
    let response: Response;
    try {
      response = await handleProxy(request(wire([{ id: "f0", label: "PAN ABCDE1234F" }])),
        async () => { throw new Error("secret-token ABCDE1234F"); });
    } finally { console.log = original; }
    const body = await response.text();
    return response.status === 502 && !body.includes("ABCDE1234F") &&
      !body.includes("secret-token") && captured.length === 0;
  });

  console.log(`\nPASS: ${passed}, FAIL: ${failed}`);
  if (failed) process.exitCode = 1;
}

main().catch(() => { console.log("FAIL: proxy suite"); process.exitCode = 1; });
