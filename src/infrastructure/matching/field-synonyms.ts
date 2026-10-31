import { FieldKey } from "../../domain/document/document.types";

/**
 * Trilingual dictionary mapping labels in English, Hindi, and Bengali to FieldKeys.
 */
export const FIELD_SYNONYMS: Record<FieldKey, string[]> = {
  FULL_NAME: [
    // English
    "full name",
    "applicant name",
    "candidate name",
    "name of applicant",
    "name of candidate",
    "person name",
    // Hindi
    "पूरा नाम",
    "आवेदक का नाम",
    "अभ्यर्थी का नाम",
    "प्रार्थी का नाम",
    // Bengali
    "পুরো নাম",
    "সম্পূর্ণ নাম",
    "আবেদনকারীর নাম",
    "প্রার্থীর নাম",
  ],

  DOB: [
    // English
    "dob",
    "date of birth",
    "birth date",
    "d o b",
    // Hindi
    "जन्म तिथि",
    "जन्म तारीख",
    "जन्म दिनांक",
    "जन्मदिन",
    // Bengali
    "জন্ম তারিখ",
    "জন্মদিন",
    "জন্মের তারিখ",
  ],

  GENDER: [
    // English
    "gender",
    "sex",
    // Hindi
    "लिंग",
    // Bengali
    "লিঙ্গ",
  ],

  ADDRESS: [
    // English
    "permanent address",
    "residential address",
    "communication address",
    "present address",
    "full address",
    "home address",
    // Hindi
    "स्थाई पता",
    "वर्तमान पता",
    "निवास स्थान",
    // Bengali
    "স্থায়ী ঠিকানা",
    "বর্তমান ঠিকানা",
  ],

  PIN_CODE: [
    // English
    "pin code",
    "pincode",
    "postal code",
    "zip code",
    // Hindi
    "पिन कोड",
    "डाक कोड",
    // Bengali
    "পিন কোড",
    "ডাক কোড",
  ],

  AADHAAR_NO: [
    // English
    "aadhaar",
    "aadhaar no",
    "aadhaar number",
    "aadhar",
    "aadhar no",
    "aadhar number",
    "uid",
    "uidai",
    // Hindi
    "आधार",
    "आधार नंबर",
    "आधार संख्या",
    "आधार क्र",
    // Bengali
    "আধার",
    "আধার নম্বর",
    "আধার সংখ্যা",
  ],

  PAN_NO: [
    // English
    "pan",
    "pan no",
    "pan number",
    "permanent account number",
    // Hindi
    "पैन",
    "पैन नंबर",
    "स्थायी खाता संख्या",
    // Bengali
    "প্যান",
    "প্যান নম্বর",
  ],

  PHONE: [
    // English
    "phone number",
    "mobile",
    "mobile number",
    "mobile no",
    "contact number",
    "contact no",
    "telephone number",
    "cell number",
    // Hindi
    "मोबाइल",
    "मोबाइल नंबर",
    "दूरभाष",
    "फोन नंबर",
    "सम्पर्क नंबर",
    // Bengali
    "মোবাইল",
    "মোবাইল নম্বর",
    "ফোন নম্বর",
    "যোগাযোগ নম্বর",
  ],

  EMAIL: [
    // English
    "email",
    "email address",
    "email id",
    "e mail",
    "e mail address",
    // Hindi
    "ईमेल",
    "ई मेल",
    // Bengali
    "ইমেল",
    "ইমেইল",
    "ই মেইল",
  ],

  OTHER: [],
};

/**
 * Trilingual keywords indicating signatures or declarations that must always be SKIPPED.
 */
