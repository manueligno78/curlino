import { getStatusMessage, MessageTone } from 'http-status-message';

export interface StatusDisplayInfo {
  message: string;
  emoji: string;
  tone: MessageTone;
}

// Map our UI tone options to the library's MessageTone
export type UIMessageTone =
  | 'friendly'
  | 'formal'
  | 'technical'
  | 'straightforward'
  | 'funny'
  | 'empathetic'
  | 'educational'
  | 'short';

const toneMappings: Record<UIMessageTone, MessageTone> = {
  friendly: 'informal',
  formal: 'formal',
  technical: 'technical',
  straightforward: 'straightforward',
  funny: 'funny',
  empathetic: 'empathetic',
  educational: 'educational',
  short: 'short',
};

/**
 * Get status message information with configurable tone
 * @param statusCode - HTTP status code
 * @param tone - Message tone preference
 * @returns Status display information including message and emoji
 */
export function getStatusInfo(
  statusCode: number,
  tone: UIMessageTone = 'friendly'
): StatusDisplayInfo {
  const mappedTone = toneMappings[tone];
  const statusResponse = getStatusMessage(statusCode, mappedTone);

  return {
    message: statusResponse.message,
    emoji: statusResponse.emoji,
    tone: mappedTone,
  };
}

/**
 * Format status display for UI components
 * @param statusCode - HTTP status code
 * @param statusText - Original status text (optional)
 * @param tone - Message tone preference
 * @returns Formatted status string with emoji and message
 */
export function formatStatusDisplay(
  statusCode: number,
  _statusText: string = '',
  tone: UIMessageTone = 'friendly'
): string {
  const statusInfo = getStatusInfo(statusCode, tone);
  return `${statusInfo.emoji} ${statusCode} ${statusInfo.message}`;
}
