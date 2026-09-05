import { describe, expect, it } from "vitest";
import { deriveApplicationProgress } from "@/lib/applications/progress";

const draft={status:"draft" as const,buyer_organization_id:"buyer",purchase_order_reference:"PO-42",invoice_number:"INV-42",invoice_total_minor:4200,invoice_due_on:"2099-01-01",ai_processing_consented_at:"2026-09-05T00:00:00Z"};

describe("application progress",()=>{
  it("starts on details before a server draft exists",()=>{const progress=deriveApplicationProgress(null);expect(progress.currentIndex).toBe(0);expect(progress.steps.map(step=>step.state)).toEqual(["current","locked","locked","locked","locked"]);});
  it("moves a saved complete draft to documents",()=>{const progress=deriveApplicationProgress(draft);expect(progress.currentIndex).toBe(1);expect(progress.completedCount).toBe(1);});
  it("uses hosted document categories to unlock review",()=>{const progress=deriveApplicationProgress(draft,["invoice","purchase_order","delivery_evidence"]);expect(progress.currentIndex).toBe(2);expect(progress.steps[1].state).toBe("complete");});
  it.each([
    ["sme_reviewed",3,3],
    ["checks_complete",4,4],
    ["buyer_confirmed",4,5],
  ] as const)("derives %s progress from server status",(status,currentIndex,completedCount)=>{const progress=deriveApplicationProgress({...draft,status});expect(progress.currentIndex).toBe(currentIndex);expect(progress.completedCount).toBe(completedCount);});
});
