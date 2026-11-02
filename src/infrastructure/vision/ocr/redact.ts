export function redactForDebug(text: string): string {
  return text
    .replace(/\b\d{10}\b/g, "XXXXXXXXXX")
    .replace(/\b\d{8,}\b/g, (match) => {
      const last4 = match.slice(-4);
      const prefix = "X".repeat(match.length - 4);
      return prefix + last4;
    });
}
