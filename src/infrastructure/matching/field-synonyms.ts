import { FieldKey } from "../../domain/document/document.types";

export const FIELD_SYNONYMS: Record<FieldKey, string[]> = {
  FULL_NAME: [

    "পূর্ণ নাম",
    "applicants name",
    "नाम",
    "নাম",

    "full name",
    "applicant name",
    "candidate name",
    "name of applicant",
    "name of candidate",
    "person name",
    "name",

    "पूरा नाम",
    "आवेदक का नाम",
    "अभ्यर्थी का नाम",
    "प्रार्थी का नाम",

    "পুরো নাম",
    "সম্পূর্ণ নাম",
    "আবেদনকারীর নাম",
    "প্রার্থীর নাম",
  ],

  FATHER_NAME: [

    "father name",
    "fathers name",
    "father's name",
    "father s name",
    "name of father",

    "पिता का नाम",
    "पिताजी का नाम",
    "पिता नाम",

    "বাবার নাম",
    "পিতার নাম",
    "বাবার নাম কী",
  ],

  MOTHER_NAME: [

    "mother name",
    "mothers name",
    "mother's name",
    "mother s name",
    "name of mother",

    "माता का नाम",
    "माताजी का नाम",
    "माता नाम",

    "মায়ের নাম",
    "মাতার নাম",
    "মায়ের নাম কী",
  ],

  DOB: [

    "dob",
    "date of birth",
    "birth date",
    "d o b",

    "जन्म तिथि",
    "जन्म तारीख",
    "जन्म दिनांक",
    "जन्मदिन",

    "জন্ম তারিখ",
    "জন্মদিন",
    "জন্মের তারিখ",
  ],

  GENDER: [

    "gender",
    "sex",

    "लिंग",

    "লিঙ্গ",
  ],

  ADDRESS: [

    "address",
    "correspondence address",
    "postal address",
    "पता",
    "स्थायी पता",
    "ঠিকানা",

    "permanent address",
    "residential address",
    "communication address",
    "present address",
    "full address",
    "home address",

    "स्थाई पता",
    "वर्तमान पता",
    "निवास स्थान",

    "স্থায়ী ঠিকানা",
    "বর্তমান ঠিকানা",
  ],

  PIN_CODE: [

    "pin",
    "पिन",
    "পিন",

    "pin code",
    "pincode",
    "postal code",
    "zip code",

    "पिन कोड",
    "डाक कोड",

    "পিন কোড",
    "ডাক কোড",
  ],

  AADHAAR_NO: [

    "aadhaar",
    "aadhaar no",
    "aadhaar number",
    "aadhar",
    "aadhar no",
    "aadhar number",
    "aadhaar card no",
    "aadhar card no",
    "addhar card no",
    "adhar card no",
    "uid",
    "uidai",

    "आधार",
    "आधार नंबर",
    "आधार संख्या",
    "आधार क्र",

    "আধার",
    "আধার নম্বর",
    "আধার সংখ্যা",
  ],

  EPIC_NO: [

    "epic",
    "epic no",
    "epic number",
    "voter id",
    "voter id number",
    "voter id no",
    "voter card no",
    "elector photo identity card",
    "elector photo identity card no",
    "epic card",

    "एपिक",
    "एपिक नंबर",
    "मतदाता पहचान पत्र",
    "मतदाता पहचान पत्र संख्या",
    "मतदाता पहचान पत्र नंबर",
    "वोटर आईडी नंबर",
    "ईपिक नंबर",

    "ইপিক",
    "ইপিক নম্বর",
    "নির্বাচক ফটো পরিচয়পত্র",
    "ভোটার আইডি নম্বর",
    "ভোটার পরিচয়পত্র নম্বর",
    "এপিক নম্বর",
  ],

  PAN_NO: [

    "pan",
    "pan no",
    "pan number",
    "permanent account number",

    "पैन",
    "पैन नंबर",
    "स्थायी खाता संख्या",

    "প্যান",
    "প্যান নম্বর",
  ],

  PHONE: [

    "phone",
    "phone no",
    "फोन",
    "ফোন",

    "phone number",
    "mobile",
    "mobile number",
    "mobile no",
    "contact number",
    "contact no",
    "telephone number",
    "cell number",

    "मोबाइल",
    "मोबाइल नंबर",
    "दूरभाष",
    "फोन नंबर",
    "सम्पर्क नंबर",

    "মোবাইল",
    "মোবাইল নম্বর",
    "ফোন নম্বর",
    "যোগাযোগ নম্বর",
  ],

  EMAIL: [

    "email",
    "email address",
    "email id",
    "e mail",
    "e mail address",

    "ईमेल",
    "ई मेल",

    "ইমেল",
    "ইমেইল",
    "ই মেইল",
  ],

  DL_NO: [

    "driving licence no",
    "driving license number",
    "dl no",
    "licence no",
    "license number",

    "ड्राइविंग लाइसेंस नंबर",
    "ड्राइविंग लाइसेंस संख्या",
    "लाइसेंस नंबर",
    "डीएल नंबर",

    "ড্রাইভিং লাইসেন্স নম্বর",
    "লাইসেন্স নম্বর",
    "ডিএল নম্বর",
  ],

  BLOOD_GROUP: [

    "blood group",
    "blood type",

    "रक्त समूह",
    "ब्लड ग्रुप",

    "রক্তের গ্রুপ",
    "ব্লাড গ্রুপ",
  ],

  VALIDITY: [

    "validity",
    "valid upto",
    "valid till",
    "expiry date",

    "वैधता",
    "वैध तिथि तक",
    "समाप्ति तिथि",

    "বৈধতা",
    "মেয়াদ",
    "মেয়াদ শেষের তারিখ",
  ],

  PLACE_OF_BIRTH: [

    "place of birth",
    "birth place",

    "जन्म स्थान",
    "जन्म स्थल",

    "জন্মস্থান",
  ],

  REGISTRATION_NO: [

    "birth registration no",
    "birth registration number",

    "जन्म पंजीकरण संख्या",
    "जन्म पंजीकरण नंबर",

    "জন্ম নিবন্ধন নম্বর",
  ],

  RATION_NO: [

    "ration card no",
    "ration card number",
    "ration no",
    "rc no",

    "राशन कार्ड नंबर",
    "राशन कार्ड संख्या",
    "राशन कार्ड क्रमांक",

    "রেশন কার্ড নম্বর",
    "রেশন কার্ড নং",
  ],

  CATEGORY: [

    "ration category",
    "card type",

    "राशन श्रेणी",
    "कार्ड प्रकार",

    "রেশন শ্রেণি",
    "কার্ডের ধরন",
  ],

  OTHER: [],
};

