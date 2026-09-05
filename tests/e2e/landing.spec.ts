import { expect, test } from "@playwright/test";

test("landing page explains the real workflow without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /Turn completed work into funding-ready proof/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence verified is not funding approved." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connect" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Funding Partner" })).toBeVisible();

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBe(widths.client);
});

test("partner calls to action lead to a truthful onboarding page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Connect your supplier network/ }).click();
  await expect(page).toHaveURL(/\/contact\?for=connect$/);
  await expect(page.getByRole("heading", { level: 1, name: /large customer conversation/i })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: /Become a funding partner/ }).click();
  await expect(page).toHaveURL(/\/contact\?for=funder$/);
  await expect(page.getByRole("heading", { level: 1, name: /funding partner conversation/i })).toBeVisible();
});

test("security page states the responsibility boundaries", async ({ page }) => {
  await page.goto("/security");
  await expect(page.getByRole("heading", { name: "Manual evidence handling" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "External compliance boundary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Independent funding" })).toBeVisible();
});

test("protected routes redirect signed-out visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?reason=signed-out$/);
  await expect(page.getByRole("heading", { name: "Sign in to ProofFlow" })).toBeVisible();
});

test("invalid credentials return a generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/^Email address/).fill("unknown@proofflow.example");
  await page.getByLabel(/^Password/).fill("Not-the-password-123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toContainText("Email or password is incorrect");
});

test("sample credentials appear only on the sign-in page and require explicit sign-in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sample credentials for testing" })).toBeVisible();
  await page.getByRole("button", { name: /SME.*Create evidence/ }).click();
  await expect(page.getByLabel(/^Email address/)).toHaveValue("sme.demo@proofflow.example");
  await expect(page.getByRole("status")).toContainText("credentials filled in");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/");
  await expect(page.getByText("Sample credentials for testing")).toHaveCount(0);
});
