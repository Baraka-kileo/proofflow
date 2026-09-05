import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

vi.mock("@/app/(protected)/applications/[applicationId]/verification-actions",()=>({
  runApplicationVerification:vi.fn(),
  sendApplicationToBuyer:vi.fn(),
}));

import { VerificationPanel } from "@/features/applications/verification-panel";
import type { VerificationCheck } from "@/lib/verification/rules-v1";

const check=(status:"pass"|"review"|"fail",ruleId=`V${String(status==="pass"?1:status==="review"?12:10).padStart(3,"0")}` as VerificationCheck["ruleId"]):VerificationCheck=>({
  ruleId,version:"verification-v1",status,severity:status==="fail"?"blocking":status==="review"?"warning":"info",title:"Buyer identity",explanation:"The reviewed values are explainable.",comparedValues:{"Purchase order":"Ubuntu Retail Group"},sourceDocumentIds:["po-id"],
});

describe("VerificationPanel",()=>{
  it("shows a clear action before the first verification run",()=>{
    render(<VerificationPanel applicationId="00000000-0000-4000-8000-000000000001" status="sme_reviewed" overallResult={null} checks={[]} completedAt={null} sourceDocuments={[]}/>);
    expect(screen.getByRole("heading",{name:"Run evidence checks"})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Run verification checks"})).toBeEnabled();
    expect(screen.getByText(/not creditworthiness or finance approval/)).toBeInTheDocument();
  });

  it("keeps failed evidence visible and disables buyer handoff",()=>{
    const checks=Array.from({length:12},(_,index)=>check(index===9?"fail":"pass",`V${String(index+1).padStart(3,"0")}` as VerificationCheck["ruleId"]));
    render(<VerificationPanel applicationId="00000000-0000-4000-8000-000000000001" status="checks_complete" overallResult="fail" checks={checks} completedAt="2026-09-05T06:00:00Z" sourceDocuments={[{id:"po-id",label:"purchase order"}]}/>);
    expect(screen.getByText("Buyer request blocked")).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Send to buyer"})).toBeDisabled();
    expect(screen.getByRole("button",{name:"Run a fresh verification"})).toBeEnabled();
    expect(screen.getAllByRole("link",{name:"View purchase order"}).length).toBeGreaterThan(0);
  });

  it("shows the immutable waiting state after a successful handoff",()=>{
    const checks=Array.from({length:12},(_,index)=>check(index===11?"review":"pass",`V${String(index+1).padStart(3,"0")}` as VerificationCheck["ruleId"]));
    render(<VerificationPanel applicationId="00000000-0000-4000-8000-000000000001" status="buyer_pending" overallResult="review" checks={checks} completedAt="2026-09-05T06:00:00Z" sourceDocuments={[{id:"po-id",label:"purchase order"}]}/>);
    expect(screen.getByRole("heading",{name:"Buyer confirmation requested"})).toBeInTheDocument();
    expect(screen.queryByRole("button",{name:"Send to buyer"})).not.toBeInTheDocument();
    expect(screen.getByText("Waiting for buyer")).toBeInTheDocument();
  });
});
