import {
  getUserSettings,
  saveUserSettings,
  updateSetting,
  resetSettings,
  isSoundEnabled,
  toggleSound,
} from '../userSettings';

describe('userSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should return default settings when no settings exist', () => {
      const settings = getUserSettings();

      expect(settings).toEqual({
        theme: 'system',
        keyboardLayout: 'qwerty',
        language: 'en',
        soundEnabled: true,
        showKeyboard: true,
        highlightErrors: true,
      });
    });

    it('should return saved settings from localStorage', () => {
      localStorage.setItem(
        'typing_user_settings',
        JSON.stringify({
          theme: 'dark',
          keyboardLayout: 'dvorak',
          language: 'es',
          soundEnabled: false,
          showKeyboard: false,
          highlightErrors: false,
        })
      );

      const settings = getUserSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.keyboardLayout).toBe('dvorak');
      expect(settings.language).toBe('es');
      expect(settings.soundEnabled).toBe(false);
    });

    it('should merge saved settings with defaults', () => {
      localStorage.setItem(
        'typing_user_settings',
        JSON.stringify({
          theme: 'dark',
        })
      );

      const settings = getUserSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.keyboardLayout).toBe('qwerty'); // Default
      expect(settings.soundEnabled).toBe(true); // Default
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('typing_user_settings', 'invalid json');

      const settings = getUserSettings();

      expect(settings).toEqual({
        theme: 'system',
        keyboardLayout: 'qwerty',
        language: 'en',
        soundEnabled: true,
        showKeyboard: true,
        highlightErrors: true,
      });
    });

    it('should handle localStorage errors gracefully', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const settings = getUserSettings();

      expect(settings).toEqual({
        theme: 'system',
        keyboardLayout: 'qwerty',
        language: 'en',
        soundEnabled: true,
        showKeyboard: true,
        highlightErrors: true,
      });

      getItemSpy.mockRestore();
    });
  });

  describe('saveUserSettings', () => {
    it('should save partial settings and merge with existing', () => {
      saveUserSettings({ theme: 'dark' });

      const settings = getUserSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.keyboardLayout).toBe('qwerty'); // Default preserved
    });

    it('should update existing settings', () => {
      saveUserSettings({ theme: 'dark', soundEnabled: false });
      saveUserSettings({ language: 'fr' });

      const settings = getUserSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.soundEnabled).toBe(false);
      expect(settings.language).toBe('fr');
    });

    it('should save all settings at once', () => {
      saveUserSettings({
        theme: 'light',
        keyboardLayout: 'colemak',
        language: 'ja',
        soundEnabled: false,
        showKeyboard: false,
        highlightErrors: false,
      });

      const settings = getUserSettings();
      expect(settings).toEqual({
        theme: 'light',
        keyboardLayout: 'colemak',
        language: 'ja',
        soundEnabled: false,
        showKeyboard: false,
        highlightErrors: false,
      });
    });

    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => saveUserSettings({ theme: 'dark' })).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('updateSetting', () => {
    it('should update a single setting', () => {
      updateSetting('theme', 'dark');

      const settings = getUserSettings();
      expect(settings.theme).toBe('dark');
    });

    it('should update different setting types', () => {
      updateSetting('keyboardLayout', 'dvorak');
      updateSetting('soundEnabled', false);
      updateSetting('language', 'zh');

      const settings = getUserSettings();
      expect(settings.keyboardLayout).toBe('dvorak');
      expect(settings.soundEnabled).toBe(false);
      expect(settings.language).toBe('zh');
    });

    it('should preserve other settings when updating one', () => {
      saveUserSettings({ theme: 'dark', soundEnabled: false });
      updateSetting('language', 'fr');

      const settings = getUserSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.soundEnabled).toBe(false);
      expect(settings.language).toBe('fr');
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      saveUserSettings({
        theme: 'dark',
        keyboardLayout: 'dvorak',
        language: 'fr',
        soundEnabled: false,
        showKeyboard: false,
        highlightErrors: false,
      });

      resetSettings();

      const settings = getUserSettings();
      expect(settings).toEqual({
        theme: 'system',
        keyboardLayout: 'qwerty',
        language: 'en',
        soundEnabled: true,
        showKeyboard: true,
        highlightErrors: true,
      });
    });

    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => resetSettings()).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('isSoundEnabled', () => {
    it('should return true by default', () => {
      expect(isSoundEnabled()).toBe(true);
    });

    it('should return saved sound setting', () => {
      saveUserSettings({ soundEnabled: false });
      expect(isSoundEnabled()).toBe(false);
    });

    it('should reflect changes after updating', () => {
      expect(isSoundEnabled()).toBe(true);
      updateSetting('soundEnabled', false);
      expect(isSoundEnabled()).toBe(false);
      updateSetting('soundEnabled', true);
      expect(isSoundEnabled()).toBe(true);
    });
  });

  describe('toggleSound', () => {
    it('should toggle sound from true to false', () => {
      const newValue = toggleSound();

      expect(newValue).toBe(false);
      expect(isSoundEnabled()).toBe(false);
    });

    it('should toggle sound from false to true', () => {
      updateSetting('soundEnabled', false);

      const newValue = toggleSound();

      expect(newValue).toBe(true);
      expect(isSoundEnabled()).toBe(true);
    });

    it('should toggle multiple times correctly', () => {
      expect(toggleSound()).toBe(false);
      expect(toggleSound()).toBe(true);
      expect(toggleSound()).toBe(false);
      expect(toggleSound()).toBe(true);
    });

    it('should return the new value', () => {
      const result1 = toggleSound();
      expect(result1).toBe(false);
      expect(isSoundEnabled()).toBe(result1);

      const result2 = toggleSound();
      expect(result2).toBe(true);
      expect(isSoundEnabled()).toBe(result2);
    });
  });
});
