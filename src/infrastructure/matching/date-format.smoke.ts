import { detectDateFormat, formatDate, parseDateParts, stripDateFormatHint } from "./date-format";

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean) {
  let ok = false;
  try {
    ok = fn();
  } catch (e) {
    console.log(`FAIL: ${name} - ${e}`);
    failCount++;
    return;
  }
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (ok) passCount++; else failCount++;
}

function parsesTo(value: string, year: number, month: number, day: number): boolean {
  const p = parseDateParts(value);
  return p !== null && p.year === year && p.month === month && p.day === day;
}

run("parse slash day first", () => parsesTo("15/08/1985", 1985, 8, 15));
run("parse dash day first", () => parsesTo("15-08-1985", 1985, 8, 15));
run("parse dot day first", () => parsesTo("15.08.1985", 1985, 8, 15));
run("parse ISO", () => parsesTo("1985-08-15", 1985, 8, 15));
run("parse year first slash", () => parsesTo("1985/08/15", 1985, 8, 15));
run("parse single digit day and month", () => parsesTo("5/8/1985", 1985, 8, 5));
run("parse trims spaces", () => parsesTo("  15/08/1985  ", 1985, 8, 15));
run("leap day accepted in leap year", () => parsesTo("29/02/2024", 2024, 2, 29));
run("leap day rejected in common year", () => parseDateParts("29/02/2023") === null);
run("31 February rejected", () => parseDateParts("31/02/1985") === null);
run("day zero rejected", () => parseDateParts("00/01/1990") === null);
run("month 13 rejected", () => parseDateParts("15/13/1990") === null);
run("two digit year rejected", () => parseDateParts("15/08/85") === null);
run("mixed separators rejected", () => parseDateParts("15/08-1985") === null);
run("text rejected", () => parseDateParts("abc") === null);
run("empty rejected", () => parseDateParts("") === null);
run("year out of range rejected", () => parseDateParts("15/08/1850") === null);

run("format to DD/MM/YYYY", () => formatDate("1985-08-15", "DD/MM/YYYY") === "15/08/1985");
run("format to DD-MM-YYYY", () => formatDate("15/08/1985", "DD-MM-YYYY") === "15-08-1985");
run("format to DD.MM.YYYY", () => formatDate("15/08/1985", "DD.MM.YYYY") === "15.08.1985");
run("format to YYYY-MM-DD", () => formatDate("15/08/1985", "YYYY-MM-DD") === "1985-08-15");
run("format to YYYY/MM/DD", () => formatDate("15-08-1985", "YYYY/MM/DD") === "1985/08/15");
run("format pads single digits", () => formatDate("5/8/1985", "DD/MM/YYYY") === "05/08/1985");
run("format invalid returns null", () => formatDate("31/02/1985", "DD/MM/YYYY") === null);

run("detect DD/MM/YYYY in label", () => detectDateFormat("Date of Birth (DD/MM/YYYY)") === "DD/MM/YYYY");
run("detect lowercase dash", () => detectDateFormat("DOB dd-mm-yyyy") === "DD-MM-YYYY");
run("detect dot", () => detectDateFormat("Date (dd.mm.yyyy)") === "DD.MM.YYYY");
run("detect ISO", () => detectDateFormat("Date of Birth YYYY-MM-DD") === "YYYY-MM-DD");
run("detect year first slash", () => detectDateFormat("yyyy/mm/dd") === "YYYY/MM/DD");
run("detect spaced pattern", () => detectDateFormat("DOB (DD / MM / YYYY)") === "DD/MM/YYYY");
run("no format in plain label", () => detectDateFormat("Date of Birth") === null);
run("no format in unrelated label", () => detectDateFormat("Address") === null);
run("word ending in dd is not a format", () => detectDateFormat("add/mm/yyyy") === null);

run("strip bracketed hint", () => stripDateFormatHint("Date of Birth (DD/MM/YYYY)") === "Date of Birth");
run("strip square bracket hint", () => stripDateFormatHint("Date of Birth [dd-mm-yyyy]") === "Date of Birth");
run("strip bare hint", () => stripDateFormatHint("DOB dd-mm-yyyy") === "DOB");
run("strip hint after dash", () => stripDateFormatHint("Date of Birth - DD/MM/YYYY") === "Date of Birth");
run("strip year first hint", () => stripDateFormatHint("Date (YYYY-MM-DD)") === "Date");
run("strip leaves plain label alone", () => stripDateFormatHint("Date of Birth:") === "Date of Birth:");
run("strip ignores word ending in dd", () => stripDateFormatHint("add/mm/yyyy") === "add/mm/yyyy");
run("strip keeps label when only a hint", () => stripDateFormatHint("(DD/MM/YYYY)") === "(DD/MM/YYYY)");

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
