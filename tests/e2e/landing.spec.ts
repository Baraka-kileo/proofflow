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
