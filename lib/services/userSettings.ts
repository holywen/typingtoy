import type { UserSettings } from '@/types';

const SETTINGS_KEY = 'typing_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  keyboardLayout: 'qwerty',
  language: 'en',
  soundEnabled: true,
  showKeyboard: true,
  highlightErrors: true,
};

/**
 * Get user settings from local storage
 */
export function getUserSettings(): UserSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to load user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user settings to local storage
 */
export function saveUserSettings(settings: Partial<UserSettings>): void {
  try {
    const currentSettings = getUserSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Failed to save user settings:', error);
  }
}

/**
 * Update a single setting
 */
export function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): void {
  saveUserSettings({ [key]: value });
}

/**
 * Reset settings to default
 */
export function resetSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error('Failed to reset settings:', error);
  }
}

/**
 * Check if sound is enabled
 */
export function isSoundEnabled(): boolean {
  return getUserSettings().soundEnabled;
}

/**
 * Toggle sound on/off
 */
export function toggleSound(): boolean {
  const settings = getUserSettings();
  const newValue = !settings.soundEnabled;
  updateSetting('soundEnabled', newValue);
  return newValue;
}
