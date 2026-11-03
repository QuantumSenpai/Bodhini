import { isValidPan } from "../../validation/formatChecks";

export function repairPan(token: string, originalToken: string): string {
  const chars = token.split("");
  const origChars = originalToken.split("");
  for (let i = 0; i < chars.length; i++) {
    if (i < 5 || i === 9) {
      if (chars[i] === "0") chars[i] = "O";
      else if (chars[i] === "1" || chars[i] === "l" || chars[i] === "|") chars[i] = "I";
      else if (chars[i] === "L" && origChars[i] === "l") chars[i] = "I";
    } else {
      if (chars[i] === "O" || chars[i] === "o") chars[i] = "0";
      else if (chars[i] === "I" || chars[i] === "l" || chars[i] === "|") chars[i] = "1";
    }
  }
  return chars.join("");
}