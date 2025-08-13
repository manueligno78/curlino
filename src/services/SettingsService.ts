import { AppSettings, DEFAULT_SETTINGS } from '../models/Settings';
import { StorageService } from './StorageService';

export class SettingsService {
  private readonly SETTINGS_KEY = 'cUrlino_settings';
  private storageService: StorageService;
  private settings: AppSettings;
  private listeners: ((settings: AppSettings) => void)[] = [];

  constructor() {
    this.storageService = new StorageService();
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    const savedSettings = this.storageService.getItem<AppSettings>(this.SETTINGS_KEY);
    if (savedSettings) {
      // Unisce le impostazioni salvate con quelle predefinite per gestire eventuali nuove proprietà
      return { ...DEFAULT_SETTINGS, ...savedSettings };
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(): void {
    this.storageService.setItem(this.SETTINGS_KEY, this.settings);
    this.notifyListeners();
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Per aggiornare solo le impostazioni di richiesta
  updateRequestDefaults(requestDefaults: Partial<AppSettings['requestDefaults']>): void {
    this.settings.requestDefaults = { ...this.settings.requestDefaults, ...requestDefaults };
    this.saveSettings();
  }

  // Per la gestione del tema
  setTheme(themeId: string): void {
    const theme = DEFAULT_SETTINGS.theme;
    if (themeId === 'system') {
      const prefersDark =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.isDark = prefersDark;
      theme.id = 'system';
      theme.name = 'Sistema';
    } else {
      const isDark = themeId === 'dark';
      theme.isDark = isDark;
      theme.id = themeId;
      theme.name = isDark ? 'Scuro' : 'Chiaro';
    }

    this.settings.theme = theme;
    this.applyCurrentTheme();
    this.saveSettings();
  }

  applyCurrentTheme(): void {
    document.documentElement.setAttribute(
      'data-theme',
      this.settings.theme.isDark ? 'dark' : 'light'
    );

    // Aggiorna anche la class CSS del body per compatibilità
    if (this.settings.theme.isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  // Sistema di sottoscrizione per notificare dei cambiamenti
  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);

    // Restituisce una funzione per annullare la sottoscrizione
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const settingsCopy = { ...this.settings };
    this.listeners.forEach(listener => listener(settingsCopy));
  }
}
