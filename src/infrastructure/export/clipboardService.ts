import * as Clipboard from "expo-clipboard";
import { createCopier, type CopierDeps } from "./copier";

const deps: CopierDeps = {
  set: async (value: string) => {
    await Clipboard.setStringAsync(value);
  },
  get: async () => {
    return await Clipboard.getStringAsync();
  },
  schedule: (callback: () => void, delayMs: number) => {
    return setTimeout(callback, delayMs) as unknown as number;
  },
  cancel: (timerId: number) => {
    clearTimeout(timerId);
  },
  clearAfterMs: 60000,
};

const copier = createCopier(deps);

export const clipboardService = {
  copy: copier.copy,
  copyMany: copier.copyMany,
  copyText: async (text: string) => {
    await Clipboard.setStringAsync(text);
  },
};