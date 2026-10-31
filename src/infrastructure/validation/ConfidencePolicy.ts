import { CONFIDENCE_THRESHOLD } from "../../domain/constants";

export function needsReview(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLD;
}

export function combineConfidence(ocrConfidence: number, passed: boolean): number {
  if (passed) return ocrConfidence;
  const combined = ocrConfidence * 0.5;
  return Math.max(0, Math.min(1, combined));
}