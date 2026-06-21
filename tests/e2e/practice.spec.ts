import { expect, test } from "@playwright/test";

test("practice page hides answers until check", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/standard answer/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /practice questions/i })).toBeVisible();
});
