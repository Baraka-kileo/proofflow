import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(protected)/applications/[applicationId]/compliance-actions", () => ({
  recordExternalComplianceStatus: vi.fn(),
}));

import { ExternalCompliancePanel } from "@/features/offers/external-compliance-panel";

describe("external compliance panel", () => {
  it("makes the funder's responsibility and data boundary explicit", () => {
    render(<ExternalCompliancePanel applicationId="00000000-0000-4000-8000-000000000042" check={null} />);

    expect(screen.getByRole("heading", { name: "External KYC/KYB progress" })).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveValue("required");
    expect(screen.getByText(/does not make the compliance decision/i)).toBeInTheDocument();
    expect(screen.getByText(/Do not enter ID numbers, biometrics/i)).toBeInTheDocument();
  });
});
