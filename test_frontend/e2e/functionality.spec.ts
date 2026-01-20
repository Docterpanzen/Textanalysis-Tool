import { expect, test } from '@playwright/test';

const baseUrl = 'http://localhost:4200';

test('sidebar navigation works', async ({ page }) => {
  await page.goto(`${baseUrl}/dashboard`);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();

  await page.getByRole('link', { name: 'Textanalyse' }).click();
  await expect(page).toHaveURL(/\/textanalyse/);
  await expect(main.getByRole('heading', { name: 'Textanalyse', level: 1 })).toBeVisible();

  await page.getByRole('link', { name: 'Documentation' }).click();
  await expect(page).toHaveURL(/\/documentation/);
  await expect(main.getByRole('heading', { name: 'Dokumentation', level: 1 })).toBeVisible();

  await page.getByRole('link', { name: 'Plagiatchecker' }).click();
  await expect(page).toHaveURL(/\/plagiatchecker/);
  await expect(main.getByRole('heading', { name: 'Plagiatchecker', level: 1 })).toBeVisible();
});

test('documentation topic switch shows text analysis section', async ({ page }) => {
  await page.goto(`${baseUrl}/documentation`);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Dokumentation', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Textanalyse' }).click();
  await expect(main.getByRole('heading', { name: 'BoW / TF / TF-IDF' })).toBeVisible();
});
