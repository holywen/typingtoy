// Device fingerprint service for guest player identification

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { DeviceIdentity } from '@/types/multiplayer';

const STORAGE_KEY = 'typingtoy_device_identity';
const DEFAULT_GUEST_PREFIX = 'Guest';
const TEST_MODE_KEY = 'typingtoy_test_mode';
const SESSION_ID_KEY = 'typingtoy_session_id';

// Initialize FingerprintJS
let fpPromise: Promise<any> | null = null;

function getFpPromise() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

// Check if test mode is enabled
export function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for test mode flag in localStorage or URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlTestMode = urlParams.get('testMode') === 'true';
  const storageTestMode = localStorage.getItem(TEST_MODE_KEY) === 'true';

  return urlTestMode || storageTestMode;
}

// Enable/disable test mode
export function setTestMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem(TEST_MODE_KEY, 'true');
      console.log('🧪 Test mode enabled - using session ID instead of device fingerprint');
    } else {
      localStorage.removeItem(TEST_MODE_KEY);
      console.log('✅ Test mode disabled - using device fingerprint');
    }
  }
}

// Generate session ID for test mode
function generateSessionId(): string {
  if (typeof window === 'undefined') {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // Check if we already have a session ID for this browser session
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    // Generate new unique session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    console.log('🆔 Generated new session ID:', sessionId);
  }

  return sessionId;
}

// Generate device ID using FingerprintJS or session ID (test mode)
export async function generateDeviceId(): Promise<string> {
  // In test mode, use session ID instead of fingerprint
  if (isTestMode()) {
    const sessionId = generateSessionId();
    console.log('🧪 Test mode: Using session ID:', sessionId);
    return sessionId;
  }

  // Normal mode: use device fingerprint
  try {
    const fp = await getFpPromise();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error generating device ID:', error);
    // Fallback to random ID
    return `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Get or create device identity
export async function getDeviceIdentity(): Promise<DeviceIdentity> {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const identity = JSON.parse(stored) as DeviceIdentity;
        // Update last used time
        identity.lastUsedAt = new Date();
        saveDeviceIdentity(identity);
        return identity;
      } catch (error) {
        console.error('Error parsing stored identity:', error);
      }
    }
  }

  // Generate new identity
  const deviceId = await generateDeviceId();
  const identity: DeviceIdentity = {
    deviceId,
    displayName: generateGuestName(),
    createdAt: new Date(),
    lastUsedAt: new Date(),
  };

  saveDeviceIdentity(identity);
  return identity;
}

// Save device identity to localStorage
export function saveDeviceIdentity(identity: DeviceIdentity): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  }
}

// Update display name
export function updateDisplayName(newName: string): void {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const identity = JSON.parse(stored) as DeviceIdentity;
        identity.displayName = newName;
        identity.lastUsedAt = new Date();
        saveDeviceIdentity(identity);
      } catch (error) {
        console.error('Error updating display name:', error);
      }
    }
  }
}

// Generate random guest name
function generateGuestName(): string {
  const adjectives = [
    'Swift', 'Quick', 'Fast', 'Rapid', 'Speedy', 'Lightning',
    'Turbo', 'Flash', 'Sonic', 'Rocket', 'Blazing', 'Flying',
  ];

  const nouns = [
    'Typer', 'Fingers', 'Keys', 'Writer', 'Ninja', 'Master',
    'Pro', 'Champion', 'Ace', 'Star', 'Hero', 'Legend',
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9999);

  return `${adjective}${noun}${number}`;
}

// Clear device identity (logout)
export function clearDeviceIdentity(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Check if user is guest
export function isGuest(userId?: string): boolean {
  return !userId || userId.startsWith('device_');
}

// Get player display name (for both guests and logged-in users)
export function getPlayerDisplayName(user?: any, deviceIdentity?: DeviceIdentity): string {
  if (user && user.name) {
    return user.name;
  }

  if (deviceIdentity) {
    return deviceIdentity.displayName;
  }

  return generateGuestName();
}

// Get player ID (userId for logged-in, deviceId for guests)
export function getPlayerId(user?: any, deviceIdentity?: DeviceIdentity): string {
  if (user && user.id) {
    return user.id;
  }

  if (deviceIdentity) {
    return deviceIdentity.deviceId;
  }

  // This should not happen, but provide a fallback
  return `temp_${Date.now()}`;
}
