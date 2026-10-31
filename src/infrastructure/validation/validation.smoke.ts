import { isValidVerhoeff, isValidAadhaar } from "./verhoeff";
import { isValidDate, isValidPin, isValidPan } from "./formatChecks";
import { needsReview, combineConfidence } from "./ConfidencePolicy";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";

let passCount = 0;
let failCount = 0;

function check<T>(name: string, actual: T, expected: T) {
  if (actual === expected) {
    console.log(`PASS: ${name}`);
    passCount++;
  } else {
    console.log(`FAIL: ${name}`);
    failCount++;
  }
}

check("isValidVerhoeff 2363 valid", isValidVerhoeff("2363"), true);
check("isValidVerhoeff 2364 invalid", isValidVerhoeff("2364"), false);

check("isValidAadhaar 291837465026 valid", isValidAadhaar("291837465026"), true);
check("isValidAadhaar 291837465027 invalid", isValidAadhaar("291837465027"), false);

check("isValidDate DD/MM/YYYY valid", isValidDate("15/08/1995"), true);
check("isValidDate DD-MM-YYYY valid", isValidDate("15-08-1995"), true);
check("isValidDate DD.MM.YYYY valid", isValidDate("15.08.1995"), true);
check("isValidDate invalid date", isValidDate("31/02/2000"), false);
check("isValidDate year before 1900", isValidDate("15/08/1899"), false);
check("isValidDate year after current", isValidDate(`15/08/${new Date().getFullYear() + 1}`), false);

check("isValidPin 6 digits not starting 0", isValidPin("560001"), true);
check("isValidPin starts with 0", isValidPin("012345"), false);
check("isValidPin 5 digits", isValidPin("12345"), false);
check("isValidPin non-digits", isValidPin("abc123"), false);
check("isValidPin 7 digits", isValidPin("1234567"), false);
check("isValidPin empty", isValidPin(""), false);

check("isValidPan valid format", isValidPan("ABCDE1234F"), true);
check("isValidPan lowercase", isValidPan("abcde1234f"), false);
check("isValidPan wrong pattern", isValidPan("ABC1234F"), false);
check("isValidPan extra char", isValidPan("ABCDE1234FG"), false);

check("needsReview below threshold", needsReview(CONFIDENCE_THRESHOLD - 0.01), true);
check("needsReview at threshold", needsReview(CONFIDENCE_THRESHOLD), false);
check("needsReview above threshold", needsReview(CONFIDENCE_THRESHOLD + 0.01), false);

check("combineConfidence passed true returns ocr", combineConfidence(0.9, true), 0.9);
check("combineConfidence passed false halves", combineConfidence(0.9, false), 0.45);
check("combineConfidence clamp low", combineConfidence(0.1, false), 0.05);
check("combineConfidence clamp high", combineConfidence(1.0, false), 0.5);

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);