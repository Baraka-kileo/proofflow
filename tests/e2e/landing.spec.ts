import { expect, test } from "@playwright/test";

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

test("protected shell is usable on mobile without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Good morning, Amara." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(widths.scroll).toBe(widths.client);
});

for (const viewport of [{ width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`protected shell fits ${viewport.width}px without overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
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
  await page.goto("/dashboard");
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByRole("alert").filter({ hasText: "You are offline" })).toContainText("You are offline");
  await context.setOffline(false);
});

test("demo login selects the buyer workspace through an HTTP-only session", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to ProofFlow" })).toBeVisible();
  await page.getByRole("button", { name: "Buyer workspace Confirm delivery requests", exact:true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("buyer workspace", { exact:true })).toBeVisible();
  const cookie=(await page.context().cookies()).find(item=>item.name==="proof-demo-role");
  expect(cookie?.httpOnly).toBe(true);
});
