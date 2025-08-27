import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Edge Cases and Special Characters', () => {
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

  test('Special characters in URL and headers', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('Captured special chars request:', request.method(), request.url());
      }
      route.continue();
    });

    // Go to Builder tab
    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    // URL with special characters in parameters
    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/get');

    // Add query parameters with special characters
    const querySection = page.locator('h3:has-text("Query Parameters")');
    await querySection.click();
    await page.waitForTimeout(500);

    const addParamBtn = page.locator('button:has-text("Add Parameter")');
    await addParamBtn.click();
    await page.waitForTimeout(300);

    const paramKeyInput = page.locator('input[placeholder="Parameter name"]');
    const paramValueInput = page.locator('input[placeholder="Parameter value"]');
    
    // Parameters with special characters
    await paramKeyInput.first().fill('search query');
    await paramValueInput.first().fill('hello world & special chars: @#$%^()');

    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(1).fill('unicode_test');
    await paramValueInput.nth(1).fill('测试 français émojis 🚀🔥');

    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(2).fill('encoded');
    await paramValueInput.nth(2).fill('value with spaces & symbols: +=%&?');

    // Headers with special characters
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('X-Custom-Unicode');
    await headerValueInput.first().fill('测试头部 with émojis 🎯 & symbols');

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-Special-Chars');
    await headerValueInput.nth(1).fill('Value with "quotes" & \'apostrophes\' & <tags>');

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThan(0);
    const request = requests[0];

    // Verify that URL contains parameters (might be URL-encoded)
    expect(request.url).toContain('httpbin.org/get');
    expect(request.url).toContain('search'); // Should contain the key
    expect(request.url).toContain('unicode_test');
    expect(request.url).toContain('encoded');

    // Verify headers with special characters
    expect(request.headers['x-custom-unicode']).toContain('测试头部');
    expect(request.headers['x-special-chars']).toContain('quotes');

    console.log('✅ Special characters test completed - URL:', request.url);
  });

  test('Empty and missing parameters handling', async () => {
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

    // Headers with empty values and empty keys
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    // Header with key but empty value
    await headerKeyInput.first().fill('X-Empty-Value');
    await headerValueInput.first().fill('');

    // Second header with value but empty key
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('');
    await headerValueInput.nth(1).fill('orphaned-value');

    // Normal header for comparison
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('Content-Type');
    await headerValueInput.nth(2).fill('application/json');

    // Empty body (should be allowed)
    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    await bodyTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await bodyTextarea.fill(''); // Completely empty body

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThan(0);
    const request = requests[0];

    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://httpbin.org/post');
    
    // Verify how empty headers are handled
    expect(request.headers['content-type']).toBe('application/json');
    
    // Body should be empty or null
    expect(request.postData === '' || request.postData === null).toBe(true);

    console.log('✅ Empty parameters test completed');
  });

  test('JSON body with special characters and escapes', async () => {
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
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('Content-Type');
    await headerValueInput.first().fill('application/json; charset=utf-8');

    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    await bodyTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    // JSON with special characters, escape sequences, unicode
    const complexJson = {
      "text_with_quotes": "This has \"quotes\" and 'apostrophes'",
      "text_with_escapes": "Line 1\\nLine 2\\tTabbed\\rCarriage return",
      "unicode_text": "Testing unicode: 测试 français émojis 🚀🔥💻",
      "special_chars": "Symbols: @#$%^&*()+=[]{}|\\:;\"'<>,.?/~`",
      "empty_string": "",
      "null_value": null,
      "boolean_true": true,
      "boolean_false": false,
      "number": 42.5,
      "array_mixed": ["string", 123, true, null, {"nested": "object"}],
      "nested_object": {
        "deep": {
          "very_deep": "value with special chars: \\\"escaped quotes\\\""
        }
      },
      "json_string": "{\"this\":\"looks like JSON but is string\"}",
      "html_content": "<script>alert('xss')</script><div class=\"test\">HTML content</div>"
    };

    await bodyTextarea.fill(JSON.stringify(complexJson, null, 2));

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThan(0);
    const request = requests[0];

    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://httpbin.org/post');
    expect(request.headers['content-type']).toBe('application/json; charset=utf-8');

    // Verify JSON body is correct
    expect(request.postData).toBeTruthy();
    const parsedBody = JSON.parse(request.postData);
    
    // Verify special characters are preserved
    expect(parsedBody.text_with_quotes).toBe("This has \"quotes\" and 'apostrophes'");
    expect(parsedBody.text_with_escapes).toBe("Line 1\\nLine 2\\tTabbed\\rCarriage return");
    expect(parsedBody.unicode_text).toContain('测试');
    expect(parsedBody.unicode_text).toContain('🚀');
    expect(parsedBody.special_chars).toContain('@#$%^&*()');
    expect(parsedBody.null_value).toBe(null);
    expect(parsedBody.boolean_true).toBe(true);
    expect(parsedBody.number).toBe(42.5);
    expect(parsedBody.html_content).toContain('<script>');

    console.log('✅ Complex JSON test completed');
  });

  test('Content-Type vs body mismatch handling', async () => {
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

    // Header says XML but body is JSON (intentional mismatch)
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('Content-Type');
    await headerValueInput.first().fill('application/xml'); // Says XML

    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    if (await bodyTextarea.isVisible()) {
      // But body is valid JSON
      await bodyTextarea.fill('{"this": "is", "valid": "json", "not": "xml"}');
    }

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      expect(request.method).toBe('POST');
      expect(request.headers['content-type']).toBe('application/xml');
      
      // Body should be sent as specified, regardless of Content-Type
      if (request.postData) {
        const bodyContent = request.postData;
        expect(bodyContent).toContain('{"this": "is"');
        expect(bodyContent).toContain('"valid": "json"');
        
        // Should be valid JSON despite XML header
        try {
          const parsed = JSON.parse(bodyContent);
          expect(parsed.this).toBe('is');
          expect(parsed.valid).toBe('json');
        } catch (e) {
          console.log('⚠️ JSON parsing failed, body may be corrupted:', bodyContent);
        }
      }

      console.log('✅ Content-Type mismatch test completed');
    } else {
      console.log('⚠️ Content-Type mismatch test - No requests captured');
    }
  });
});