export const SIGNATURE_DECLARATION_KEYWORDS: string[] = [
  // English
  "signature",
  "sign",
  "signed",
  "sign here",
  "applicant signature",
  "candidate signature",
  "declaration",
  "declare",
  "undertaking",
  "i hereby declare",
  "consent",
  "thumb impression",
  "lti",
  "rti",
  // Hindi
  "हस्ताक्षर",
  "दस्तखत",
  "आवेदक के हस्ताक्षर",
  "उम्मीदवार के हस्ताक्षर",
  "घोषणा",
  "शपथ पत्र",
  "सहमति",
  "अंगूठे का निशान",
  // Bengali
  "স্বাক্ষর",
  "আবেদনকারীর স্বাক্ষর",
  "প্রার্থীর স্বাক্ষর",
  "ঘোষণা",
  "ঘোষণাপত্র",
  "সম্মতি",
  "টিপসই",
];

/**
 * Generic standalone words that MUST NEVER alone trigger an automatic match.
 */
const GENERIC_STANDALONE_WORDS = new Set([
  "name",
  "no",
  "date",
  "number",
  "in",
  "permanent",
  "code",
  "id",
  "card",
  "address",
  "first",
  "last",
  "valid",
  "type",
  "of",
  "for",
  "to",
  "at",
  "by",
  "on",
  "serial",
  "application",
  "phone",
  "pin",
  // Hindi generic
  "नाम",
  "नंबर",
  "तारीख",
  "तिथि",
  "पता",
  "कोड",
  "संख्या",
  // Bengali generic
  "নাম",
  "নম্বর",
  "তারিখ",
  "ঠিকানা",
  "কোড",
  "সংখ্যা",
]);

/**
 * Relational qualifiers indicating someone other than the primary applicant.
 * Labels containing any of these must NEVER match FULL_NAME.
 */
const RELATIONAL_QUALIFIERS = [
  "father",
  "fathers",
  "mother",
  "mothers",
  "parent",
  "parents",
  "spouse",
  "spouses",
  "husband",
  "husbands",
  "wife",
  "wifes",
  "guardian",
  "guardians",
  "nominee",
  "nominees",
  "doctor",
  "doctors",
  "witness",
  "witnesses",
  "officer",
  "child",
  // Hindi
  "पिता",
  "माता",
  "पति",
  "पत्नी",
  "अभिभावक",
  "नामिती",
  "संरक्षक",
  "डॉक्टर",
  "गवाह",
  // Bengali
  "বাবা",
  "বাবার",
  "মা",
  "মায়ের",
  "পিতা",
  "মাতা",
  "স্বামী",
  "স্ত্রী",
  "অভিভাবক",
  "নমিনি",
  "ডাক্তার",
  "সাক্ষী",
];

/**
 * Date qualifiers indicating a date other than Date of Birth.
 */
const NON_DOB_QUALIFIERS = [
  "application",
  "apply",
  "issue",
  "issued",
  "expiry",
  "submission",
  "registration",
  "exam",
  "joining",
  "valid",
  "effective",
  "current",
  "today",
  // Hindi
  "आवेदन",
  "जारी",
  "पंजीकरण",
  "जमा",
  // Bengali
  "আবেদন",
  "ইস্যু",
  "জমা",
  "নিবন্ধন",
];

/**
 * Number qualifiers indicating numbers other than Aadhaar or PAN.
 */
const NON_ID_NUMBER_QUALIFIERS = [
  "serial",
  "application",
  "roll",
  "registration",
  "receipt",
  "form",
  "token",
  "room",
  "flat",
  "door",
  "plot",
  "account",
  "challan",
  "order",
  "bill",
  "invoice",
  "case",
  "file",
  // Hindi
  "क्रम",
  "क्रमांक",
  "कमरा",
  "रसीद",
  "खाता",
  // Bengali
  "ক্রমিক",
  "রসিদ",
  "হিসাব",
];

/**
 * Normalizes a string by lowercasing, stripping apostrophes/punctuation, and collapsing whitespace.
 */
