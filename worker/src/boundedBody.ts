export class BodyReadError extends Error {
  constructor(readonly kind: "too_large" | "invalid" | "aborted") {
    super(kind);
  }
}

export function declaredLength(headers: Headers, limit: number): void {
  const value = headers.get("content-length");
  if (value === null) return;
  if (!/^[0-9]+$/.test(value.trim())) throw new BodyReadError("invalid");
  if (Number(value) > limit) throw new BodyReadError("too_large");
}

export async function readBoundedText(
  body: ReadableStream<Uint8Array> | null, limit: number, signal: AbortSignal,
): Promise<string> {
  if (signal.aborted) throw new BodyReadError("aborted");
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let rejectAbort: (error: BodyReadError) => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  let completed = false;
  let cancelling = false;
  const cancelReader = () => {
    if (cancelling) return;
    cancelling = true;
    void reader.cancel().catch(() => undefined).finally(() => {
      try { reader.releaseLock(); } catch { return; }
    });
  };
  const onAbort = () => {
    rejectAbort(new BodyReadError("aborted"));
    cancelReader();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  let bytes = 0;
  try {
    if (signal.aborted) onAbort();
    let text = "";
    for (;;) {
      const chunk = await Promise.race([reader.read(), aborted]);
      if (signal.aborted) throw new BodyReadError("aborted");
      if (chunk.done) {
        const result = text + decoder.decode();
        completed = true;
        return result;
      }
      bytes += chunk.value.byteLength;
      if (bytes > limit) throw new BodyReadError("too_large");
      text += decoder.decode(chunk.value, { stream: true });
    }
  } catch (error) {
    cancelReader();
    if (signal.aborted) throw new BodyReadError("aborted");
    if (error instanceof BodyReadError) throw error;
    throw new BodyReadError("invalid");
  } finally {
    signal.removeEventListener("abort", onAbort);
    if (completed) reader.releaseLock();
  }
}
