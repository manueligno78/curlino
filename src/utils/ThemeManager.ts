/**
 * Theme Manager - Handles theme switching and persistence
 * Supports light/dark themes with system preference detection
 */

export type Theme = 'light' | 'dark' | 'auto';

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = 'light';
  private systemTheme: 'light' | 'dark' = 'light';
  private mediaQuery: MediaQueryList;

  private constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemTheme = this.mediaQuery.matches ? 'dark' : 'light';

    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', e => {
      this.systemTheme = e.matches ? 'dark' : 'light';
      this.applyTheme();
    });

    // Load saved theme
    this.loadSavedTheme();
    this.applyTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Set theme and persist to localStorage
   */
  public setTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem('curlino-theme', theme);
    this.applyTheme();
  }

  /**
   * Get current active theme
   */
  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get resolved theme (considering auto/system preference)
   */
  public getResolvedTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.systemTheme;
    }
    return this.currentTheme === 'dark' ? 'dark' : 'light';
  }

  /**
   * Toggle between light and dark themes
   */
  public toggleTheme(): void {
    const resolved = this.getResolvedTheme();
    this.setTheme(resolved === 'light' ? 'dark' : 'light');
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    const resolvedTheme = this.getResolvedTheme();
    const root = document.documentElement;

    // Set data attribute for CSS
    root.setAttribute('data-theme', resolvedTheme);

    // Update class for compatibility
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${resolvedTheme}`);

    // Dispatch event for components that need to react
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme: resolvedTheme, userTheme: this.currentTheme },
      })
    );
  }

  /**
   * Load theme from localStorage
   */
  private loadSavedTheme(): void {
    const saved = localStorage.getItem('curlino-theme') as Theme;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.currentTheme = saved;
    } else {
      // Default to system preference
      this.currentTheme = 'auto';
    }
  }

  /**
   * Get theme icon for UI
   */
  public getThemeIcon(): string {
    const resolved = this.getResolvedTheme();
    switch (this.currentTheme) {
      case 'auto':
        return resolved === 'dark' ? '🌙' : '☀️';
      case 'dark':
        return '🌙';
      case 'light':
        return '☀️';
      default:
        return '☀️';
    }
  }

  /**
   * Get next theme in cycle (light → dark → auto → light)
   */
  public getNextTheme(): Theme {
    switch (this.currentTheme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'auto';
      case 'auto':
        return 'light';
      default:
        return 'light';
    }
  }
}
