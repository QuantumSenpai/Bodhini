export type DateFormat =
  | "DD/MM/YYYY"
  | "DD-MM-YYYY"
  | "DD.MM.YYYY"
  | "YYYY-MM-DD"
  | "YYYY/MM/DD";

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

const DAY_FIRST_VALUE = /^(\d{1,2})([\/\-.])(\d{1,2})\2(\d{4})$/;
const YEAR_FIRST_VALUE = /^(\d{4})([\/\-.])(\d{1,2})\2(\d{1,2})$/;
const DAY_FIRST_LABEL = /\bd{2}\s*([\/\-.])\s*m{2}\s*\1\s*y{4}\b/;
const YEAR_FIRST_LABEL = /\by{4}\s*([\/\-.])\s*m{2}\s*\1\s*d{2}\b/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseDateParts(value: string): DateParts | null {
  const text = value.trim();
  let year: number;
  let month: number;
  let day: number;
  const dayFirst = DAY_FIRST_VALUE.exec(text);
  const yearFirst = YEAR_FIRST_VALUE.exec(text);
  if (dayFirst) {
    day = Number(dayFirst[1]);
    month = Number(dayFirst[3]);
    year = Number(dayFirst[4]);
  } else if (yearFirst) {
    year = Number(yearFirst[1]);
    month = Number(yearFirst[3]);
    day = Number(yearFirst[4]);
  } else {
    return null;
  }
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function formatDate(value: string, format: DateFormat): string | null {
  const parts = parseDateParts(value);
  if (!parts) return null;
  const dd = pad2(parts.day);
  const mm = pad2(parts.month);
  const yyyy = String(parts.year);
  switch (format) {
    case "DD/MM/YYYY":
      return `${dd}/${mm}/${yyyy}`;
    case "DD-MM-YYYY":
      return `${dd}-${mm}-${yyyy}`;
    case "DD.MM.YYYY":
      return `${dd}.${mm}.${yyyy}`;
    case "YYYY-MM-DD":
      return `${yyyy}-${mm}-${dd}`;
    case "YYYY/MM/DD":
      return `${yyyy}/${mm}/${dd}`;
  }
}

export function detectDateFormat(label: string): DateFormat | null {
  const text = label.toLowerCase();
  const dayFirst = DAY_FIRST_LABEL.exec(text);
  if (dayFirst) {
    if (dayFirst[1] === "/") return "DD/MM/YYYY";
    if (dayFirst[1] === "-") return "DD-MM-YYYY";
    return "DD.MM.YYYY";
  }
  const yearFirst = YEAR_FIRST_LABEL.exec(text);
  if (yearFirst) {
    if (yearFirst[1] === "-") return "YYYY-MM-DD";
    if (yearFirst[1] === "/") return "YYYY/MM/DD";
  }
  return null;
}

const HINT_BRACKETED = /[(\[]\s*(?:d{2}\s*([\/\-.])\s*m{2}\s*\1\s*y{4}|y{4}\s*([\/\-.])\s*m{2}\s*\2\s*d{2})\s*[)\]]/gi;
const HINT_BARE = /\b(?:d{2}\s*([\/\-.])\s*m{2}\s*\1\s*y{4}|y{4}\s*([\/\-.])\s*m{2}\s*\2\s*d{2})\b/gi;

export function stripDateFormatHint(label: string): string {
  const out = label.replace(HINT_BRACKETED, " ").replace(HINT_BARE, " ");
  if (out === label) return label;
  const cleaned = out.replace(/\s+/g, " ").replace(/[\s:\-,;]+$/, "").trim();
  return cleaned.length > 0 ? cleaned : label;
}
