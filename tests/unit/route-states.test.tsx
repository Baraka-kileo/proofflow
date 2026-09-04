import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/empty-state";
import { RouteError } from "@/components/route-error";
import { RouteLoading } from "@/components/route-loading";
describe("route states",()=>{afterEach(cleanup);it("announces loading",()=>{render(<RouteLoading />);expect(screen.getByRole("status",{name:"Loading page"})).toBeInTheDocument();});it("runs the supplied recovery action",()=>{const reset=vi.fn();render(<RouteError reset={reset} />);fireEvent.click(screen.getByRole("button",{name:"Try again"}));expect(reset).toHaveBeenCalledOnce();});it("only renders a working empty-state link when supplied",()=>{render(<EmptyState title="No applications yet" description="Start when ready." action={{label:"Start application",href:"/applications/new"}} />);expect(screen.getByRole("link",{name:"Start application"})).toHaveAttribute("href","/applications/new");});});
