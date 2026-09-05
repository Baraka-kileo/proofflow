import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewReadyPanel } from "@/features/applications/review-ready-panel";

describe("review-ready extraction disclosure",()=>{
  it("shows the required disclosure only in explicit demo mode",()=>{
    const {rerender}=render(<ReviewReadyPanel extractionMode="live"/>);
    expect(screen.queryByText("Demo extraction—not processed by live AI")).not.toBeInTheDocument();
    rerender(<ReviewReadyPanel extractionMode="demo"/>);
    expect(screen.getByRole("status")).toHaveTextContent("Demo extraction—not processed by live AI");
  });
});
