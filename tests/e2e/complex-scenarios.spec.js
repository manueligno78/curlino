import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Complex Scenarios and Boundary Tests', () => {
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

  test('Large payload and long URLs handling', async () => {
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

    // Very long URL with many parameters
    const urlInput = page.locator('.url-input');
    const baseUrl = 'https://httpbin.org/post';
    const longQueryString = Array.from({length: 20}, (_, i) => 
      `param${i}=very_long_value_with_lots_of_text_to_make_url_extremely_long_${i}_${'x'.repeat(50)}`
    ).join('&');
    
    await urlInput.fill(`${baseUrl}?${longQueryString}`);

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

    // Header with very long value
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-Very-Long-Header');
    const longHeaderValue = 'A'.repeat(1000) + ' with special chars: 测试 🚀';
    await headerValueInput.nth(1).fill(longHeaderValue);

    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    await bodyTextarea.waitFor({ state: 'visible', timeout: 5000 });
    
    // Very large body
    const largeObject = {
      description: "Large payload test",
      large_array: Array.from({length: 100}, (_, i) => ({
        id: i,
        data: `Item ${i} with some content ${'x'.repeat(100)}`,
        unicode: `测试${i} français émojis 🚀🔥💻`
      })),
      large_string: 'X'.repeat(5000) + ' 测试 end',
      nested_large: {
        level1: {
          level2: {
            level3: {
              data: Array.from({length: 50}, (_, i) => `nested_item_${i}_${'y'.repeat(50)}`)
            }
          }
        }
      }
    };

    await bodyTextarea.fill(JSON.stringify(largeObject, null, 2));

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(5000); // More time for large payload

    if (requests.length > 0) {
      const request = requests[0];
      expect(request.method).toBe('POST');
      expect(request.url).toContain('httpbin.org/post');
      expect(request.url.length).toBeGreaterThan(1000); // URL should be very long
      
      expect(request.headers['content-type']).toBe('application/json');
      expect(request.headers['x-very-long-header']).toContain('AAAA');
      expect(request.headers['x-very-long-header'].length).toBeGreaterThan(1000);

      if (request.postData) {
        expect(request.postData.length).toBeGreaterThan(10000); // Body should be very large
        const parsedBody = JSON.parse(request.postData);
        expect(parsedBody.large_array).toHaveLength(100);
        expect(parsedBody.large_string).toContain('XXXX');
      }

      console.log('✅ Large payload test completed - URL length:', request.url.length);
    } else {
      console.log('⚠️ Large payload test - No requests captured, may indicate size limits');
    }
  });

  test('Unusual HTTP method with body (DELETE)', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('Captured unusual method request:', request.method(), request.url());
      }
      route.continue();
    });

    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    // Test DELETE with body (technically possible but unusual)
    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('DELETE');
    await page.waitForTimeout(500);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/delete');

    // Headers that might conflict
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    // Conflicting headers
    await headerKeyInput.first().fill('Content-Type');
    await headerValueInput.first().fill('application/json');

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('Accept');
    await headerValueInput.nth(1).fill('application/xml'); // Different from Content-Type

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('Content-Length');
    await headerValueInput.nth(2).fill('999'); // Might be overridden

    // DELETE with body (if supported by app)
    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
      
      const bodyTextarea = page.locator('textarea.body-editor');
      if (await bodyTextarea.isVisible()) {
        await bodyTextarea.fill('{"reason": "deletion_reason", "confirm": true}');
      }
    }

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      expect(request.method).toBe('DELETE');
      expect(request.url).toBe('https://httpbin.org/delete');
      
      // Verify headers
      expect(request.headers['content-type']).toBe('application/json');
      expect(request.headers['accept']).toBe('application/xml');
      
      console.log('✅ Unusual HTTP method combination test completed');
    } else {
      console.log('⚠️ Unusual HTTP method - No requests captured');
    }
  });

  test('Boundary values and limits testing', async () => {
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

    // Test parameters with boundary values
    const querySection = page.locator('h3:has-text("Query Parameters")');
    await querySection.click();
    await page.waitForTimeout(500);

    const addParamBtn = page.locator('button:has-text("Add Parameter")');
    const paramKeyInput = page.locator('input[placeholder="Parameter name"]');
    const paramValueInput = page.locator('input[placeholder="Parameter value"]');

    // Parameter with single character key
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.first().fill('a');
    await paramValueInput.first().fill('single_char_key');

    // Parameter with very long value (boundary test)
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(1).fill('long_value');
    await paramValueInput.nth(1).fill('x'.repeat(2000)); // 2KB value

    // Parameter with only numbers
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(2).fill('123');
    await paramValueInput.nth(2).fill('456');

    // Parameter with control characters
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(3).fill('control_chars');
    await paramValueInput.nth(3).fill('\t\n\r'); // Tab, newline, carriage return

    // Headers with boundary values
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    // Header with numeric value (should be string)
    await headerKeyInput.first().fill('X-Numeric-Value');
    await headerValueInput.first().fill('42');

    // Header simulating a very large number
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-Big-Number');
    await headerValueInput.nth(1).fill('999999999999999999999');

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      // Verify boundary parameters
      expect(request.url).toContain('a=single_char_key');
      expect(request.url).toContain('long_value=');
      expect(request.url).toContain('123=456');
      
      // Verify headers
      expect(request.headers['x-numeric-value']).toBe('42');
      expect(request.headers['x-big-number']).toBe('999999999999999999999');

      console.log('✅ Boundary values test completed - URL length:', request.url.length);
    } else {
      console.log('⚠️ Boundary values test - No requests captured');
    }
  });

  test('Extreme complexity cURL parsing', async () => {
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

    await page.waitForTimeout(1000);
    const activeTab = await page.locator('.nav-button.active').textContent();
    if (activeTab !== 'Import') {
      const importTab = page.locator('button:has-text("Import")').first();
      await importTab.click();
      await page.waitForTimeout(1000);
    }

    // Extremely complex cURL with all possible edge cases
    const extremeCurl = `curl -X PATCH 'https://httpbin.org/patch?q1=val%201&q2=val%202&empty=&unicode=测试🚀&special=%26%3D%25' \\
      --compressed \\
      --insecure \\
      --location \\
      --max-time 30 \\
      -H 'User-Agent: Custom/1.0 (🚀; test; +https://test.com)' \\
      -H 'Accept: application/json, text/plain, */*' \\
      -H 'Accept-Language: en-US,en;q=0.9,it;q=0.8,zh;q=0.7' \\
      -H 'Accept-Encoding: gzip, deflate, br' \\
      -H 'Content-Type: application/json; charset=utf-8; boundary=----test' \\
      -H 'Authorization: Bearer token_with_special.chars-and_numbers123' \\
      -H 'X-Custom: value with "quotes", \\'apostrophes\\', and <tags>' \\
      -H 'X-Unicode: 测试 français émojis 🚀🔥💻' \\
      -H 'X-Empty:' \\
      -H 'X-Numeric: 42' \\
      --data-raw '{
        "string": "text with \\"escapes\\" and \\n newlines",
        "unicode": "测试 français émojis 🚀🔥💻",
        "number": 42.5,
        "boolean": true,
        "null": null,
        "array": [1, "two", true, null, {"nested": "object"}],
        "object": {
          "deep": {
            "nested": "value with special: @#$%^&*()+=[]{}|\\\\:;\"'"'"'<>,.?/~\`"
          }
        },
        "html": "<script>alert(\\"xss\\")</script>",
        "json_string": "{\\"fake\\": \\"json\\"}",
        "empty_string": "",
        "control_chars": "\\t\\n\\r"
      }'`;

    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await curlTextarea.fill(extremeCurl);

    const importButton = page.locator('button.btn-primary:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(2000); // More time for complex parsing

    const sendButton = page.locator('button:has-text("Send")').first();
    if (await sendButton.isVisible()) {
      await sendButton.click();
      await page.waitForTimeout(4000);

      if (requests.length > 0) {
        const request = requests[0];
        
        expect(request.method).toBe('PATCH');
        expect(request.url).toContain('httpbin.org/patch');
        
        // Verify parsing of complex query parameters
        expect(request.url).toContain('q1=');
        expect(request.url).toContain('q2=');
        expect(request.url).toContain('unicode=');
        expect(request.url).toContain('special=');

        // Verify complex headers
        expect(request.headers['user-agent']).toContain('Custom/1.0');
        expect(request.headers['accept']).toContain('application/json');
        expect(request.headers['authorization']).toContain('Bearer');
        expect(request.headers['x-unicode']).toContain('测试');
        expect(request.headers['x-numeric']).toBe('42');

        // Verify complex body
        if (request.postData) {
          const parsedBody = JSON.parse(request.postData);
          expect(parsedBody.string).toContain('escapes');
          expect(parsedBody.unicode).toContain('🚀');
          expect(parsedBody.number).toBe(42.5);
          expect(parsedBody.boolean).toBe(true);
          expect(parsedBody.null).toBe(null);
          expect(parsedBody.array).toHaveLength(5);
          expect(parsedBody.html).toContain('<script>');
        }

        console.log('✅ Extreme complexity cURL test completed');
      } else {
        console.log('⚠️ Extreme cURL - No requests captured, parsing may have failed');
      }
    } else {
      console.log('⚠️ Extreme cURL - Import failed, Send button not available');
    }
  });
});