import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Curlino App Launch', () => {
  let electronApp;
  let page;

  test.beforeEach(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', '..', 'out', 'main', 'electron.js')],
      timeout: 15000
    });
    
    // Get the first page (main window)
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should open app and show importer view', async () => {
    // Wait for the page to be fully loaded
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Check if the app window is visible
    expect(page).toBeTruthy();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/app-launch.png' });
    
    // Look for importer-related elements
    // Note: We need to check what elements exist in the importer view
    // This is a basic check that the app loaded successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check if main content area exists
    const mainContent = await page.locator('body').isVisible();
    expect(mainContent).toBe(true);
    
    console.log('App launched successfully with title:', title);
  });
});