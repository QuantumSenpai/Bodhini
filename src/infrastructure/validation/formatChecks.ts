export function isValidDate(value: string): boolean {
  const match = value.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

export function isValidPin(value: string): boolean {
  if (!/^\d{6}$/.test(value)) return false;
  return value[0] !== "0";
}

export function isValidPan(value: string): boolean {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(value);
}