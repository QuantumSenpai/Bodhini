import { FieldKey } from "../../domain/document/document.types";

const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export class FieldValidator {

  public static isValidAadhaar(value: string): boolean {
    const cleaned = value.replace(/\s+/g, "").replace(/-/g, "");
    if (!/^\d{12}$/.test(cleaned)) {
      return false;
    }

    let c = 0;
    const invertedArray = cleaned
      .split("")
      .map(Number)
      .reverse();

    for (let i = 0; i < invertedArray.length; i++) {
      c = VERHOEFF_D[c][VERHOEFF_P[i % 8][invertedArray[i]]];
    }

    return c === 0;
  }

  public static maskAadhaar(value: string): string {
    const cleaned = value.replace(/\s+/g, "").replace(/-/g, "");
    if (cleaned.length < 4) {
      return value;
    }
    const last4 = cleaned.slice(-4);
    return `•••• •••• ${last4}`;
  }

  public static isValidPan(value: string): boolean {
    const cleaned = value.trim().toUpperCase();
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned);
  }

  public static normalizeDob(value: string): string | null {
    const trimmed = value.trim();

    const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      return FieldValidator.validateDateValues(year, month, day);
    }

    const dmyMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(trimmed);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      const year = parseInt(dmyMatch[3], 10);
      return FieldValidator.validateDateValues(year, month, day);
    }

    return null;
  }

  public static isValidPhone(value: string): boolean {
    const cleaned = value
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/^\+91/, "")
      .replace(/^0/, "");

    return /^[6-9]\d{9}$/.test(cleaned);
  }

  public static normalizePhone(value: string): string | null {
    const cleaned = value
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/^\+91/, "")
      .replace(/^0/, "");

    if (/^[6-9]\d{9}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  public static isValidPinCode(value: string): boolean {
    const cleaned = value.trim();
    return /^[1-9][0-9]{5}$/.test(cleaned);
  }

  public static normalizeGender(value: string): "Male" | "Female" | "Other" | null {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "male" ||
      normalized === "m" ||
      normalized === "पुरुष" ||
      normalized === "পুং" ||
      normalized === "পুরুষ"
    ) {
      return "Male";
    }

    if (
      normalized === "female" ||
      normalized === "f" ||
      normalized === "महिला" ||
      normalized === "स्त्री" ||
      normalized === "মহিলা" ||
      normalized === "স্ত্রী"
    ) {
      return "Female";
    }

    if (
      normalized === "other" ||
      normalized === "transgender" ||
      normalized === "अन्य" ||
      normalized === "অন্যান্য" ||
      normalized === "তৃতীয় লিঙ্গ"
    ) {
      return "Other";
    }

    return null;
  }

  public static validate(key: FieldKey, value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    switch (key) {
      case "AADHAAR_NO":
        return FieldValidator.isValidAadhaar(value);
      case "PAN_NO":
        return FieldValidator.isValidPan(value);
      case "DOB":
        return FieldValidator.normalizeDob(value) !== null;
      case "PHONE":
        return FieldValidator.isValidPhone(value);
      case "PIN_CODE":
        return FieldValidator.isValidPinCode(value);
      case "GENDER":
        return FieldValidator.normalizeGender(value) !== null;
      case "EMAIL":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
      case "FULL_NAME":
      case "ADDRESS":
      case "OTHER":
        return value.trim().length > 0;
      default:
        return true;
    }
  }

  private static validateDateValues(year: number, month: number, day: number): string | null {
    if (year < 1900 || year > new Date().getFullYear()) {
      return null;
    }
    if (month < 1 || month > 12) {
      return null;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return null;
    }

    const yStr = String(year).padStart(4, "0");
    const mStr = String(month).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  }
}