/**
 * Utility per generare comandi curl dalle richieste HTTP effettuate
 */
import { Request } from '../models/Request';
import { AxiosRequestConfig } from 'axios';

/**
 * Genera un comando curl a partire da una richiesta
 * @param request L'oggetto Request o AxiosRequestConfig da cui generare il comando curl
 * @returns Il comando curl come stringa
 */
export function generateCurlCommand(request: Request | AxiosRequestConfig): string {
  let url: string = '';
  let method: string = 'GET';
  let headers: Record<string, string> = {};
  let body: string | undefined;

  // Estrai i dati dalla richiesta a seconda del tipo di oggetto
  if ('data' in request && request.data !== undefined) {
    // È un AxiosRequestConfig
    url = request.url || '';
    method = (request.method || 'GET').toUpperCase();
    headers = (request.headers as Record<string, string>) || {};

    if (request.data) {
      if (typeof request.data === 'string') {
        body = request.data;
      } else {
        try {
          body = JSON.stringify(request.data);
        } catch {
          body = String(request.data);
        }
      }
    }
  } else {
    // È un oggetto Request
    const reqObj = request as Request;
    url = reqObj.url;
    method = reqObj.method;
    headers = reqObj.headers;
    body = reqObj.body;
  }

  // Costruisci il comando curl base
  let curlCommand = `curl -X ${method} '${url}'`;

  // Aggiungi le intestazioni
  Object.entries(headers).forEach(([key, value]) => {
    if (key && value) {
      // Gestisci i caratteri speciali
      const escapedValue = value.replace(/'/g, "'\\''");
      curlCommand += ` \\\n  -H '${key}: ${escapedValue}'`;
    }
  });

  // Aggiungi il corpo della richiesta per i metodi che lo supportano
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    // Gestisci i caratteri speciali
    const escapedBody = body.replace(/'/g, "'\\''");
    curlCommand += ` \\\n  -d '${escapedBody}'`;
  }

  return curlCommand;
}
