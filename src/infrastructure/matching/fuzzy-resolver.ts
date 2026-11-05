import { FieldKey } from "../../domain/document/document.types";
import {
  FIELD_SYNONYMS,
  normalizeLabel,
  GENERIC_STANDALONE_WORDS,
  RELATIONAL_QUALIFIERS,
  NON_DOB_QUALIFIERS,
  NON_ID_NUMBER_QUALIFIERS,
} from "./field-synonyms";

function damerauLevenshtein(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  const dp = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));

  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[lenA][lenB];
}

function containsIndic(text: string): boolean {
  return /[ऀ-ॿঀ-৿]/.test(text);
}

export function resolveFieldKeyFuzzy(
  label: string
): { key: FieldKey; matchType: "partial" } | null {
  const normalized = normalizeLabel(label);
  if (!normalized) return null;
  if (GENERIC_STANDALONE_WORDS.has(normalized)) return null;
  if (containsIndic(normalized)) return null;

  const labelTokens = normalized.split(" ");

  const hasRelationalQualifier = RELATIONAL_QUALIFIERS.some((rq) =>
    labelTokens.includes(rq) || normalized.includes(rq)
  );

  const hasNonDobQualifier = NON_DOB_QUALIFIERS.some((dq) =>
    labelTokens.includes(dq) || normalized.includes(dq)
  );

  const hasNonIdNumberQualifier = NON_ID_NUMBER_QUALIFIERS.some((nq) =>
    labelTokens.includes(nq) || normalized.includes(nq)
  );

  for (const [keyStr, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    const key = keyStr as FieldKey;
    if (key === "OTHER") continue;
    if (key === "FULL_NAME" && hasRelationalQualifier) continue;
    if (key === "DOB" && hasNonDobQualifier) continue;
    if ((key === "AADHAAR_NO" || key === "PAN_NO" || key === "PHONE") && hasNonIdNumberQualifier) continue;
    for (const synonym of synonyms) {
      if (containsIndic(synonym)) continue;
      if (normalizeLabel(synonym) === normalized) return null;
    }
  }

  if (normalized.length < 5) return null;

  let bestDistance = Infinity;
  let bestKeys = new Set<FieldKey>();

  for (const [keyStr, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    const key = keyStr as FieldKey;
    if (key === "OTHER") continue;

    if (key === "FULL_NAME" && hasRelationalQualifier) continue;
    if (key === "DOB" && hasNonDobQualifier) continue;
    if ((key === "AADHAAR_NO" || key === "PAN_NO" || key === "PHONE") && hasNonIdNumberQualifier) continue;

    for (const synonym of synonyms) {
      if (containsIndic(synonym)) continue;
      const normSyn = normalizeLabel(synonym);
      if (normSyn.length < 5) continue;

      const dist = damerauLevenshtein(normalized, normSyn);
      if (dist === 0) continue;

      const allowed = normalized.length <= 8 ? 1 : 2;
      if (dist > allowed) continue;

      if (dist < bestDistance) {
        bestDistance = dist;
        bestKeys = new Set([key]);
      } else if (dist === bestDistance) {
        bestKeys.add(key);
      }
    }
  }

  if (bestKeys.size === 1) {
    const [matchedKey] = Array.from(bestKeys);
    return { key: matchedKey, matchType: "partial" };
  }
  return null;
}
