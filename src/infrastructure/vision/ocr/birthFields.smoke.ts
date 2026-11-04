import { findBirthDob, findBirthFather, findBirthGender, findBirthMother, findBirthName, findBirthPlace, findBirthRegistration } from "./birthFields";
import type { OcrRow } from "./ocr.types";

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean): void {
  let ok = false;
  try {
    ok = fn();
  } catch {
    ok = false;
  }
  if (ok) passCount++;
  else failCount++;
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
}

function rows(...texts: string[]): OcrRow[] {
  return texts.map((text, i) => ({ text, left: 0, top: i * 30, right: 300, bottom: i * 30 + 25, script: "latin" }));
}

run("child name on next row", () => findBirthName(rows("Name of Child", "ANITA KUMARI SHARMA")) === "ANITA KUMARI SHARMA");

run("empty name value does not take the Sex row", () => findBirthName(rows("Name of Child", "Sex MALE")) === null);

run("empty name value does not take the Date of Birth row", () => findBirthName(rows("Name of Child", "Date of Birth", "15/08/2020")) === null);

run("hospital name row is not the child name", () => {
  const n = findBirthName(rows("Name of Hospital CITY GENERAL HOSPITAL", "Name of Child ANITA KUMARI SHARMA"));
  return n === "ANITA KUMARI SHARMA";
});

run("only hospital row gives no child name", () => findBirthName(rows("Name of Hospital CITY GENERAL HOSPITAL")) === null);

run("father and mother stay separate", () => {
  const r = rows("Name of Child ANITA KUMARI SHARMA", "Father's Name SURESH KUMAR SHARMA", "Mother's Name MEENA DEVI");
  return findBirthFather(r) === "SURESH KUMAR SHARMA" && findBirthMother(r) === "MEENA DEVI" && findBirthName(r) === "ANITA KUMARI SHARMA";
});

run("father value on next row", () => findBirthFather(rows("Father's Name", "SURESH KUMAR SHARMA")) === "SURESH KUMAR SHARMA");

run("empty father value does not take the Mother row", () => findBirthFather(rows("Father's Name", "Mother's Name MEENA DEVI")) === null);

run("DOB same row", () => findBirthDob(rows("Date of Birth: 15/08/2020"))?.value === "15/08/2020");

run("DOB on next row", () => findBirthDob(rows("Date of Birth", "15/08/2020"))?.value === "15/08/2020");

run("DOB month name", () => findBirthDob(rows("Date of Birth 5 August 2020"))?.value === "05/08/2020");

run("DOB label without date does not take Date of Registration", () => findBirthDob(rows("Date of Birth", "Date of Registration 20/08/2020")) === null);

run("gender on next row", () => findBirthGender(rows("Sex", "FEMALE")) === "FEMALE");

run("gender same row", () => findBirthGender(rows("Sex: MALE")) === "MALE");

run("empty gender value does not read the Father row", () => findBirthGender(rows("Sex", "Father's Name RAMESH MALE KUMAR")) === null);

run("place same row with colon", () => findBirthPlace(rows("Place of Birth: CITY HOSPITAL KOLKATA")) === "CITY HOSPITAL KOLKATA");

run("place on next row", () => findBirthPlace(rows("Place of Birth", "APOLLO HOSPITAL KOLKATA")) === "APOLLO HOSPITAL KOLKATA");

run("empty place value does not take the Sex row", () => findBirthPlace(rows("Place of Birth", "Sex MALE")) === null);

run("registration with colon", () => findBirthRegistration(rows("Registration No: REG/2020/12345")) === "REG/2020/12345");

run("registration with Reg. No. and dot", () => findBirthRegistration(rows("Reg. No. 12345/2020")) === "12345/2020");

run("registration with Reg No and no dot", () => findBirthRegistration(rows("Reg No 98765")) === "98765");

run("registration on next row", () => findBirthRegistration(rows("Registration No", "B-2020/4567")) === "B-2020/4567");

run("registration without a digit is rejected", () => findBirthRegistration(rows("Registration No: PENDING")) === null);

run("empty rows", () => findBirthName([]) === null && findBirthDob([]) === null && findBirthRegistration([]) === null);

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
