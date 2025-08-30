/**
 * URL validation utility functions for request input
 *
 * This utility provides:
 * - URL validation with protocol checking
 * - Protocol prefilling (HTTPS by default)
 * - URL normalization and correction
 */

import { logger } from './BrowserLogger';

export interface ValidationResult {
  isValid: boolean;
  correctedUrl?: string;
  error?: string;
}

/**
 * Check if a URL has a valid protocol
 */
export function hasValidProtocol(url: string): boolean {
  const protocolRegex = /^https?:\/\//i;
  return protocolRegex.test(url.trim());
}

/**
 * Check if a URL is valid without requiring protocol
 */
export function isValidUrlFormat(url: string): boolean {
  try {
    // If no protocol, add https:// for validation
    const testUrl = hasValidProtocol(url) ? url : `https://${url}`;
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add HTTPS protocol if missing from URL
 */
export function prefillProtocol(url: string, protocol: 'https' | 'http' = 'https'): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return `${protocol}://`;

  if (hasValidProtocol(trimmedUrl)) {
    return trimmedUrl;
  }

  // Remove any leading protocol-like text that's incomplete
  const cleanUrl = trimmedUrl.replace(/^(https?:?\/?\/?)/, '');
  return `${protocol}://${cleanUrl}`;
}

/**
 * Validate and correct URL input
 */
export function validateAndCorrectUrl(url: string): ValidationResult {
  try {
    const trimmedUrl = url.trim();

    // Empty URL is invalid
    if (!trimmedUrl) {
      return {
        isValid: false,
        error: 'URL cannot be empty',
      };
    }

    // Check if it's a cURL command - these are handled separately
    if (trimmedUrl.toLowerCase().startsWith('curl ')) {
      return {
        isValid: true,
        correctedUrl: trimmedUrl,
      };
    }

    // If no protocol, add HTTPS
    let correctedUrl = trimmedUrl;
    if (!hasValidProtocol(trimmedUrl)) {
      correctedUrl = prefillProtocol(trimmedUrl);
    }

    // Validate the final URL
    try {
      new URL(correctedUrl);

      logger.debug('URL validation successful', {
        component: 'urlValidation',
        action: 'validateAndCorrectUrl',
        originalUrl: url,
        correctedUrl: correctedUrl,
      });

      return {
        isValid: true,
        correctedUrl: correctedUrl,
      };
    } catch (urlError) {
      return {
        isValid: false,
        error: 'Invalid URL format',
      };
    }
  } catch (error) {
    logger.error('URL validation error', {
      component: 'urlValidation',
      action: 'validateAndCorrectUrl',
      error: error instanceof Error ? error.message : String(error),
      url: url,
    });

    return {
      isValid: false,
      error: 'Unable to validate URL',
    };
  }
}

/**
 * Get the protocol from a URL, or return default
 */
export function getUrlProtocol(url: string): 'https' | 'http' | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' ? 'https' : 'http';
  } catch {
    return null;
  }
}
