import { describe, expect, it } from "vitest";
import { DEMO_EXTRACTION_DISCLOSURE, extractDemoDocument } from "@/lib/ai/demo-extraction";

describe("honest deterministic demo extraction", () => {
  it("returns the bundled synthetic invoice only under explicit demo mode", () => {
    const result=extractDemoDocument({mode:"demo",kind:"invoice",sha256:"9b93af9c5eaf434b058ca50a30b8178dcfd1b097113f6999aef8a29b21855272"});
    expect(result.normalizedFields.total).toBe("48750.25");
    expect(result.metadata.disclosure).toBe(DEMO_EXTRACTION_DISCLOSURE);
    expect(result.provider).toBe("proofflow-demo-fixture");
  });
  it("cannot activate while live mode is selected",()=>{
    expect(()=>extractDemoDocument({mode:"live",kind:"invoice",sha256:"9b93af9c5eaf434b058ca50a30b8178dcfd1b097113f6999aef8a29b21855272"})).toThrowError(expect.objectContaining({code:"DEMO_MODE_DISABLED"}));
  });
  it.each([
    ["unknown bytes","invoice","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["wrong slot","purchase_order","9b93af9c5eaf434b058ca50a30b8178dcfd1b097113f6999aef8a29b21855272"],
  ] as const)("rejects %s without inventing values",(_name,kind,sha256)=>{
    expect(()=>extractDemoDocument({mode:"demo",kind,sha256})).toThrowError(expect.objectContaining({code:"DEMO_DOCUMENT_UNKNOWN"}));
  });
});
