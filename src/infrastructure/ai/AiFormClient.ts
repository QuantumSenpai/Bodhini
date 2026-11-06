import type { AppLanguage } from "../../domain/document/document.types";
import type { AiClientResult, AiLabel } from "./aiTypes";
import { MAX_RESPONSE_BYTES, parseAiResponse } from "./parseAiResponse";
import { sanitizeLabels } from "./sanitizeLabels";

export interface AiHttpResponse {
  ok: boolean;
  text: () => Promise<string>;
  headers?: { get: (name: string) => string | null };
}

export type AiFetch = (url: string, init: {
  method: "POST";
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}) => Promise<AiHttpResponse>;

export interface AiClock {
  schedule: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
}

const defaultClock: AiClock = {
  schedule: (callback, ms) => setTimeout(callback, ms),
  cancel: (timer) => clearTimeout(timer),
};

export class AiFormClient {
  constructor(
    private readonly endpoint: string,
    private readonly fetcher: AiFetch = fetch,
    private readonly clock: AiClock = defaultClock,
  ) {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new Error("AI proxy endpoint must be an HTTPS URL");
    }
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) {
      throw new Error("AI proxy endpoint must be an HTTPS URL without credentials, a query, or a fragment");
    }
  }

  async suggest(labels: readonly AiLabel[], language: AppLanguage, signal?: AbortSignal): Promise<AiClientResult> {
    if (signal?.aborted) return { status: "cancelled" };
    const batch = sanitizeLabels(labels, language);
    if (!batch.ok) return { status: "rejected", reason: batch.reason };
    if (batch.request.labels.length === 0) return { status: "no_suggestions", suggestions: [] };

    const controller = new AbortController();
    let outcome: "cancelled" | "timeout" | null = null;
    let rejectAbort: (error: Error) => void = () => undefined;
    const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
    const abort = (reason: "cancelled" | "timeout") => {
      if (outcome) return;
      outcome = reason;
      controller.abort();
      rejectAbort(new Error("AI request aborted"));
    };
    const onCallerAbort = () => abort("cancelled");
    signal?.addEventListener("abort", onCallerAbort, { once: true });
    const timer = this.clock.schedule(() => abort("timeout"), 8000);
    let phase: "transport" | "response" = "transport";

    try {
      if (signal?.aborted) abort("cancelled");
      const response = await Promise.race([
        outcome ? aborted : this.fetcher(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: batch.body,
          signal: controller.signal,
        }),
        aborted,
      ]);
      phase = "response";
      if (!response || typeof response.ok !== "boolean" || typeof response.text !== "function") {
        return { status: "failure", reason: "response" };
      }
      if (!response.ok) return { status: "failure", reason: "http" };
      const contentLength = response.headers?.get("content-length");
      if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
        return { status: "failure", reason: "response" };
      }
      const raw = await Promise.race([response.text(), aborted]);
      const parsed = parseAiResponse(raw, batch);
      if (!parsed.ok) return { status: "failure", reason: "response" };
      if (parsed.suggestions.length === 0) return { status: "no_suggestions", suggestions: [] };
      return { status: "suggestions", suggestions: parsed.suggestions };
    } catch {
      if (outcome === "timeout") return { status: "timeout" };
      if (outcome === "cancelled" || signal?.aborted) return { status: "cancelled" };
      return { status: "failure", reason: phase === "transport" ? "network" : "response" };
    } finally {
      this.clock.cancel(timer);
      signal?.removeEventListener("abort", onCallerAbort);
    }
  }
}
