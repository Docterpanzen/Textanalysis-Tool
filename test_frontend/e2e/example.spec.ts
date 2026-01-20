import { expect, test } from '@playwright/test';

const baseUrl = 'http://localhost:4200';

test('dashboard shows key sections', async ({ page }) => {
  await page.goto(`${baseUrl}/dashboard`);

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Analyse-Historie' })).toBeVisible();
  await expect(page.getByText('Jobs insgesamt')).toBeVisible();
});

test('plagiatchecker has two upload areas', async ({ page }) => {
  await page.goto(`${baseUrl}/plagiatchecker`);

  await expect(page.getByRole('heading', { name: 'Plagiatchecker' })).toBeVisible();
  await expect(page.getByText('Dokument A')).toBeVisible();
  await expect(page.getByText('Dokument B')).toBeVisible();
});
