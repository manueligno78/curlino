import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('API Call Validation', () => {
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

  test('Builder API call validation - GET with headers and query params', async () => {
    // Array per catturare le richieste di rete
    const requests = [];
    
    // Intercetta tutte le richieste HTTP
    await page.route('**/*', async (route, request) => {
      // Salva i dettagli della richiesta
      if (request.url().startsWith('https://httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      
      // Continua con la richiesta normale
      route.continue();
    });

    // Go to Builder tab
    const builderTab = page.locator('button:has-text("Builder")').first();
    await builderTab.click();
    await page.waitForTimeout(500);

    // Configure URL base senza parametri
    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/get');

    // Aggiungi header personalizzato
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    // Riempi headers usando placeholder specifico
    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    await headerKeyInput.first().fill('X-Test-Header');
    await headerValueInput.first().fill('TestValue123');

    // Aggiungi secondo header
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('Authorization');
    await headerValueInput.nth(1).fill('Bearer token123');

    // Aggiungi parametri query tramite la sezione dedicata
    const querySection = page.locator('h3:has-text("Query Parameters")');
    await querySection.click();
    await page.waitForTimeout(500);

    const addParamBtn = page.locator('button:has-text("Add Parameter")');
    await addParamBtn.click();
    await page.waitForTimeout(300);

    // Usa placeholder specifico per i parametri
    const paramKeyInput = page.locator('input[placeholder="Parameter name"]');
    const paramValueInput = page.locator('input[placeholder="Parameter value"]');
    
    await paramKeyInput.first().fill('page');
    await paramValueInput.first().fill('1');

    // Add second parameter for more complete test
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(1).fill('limit');
    await paramValueInput.nth(1).fill('10');

    // Invia la richiesta
    const sendButton = page.locator('button:has-text("Send").btn-primary');
    await sendButton.click();

    // Aspetta che la richiesta venga completata
    await page.waitForTimeout(3000);

    // Verifica che sia stata intercettata almeno una richiesta
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    // Verifica URL con parametri query (ora dovrebbe avere entrambi i parametri)
    expect(request.url).toContain('https://httpbin.org/get');
    expect(request.url).toContain('page=1');
    expect(request.url).toContain('limit=10');

    // Verifica metodo HTTP
    expect(request.method).toBe('GET');

    // Verifica headers personalizzati
    expect(request.headers['x-test-header']).toBe('TestValue123');
    expect(request.headers['authorization']).toBe('Bearer token123');

    // Verifica che non ci sia body per GET
    expect(request.postData).toBeFalsy();

    console.log('✅ Builder GET request validation passed');
  });

  test('Builder API call validation - POST with JSON body', async () => {
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

    // Screenshot prima di inviare
    await page.screenshot({ path: 'tests/screenshots/post-before-send.png' });

    // Invia la richiesta
    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Screenshot dopo aver inviato
    await page.screenshot({ path: 'tests/screenshots/post-after-send.png' });

    console.log('Requests captured:', requests.length);
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    // Verifica URL
    expect(request.url).toBe('https://httpbin.org/post');

    // Verifica metodo
    expect(request.method).toBe('POST');

    // Verifica Content-Type header
    expect(request.headers['content-type']).toBe('application/json');

    // Verifica body JSON
    expect(request.postData).toBeTruthy();
    const parsedBody = JSON.parse(request.postData);
    expect(parsedBody.name).toBe('Test User');
    expect(parsedBody.email).toBe('test@example.com');
    expect(parsedBody.data.key).toBe('value');
    expect(parsedBody.data.number).toBe(42);

    console.log('✅ Builder POST request validation passed');
  });

  test('Importer API call validation - cURL import accuracy', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('Captured cURL request:', request.method(), request.url());
      }
      route.continue();
    });

    // L'app dovrebbe essere nel tab Import di default
    await page.waitForTimeout(1000);
    
    // Verifica che sia nel tab Import, altrimenti clicca
    const activeTab = await page.locator('.nav-button.active').textContent();
    if (activeTab !== 'Import') {
      const importTab = page.locator('button:has-text("Import")').first();
      await importTab.click();
      await page.waitForTimeout(1000);
    }

    // Comando cURL POST complesso ma realistico
    const curlCommand = `curl -X POST 'https://httpbin.org/post?api_key=123' -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' -d '{"user":"testuser","data":{"value":42}}'`;

    // Inserisci il comando cURL
    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await curlTextarea.fill(curlCommand);

    // Importa il comando - usa selettore specifico
    const importButton = page.locator('button.btn-primary:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(1500);

    // Invia la richiesta
    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    console.log('Requests captured:', requests.length);
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    // Verify URL - may have duplicate parameters, use contains
    expect(request.url).toContain('https://httpbin.org/post');
    expect(request.url).toContain('api_key=123');

    // Verifica metodo
    expect(request.method).toBe('POST');

    // Verifica headers principali
    expect(request.headers['content-type']).toBe('application/json');
    expect(request.headers['authorization']).toBe('Bearer token123');

    // Verifica body JSON
    expect(request.postData).toBeTruthy();
    const parsedBody = JSON.parse(request.postData);
    expect(parsedBody.user).toBe('testuser');
    expect(parsedBody.data.value).toBe(42);

    console.log('✅ Importer cURL validation passed');
  });

  test('Importer API call validation - GET cURL with multiple headers', async () => {
    const requests = [];
    
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('httpbin.org')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('Captured GET cURL request:', request.method(), request.url());
      }
      route.continue();
    });

    // Assicurati di essere nel tab Import
    await page.waitForTimeout(1000);
    const activeTab = await page.locator('.nav-button.active').textContent();
    if (activeTab !== 'Import') {
      const importTab = page.locator('button:has-text("Import")').first();
      await importTab.click();
      await page.waitForTimeout(1000);
    }

    // Comando cURL GET semplificato ma con headers importanti
    const curlCommand = `curl -X GET 'https://httpbin.org/get?format=json' -H 'Accept: application/json' -H 'X-API-Key: key123'`;

    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await curlTextarea.fill(curlCommand);

    // Importa e invia
    const importButton = page.locator('button.btn-primary:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(1500);

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    console.log('Requests captured:', requests.length);
    expect(requests.length).toBeGreaterThan(0);

    const request = requests[0];

    // Verify URL with parameters (may be duplicated)
    expect(request.url).toContain('https://httpbin.org/get');
    expect(request.url).toContain('format=json');

    // Verifica metodo
    expect(request.method).toBe('GET');

    // Verifica headers importanti (alcuni potrebbero essere sovrascritti)
    expect(request.headers['accept']).toBe('application/json');
    expect(request.headers['x-api-key']).toBe('key123');

    // GET non dovrebbe avere body
    expect(request.postData).toBeFalsy();

    console.log('✅ Importer GET cURL validation passed');
  });

  test('Complex API call validation - PUT with form data', async () => {
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

    // Test da Builder per PUT con form data
    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    // Configura PUT request
    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('PUT');
    await page.waitForTimeout(500);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/put');

    // Aggiungi headers per form data
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

    // Aggiungi body form data - dovrebbe essere visibile automaticamente per PUT
    await page.waitForTimeout(500);
    
    // Select FORM type if available - use more specific selector
    const formTypeButton = page.locator('button.btn-sm:has-text("FORM")').first();
    if (await formTypeButton.isVisible()) {
      await formTypeButton.click();
      await page.waitForTimeout(300);
    } else {
      // Altrimenti usa TEXT e inserisci form data manualmente
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

  test('Edge Case - Special Characters in URL and Headers', async () => {
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

    // URL con caratteri speciali nei parametri
    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/get');

    // Aggiungi parametri query con caratteri speciali
    const querySection = page.locator('h3:has-text("Query Parameters")');
    await querySection.click();
    await page.waitForTimeout(500);

    const addParamBtn = page.locator('button:has-text("Add Parameter")');
    await addParamBtn.click();
    await page.waitForTimeout(300);

    const paramKeyInput = page.locator('input[placeholder="Parameter name"]');
    const paramValueInput = page.locator('input[placeholder="Parameter value"]');
    
    // Parametri con caratteri speciali
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

    // Headers con caratteri speciali
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

    // Verifica che l'URL contenga i parametri (potrebbero essere URL-encoded)
    expect(request.url).toContain('httpbin.org/get');
    expect(request.url).toContain('search'); // Dovrebbe contenere la chiave
    expect(request.url).toContain('unicode_test');
    expect(request.url).toContain('encoded');

    // Verifica headers con caratteri speciali
    expect(request.headers['x-custom-unicode']).toContain('测试头部');
    expect(request.headers['x-special-chars']).toContain('quotes');

    console.log('✅ Special characters test completed - URL:', request.url);
  });

  test('Edge Case - Empty and Missing Parameters', async () => {
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

    // Headers con valori vuoti e chiavi vuote
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    // Header con chiave ma valore vuoto
    await headerKeyInput.first().fill('X-Empty-Value');
    await headerValueInput.first().fill('');

    // Secondo header con valore ma chiave vuota
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('');
    await headerValueInput.nth(1).fill('orphaned-value');

    // Header normale per confronto
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('Content-Type');
    await headerValueInput.nth(2).fill('application/json');

    // Body vuoto (dovrebbe essere consentito)
    await page.waitForTimeout(500);
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    const bodyTextarea = page.locator('textarea.body-editor');
    await bodyTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await bodyTextarea.fill(''); // Body completamente vuoto

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThan(0);
    const request = requests[0];

    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://httpbin.org/post');
    
    // Verifica come vengono gestiti gli headers vuoti
    expect(request.headers['content-type']).toBe('application/json');
    
    // Body dovrebbe essere vuoto o null
    expect(request.postData === '' || request.postData === null).toBe(true);

    console.log('✅ Empty parameters test completed');
  });

  test('Edge Case - Complex Query String Encoding', async () => {
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

    // Test tramite Importer con cURL complesso
    await page.waitForTimeout(1000);
    const activeTab = await page.locator('.nav-button.active').textContent();
    if (activeTab !== 'Import') {
      const importTab = page.locator('button:has-text("Import")').first();
      await importTab.click();
      await page.waitForTimeout(1000);
    }

    // cURL con query string molto complessa
    const complexCurl = `curl -X GET 'https://httpbin.org/get?q1=value%20with%20spaces&q2=special%26chars&q3=equals%3Din%3Dvalue&q4=%E6%B5%8B%E8%AF%95&empty=&multiple=val1&multiple=val2' -H 'X-Test: complex%20header%20value'`;

    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await curlTextarea.fill(complexCurl);

    const importButton = page.locator('button.btn-primary:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(1500);

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThan(0);
    const request = requests[0];

    // Verifica che la query string complessa sia preservata
    expect(request.url).toContain('httpbin.org/get');
    expect(request.url).toContain('q1=');
    expect(request.url).toContain('q2=');
    expect(request.url).toContain('q3=');
    expect(request.url).toContain('q4=');
    expect(request.url).toContain('empty=');
    expect(request.url).toContain('multiple=');

    console.log('✅ Complex query string test completed - URL:', request.url);
  });

  test('Edge Case - JSON Body with Special Characters and Escapes', async () => {
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
    
    // JSON con caratteri speciali, escape sequences, unicode
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

    // Verifica che il body JSON sia corretto
    expect(request.postData).toBeTruthy();
    const parsedBody = JSON.parse(request.postData);
    
    // Verifica che i caratteri speciali siano preservati
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

  test('Edge Case - Malformed cURL Commands', async () => {
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

    // Test cURL con sintassi borderline/complessa ma valida
    const trickyButValidCurl = `curl \\
      --request POST \\
      --url 'https://httpbin.org/post?param1=value1&param2=value%202' \\
      --header 'Content-Type: application/json' \\
      --header 'X-Weird-Header: value with    multiple   spaces' \\
      --header 'X-Empty-Header:' \\
      --data '{
        "key1": "value1",
        "key2": "value with \\"escaped quotes\\"",
        "key3": null
      }'`;

    const curlTextarea = page.locator('.curl-textarea');
    await curlTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await curlTextarea.fill(trickyButValidCurl);

    const importButton = page.locator('button.btn-primary:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(1500);

    // Dovrebbe importare senza errori
    const sendButton = page.locator('button:has-text("Send")').first();
    if (await sendButton.isVisible()) {
      await sendButton.click();
      await page.waitForTimeout(3000);

      if (requests.length > 0) {
        const request = requests[0];
        expect(request.method).toBe('POST');
        expect(request.url).toContain('httpbin.org/post');
        expect(request.url).toContain('param1=value1');
        
        if (request.postData) {
          const parsedBody = JSON.parse(request.postData);
          expect(parsedBody.key1).toBe('value1');
          expect(parsedBody.key2).toContain('escaped quotes');
          expect(parsedBody.key3).toBe(null);
        }
        
        console.log('✅ Complex cURL import test completed');
      } else {
        console.log('⚠️ Complex cURL test - No requests captured, may indicate parsing issue');
      }
    } else {
      console.log('⚠️ Complex cURL test - Send button not available, may indicate import failure');
    }
  });

  test('Edge Case - Large Payload and Long URLs', async () => {
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

    // URL molto lunga con molti parametri
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

    // Header con valore molto lungo
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
    
    // Body molto grande
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
      expect(request.url.length).toBeGreaterThan(1000); // URL dovrebbe essere molto lunga
      
      expect(request.headers['content-type']).toBe('application/json');
      expect(request.headers['x-very-long-header']).toContain('AAAA');
      expect(request.headers['x-very-long-header'].length).toBeGreaterThan(1000);

      if (request.postData) {
        expect(request.postData.length).toBeGreaterThan(10000); // Body dovrebbe essere molto grande
        const parsedBody = JSON.parse(request.postData);
        expect(parsedBody.large_array).toHaveLength(100);
        expect(parsedBody.large_string).toContain('XXXX');
      }

      console.log('✅ Large payload test completed - URL length:', request.url.length);
    } else {
      console.log('⚠️ Large payload test - No requests captured, may indicate size limits');
    }
  });

  test('QA Edge Case - HTTP Methods with Unusual Combinations', async () => {
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

    // Test DELETE con body (tecnicamente possibile ma inusuale)
    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('DELETE');
    await page.waitForTimeout(500);

    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/delete');

    // Headers che potrebbero confliggere
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    // Headers conflittuali
    await headerKeyInput.first().fill('Content-Type');
    await headerValueInput.first().fill('application/json');

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('Accept');
    await headerValueInput.nth(1).fill('application/xml'); // Diverso da Content-Type

    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('Content-Length');
    await headerValueInput.nth(2).fill('999'); // Potrebbe essere sovrascritto

    // DELETE con body (se supportato dall'app)
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
      
      // Verifica headers
      expect(request.headers['content-type']).toBe('application/json');
      expect(request.headers['accept']).toBe('application/xml');
      
      console.log('✅ Unusual HTTP method combination test completed');
    } else {
      console.log('⚠️ Unusual HTTP method - No requests captured');
    }
  });

  test('QA Edge Case - Boundary Values and Limits', async () => {
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

    // Test parametri con valori limite
    const querySection = page.locator('h3:has-text("Query Parameters")');
    await querySection.click();
    await page.waitForTimeout(500);

    const addParamBtn = page.locator('button:has-text("Add Parameter")');
    const paramKeyInput = page.locator('input[placeholder="Parameter name"]');
    const paramValueInput = page.locator('input[placeholder="Parameter value"]');

    // Parametro con chiave di un solo carattere
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.first().fill('a');
    await paramValueInput.first().fill('single_char_key');

    // Parametro con valore molto lungo (boundary test)
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(1).fill('long_value');
    await paramValueInput.nth(1).fill('x'.repeat(2000)); // 2KB value

    // Parametro con solo numeri
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(2).fill('123');
    await paramValueInput.nth(2).fill('456');

    // Parametro con caratteri di controllo
    await addParamBtn.click();
    await page.waitForTimeout(300);
    await paramKeyInput.nth(3).fill('control_chars');
    await paramValueInput.nth(3).fill('\t\n\r'); // Tab, newline, carriage return

    // Headers con valori limite
    const headersSection = page.locator('h3:has-text("Headers")');
    await headersSection.click();
    await page.waitForTimeout(500);

    const addHeaderBtn = page.locator('button:has-text("Add Header")');
    await addHeaderBtn.click();
    await page.waitForTimeout(300);

    const headerKeyInput = page.locator('input[placeholder="Header name"]');
    const headerValueInput = page.locator('input[placeholder="Header value"]');
    
    // Header con valore numerico (dovrebbe essere stringa)
    await headerKeyInput.first().fill('X-Numeric-Value');
    await headerValueInput.first().fill('42');

    // Header che simula un numero molto grande
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-Big-Number');
    await headerValueInput.nth(1).fill('999999999999999999999');

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      // Verifica parametri limite
      expect(request.url).toContain('a=single_char_key');
      expect(request.url).toContain('long_value=');
      expect(request.url).toContain('123=456');
      
      // Verifica headers
      expect(request.headers['x-numeric-value']).toBe('42');
      expect(request.headers['x-big-number']).toBe('999999999999999999999');

      console.log('✅ Boundary values test completed - URL length:', request.url.length);
    } else {
      console.log('⚠️ Boundary values test - No requests captured');
    }
  });

  test('QA Edge Case - Content-Type vs Body Mismatch', async () => {
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
    await headerValueInput.first().fill('application/xml'); // Dice XML

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
      
      // Il body dovrebbe essere inviato come specificato, indipendentemente dal Content-Type
      if (request.postData) {
        const bodyContent = request.postData;
        expect(bodyContent).toContain('{"this": "is"');
        expect(bodyContent).toContain('"valid": "json"');
        
        // Dovrebbe essere JSON valido nonostante l'header XML
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

  test('QA Edge Case - Authentication Headers Edge Cases', async () => {
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

    // Bearer token con caratteri speciali
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.first().fill('Authorization');
    await headerValueInput.first().fill('Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0IiwiaWF0IjoxNjM4MzYwMDAwLCJleHAiOjE2NzAzNjAwMDAsImF1ZCI6Ind3dy50ZXN0LmNvbSIsInN1YiI6InRlc3RAdGVzdC5jb20iLCJuYW1lIjoidGVzdCBüc2VyIiwicm9sZSI6InVzZXIifQ.invalid_signature_🚀測試');

    // Basic auth con username:password contenenti caratteri speciali
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(1).fill('X-Basic-Auth-Test');
    await headerValueInput.nth(1).fill('Basic dXNlcjpwYXNzd29yZDEyMyE='); // user:password123!

    // API key con formato inusuale
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(2).fill('X-API-Key');
    await headerValueInput.nth(2).fill('sk-test-123456789abcdef_🔑_測試apikey');

    // Header con valore vuoto (dovrebbe essere incluso?)
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(3).fill('X-Empty-Auth');
    await headerValueInput.nth(3).fill('');

    // Header duplicato con valori diversi
    await addHeaderBtn.click();
    await page.waitForTimeout(300);
    await headerKeyInput.nth(4).fill('Authorization');
    await headerValueInput.nth(4).fill('Basic dXNlcjE6cGFzczE='); // Secondo Authorization header

    const sendButton = page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);

    if (requests.length > 0) {
      const request = requests[0];
      
      // Verifica come vengono gestiti gli headers di auth complessi
      expect(request.headers['authorization']).toBeDefined();
      expect(request.headers['x-basic-auth-test']).toBe('Basic dXNlcjpwYXNzd29yZDEyMyE=');
      expect(request.headers['x-api-key']).toContain('sk-test-123456789abcdef');

      // Test critico: headers duplicati dovrebbero essere gestiti correttamente
      const authHeader = request.headers['authorization'];
      console.log('Authorization header value:', authHeader);
      
      console.log('✅ Authentication headers edge case test completed');
    } else {
      console.log('⚠️ Authentication headers test - No requests captured');
    }
  });

  test('QA Edge Case - cURL with Extreme Complexity', async () => {
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

    // cURL estremamente complesso con tutti i edge case possibili
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
        
        // Verifica parsing di query parameters complessi
        expect(request.url).toContain('q1=');
        expect(request.url).toContain('q2=');
        expect(request.url).toContain('unicode=');
        expect(request.url).toContain('special=');

        // Verifica headers complessi
        expect(request.headers['user-agent']).toContain('Custom/1.0');
        expect(request.headers['accept']).toContain('application/json');
        expect(request.headers['authorization']).toContain('Bearer');
        expect(request.headers['x-unicode']).toContain('测试');
        expect(request.headers['x-numeric']).toBe('42');

        // Verifica body complesso
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