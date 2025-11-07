/**
 * @jest-environment jsdom
 */

import {
  isTestMode,
  setTestMode,
  isGuest,
  getPlayerDisplayName,
  getPlayerId,
  updateDisplayName,
  clearDeviceIdentity,
  saveDeviceIdentity,
} from '../deviceId';
import type { DeviceIdentity } from '@/types/multiplayer';

// Mock FingerprintJS
jest.mock('@fingerprintjs/fingerprintjs', () => ({
  load: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(() =>
        Promise.resolve({
          visitorId: 'mock-visitor-id-12345',
        })
      ),
    })
  ),
}));

describe('deviceId', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('isTestMode', () => {
    it('should return false by default', () => {
      expect(isTestMode()).toBe(false);
    });

    it('should return true when set in localStorage', () => {
      localStorage.setItem('typingtoy_test_mode', 'true');
      expect(isTestMode()).toBe(true);
    });

    it('should return true when URL param is set', () => {
      // Save original URLSearchParams
      const OriginalURLSearchParams = global.URLSearchParams;

      // Mock URLSearchParams to return testMode=true
      const mockGet = jest.fn((key: string) => {
        return key === 'testMode' ? 'true' : null;
      });
      global.URLSearchParams = jest.fn().mockImplementation(() => ({
        get: mockGet,
      })) as any;

      expect(isTestMode()).toBe(true);

      // Restore original
      global.URLSearchParams = OriginalURLSearchParams;
    });

    it('should return false when set to any other value', () => {
      localStorage.setItem('typingtoy_test_mode', 'false');
      expect(isTestMode()).toBe(false);
    });
  });

  describe('setTestMode', () => {
    it('should enable test mode', () => {
      setTestMode(true);
      expect(localStorage.getItem('typingtoy_test_mode')).toBe('true');
    });

    it('should disable test mode', () => {
      localStorage.setItem('typingtoy_test_mode', 'true');
      setTestMode(false);
      expect(localStorage.getItem('typingtoy_test_mode')).toBeNull();
    });

    it('should log when enabling test mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      setTestMode(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test mode enabled')
      );
      consoleSpy.mockRestore();
    });

    it('should log when disabling test mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      setTestMode(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test mode disabled')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('isGuest', () => {
    it('should return true for undefined userId', () => {
      expect(isGuest(undefined)).toBe(true);
    });

    it('should return true for device_ prefixed userId', () => {
      expect(isGuest('device_123456')).toBe(true);
      expect(isGuest('device_abc')).toBe(true);
    });

    it('should return false for regular userId', () => {
      expect(isGuest('user-123')).toBe(false);
      expect(isGuest('abc123')).toBe(false);
    });

    it('should return true for empty string', () => {
      expect(isGuest('')).toBe(true);
    });
  });

  describe('getPlayerDisplayName', () => {
    it('should return user name if user is provided', () => {
      const user = { name: 'John Doe', id: 'user-123' };
      const name = getPlayerDisplayName(user);
      expect(name).toBe('John Doe');
    });

    it('should return device identity display name if no user', () => {
      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'SwiftTyper123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
      const name = getPlayerDisplayName(undefined, identity);
      expect(name).toBe('SwiftTyper123');
    });

    it('should generate guest name if neither user nor identity provided', () => {
      const name = getPlayerDisplayName();
      expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/); // Pattern: AdjectiveNoun123
    });

    it('should prefer user name over device identity', () => {
      const user = { name: 'John Doe', id: 'user-123' };
      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'SwiftTyper123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
      const name = getPlayerDisplayName(user, identity);
      expect(name).toBe('John Doe');
    });
  });

  describe('getPlayerId', () => {
    it('should return user id if user is provided', () => {
      const user = { name: 'John', id: 'user-123' };
      const id = getPlayerId(user);
      expect(id).toBe('user-123');
    });

    it('should return device id if no user provided', () => {
      const identity: DeviceIdentity = {
        deviceId: 'device-456',
        displayName: 'Guest',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
      const id = getPlayerId(undefined, identity);
      expect(id).toBe('device-456');
    });

    it('should return temp id if neither user nor identity provided', () => {
      const id = getPlayerId();
      expect(id).toMatch(/^temp_\d+$/);
    });

    it('should prefer user id over device identity', () => {
      const user = { name: 'John', id: 'user-123' };
      const identity: DeviceIdentity = {
        deviceId: 'device-456',
        displayName: 'Guest',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
      const id = getPlayerId(user, identity);
      expect(id).toBe('user-123');
    });
  });

  describe('saveDeviceIdentity and updateDisplayName', () => {
    it('should save device identity to localStorage', () => {
      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'TestUser',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      saveDeviceIdentity(identity);

      const stored = localStorage.getItem('typingtoy_device_identity');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.deviceId).toBe('device-123');
      expect(parsed.displayName).toBe('TestUser');
    });

    it('should update display name in localStorage', () => {
      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'OldName',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      saveDeviceIdentity(identity);
      updateDisplayName('NewName');

      const stored = localStorage.getItem('typingtoy_device_identity');
      const parsed = JSON.parse(stored!);
      expect(parsed.displayName).toBe('NewName');
      expect(parsed.deviceId).toBe('device-123'); // Unchanged
    });

    it('should update lastUsedAt when updating display name', () => {
      const oldDate = new Date('2020-01-01');
      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'OldName',
        createdAt: oldDate,
        lastUsedAt: oldDate,
      };

      saveDeviceIdentity(identity);

      // Wait a bit to ensure timestamp changes
      const beforeUpdate = Date.now();
      updateDisplayName('NewName');

      const stored = localStorage.getItem('typingtoy_device_identity');
      const parsed = JSON.parse(stored!);
      const lastUsedAt = new Date(parsed.lastUsedAt).getTime();
      expect(lastUsedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should handle errors when updating non-existent identity', () => {
      // When there's no stored identity, updateDisplayName should silently do nothing
      expect(() => updateDisplayName('NewName')).not.toThrow();

      // Verify nothing was stored
      const stored = localStorage.getItem('typingtoy_device_identity');
      expect(stored).toBeNull();
    });
  });

  describe('clearDeviceIdentity', () => {
    it('should remove device identity from localStorage', () => {
      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'TestUser',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      saveDeviceIdentity(identity);
      expect(localStorage.getItem('typingtoy_device_identity')).not.toBeNull();

      clearDeviceIdentity();
      expect(localStorage.getItem('typingtoy_device_identity')).toBeNull();
    });

    it('should not throw if no identity exists', () => {
      expect(() => clearDeviceIdentity()).not.toThrow();
    });
  });

  describe('Guest name generation', () => {
    it('should generate unique names', () => {
      const names = new Set();
      for (let i = 0; i < 10; i++) {
        const name = getPlayerDisplayName();
        names.add(name);
      }
      // At least some names should be unique (very high probability)
      expect(names.size).toBeGreaterThan(1);
    });

    it('should generate names in correct format', () => {
      for (let i = 0; i < 5; i++) {
        const name = getPlayerDisplayName();
        // Should match pattern: AdjectiveNoun + number
        expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
      }
    });

    it('should generate numbers up to 9999', () => {
      // This tests the format, actual implementation uses random
      const name = getPlayerDisplayName();
      const numberPart = name.match(/\d+$/)?.[0];
      expect(numberPart).toBeDefined();
      if (numberPart) {
        const num = parseInt(numberPart, 10);
        expect(num).toBeLessThan(10000);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle user with missing name property', () => {
      const user = { id: 'user-123' } as any;
      const name = getPlayerDisplayName(user);
      // Should generate a guest name since user.name is missing
      expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });

    it('should handle user with missing id property', () => {
      const user = { name: 'John' } as any;
      const id = getPlayerId(user);
      // Should fall back to temp ID
      expect(id).toMatch(/^temp_\d+$/);
    });

    it('should handle device identity with missing fields', () => {
      const identity = { deviceId: 'device-123' } as any;
      const id = getPlayerId(undefined, identity);
      expect(id).toBe('device-123');
    });

    it('should throw when localStorage fails', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const identity: DeviceIdentity = {
        deviceId: 'device-123',
        displayName: 'TestUser',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      // saveDeviceIdentity doesn't have error handling, so it throws
      expect(() => saveDeviceIdentity(identity)).toThrow('Storage error');

      setItemSpy.mockRestore();
    });
  });
});
