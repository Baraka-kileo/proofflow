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
