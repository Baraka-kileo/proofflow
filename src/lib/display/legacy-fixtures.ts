/**
 * Earlier fictional fixtures included explicit DEMO suffixes. Signed customer
 * decisions remain immutable in storage, so current views normalize only that
 * obsolete presentation suffix without rewriting the audit record.
 */
export function presentLegacyFixtureLabel(value: string) {
  return value
    .replace(/-DEMO\b/gi, "")
    .replace(/\s+Demo\b/gi, "")
    .trim();
}
