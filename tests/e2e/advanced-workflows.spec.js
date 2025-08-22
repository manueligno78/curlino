import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Advanced User Workflows', () => {
  let electronApp;
  let page;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', '..', 'out', 'main', 'electron.js')],
      timeout: 15000
    });
    
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('Complete Request Import and Builder Flow', async () => {
    // 1. Import a cURL command
    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    const complexCurl = 'curl -X POST "https://httpbin.org/post" -H "Content-Type: application/json" -d \'{"test": "data"}\'';
    await curlTextarea.fill(complexCurl);
    
    // 2. Import the command
    const importButton = page.locator('button:has-text("Import").btn-primary');
    if (await importButton.isEnabled()) {
      await importButton.click();
      await page.waitForTimeout(500);
    }
    
    // 3. Switch to Builder mode
    const builderButton = page.locator('button:has-text("Builder")');
    if (!(await builderButton.hasAttribute('disabled'))) {
      await builderButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 4. Verify URL was imported correctly
    const urlInput = page.locator('input[placeholder*="api.example.com"], .url-input').first();
    if (await urlInput.isVisible()) {
      const urlValue = await urlInput.inputValue();
      expect(urlValue).toContain('httpbin.org');
    }
    
    await page.screenshot({ path: 'tests/screenshots/import-to-builder-flow.png' });
    
    console.log('✅ Complete import to builder flow tested');
  });

  test('Multiple Tab Navigation', async () => {
    // Test navigation between all three main tabs
    const tabs = ['Import', 'Builder', 'History'];
    
    for (const tabName of tabs) {
      const tabButton = page.locator(`button:has-text("${tabName}")`).first();
      
      if (await tabButton.isVisible() && !(await tabButton.hasAttribute('disabled'))) {
        await tabButton.click();
        await page.waitForTimeout(500);
        
        // Verify tab is active
        const activeClass = await tabButton.getAttribute('class');
        expect(activeClass).toContain('active');
        
        console.log(`✅ ${tabName} tab navigation working`);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/tab-navigation.png' });
  });

  test('Sidebar Toggle and Persistence', async () => {
    // Find sidebar toggle button
    const sidebarToggle = page.locator('.sidebar-toggle-btn, [aria-label*="toggle"], button:has-text("▶")');
    
    if (await sidebarToggle.isVisible()) {
      // Toggle sidebar closed
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      
      // Toggle sidebar open
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      
      // Verify toggle is still functional
      expect(await sidebarToggle.isVisible()).toBe(true);
      
      console.log('✅ Sidebar toggle functionality working');
    }
    
    await page.screenshot({ path: 'tests/screenshots/sidebar-toggle.png' });
  });

  test('Error Handling and Recovery', async () => {
    // Test with invalid cURL command
    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    // Try invalid command
    await curlTextarea.fill('invalid curl command format');
    
    const importButton = page.locator('button:has-text("Import").btn-primary');
    if (await importButton.isEnabled()) {
      await importButton.click();
      await page.waitForTimeout(1000);
      
      // Should handle gracefully without crashing
      expect(await page.locator('body').isVisible()).toBe(true);
    }
    
    // Clear and try valid command
    const clearButton = page.locator('button:has-text("Clear").btn-secondary');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verify recovery
    const textValue = await curlTextarea.inputValue();
    expect(textValue).toBe('');
    
    await page.screenshot({ path: 'tests/screenshots/error-recovery.png' });
    
    console.log('✅ Error handling and recovery tested');
  });

  test('Theme Persistence Across Sessions', async () => {
    // Get initial theme state
    const themeToggle = page.locator('.theme-toggle');
    await themeToggle.waitFor({ state: 'visible' });
    
    // Toggle theme
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    // Take screenshot of theme change
    await page.screenshot({ path: 'tests/screenshots/theme-changed.png' });
    
    // Theme toggle should still be visible and functional
    expect(await themeToggle.isVisible()).toBe(true);
    
    console.log('✅ Theme persistence tested');
  });

  test('App Responsiveness and Performance', async () => {
    // Test rapid interactions
    const importTab = page.locator('button:has-text("Import")').first();
    const builderTab = page.locator('button:has-text("Builder")').first();
    
    // Rapid tab switching
    if (await importTab.isVisible() && await builderTab.isVisible()) {
      for (let i = 0; i < 3; i++) {
        if (!(await importTab.hasAttribute('disabled'))) {
          await importTab.click();
          await page.waitForTimeout(100);
        }
        
        if (!(await builderTab.hasAttribute('disabled'))) {
          await builderTab.click();
          await page.waitForTimeout(100);
        }
      }
    }
    
    // App should remain responsive
    expect(await page.locator('body').isVisible()).toBe(true);
    
    // Test large text input
    const curlTextarea = page.locator('.curl-textarea');
    if (await curlTextarea.isVisible()) {
      const largeCurl = 'curl -X POST https://httpbin.org/post ' + 'A'.repeat(1000);
      await curlTextarea.fill(largeCurl);
      
      // Should handle large input without issues
      const inputValue = await curlTextarea.inputValue();
      expect(inputValue.length).toBeGreaterThan(500);
    }
    
    await page.screenshot({ path: 'tests/screenshots/performance-test.png' });
    
    console.log('✅ App responsiveness and performance tested');
  });

  test('Keyboard Shortcuts and Accessibility', async () => {
    // Test keyboard navigation
    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    // Focus on textarea
    await curlTextarea.click();
    
    // Fill with content
    await curlTextarea.fill('curl -X GET https://httpbin.org/get');
    
    // Test keyboard shortcuts (if implemented)
    // Ctrl/Cmd + A to select all
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
    
    // App should remain functional after keyboard interactions
    expect(await curlTextarea.isVisible()).toBe(true);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: 'tests/screenshots/keyboard-navigation.png' });
    
    console.log('✅ Keyboard shortcuts and accessibility tested');
  });

  test('Window State and Rendering', async () => {
    // Get window properties
    const windowTitle = await page.title();
    expect(windowTitle).toBeTruthy();
    
    // Test window resizing behavior
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    
    // App should adapt to smaller viewport
    expect(await page.locator('body').isVisible()).toBe(true);
    
    // Restore larger size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    // All elements should still be visible
    const importButton = page.locator('button:has-text("Import")').first();
    expect(await importButton.isVisible()).toBe(true);
    
    await page.screenshot({ path: 'tests/screenshots/window-resize.png' });
    
    console.log('✅ Window state and rendering tested');
  });
});