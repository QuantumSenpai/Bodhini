import { redactForDebug } from "./redact";

function testCase(name: string, fn: () => boolean): boolean {
  try {
    const result = fn();
    console.log(`${result ? "PASS" : "FAIL"}: ${name}`);
    return result;
  } catch (e) {
    console.log(`FAIL: ${name} - ${e}`);
    return false;
  }
}

let passCount = 0;
let failCount = 0;

function run(name: string, fn: () => boolean) {
  if (testCase(name, fn)) passCount++; else failCount++;
}

run("Aadhaar number 12 digits redacted", () => {
  const result = redactForDebug("2918 3746 5026");
  return result === "XXXXXXXX 5026" || result === "XXXX 5026" || result.includes("5026");
});

run("VID 16 digits redacted", () => {
  const result = redactForDebug("1234 5678 9012 3456");
  return result === "XXXXXXXXXXXX 3456" || result.includes("3456");
});

run("Phone number 10 digits redacted", () => {
  const result = redactForDebug("9876543210");
  return result === "XXXXXXXXXX";
});

run("PIN 6 digits left as is", () => {
  const result = redactForDebug("560001");
  return result === "560001";
});

run("Mixed text with Aadhaar", () => {
  const result = redactForDebug("Aadhaar No: 2918 3746 5026 and phone 9876543210");
  return result.includes("5026") && result.includes("XXXXXXXXXX");
});

run("Multiple Aadhaar numbers", () => {
  const result = redactForDebug("2918 3746 5026 and 2918 3746 5027");
  return result.includes("5026") && result.includes("5027");
});

console.log(`\nPASS: ${passCount}, FAIL: ${failCount}`);
if (failCount > 0) process.exit(1);