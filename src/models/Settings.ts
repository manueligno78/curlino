export interface Theme {
  name: string;
  id: string;
  isDark: boolean;
  mode?: string;
}

export interface RequestDefaults {
  followRedirects: boolean;
  timeout: number; // in milliseconds
  sslVerification: boolean;
  defaultHeaders: Record<string, string>; // intestazioni predefinite
}

export interface AppearanceSettings {
  fontSize: 'small' | 'medium' | 'large';
  statusMessageTone?: 'friendly' | 'formal' | 'technical';
}

export interface RequestSettings {
  timeout?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
}

export interface AdvancedSettings {
  enableDevtools?: boolean;
  verboseLogging?: boolean;
}

export interface PerformanceSettings {
  historyLimit: number;
}

export interface AppSettings {
  theme: Theme;
  fontSize: number;
  requestDefaults: RequestDefaults;
  autoSave: boolean;
  sendUsageData: boolean;
  maxHistoryItems: number;
  appearance?: AppearanceSettings;
  request?: RequestSettings;
  advanced?: AdvancedSettings;
  performance?: PerformanceSettings;
}

export const DEFAULT_THEMES: Theme[] = [
  {
    name: 'Chiaro',
    id: 'light',
    isDark: false,
  },
  {
    name: 'Scuro',
    id: 'dark',
    isDark: true,
  },
  {
    name: 'Sistema',
    id: 'system',
    isDark: false, // sarà aggiornato dinamicamente in base alle preferenze di sistema
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: DEFAULT_THEMES[0], // tema chiaro di default
  fontSize: 14,
  requestDefaults: {
    followRedirects: true,
    timeout: 30000, // 30 secondi
    sslVerification: true,
    defaultHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  autoSave: true,
  sendUsageData: false, // opt-out per la telemetria
  maxHistoryItems: 50,
};
