import { describe, expect, it } from "vitest";
import {
  decimalToMinorUnits,
  normalizeCurrency,
  normalizeIsoDate,
  normalizeName,
  normalizeReference,
} from "@/lib/verification/normalizers";

describe("verification normalizers", () => {
  it.each([
    [" Ubuntu Retail Group (Pty) Ltd. ", "ubuntu retail group pty ltd"],
    ["MOKOENA  &  SONS", "mokoena and sons"],
    ["Caf\u00e9-Supply", "cafe supply"],
    ["   ", null],
    [null, null],
  ])("normalizes names without inventing missing values", (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });

  it.each([
    [" po-1042 / za ", "PO1042ZA"],
    ["inv. 00_42", "INV0042"],
    ["---", null],
    [null, null],
  ])("normalizes references across punctuation, case, and whitespace", (input, expected) => {
    expect(normalizeReference(input)).toBe(expected);
  });

  it.each([
    ["2026-09-05", "2026-09-05"],
    ["2024-02-29", "2024-02-29"],
    ["2026-02-29", null],
    ["05/09/2026", null],
    [null, null],
  ])("accepts only real ISO calendar dates", (input, expected) => {
    expect(normalizeIsoDate(input)).toBe(expected);
  });

  it.each([
    [" zar ", "ZAR"],
    ["usd", "USD"],
    ["R", null],
    ["US D", null],
    [null, null],
  ])("normalizes only three-letter currency codes", (input, expected) => {
    expect(normalizeCurrency(input)).toBe(expected);
  });

  it.each([
    ["48750.25", 2, BigInt(4_875_025)],
    ["48750.2", 2, BigInt(4_875_020)],
    ["48750", 2, BigInt(4_875_000)],
    ["19.123", 3, BigInt(19_123)],
    ["19.123", 2, null],
    ["48,750.25", 2, null],
    ["-1.00", 2, null],
    [null, 2, null],
  ])("parses decimal currency into exact integer minor units", (input, digits, expected) => {
    expect(decimalToMinorUnits(input, digits)).toBe(expected);
  });
});
