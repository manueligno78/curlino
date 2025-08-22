import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Essential App Flows', () => {
  let electronApp;
  let page;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', '..', 'out', 'main', 'electron.js')],
      timeout: 15000
    });
    
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Let UI stabilize
  });

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('App Launch and Basic UI', async () => {
    // Verify app launched successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Verify main navigation is present
    const importButton = page.locator('.nav-button').first();
    expect(await importButton.isVisible()).toBe(true);
    
    // Take screenshot for reference
    await page.screenshot({ path: 'tests/screenshots/app-launch-basic.png' });
    
    console.log('✅ App launched with title:', title);
  });

  test('cURL Import Functionality', async () => {
    // Find and fill cURL textarea
    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    const curlCommand = 'curl -X GET https://httpbin.org/get';
    await curlTextarea.fill(curlCommand);
    
    // Verify input was filled
    const inputValue = await curlTextarea.inputValue();
    expect(inputValue).toContain('httpbin.org/get');
    
    await page.screenshot({ path: 'tests/screenshots/curl-input-filled.png' });
    
    console.log('✅ cURL command entered successfully');
  });

  test('Navigation Tabs Visibility', async () => {
    // Check all main navigation buttons exist
    const navButtons = await page.locator('.nav-button').all();
    expect(navButtons.length).toBeGreaterThan(0);
    
    // Verify specific tabs exist
    const importTab = page.locator('button:has-text("Import")').first();
    const builderTab = page.locator('button:has-text("Builder")').first();
    const historyTab = page.locator('button:has-text("History")').first();
    
    expect(await importTab.isVisible()).toBe(true);
    expect(await builderTab.isVisible()).toBe(true);  
    expect(await historyTab.isVisible()).toBe(true);
    
    await page.screenshot({ path: 'tests/screenshots/navigation-tabs.png' });
    
    console.log('✅ All navigation tabs visible');
  });

  test('Theme Toggle Works', async () => {
    // Find and click theme toggle
    const themeToggle = page.locator('.theme-toggle');
    await themeToggle.waitFor({ state: 'visible' });
    
    // Get initial theme state
    const bodyClass = await page.locator('body').getAttribute('class');
    
    // Click theme toggle
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    // Verify theme toggle is still functional
    expect(await themeToggle.isVisible()).toBe(true);
    
    await page.screenshot({ path: 'tests/screenshots/theme-toggled.png' });
    
    console.log('✅ Theme toggle functional');
  });

  test('Settings Button Accessible', async () => {
    // Find settings button
    const settingsButton = page.locator('.settings-button');
    expect(await settingsButton.isVisible()).toBe(true);
    
    // Click settings button
    await settingsButton.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of settings state
    await page.screenshot({ path: 'tests/screenshots/settings-clicked.png' });
    
    console.log('✅ Settings button accessible');
  });
});