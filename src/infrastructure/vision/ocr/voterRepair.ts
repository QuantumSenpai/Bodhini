import { isValidPan } from "../../validation/formatChecks";

export function repairEpic(token: string, originalToken: string): string {
  const chars = token.split("");
  const origChars = originalToken.split("");
  for (let i = 0; i < chars.length; i++) {
    if (i < 3) {
      if (chars[i] === "0") chars[i] = "O";
      else if (chars[i] === "1" || chars[i] === "l" || chars[i] === "|") chars[i] = "I";
    } else {
      if (chars[i] === "O" || chars[i] === "o") chars[i] = "0";
      else if (chars[i] === "I" || chars[i] === "l" || chars[i] === "L" || chars[i] === "|") chars[i] = "1";
    }
  }
  return chars.join("");
}
