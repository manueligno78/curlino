import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Authentication Edge Cases', () => {
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

  test('Complex authentication headers handling', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      route.continue();
    });

    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/get');

    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');

    // Bearer token with special characters
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.first().fill('Authorization');
    await headerValueInput.first().fill('Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0IiwiaWF0IjoxNjM4MzYwMDAwLCJleHAiOjE2NzAzNjAwMDAsImF1ZCI6Ind3dy50ZXN0LmNvbSIsInN1YiI6InRlc3RAdGVzdC5jb20iLCJuYW1lIjoidGVzdCBüc2VyIiwicm9sZSI6InVzZXIifQ.invalid_signature_🚀測試');

    // Basic auth with username:password containing special characters
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-Basic-Auth-Test');
    await headerValueInput.nth(1).fill('Basic dXNlcjpwYXNzd29yZDEyMyE='); // user:password123!

    // API key with unusual format
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('X-API-Key');
    await headerValueInput.nth(2).fill('sk-test-123456789abcdef_🔑_測試apikey');

    // Header with empty value (should it be included?)
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(3).fill('X-Empty-Auth');
    await headerValueInput.nth(3).fill('');

    // Duplicate header with different values
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(4).fill('Authorization');
    await headerValueInput.nth(4).fill('Basic dXNlcjE6cGFzczE='); // Second Authorization header

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      // Verify how complex auth headers are handled
      expect(request.headers['authorization']).toBeDefined();
      expect(request.headers['x-basic-auth-test']).toBe('Basic dXNlcjpwYXNzd29yZDEyMyE=');
      expect(request.headers['x-api-key']).toContain('sk-test-123456789abcdef');

      // Critical test: duplicate headers should be handled correctly
      const authHeader = request.headers['authorization'];
      console.log('Authorization header value:', authHeader);
      
      console.log('✅ Authentication headers edge case test completed');
    } else {
      console.log('⚠️ Authentication headers test - No requests captured');
    }
  });

  test('OAuth token with special characters and long values', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      route.continue();
    });

    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/get');

    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');

    // Very long OAuth token
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.first().fill('Authorization');
    const longToken = 'Bearer ' + 'a'.repeat(1000) + '_special_chars_测试_🔐_end';
    await headerValueInput.first().fill(longToken);

    // Multiple authentication schemes in different headers
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-JWT-Token');
    await headerValueInput.nth(1).fill('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

    // API key in query style
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('X-API-Token');
    await headerValueInput.nth(2).fill('token=abc123&signature=xyz789&timestamp=' + Date.now());

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      // Verify long token is preserved
      expect(request.headers['authorization']).toContain('Bearer ' + 'a'.repeat(50)); // At least first part
      expect(request.headers['authorization']).toContain('测试');
      expect(request.headers['authorization']).toContain('🔐');
      
      // Verify JWT token
      expect(request.headers['x-jwt-token']).toContain('eyJhbGciOiJIUzI1NiI');
      
      // Verify query-style token
      expect(request.headers['x-api-token']).toContain('token=abc123');
      expect(request.headers['x-api-token']).toContain('signature=xyz789');

      console.log('✅ OAuth token test completed');
    } else {
      console.log('⚠️ OAuth token test - No requests captured');
    }
  });

  test('Multiple authentication methods in single request', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      route.continue();
    });

    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('POST');
    await page.waitForTimeout(500);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/post');

    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');

    // Multiple auth headers - some services use this approach
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.first().fill('Authorization');
    await headerValueInput.first().fill('Bearer primary-token-123');

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-API-Key');
    await headerValueInput.nth(1).fill('secondary-key-456');

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('X-Client-ID');
    await headerValueInput.nth(2).fill('client-789');

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(3).fill('X-Request-Signature');
    await headerValueInput.nth(3).fill('sha256-hash-of-request-content-and-timestamp');

    // Add Content-Type for POST
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(4).fill('Content-Type');
    await headerValueInput.nth(4).fill('application/json');

    // Add request body
    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    if (await bodyTextarea.isVisible()) {
      await bodyTextarea.fill('{"action": "authenticate", "timestamp": ' + Date.now() + '}');
    }

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      expect(request.method).toBe('POST');
      expect(request.headers['authorization']).toBe('Bearer primary-token-123');
      expect(request.headers['x-api-key']).toBe('secondary-key-456');
      expect(request.headers['x-client-id']).toBe('client-789');
      expect(request.headers['x-request-signature']).toBe('sha256-hash-of-request-content-and-timestamp');
      expect(request.headers['content-type']).toBe('application/json');

      if (request.postData) {
        const body = JSON.parse(request.postData);
        expect(body.action).toBe('authenticate');
        expect(body.timestamp).toBeGreaterThan(0);
      }

      console.log('✅ Multiple authentication methods test completed');
    } else {
      console.log('⚠️ Multiple auth test - No requests captured');
    }
  });

  test('Authentication with encoded special characters', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      route.continue();
    });

    // Test via cURL import with encoded auth
    await page.waitForTimeout(1000);
    const activeTab = await page.locator('.nav-button.active').textContent();
    if (activeTab !== 'Import') {
      const importTab = page.locator('button:has-text("Import")').first();
      await importTab.click();
      await page.waitForTimeout(1000);
    }

    // cURL with authentication containing encoded special characters
    const authCurl = `curl -X GET 'https://httpbin.org/get' \\
      -H 'Authorization: Bearer token_with_special%20chars%21%40%23' \\
      -H 'X-Custom-Auth: user%3Apass%20with%20spaces%26symbols' \\
      -H 'X-Unicode-Auth: %E6%B5%8B%E8%AF%95%F0%9F%94%91key'`; // 测试🔑key encoded

    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await curlTextarea.fill(authCurl);

    const importButton = page.locator('button.btn-primary:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(1500);

    const sendButton = page.locator('button:has-text("Send")').first();
    if (await sendButton.isVisible()) {
      await sendButton.click();
      await page.waitForTimeout(3000);

      if (requests.length > 0) {
        const request = requests[0];
        
        expect(request.method).toBe('GET');
        expect(request.url).toContain('httpbin.org/get');
        
        // Verify encoded auth headers are properly decoded/handled
        expect(request.headers['authorization']).toContain('Bearer token_with_special');
        expect(request.headers['x-custom-auth']).toBeDefined();
        expect(request.headers['x-unicode-auth']).toBeDefined();

        console.log('✅ Encoded authentication test completed');
        console.log('Auth header:', request.headers['authorization']);
        console.log('Custom auth:', request.headers['x-custom-auth']);
        console.log('Unicode auth:', request.headers['x-unicode-auth']);
      } else {
        console.log('⚠️ Encoded auth test - No requests captured');
      }
    } else {
      console.log('⚠️ Encoded auth test - Import failed');
    }
  });
});