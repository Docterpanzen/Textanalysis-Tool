import { expect, test } from '@playwright/test';

test('functionality test', async ({ page }) => {
  await page.goto('http://localhost:4200/dashboard');
  await page.getByRole('link', { name: 'Documentation' }).click();
  await page.waitForTimeout(1500);
  await page.locator('a').filter({ hasText: 'Einleitung' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Textanalyse' }).click();
  await page.waitForTimeout(1500);
  await page.locator('a').filter({ hasText: 'BoW / TF / TF-IDF' }).click();
  await page.waitForTimeout(1500);
  await expect(page.getByRole('heading', { name: 'BoW / TF / TF-IDF' })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.getByRole('link', { name: 'Plagiatchecker' }).click();
  await page.waitForTimeout(1500);
  await page.getByText('Datei auswählen').nth(1).click();
  await page.waitForTimeout(2500);
});