export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/['’`]/g, "") // strip apostrophes so father's -> fathers
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // keep only letters, numbers, and whitespace (unicode-aware)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if text contains signature or declaration keywords across English, Hindi, and Bengali.
 * Inspects labels, instructions, or free-text prompts.
 */
export function isSignatureOrDeclarationLabel(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeLabel(text);
  if (!normalized) return false;
  const words = normalized.split(" ");

  return SIGNATURE_DECLARATION_KEYWORDS.some((kw) => {
    const kwNorm = normalizeLabel(kw);
    // If multi-word phrase, check substring containment
    if (kwNorm.includes(" ")) {
      return normalized.includes(kwNorm);
    }
    // For non-Latin scripts (Devanagari, Bengali), substring match captures compound words & inflections safely
    if (/[ऀ-ॿঀ-৿]/.test(kwNorm)) {
      return normalized.includes(kwNorm);
    }
    // For English short words like "sign" or "signed", exact word match avoids "designation" or "assignment"
    if (kwNorm === "sign" || kwNorm === "signed" || kwNorm === "lti" || kwNorm === "rti") {
      return words.includes(kwNorm);
    }
    // For other English keywords ("signature", "declaration", "declare", "undertaking", "consent")
    return words.some((w) => w === kwNorm || w.startsWith(kwNorm));
  });
}

/**
 * Resolves a form field label to a canonical FieldKey with strict ambiguity guards.
 */
export function resolveFieldKey(
  label: string
): { key: FieldKey; matchType: "exact" | "synonym" } | null {
  const normalized = normalizeLabel(label);
  if (!normalized) {
    return null;
  }

  // 1. Generic word guard: Never allow a generic word alone to trigger an automatic match
  if (GENERIC_STANDALONE_WORDS.has(normalized)) {
    return null;
  }

  const labelTokens = normalized.split(" ");

  // 2. Relational protection: If any relational qualifier is present, never match FULL_NAME
  const hasRelationalQualifier = RELATIONAL_QUALIFIERS.some((rq) =>
    labelTokens.includes(rq) || normalized.includes(rq)
  );

  // 3. Non-DOB date protection
  const hasNonDobQualifier = NON_DOB_QUALIFIERS.some((dq) =>
    labelTokens.includes(dq) || normalized.includes(dq)
  );

  // 4. Non-ID number protection
  const hasNonIdNumberQualifier = NON_ID_NUMBER_QUALIFIERS.some((nq) =>
    labelTokens.includes(nq) || normalized.includes(nq)
  );

  // 5. Exact normalized synonym matching
  for (const [keyStr, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    const key = keyStr as FieldKey;
    if (key === "OTHER") continue;

    // Reject disqualified keys
    if (key === "FULL_NAME" && hasRelationalQualifier) continue;
    if (key === "DOB" && hasNonDobQualifier) continue;
    if ((key === "AADHAAR_NO" || key === "PAN_NO") && hasNonIdNumberQualifier) continue;

    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeLabel(synonym);
      if (normalized === normalizedSynonym) {
        return { key, matchType: "exact" };
      }
    }
  }

  // 6. Conservative token matching (multi-token labels only, strictly unambiguous)
  if (labelTokens.length >= 2) {
    const candidateMatches = new Set<FieldKey>();

    for (const [keyStr, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      const key = keyStr as FieldKey;
      if (key === "OTHER") continue;

      // Reject disqualified keys
      if (key === "FULL_NAME" && hasRelationalQualifier) continue;
      if (key === "DOB" && hasNonDobQualifier) continue;
      if ((key === "AADHAAR_NO" || key === "PAN_NO") && hasNonIdNumberQualifier) continue;

      for (const synonym of synonyms) {
        const synTokens = normalizeLabel(synonym).split(" ");
        // Ensure every token in the known synonym is present in the label in order or complete presence
        if (
          synTokens.length >= 2 &&
          synTokens.every((st) => labelTokens.includes(st))
        ) {
          candidateMatches.add(key);
        }
      }
    }

    // Only accept if strictly unambiguous (exactly 1 candidate key)
    if (candidateMatches.size === 1) {
      const [matchedKey] = Array.from(candidateMatches);
      return { key: matchedKey, matchType: "synonym" };
    }
  }

  // Ambiguous or unrecognized labels produce null -> NEEDS_USER
  return null;
}
