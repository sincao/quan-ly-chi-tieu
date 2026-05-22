import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Next.js default page doesn't have a title in the tag by default sometimes, 
  // but let's check for "To get started" text which is in the default template.
  await expect(page.getByText('To get started')).toBeVisible();
});
