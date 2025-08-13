/**
 * Format JSON data with proper indentation
 */
export function formatJson(json: unknown): string {
  try {
    return JSON.stringify(json, null, 2);
  } catch {
    return String(json);
  }
}

/**
 * Format XML data with proper indentation
 */
export function formatXml(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  '; // 2 spaces

  xml.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) {
      // If this is a closing tag, decrease the indent level
      indent = indent.substring(tab.length);
    }

    formatted += indent + '<' + node + '>\r\n';

    if (node.match(/^<?\w[^>]*[^/]$/)) {
      // If this is an opening tag, increase the indent level
      indent += tab;
    }
  });

  return formatted.substring(1, formatted.length - 3);
}

/**
 * Format headers object to a string
 */
export function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

/**
 * Parse headers string to an object
 */
export function parseHeaders(headersStr: string): Record<string, string> {
  const result: Record<string, string> = {};

  if (!headersStr.trim()) return result;

  headersStr.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine.substring(colonIndex + 1).trim();
      if (key) {
        result[key] = value;
      }
    }
  });

  return result;
}

import { ApiResponseBody } from '../types/api';

interface ResponseData {
  status?: string | number;
  headers?: Record<string, string>;
  body?: ApiResponseBody;
}

/**
 * Format response object for display
 */
export function formatResponse(response: unknown): string {
  if (!response) return 'No response received';

  const responseData = response as ResponseData;
  return `Status: ${responseData.status || 'Unknown'}\nHeaders:\n${formatHeaders(responseData.headers || {})}\n\nBody:\n${formatJson(responseData.body)}`;
}

/**
 * Format time in milliseconds to a human-readable format
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Try to detect content type and format it accordingly
 */
export function formatByContentType(content: unknown, contentType?: string): string {
  if (!content) return '';

  // If it's already a string, check if it's JSON or XML
  if (typeof content === 'string') {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      return formatJson(parsed);
    } catch {
      // Check if it looks like XML
      if (contentType?.includes('xml') || content.trim().startsWith('<')) {
        return formatXml(content);
      }
      return content;
    }
  }

  // If it's an object, format as JSON
  return formatJson(content);
}

/**
 * Generate a random UUID (v4)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
