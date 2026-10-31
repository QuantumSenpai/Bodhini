const d = [
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

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeffChecksum(num: string): number {
  let c = 0;
  for (let i = num.length - 1; i >= 0; i--) {
    c = d[c][p[(num.length - 1 - i) % 8][Number(num[i])]];
  }
  return c;
}

export function isValidVerhoeff(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  return verhoeffChecksum(digits) === 0;
}

export function isValidAadhaar(value: string): boolean {
  const digits = value.replace(/\s/g, "");
  if (digits.length !== 12) return false;
  if (!/^[2-9]/.test(digits)) return false;
  return isValidVerhoeff(digits);
<<<<<<< HEAD
}

export function maskAadhaar(value: string): string {
  const cleaned = value.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.length < 4) {
    return value;
  }
  const last4 = cleaned.slice(-4);
  return `•••• •••• ${last4}`;
=======
>>>>>>> dba0fcc (feat: add core document processing, form analysis, and offline-first mobile UI)
}