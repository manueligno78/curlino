import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Builder API Validation', () => {
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

  test('Builder GET request with headers and query params', async () => {
    // Array to capture network requests
    const requests = [];
    
    // Intercept all HTTP requests
    await page.route('**/*', async (route, request) => {
      // Save request details
      if (request.url().startsWith('https://httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      
      // Continue with the normal request
      route.continue();
    });

    // Go to Builder tab
    const builderTab = page.locator('button:has-text("Builder")').first();
    await builderTab.click();
    await page.waitForTimeout(500);

    // Configure base URL without parameters
    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/get');

    // Add custom header
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    // Fill headers using specific placeholders
    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('X-Test-Header');
    await headerValueInput.first().fill('TestValue123');

    // Add second header
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('Authorization');
    await headerValueInput.nth(1).fill('Bearer token123');

    // Add query parameters through dedicated section
    const querySection = page.locator('h3:has-text("Query Parameters")');
    await querySection.click();
    await page.waitForTimeout(500);

    const addParamBtn = page.locator('button:has-text("Add Parameter")');
    await addParamBtn.click();
    await page.waitForTimeout(300);

    // Use specific placeholders for parameters
    const paramKeyInput = page.locator('input[placeholder="Parameter name"]');
    const paramValueInput = page.locator('input[placeholder="Parameter value"]');
    
    await paramKeyInput.first().fill('page');
    await paramValueInput.first().fill('1');

    // Add second parameter for more complete test
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(1).fill('limit');
    await paramValueInput.nth(1).fill('10');

    // Send the request
    const sendButton = page.locator('button:has-text("Send").btn-primary');
    await sendButton.click();

    // Wait for request to complete
    await page.waitForTimeout(3000);

    // Verify that at least one request was intercepted
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    // Verify URL with query parameters (should now have both parameters)
    expect(request.url).toContain('https://httpbin.org/get');
    expect(request.url).toContain('page=1');
    expect(request.url).toContain('limit=10');

    // Verify HTTP method
    expect(request.method).toBe('GET');

    // Verify custom headers
    expect(request.headers['x-test-header']).toBe('TestValue123');
    expect(request.headers['authorization']).toBe('Bearer token123');

    // Verify no body for GET request
    expect(request.postData).toBeFalsy();

    console.log('✅ Builder GET request validation passed');
  });

  test('Builder POST request with JSON body', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('Captured request:', request.method(), request.url());
      }
      route.continue();
    });

    // Go to Builder tab
    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    // Change method to POST
    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('POST');
    await page.waitForTimeout(500);

    // Configure URL
    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/post');

    // Add Content-Type header
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('Content-Type');
    await headerValueInput.first().fill('application/json');

    // Add JSON body - Body section should be visible automatically for POST
    await page.waitForTimeout(500);
    
    // Select JSON type if not already selected
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    // Find body textarea
    const bodyTextarea = page.locator('textarea.body-editor');
    await bodyTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    const jsonBody = JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      data: { key: 'value', number: 42 }
    }, null, 2);
    
    await bodyTextarea.fill(jsonBody);

    // Send the request
    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    console.log('Requests captured:', requests.length);
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    // Verify URL
    expect(request.url).toBe('https://httpbin.org/post');

    // Verify method
    expect(request.method).toBe('POST');

    // Verify Content-Type header
    expect(request.headers['content-type']).toBe('application/json');

    // Verify JSON body
    expect(request.postData).toBeTruthy();
    const parsedBody = JSON.parse(request.postData);
    expect(parsedBody.name).toBe('Test User');
    expect(parsedBody.email).toBe('test@example.com');
    expect(parsedBody.data.key).toBe('value');
    expect(parsedBody.data.number).toBe(42);

    console.log('✅ Builder POST request validation passed');
  });

  test('Builder PUT request with form data', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('Captured PUT request:', request.method(), request.url());
      }
      route.continue();
    });

    // Test from Builder for PUT with form data
    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    // Configure PUT request
    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('PUT');
    await page.waitForTimeout(500);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/put');

    // Add headers for form data
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('Content-Type');
    await headerValueInput.first().fill('application/x-www-form-urlencoded');

    // Add form data body - should be visible automatically for PUT
    await page.waitForTimeout(500);
    
    // Select FORM type if available - use more specific selector
    const formTypeButton = page.locator('button.btn-sm:has-text("FORM")').first();
    if (await formTypeButton.isVisible()) {
      await formTypeButton.click();
      await page.waitForTimeout(300);
    } else {
      // Otherwise use TEXT and insert form data manually
      const textTypeButton = page.locator('button.btn-sm:has-text("TEXT")');
      if (await textTypeButton.isVisible()) {
        await textTypeButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    await bodyTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await bodyTextarea.fill('name=John&email=john@example.com&active=true');

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    console.log('Requests captured:', requests.length);
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    expect(request.url).toBe('https://httpbin.org/put');
    expect(request.method).toBe('PUT');
    expect(request.headers['content-type']).toBe('application/x-www-form-urlencoded');
    expect(request.postData).toBe('name=John&email=john@example.com&active=true');

    console.log('✅ Complex PUT form data validation passed');
  });
});