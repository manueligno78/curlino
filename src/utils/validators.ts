/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is not empty
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate if a string is valid JSON
 */
export function isValidJson(jsonString: string): boolean {
  if (!isNonEmptyString(jsonString)) return false;

  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is valid XML
 */
export function isValidXml(xmlString: string): boolean {
  if (!isNonEmptyString(xmlString)) return false;

  try {
    const parser = new DOMParser();
    const dom = parser.parseFromString(xmlString, 'application/xml');
    return !dom.getElementsByTagName('parsererror').length;
  } catch {
    return false;
  }
}

/**
 * Validate headers format
 */
export function isValidHeaders(headersString: string): boolean {
  if (!headersString.trim()) return true;

  const lines = headersString.split('\n');
  return lines.every(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return true; // Allow empty lines
    return trimmedLine.includes(':');
  });
}

/**
 * Validate HTTP method
 */
export function isValidHttpMethod(method: string): boolean {
  const validMethods = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'HEAD',
    'OPTIONS',
    'CONNECT',
    'TRACE',
  ];
  return validMethods.includes(method.toUpperCase());
}
