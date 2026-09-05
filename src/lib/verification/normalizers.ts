const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DECIMAL_MONEY_PATTERN = /^(0|[1-9]\d*)(?:\.(\d+))?$/;

function cleanText(value: string | null | undefined) {
  if (value == null) return null;
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeName(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (cleaned === null) return null;
  const normalized = cleaned
    .toLocaleLowerCase("en")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return normalized || null;
}

export function normalizeReference(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (cleaned === null) return null;
  const normalized = cleaned.toLocaleUpperCase("en").replace(/[^A-Z0-9]/g, "");
  return normalized || null;
}

export function normalizeIsoDate(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (cleaned === null) return null;
  const match = ISO_DATE_PATTERN.exec(cleaned);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? cleaned
    : null;
}

export function normalizeCurrency(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (cleaned === null) return null;
  const normalized = cleaned.toLocaleUpperCase("en");
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

export function decimalToMinorUnits(
  value: string | null | undefined,
  fractionDigits = 2,
): bigint | null {
  const cleaned = cleanText(value);
  if (cleaned === null || !Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) return null;
  const match = DECIMAL_MONEY_PATTERN.exec(cleaned);
  if (!match) return null;
  const fraction = match[2] ?? "";
  if (fraction.length > fractionDigits) return null;
  const scale = BigInt(10) ** BigInt(fractionDigits);
  const paddedFraction = fraction.padEnd(fractionDigits, "0");
  return BigInt(match[1]) * scale + BigInt(paddedFraction || "0");
}
