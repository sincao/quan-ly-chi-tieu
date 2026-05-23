# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verify-budget-edit.spec.ts >> should open edit budget modal when clicking edit icon
- Location: e2e/verify-budget-edit.spec.ts:3:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Tổng quan"
Received string:    "Quản LýChi Tiêu"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    13 × locator resolved to <h1>…</h1>
       - unexpected value "Quản LýChi Tiêu"

```

```yaml
- heading "Quản Lý Chi Tiêu" [level=1]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('should open edit budget modal when clicking edit icon', async ({ page }) => {
  4  |   // 1. Mock Supabase session to bypass login
  5  |   await page.addInitScript(() => {
  6  |     window.localStorage.setItem('supabase.auth.token', JSON.stringify({
  7  |       currentSession: {
  8  |         access_token: 'mock-token',
  9  |         expires_at: Math.floor(Date.now() / 1000) + 3600,
  10 |         user: { id: 'test-user-id', email: 'test@example.com' }
  11 |       }
  12 |     }));
  13 |     // Also skip onboarding for this user
  14 |     window.localStorage.setItem('onboarding_test-user-id', 'true');
  15 |   });
  16 | 
  17 |   // 2. Go to home page (Dashboard)
  18 |   await page.goto('http://localhost:3000');
  19 |   
  20 |   // 3. Wait for Dashboard to load (look for "Tổng quan")
> 21 |   await expect(page.locator('h1')).toContainText('Tổng quan');
     |                                    ^ Error: expect(locator).toContainText(expected) failed
  22 | 
  23 |   // 4. Find the edit icon in the "Ngân sách tháng" card
  24 |   // The card has the text "NGÂN SÁCH THÁNG"
  25 |   const budgetCard = page.locator('.kpi.primary');
  26 |   const editButton = budgetCard.locator('button');
  27 |   
  28 |   // 5. Click the edit button
  29 |   await editButton.click();
  30 | 
  31 |   // 6. Verify modal appears
  32 |   const modal = page.locator('.modal');
  33 |   await expect(modal).toBeVisible();
  34 |   await expect(modal.locator('h3')).toContainText('Chỉnh sửa ngân sách');
  35 |   
  36 |   // 7. Verify presets exist
  37 |   await expect(page.locator('.onboard-presets button')).toHaveCount(4);
  38 | });
  39 | 
```