import { describe, expect, it } from "vitest";
import { canonicalEvidenceSchema } from "@/lib/integrations/evidence-v1";
import { DemoCoupaConnector, retrieveDemoCoupaEvidence, type DemoCoupaScenario } from "@/lib/integrations/demo-coupa";
import { runCoupaRulesV1 } from "@/lib/integrations/rules-v1";
import { ConnectorTimeoutError,withSafeRetry } from "@/lib/integrations/resilience";

const transaction = {
  supplierId: "SUP-001",
  supplierName: "Mokoena Catering Demo",
  purchaseOrderNumber: "PO-2048",
  invoiceNumber: "INV-2048",
  invoiceTotalMinor: 8_230_000,
  currency: "ZAR",
  invoiceDate: "2026-09-01",
  dueDate: "2026-10-09",
};

async function run(scenario: DemoCoupaScenario) {
  const connector = new DemoCoupaConnector(scenario, transaction, () => "2026-09-05T12:32:00+02:00");
  const evidence = await retrieveDemoCoupaEvidence(connector, transaction, "corr-demo-2048");
  return evidence ? runCoupaRulesV1({ ...transaction, totalMinor: transaction.invoiceTotalMinor, dueDate: transaction.dueDate }, evidence) : null;
}

describe("Demo Coupa integration", () => {
  it("system verifies a complete match", async () => {
    const output = await run("match");
    expect(output?.outcome).toBe("system_verified");
    expect(output?.checks).toHaveLength(10);
    expect(output?.checks.every((check) => check.result === "pass")).toBe(true);
  });

  it.each(["invoice_missing", "amount_mismatch", "receipt_missing"] as const)("routes %s to buyer exception review", async (scenario) => {
    expect((await run(scenario))?.outcome).toBe("review_required");
  });

  it("blocks an invoice Demo Coupa reports as paid", async () => {
    const output = await run("already_paid");
    expect(output?.outcome).toBe("blocked");
    expect(output?.checks.find((check) => check.ruleId === "C009")?.result).toBe("fail");
  });

  it("returns no evidence when Demo Coupa is disconnected", async () => {
    expect(await run("disconnected")).toBeNull();
  });

  it("rejects malformed connector evidence before comparison", () => {
    expect(() => canonicalEvidenceSchema.parse({ provider: "coupa", providerMode: "demo", receipts: "not-an-array" })).toThrow();
  });

  it("retries one safe lookup and bounds timeouts",async()=>{let attempts=0;await expect(withSafeRetry(async()=>{attempts++;if(attempts===1)throw new Error("temporary");return"ok";},{timeoutMs:100,retries:1})).resolves.toBe("ok");expect(attempts).toBe(2);await expect(withSafeRetry(()=>new Promise(()=>undefined),{timeoutMs:5,retries:0})).rejects.toBeInstanceOf(ConnectorTimeoutError);});
});
