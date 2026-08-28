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

test('runs the public questionnaire from instructions through answers to a score', async ({ page }) => {
  await page.goto('/tests/stress-check-v1');
  await expect(page.getByRole('heading', { name: 'Antes de comenzar' })).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar cuestionario' }).click();

  for (let index = 0; index < 4; index += 1) {
    await page.locator('input[type="radio"]').first().check();
    if (index < 3) await page.getByRole('button', { name: 'Siguiente' }).click();
  }
  await page.getByRole('button', { name: 'Ver resultado' }).click();

  await expect(page).toHaveURL(/\/results\//);
  await expect(page.locator('.score')).toHaveText('0');
});
