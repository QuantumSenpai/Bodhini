export interface CopierDeps {
  set: (value: string) => Promise<void>;
  get: () => Promise<string>;
  schedule: (callback: () => void, delayMs: number) => number;
  cancel: (timerId: number) => void;
  clearAfterMs?: number;
}

const DEFAULT_CLEAR_AFTER_MS = 60000;
const SENSITIVE_KEYS = new Set(["AADHAAR_NO", "PAN_NO"]);

export function createCopier(deps: CopierDeps) {
  const { set, get, schedule, cancel, clearAfterMs = DEFAULT_CLEAR_AFTER_MS } = deps;
  let timerId: number | null = null;

  function disarm(): void {
    if (timerId !== null) {
      cancel(timerId);
      timerId = null;
    }
  }

  function arm(expected: string): void {
    timerId = schedule(() => {
      timerId = null;
      get()
        .then((current) => (current === expected ? set("") : undefined))
        .catch(() => undefined);
    }, clearAfterMs);
  }

  async function write(value: string, sensitive: boolean): Promise<boolean> {
    try {
      await set(value);
      disarm();
      if (sensitive) arm(value);
      return sensitive;
    } catch {
      return false;
    }
  }

  function copy(key: string, value: string): Promise<boolean> {
    return write(value, SENSITIVE_KEYS.has(key));
  }

  function copyMany(items: { key: string; value: string }[]): Promise<boolean> {
    const joined = items.map((item) => item.value).join("\n");
    return write(joined, items.some((item) => SENSITIVE_KEYS.has(item.key)));
  }

  return { copy, copyMany };
}
