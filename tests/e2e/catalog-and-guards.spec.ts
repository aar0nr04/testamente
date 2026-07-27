import { expect, test } from '@playwright/test';

test('synchronizes catalog filters with the URL and clears them', async ({ page }) => {
  await page.goto('/tests');
  await expect(page.getByRole('heading', { name: 'Catálogo de tests' })).toBeVisible();
  await page.getByLabel('Buscar').fill('ansiedad');
  await expect(page).toHaveURL(/q=ansiedad/);
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();
  await expect(page).not.toHaveURL(/q=ansiedad/);
});

test('redirects protected administration to login without a verified claimed session', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});