export const SIGNATURE_DECLARATION_KEYWORDS: string[] = [

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

  "हस्ताक्षर",
  "दस्तखत",
  "आवेदक के हस्ताक्षर",
  "उम्मीदवार के हस्ताक्षर",
  "आबेदनकारीर स्वाक्षर",
  "घोषणा",
  "शपथ पत्र",
  "सहमति",
  "अंगूठे का निशान",

  "স্বাক্ষর",
  "আবেদনকারীর স্বাক্ষর",
  "প্রার্থীর স্বাক্ষর",
  "ঘোষণা",
  "ঘোষণাপত্র",
  "সম্মতি",
  "টিপসই",
];

export const GENERIC_STANDALONE_WORDS = new Set([
  "no",
  "date",
  "number",
  "in",
  "permanent",
  "code",
  "id",
  "card",
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

  "नंबर",
  "तारीख",
  "तिथि",
  "कोड",
  "संख्या",

  "নম্বর",
  "তারিখ",
  "কোড",
  "সংখ্যা",
]);

export const RELATIONAL_QUALIFIERS = [
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

  "पिता",
  "माता",
  "पति",
  "पत्नी",
  "अभिभावक",
  "नामिती",
  "संरक्षक",
  "डॉक्टर",
  "गवाह",

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

export const NON_DOB_QUALIFIERS = [
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

  "आवेदन",
  "जारी",
  "पंजीकरण",
  "जमा",

  "আবেদন",
  "ইস্যু",
  "জমা",
  "নিবন্ধন",
];

export const NON_ID_NUMBER_QUALIFIERS = [
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

  "क्रम",
  "क्रमांक",
  "कमरा",
  "रसीद",
  "खाता",

  "ক্রমিক",
  "রসিদ",
  "হিসাব",
];

export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSignatureOrDeclarationLabel(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeLabel(text);
  if (!normalized) return false;
  const words = normalized.split(" ");

  return SIGNATURE_DECLARATION_KEYWORDS.some((kw) => {
    const kwNorm = normalizeLabel(kw);

    if (kwNorm.includes(" ")) {
      return normalized.includes(kwNorm);
    }

    if (/[ऀ-ॿঀ-৿]/.test(kwNorm)) {
      return normalized.includes(kwNorm);
    }

    if (kwNorm === "sign" || kwNorm === "signed" || kwNorm === "lti" || kwNorm === "rti") {
      return words.includes(kwNorm);
    }

    return words.some((w) => w === kwNorm || w.startsWith(kwNorm));
  });
}

export function resolveFieldKey(
  label: string
): { key: FieldKey; matchType: "exact" | "synonym" } | null {
  const normalized = normalizeLabel(label);
  if (!normalized) {
    return null;
  }

  if (GENERIC_STANDALONE_WORDS.has(normalized)) {
    return null;
  }

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
    if ((key === "AADHAAR_NO" || key === "PAN_NO") && hasNonIdNumberQualifier) continue;

    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeLabel(synonym);
      if (normalized === normalizedSynonym) {
        return { key, matchType: "exact" };
      }
    }
  }

  if (labelTokens.length >= 2) {
    const candidateMatches = new Set<FieldKey>();

    for (const [keyStr, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      const key = keyStr as FieldKey;
      if (key === "OTHER") continue;

      if (key === "FULL_NAME" && hasRelationalQualifier) continue;
      if (key === "DOB" && hasNonDobQualifier) continue;
      if ((key === "AADHAAR_NO" || key === "PAN_NO") && hasNonIdNumberQualifier) continue;

      for (const synonym of synonyms) {
        const synTokens = normalizeLabel(synonym).split(" ");

        if (
          synTokens.length >= 2 &&
          synTokens.every((st) => labelTokens.includes(st))
        ) {
          candidateMatches.add(key);
        }
      }
    }

    if (candidateMatches.size === 1) {
      const [matchedKey] = Array.from(candidateMatches);
      return { key: matchedKey, matchType: "synonym" };
    }
  }

  return null;
}