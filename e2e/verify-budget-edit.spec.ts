import { test, expect } from '@playwright/test';

test('should open edit budget modal when clicking edit icon', async ({ page }) => {
  // 1. Mock Supabase session to bypass login
  await page.addInitScript(() => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: {
        access_token: 'mock-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
    }));
    // Also skip onboarding for this user
    window.localStorage.setItem('onboarding_test-user-id', 'true');
  });

  // 2. Go to home page (Dashboard)
  await page.goto('http://localhost:3000');
  
  // 3. Wait for Dashboard to load (look for "Tổng quan")
  await expect(page.locator('h1')).toContainText('Tổng quan');

  // 4. Find the edit icon in the "Ngân sách tháng" card
  // The card has the text "NGÂN SÁCH THÁNG"
  const budgetCard = page.locator('.kpi.primary');
  const editButton = budgetCard.locator('button');
  
  // 5. Click the edit button
  await editButton.click();

  // 6. Verify modal appears
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('h3')).toContainText('Chỉnh sửa ngân sách');
  
  // 7. Verify presets exist
  await expect(page.locator('.onboard-presets button')).toHaveCount(4);
});
