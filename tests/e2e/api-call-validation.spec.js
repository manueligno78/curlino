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

    // Vai al tab Builder
    const builderTab = page.locator('button:has-text("Builder")').first();
    await builderTab.click();
    await page.waitForTimeout(500);

    // Configura URL base senza parametri
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

    // Aggiungi un secondo parametro per test più completo
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

    // Vai al tab Builder
    const builderTab = page.locator('button:has-text("Builder")');
    await builderTab.click();
    await page.waitForTimeout(1000);

    // Cambia metodo a POST
    const methodSelect = page.locator('.method-select');
    await methodSelect.selectOption('POST');
    await page.waitForTimeout(500);

    // Configura URL
    const urlInput = page.locator('.url-input');
    await urlInput.fill('https://httpbin.org/post');

    // Aggiungi header Content-Type
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

    // Aggiungi body JSON - La sezione Body dovrebbe essere visibile automaticamente per POST
    await page.waitForTimeout(500);
    
    // Seleziona tipo JSON se non è già selezionato
    const jsonTypeButton = page.locator('button:has-text("JSON")');
    if (await jsonTypeButton.isVisible()) {
      await jsonTypeButton.click();
      await page.waitForTimeout(300);
    }
    
    // Trova il textarea del body
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

    // Verifica URL - può avere parametri duplicati, usiamo contains
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

    // Verifica URL con parametri (può essere duplicato)
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
    
    // Seleziona tipo FORM se disponibile - usa selettore più specifico
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
});