import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ExtractionReviewWorkspace, type ReviewDocument } from "@/features/applications/extraction-review-workspace";

const documents:ReviewDocument[]=[
  {id:"po",kind:"purchase_order",filename:"purchase-order.pdf",previewUrl:"https://example.test/signed-po",provider:"proofflow-demo-fixture",fields:[{id:"buyer",name:"buyer_legal_name",sourceValue:"Ubuntu Retail",normalizedValue:"Ubuntu Retail",confidenceBps:9500,sourceLabel:"Buyer"},{id:"date",name:"issue_date",sourceValue:null,normalizedValue:null,confidenceBps:0,sourceLabel:null}]},
  {id:"invoice",kind:"invoice",filename:"invoice.pdf",previewUrl:null,provider:"proofflow-demo-fixture",fields:[{id:"total",name:"total",sourceValue:"48750.25",normalizedValue:"48750.25",confidenceBps:9900,sourceLabel:"Invoice total"}]},
];

afterEach(cleanup);

describe("extraction review workspace",()=>{
  it("shows provenance, missing-field guidance, normalization and preserved edits",async()=>{
    const user=userEvent.setup();render(<ExtractionReviewWorkspace documents={documents}/>);
    expect(screen.getByText("Demo extraction—not processed by live AI")).toBeInTheDocument();
    expect(screen.getByText("Source: Purchase order · Buyer")).toBeInTheDocument();
    expect(screen.getByText("Please check")).toBeInTheDocument();
    expect(screen.getByText("Normalized format: YYYY-MM-DD")).toBeInTheDocument();
    const buyer=screen.getByLabelText("Buyer legal name");await user.clear(buyer);await user.type(buyer,"Ubuntu Retail Group Demo");
    expect(screen.getByText(/Edited by you · Original: Ubuntu Retail/)).toBeInTheDocument();
    await user.click(screen.getByRole("button",{name:"Document"}));
    await user.click(screen.getByRole("tab",{name:"Invoice"}));
    await user.click(screen.getByRole("tab",{name:"Purchase order"}));
    await user.click(screen.getByRole("button",{name:"Fields"}));
    expect(screen.getByLabelText("Buyer legal name")).toHaveValue("Ubuntu Retail Group Demo");
  });

  it("shows an expiring signed preview and a safe unavailable state",async()=>{
    const user=userEvent.setup();render(<ExtractionReviewWorkspace documents={documents}/>);
    expect(screen.getAllByTitle("Purchase order private preview")[0]).toHaveAttribute("src","https://example.test/signed-po");
    await user.click(screen.getByRole("tab",{name:"Invoice"}));
    expect(screen.getByText(/Preview expired or unavailable/)).toBeInTheDocument();
  });
});
