import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

test.describe.configure({ mode: "serial" });

async function enterDemoRole(page: Page, role: "SME" | "Buyer" | "Funder") {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`^${role} workspace`) }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 });
}

async function uniquePdf(path:string,label:string){
  const pdf=await PDFDocument.load(await readFile(path));
  pdf.setTitle(`${label}-${Date.now()}-${Math.random()}`);
  return Buffer.from(await pdf.save());
}

test("landing page renders its primary story without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Turn completed work into trusted proof.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Hackathon demo · no real money moves")).toBeVisible();

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBe(widths.client);
});

test("landing interactions expose focus and respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const action = page.getByRole("link", { name: "Explore the flow" });
  await action.focus();
  await expect(action).toBeFocused();

  const presentation = await page.evaluate(() => {
    const focused = document.activeElement;
    const reveal = document.querySelector(".reveal");
    return {
      outlineWidth: focused ? getComputedStyle(focused).outlineWidth : "0px",
      animationDuration: reveal ? getComputedStyle(reveal).animationDuration : "",
    };
  });

  expect(Number.parseFloat(presentation.outlineWidth)).toBeGreaterThan(0);
  expect(Number.parseFloat(presentation.animationDuration)).toBeLessThanOrEqual(0.01);
});

test("protected routes redirect signed-out visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?reason=signed-out$/);
  await expect(page.getByRole("heading", { name: "Sign in to ProofFlow" })).toBeVisible();
});

test("invalid live credentials return a generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/^Email address/).fill("unknown@proofflow.example");
  await page.getByLabel(/^Password/).fill("Not-the-password-123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toContainText("Email or password is incorrect");
});

