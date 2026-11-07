import type { ProviderAdapter, ProxyClock } from "../src/handler";
import { handleProxy } from "../src/handler";

export default {
  async fetch(request: Request): Promise<Response> {
    const mode = request.headers.get("x-test-provider") ?? "map";
    const inputMode = request.headers.get("x-test-input");
    let providerCalls = 0;
    let inputCancellations = 0;
    let outputCancellations = 0;
    const scheduledDurations: number[] = [];
    const activeTimers = new Set<ReturnType<typeof setTimeout>>();
    const clock: ProxyClock = {
      schedule(callback, ms) {
        scheduledDurations.push(ms);
        const timer = setTimeout(() => { activeTimers.delete(timer); callback(); }, ms);
        activeTimers.add(timer);
        return timer;
      },
      cancel(timer) { clearTimeout(timer); activeTimers.delete(timer); },
    };

    let incoming = request;
    if (inputMode === "stall" || inputMode === "abort" || inputMode === "chunk" || inputMode === "chunk-no-length") {
      const controller = new AbortController();
      const stream = new ReadableStream<Uint8Array>({
        start(streamController) {
          if (inputMode === "chunk" || inputMode === "chunk-no-length") streamController.enqueue(new Uint8Array(16385));
        },
        cancel() { inputCancellations++; },
      });
      if (inputMode === "abort") setTimeout(() => controller.abort(), 20);
      incoming = new Request(request.url, {
        method: "POST", headers: {
          "content-type": "application/json",
          ...(inputMode === "chunk" ? { "content-length": "1" } : {}),
        }, body: stream, signal: controller.signal,
      });
    }

    const provider: ProviderAdapter = async (input) => {
      providerCalls++;
      if (mode === "stall") return new Promise<Response>(() => undefined);
      if (mode === "http-failure") return new Response(null, { status: 503 });
      if (mode === "boundary" || mode === "boundary-over") {
        const base = '{"suggestions":[]}';
        const length = 8192 + (mode === "boundary-over" ? 1 : 0);
        return new Response(base.padEnd(length, " "), { headers: { "content-type": "application/json" } });
      }
      if (mode === "oversized" || mode === "oversized-no-length") {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) { controller.enqueue(new TextEncoder().encode("অ".repeat(3000))); },
          cancel() { outputCancellations++; },
        });
        return new Response(stream, { headers: {
          "content-type": "application/json",
          ...(mode === "oversized" ? { "content-length": "1" } : {}),
        } });
      }
      const ids = input.request.labels.map((item) => item.id);
      const suggestions = mode === "empty" ? [] : mode === "manual"
        ? ids.slice(0, 2).map((id, index) => ({ id, action: "manual", type: index === 0 ? "SIGNATURE" : "DECLARATION" }))
        : ids.slice(0, 1).map((id) => ({ id, action: "map", key: "FULL_NAME" }));
      return Response.json({ suggestions });
    };
    const response = await handleProxy(incoming, provider, clock);
    response.headers.set("x-test-provider-calls", String(providerCalls));
    response.headers.set("x-test-declared-length", incoming.headers.get("content-length") ?? "absent");
    response.headers.set("x-test-input-cancellations", String(inputCancellations));
    response.headers.set("x-test-output-cancellations", String(outputCancellations));
    response.headers.set("x-test-deadlines", scheduledDurations.join(","));
    response.headers.set("x-test-active-timers", String(activeTimers.size));
    return response;
  },
};
