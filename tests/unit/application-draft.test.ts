import { describe, expect, it } from "vitest";
import { applicationDraftSchema, moneyToMinorUnits } from "@/lib/validation/application-draft";

const valid={buyerOrganizationId:"22222222-2222-4222-8222-222222222222",purchaseOrderReference:"PO-DEMO-1042",invoiceNumber:"INV-DEMO-2041",invoiceAmount:"48750.25",currency:"ZAR",expectedDueDate:"2099-10-19",aiConsent:"on"};

describe("application draft validation",()=>{
  it("converts decimal currency to exact integer minor units",()=>{expect(moneyToMinorUnits("48750.25")).toBe(4_875_025);expect(moneyToMinorUnits("10.5")).toBe(1050);});
  it("accepts a complete consented draft",()=>{expect(applicationDraftSchema.safeParse(valid).success).toBe(true);});
  it.each([
    ["buyerOrganizationId","not-an-id"],
    ["invoiceAmount","12.345"],
    ["invoiceAmount","0"],
    ["expectedDueDate","2020-01-01"],
    ["aiConsent",null],
  ])("rejects invalid %s",(field,value)=>{const parsed=applicationDraftSchema.safeParse({...valid,[field]:value});expect(parsed.success).toBe(false);if(!parsed.success)expect(parsed.error.issues.some(issue=>issue.path[0]===field)).toBe(true);});
});
