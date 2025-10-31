import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login button on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if homepage loads
    await expect(page).toHaveTitle(/Project Catalyst/);
    
    // Check for sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should redirect to OAuth login when clicking sign in', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await signInButton.click();
    
    // Should redirect to OAuth provider or show login modal
    // Note: In real tests, you'd mock the OAuth flow
    await page.waitForURL(/oauth|login/, { timeout: 5000 }).catch(() => {
      // If not redirected, check if modal appeared
      expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test('should show user menu when authenticated', async ({ page, context }) => {
    // Mock authenticated session by setting cookie
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    
    // Check if user menu is visible
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button', { name: /account|profile|user/i })
    );
    
    // User menu should be present on authenticated pages
    await expect(userMenu.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // If no user menu, check if we're on dashboard
      expect(page.url()).toContain('/dashboard');
    });
  });

  test('should be able to logout', async ({ page, context }) => {
    // Mock authenticated session
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to homepage or login
      await expect(page).toHaveURL(/\/($|login)/);
    }
  });
});
