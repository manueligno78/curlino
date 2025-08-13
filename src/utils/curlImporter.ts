/**
 * This utility helps to parse cURL commands and convert them to request objects
 *
 * It supports parsing of standard cURL commands with:
 * - URL extraction
 * - HTTP method (-X)
 * - Headers (-H)
 * - Body data (-d, --data)
 *
 * Example usage:
 * ```
 * const curlCommand = 'curl -X POST -H "Content-Type: application/json" -d \'{"name":"test"}\' https://api.example.com/data';
 * const request = importCurlCommand(curlCommand);
 * if (request) {
 *   // Use the request object
 * }
 * ```
 */

import { Request } from '../models/Request';
import { generateUUID } from './formatters';
import { logger } from './BrowserLogger';

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Parse a cURL command and extract request details
 */
export function parseCurlCommand(curlCommand: string): ParsedCurl | null {
  try {
    curlCommand = curlCommand.trim();
    if (!curlCommand.toLowerCase().startsWith('curl')) {
      return null;
    }
    const result: ParsedCurl = {
      url: '',
      method: 'GET',
      headers: {},
    };
    // Tokenize the command (very basic, does not handle all edge cases)
    // Split by spaces, but keep quoted substrings together
    const tokens = curlCommand.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    let urlToken = '';
    const bodyParts: string[] = [];

    logger.debug('Parsing cURL command', {
      component: 'curlImporter',
      action: 'parseCurlCommand',
      tokens: tokens,
      curlCommand: curlCommand.substring(0, 200),
    });

    // Track which tokens are consumed as flag values
    const consumedTokens = new Set<number>();

    for (let i = 1; i < tokens.length; i++) {
      // skip 'curl'
      const token = tokens[i];

      // Skip if this token was already consumed as a flag value
      if (consumedTokens.has(i)) {
        continue;
      }

      if ((token === '-X' || token === '--request') && tokens[i + 1]) {
        result.method = tokens[i + 1].replace(/['"]/g, '').toUpperCase();
        consumedTokens.add(i + 1); // Mark the next token as consumed
        i++;
      } else if ((token === '-H' || token === '--header') && tokens[i + 1]) {
        const header = tokens[i + 1].replace(/^['"]|['"]$/g, '');
        const parts = header.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          result.headers[key] = value;
        }
        consumedTokens.add(i + 1); // Mark the next token as consumed
        i++;
      } else if (
        (token === '-d' ||
          token === '--data' ||
          token === '--data-raw' ||
          token === '--data-binary') &&
        tokens[i + 1]
      ) {
        let data = tokens[i + 1];
        // Remove quotes if present
        if (
          (data.startsWith("'") && data.endsWith("'")) ||
          (data.startsWith('"') && data.endsWith('"'))
        )
          data = data.slice(1, -1);
        bodyParts.push(data);
        consumedTokens.add(i + 1); // Mark the next token as consumed
        i++;
      } else if (!token.startsWith('-') && token !== 'curl') {
        // This is a potential URL token
        if (!urlToken) {
          urlToken = token;
        }
      }
    }
    // Compose body if present
    if (bodyParts.length > 0) {
      result.body = bodyParts.join('&');
      if (result.method === 'GET') {
        result.method = 'POST';
      }
    }
    // Extract URL: from the URL token we found
    if (urlToken) {
      result.url = urlToken.replace(/^['"]|['"]$/g, '');
    }

    logger.debug('Parsed cURL result', {
      component: 'curlImporter',
      action: 'parseCurlCommand',
      result: result,
      urlToken: urlToken,
    });
    return result;
  } catch (error) {
    logger.error('Failed to parse cURL command', {
      component: 'curlImporter',
      action: 'parseCurlCommand',
      error: error instanceof Error ? error.message : String(error),
      curlCommand: curlCommand.substring(0, 100) + '...',
    });
    return null;
  }
}

/**
 * Convert parsed cURL data to a Request object
 */
export function createRequestFromCurl(curlData: ParsedCurl): Request {
  const name = curlData.url.split('/').pop() || 'Imported Request';

  return new Request(
    generateUUID(),
    name,
    curlData.url,
    curlData.method,
    curlData.headers,
    curlData.body || '',
    'Imported from cURL'
  );
}

/**
 * Parse a cURL command and create a Request object directly
 */
export function importCurlCommand(curlCommand: string): Request | null {
  const parsed = parseCurlCommand(curlCommand);
  if (!parsed) return null;

  return createRequestFromCurl(parsed);
}