test("protected shell is usable on mobile without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemoRole(page, "SME");
  await expect(page.getByRole("heading", { level: 1, name: "Good morning, Amara." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(widths.scroll).toBe(widths.client);
});

for (const viewport of [{ width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`protected shell fits ${viewport.width}px without overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterDemoRole(page, "SME");
    const navigationName=viewport.width>=1024?"Workspace navigation":"Mobile navigation";
    await expect(page.getByRole("navigation", { name:navigationName })).toBeVisible();
    const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(widths.scroll).toBe(widths.client);
  });
}

test("system states provide clear recovery", async ({ page, context }) => {
  await page.goto("/a-route-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "This page is not part of the evidence trail." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to overview" })).toHaveAttribute("href", "/dashboard");
  await enterDemoRole(page, "SME");
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByRole("alert").filter({ hasText: "You are offline" })).toContainText("You are offline");
  await context.setOffline(false);
});

test("demo login selects the buyer workspace through a hosted Supabase session", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to ProofFlow" })).toBeVisible();
  await page.getByRole("button", { name: "Buyer workspace Confirm delivery requests", exact:true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("buyer workspace", { exact:true })).toBeVisible();
  const cookies=await page.context().cookies();
  expect(cookies.some(item=>item.name.startsWith("sb-")&&item.name.includes("auth-token"))).toBe(true);
  expect(cookies.some(item=>item.name==="proof-demo-role")).toBe(false);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?reason=signed-out$/);
});

test("each demo role receives a distinct dashboard in a separate browser session", async ({ browser }) => {
  const roles=[
    {button:"SME workspace Create and track evidence",heading:"Good morning, Amara.",visible:"Ubuntu Retail Group Demo",hidden:"Mokoena Catering Demo"},
    {button:"Buyer workspace Confirm delivery requests",heading:"2 requests are waiting.",visible:"INV-1184-DEMO",hidden:"INV-2039-DEMO"},
    {button:"Funder workspace Review simulated offers",heading:"Evidence ready for review.",visible:"Mokoena Catering Demo",hidden:"INV-2040-DEMO"},
  ];
  for(const role of roles){const context=await browser.newContext();const page=await context.newPage();await page.goto("/login");await page.getByRole("button",{name:role.button,exact:true}).click();await expect(page.getByRole("heading",{level:1,name:role.heading})).toBeVisible({timeout:15_000});await expect(page.getByText(role.visible,{exact:false}).first()).toBeVisible();await expect(page.getByText(role.hidden,{exact:false})).toHaveCount(0);await context.close();}
});

test("SME creates a validated private application draft", async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemoRole(page,"SME");
  await page.goto("/applications/new");
  await expect(page.getByRole("heading",{name:"Start with the invoice story."})).toBeVisible();
  await page.getByRole("button",{name:/Create private draft/}).click();
  const summary=page.getByRole("alert").filter({hasText:"Please fix the following"});
  await expect(summary).toContainText("Choose a valid buyer organization");
  await expect(summary).toContainText("Invoice amount");
  await expect(summary).toContainText("Expected due date");
  await expect(summary).toContainText("Consent is required");
  await page.getByLabel(/Buyer organization/).selectOption({label:"Ubuntu Retail Group Demo"});
  await page.getByLabel(/Purchase-order reference/).fill("PO-E2E-DEMO-1042");
  const invoice=`INV-E2E-DEMO-${Date.now()}`;
  await page.getByLabel(/Invoice number/).fill(invoice);
  await page.getByLabel(/Invoice amount/).fill("48750.25");
  await page.getByLabel(/Expected payment date/).fill("2099-10-19");
  await page.getByRole("checkbox",{name:/I understand and consent/}).click();
  await page.getByRole("button",{name:/Create private draft/}).click();
  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]+$/,{timeout:15_000});
  await expect(page.getByRole("heading",{name:invoice})).toBeVisible();
  const progress=page.getByRole("complementary",{name:"Application progress"});
  await expect(progress).toContainText("1 of 5 complete");
  await expect(progress.getByText("Documents",{exact:true})).toBeVisible();
  await expect(progress).toContainText("Upload all three evidence documents first.");
  const invoiceSlot=page.getByTestId("document-slot-invoice");
  await invoiceSlot.getByLabel("Upload Invoice").setInputFiles({name:"notes.txt",mimeType:"text/plain",buffer:Buffer.from("not evidence")});
  await expect(invoiceSlot.getByRole("alert")).toContainText("Choose a PDF, JPEG, or PNG file.");
  await invoiceSlot.getByLabel("Upload Invoice").setInputFiles({name:"too-large.pdf",mimeType:"application/pdf",buffer:Buffer.alloc(10*1024*1024+1)});
  await expect(invoiceSlot.getByRole("alert")).toContainText("larger than the 10 MB limit");
  const purchaseOrderSlot=page.getByTestId("document-slot-purchase_order");
  const deliverySlot=page.getByTestId("document-slot-delivery_evidence");
  const purchaseBytes=await uniquePdf("output/pdf/proofflow-demo-purchase-order.pdf","purchase-order-e2e");
  const deliveryBytes=await uniquePdf("output/pdf/proofflow-demo-delivery-evidence.pdf","delivery-e2e");
  const invoiceBytes=await uniquePdf("output/pdf/proofflow-demo-invoice.pdf","invoice-e2e");
  await purchaseOrderSlot.getByLabel("Upload Purchase order").setInputFiles({name:"proofflow-demo-purchase-order.pdf",mimeType:"application/pdf",buffer:purchaseBytes});
  await expect(purchaseOrderSlot).toContainText("1 page",{timeout:25_000});
  await deliverySlot.getByLabel("Upload Delivery evidence").setInputFiles({name:"renamed-delivery-proof.pdf",mimeType:"application/pdf",buffer:purchaseBytes});
  await expect(deliverySlot.getByRole("alert")).toContainText("V009 · Exact duplicate file",{timeout:25_000});
  await expect(page.getByText("1 / 3 uploaded")).toBeVisible();
  await deliverySlot.getByLabel("Upload Delivery evidence").setInputFiles({name:"proofflow-demo-delivery-evidence.pdf",mimeType:"application/pdf",buffer:deliveryBytes});
  await expect(deliverySlot).toContainText("1 page",{timeout:25_000});
  await invoiceSlot.getByLabel("Upload Invoice").setInputFiles({name:"proofflow-demo-invoice.pdf",mimeType:"application/pdf",buffer:invoiceBytes});
  await expect(invoiceSlot).toContainText("1 page",{timeout:25_000});
  await expect(page.getByText("3 / 3 uploaded")).toBeVisible();
  await expect(page.getByRole("complementary",{name:"Application progress"})).toContainText("2 of 5 complete");
  await expect(page.getByRole("heading",{name:"Documents are ready for extraction"})).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Demo extraction—not processed by live AI");
  await expect(invoiceSlot.getByRole("button",{name:"Preview"})).toBeVisible();
  await purchaseOrderSlot.getByRole("button",{name:"Remove"}).click();
  await expect(purchaseOrderSlot.getByText("Browse files")).toBeVisible({timeout:15_000});
  await expect(page.getByText("2 / 3 uploaded")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading",{name:invoice})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Application information"})).toBeVisible();
  await expect(page.getByText("PO-E2E-DEMO-1042",{exact:true})).toBeVisible();
  await expect(page.getByText("19 Oct 2099",{exact:true})).toBeVisible();
  await expect(page.getByText("2 / 3 uploaded")).toBeVisible();
  await expect(purchaseOrderSlot.getByText("Required",{exact:true})).toBeVisible();
  await expect(page.getByRole("complementary",{name:"Application progress"})).toContainText("1 of 5 complete");
  await page.goto("/dashboard");
  await page.goBack();
  await expect(page.getByRole("complementary",{name:"Application progress"})).toContainText("1 of 5 complete");
  const applicationUrl=page.url();
  await page.getByRole("button",{name:"Sign out"}).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button",{name:"SME workspace Create and track evidence",exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/,{timeout:15_000});
  await page.goto(applicationUrl);
  await expect(page.getByText("2 / 3 uploaded")).toBeVisible();
  await expect(page.getByText("proofflow-demo-delivery-evidence.pdf",{exact:true})).toBeVisible();
  await expect(page.getByText("proofflow-demo-invoice.pdf",{exact:true})).toBeVisible();
  await expect(page.getByTestId("document-slot-purchase_order").getByText("Required",{exact:true})).toBeVisible();
});

test("buyer receives generic denial for the SME draft route",async({page})=>{
  await enterDemoRole(page,"Buyer");
  await page.goto("/applications/new");
  await expect(page.getByRole("heading",{name:"This page is not part of the evidence trail."})).toBeVisible();
});
