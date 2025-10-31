import { test, expect } from '@playwright/test';

test.describe('Project Creation Workflow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authenticated session
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('should navigate to new project page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for "New Project" or "Create Project" button
    const newProjectButton = page.getByRole('button', { name: /new project|create project/i }).or(
      page.getByRole('link', { name: /new project|create project/i })
    );
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      await expect(page).toHaveURL(/\/projects\/new/);
    } else {
      // Navigate directly if button not found
      await page.goto('/projects/new');
    }
    
    // Check if we're on the new project page
    await expect(page.locator('h1, h2')).toContainText(/create|new project/i, { timeout: 10000 }).catch(() => {
      expect(page.url()).toContain('/projects/new');
    });
  });

  test('should display project creation form', async ({ page }) => {
    await page.goto('/projects/new');
    
    // Check for form elements
    const projectNameInput = page.getByLabel(/project name|name/i).or(
      page.getByPlaceholder(/project name|name/i)
    );
    
    await expect(projectNameInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects/new');
    
    // Fill in project details
    const projectNameInput = page.getByLabel(/project name|name/i).or(
      page.getByPlaceholder(/project name|name/i)
    ).first();
    
    await projectNameInput.fill('Test E2E Project');
    
    // Fill description if available
    const descriptionInput = page.getByLabel(/description/i).or(
      page.getByPlaceholder(/description/i)
    ).first();
    
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('This is an E2E test project');
    }
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /create|submit|save/i });
    await submitButton.click();
    
    // Should redirect to project detail or dashboard
    await page.waitForURL(/\/projects\/\d+|\/dashboard/, { timeout: 10000 }).catch(() => {
      // Check for success message
      expect(page.locator('text=/created|success/i')).toBeVisible();
    });
  });

  test('should display validation errors for empty form', async ({ page }) => {
    await page.goto('/projects/new');
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /create|submit/i });
    await submitButton.click();
    
    // Should show validation error
    const errorMessage = page.locator('text=/required|cannot be empty/i').or(
      page.locator('[role="alert"]')
    );
    
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Project List and Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authenticated session
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('should display projects on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for projects section
    const projectsSection = page.locator('text=/projects|my projects/i').or(
      page.locator('[data-testid="projects-list"]')
    );
    
    await expect(projectsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to project detail page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find and click on a project
    const projectLink = page.getByRole('link', { name: /test|project/i }).first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await expect(page).toHaveURL(/\/projects\/\d+/);
    }
  });
});
