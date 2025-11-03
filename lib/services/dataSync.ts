/**
 * Service to sync user data between localStorage and MongoDB
 */

import { getUserSettings } from './userSettings';
import { getProgressHistory, getLastPosition, type ProgressRecord, type LastPosition } from './progressStorage';

export interface UserData {
  settings: {
    keyboardLayout: string;
    soundEnabled: boolean;
  };
  progressHistory: ProgressRecord[];
  lastPositions: Record<string, LastPosition>;
}

/**
 * Get all user data from localStorage
 */
export function getAllLocalData(): UserData {
  const settings = getUserSettings();
  const progressHistory = getProgressHistory();

  // Get all last positions for all layouts
  const lastPositions: Record<string, LastPosition> = {};
  const layouts = ['qwerty', 'dvorak', 'colemak', 'workman', 'azerty', 'qwertz', 'qwerty-uk', 'programmer', 'spanish', 'latin'];

  layouts.forEach(layout => {
    const position = getLastPosition(layout);
    if (position) {
      lastPositions[layout] = position;
    }
  });

  return {
    settings,
    progressHistory,
    lastPositions,
  };
}

/**
 * Sync local data to the server
 */
export async function syncToServer(userId: string): Promise<boolean> {
  try {
    const localData = getAllLocalData();

    const response = await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        data: localData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync data to server');
    }

    return true;
  } catch (error) {
    console.error('Error syncing to server:', error);
    return false;
  }
}

/**
 * Load data from server and merge with local data
 */
export async function syncFromServer(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/sync?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to load data from server');
    }

    const serverData = await response.json();

    // Merge server data with local data
    // Server data takes precedence for settings
    if (serverData.settings) {
      localStorage.setItem('typing_user_settings', JSON.stringify(serverData.settings));
    }

    // Merge progress history (keep both, deduplicate by id)
    if (serverData.progressHistory && Array.isArray(serverData.progressHistory)) {
      const localHistory = getProgressHistory();
      const mergedHistory = [...serverData.progressHistory];

      localHistory.forEach(localRecord => {
        if (!mergedHistory.find(r => r.id === localRecord.id)) {
          mergedHistory.push(localRecord);
        }
      });

      // Sort by completedAt descending
      mergedHistory.sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      localStorage.setItem('typing_progress_history', JSON.stringify(mergedHistory.slice(0, 100)));
    }

    // Merge last positions (server takes precedence if newer)
    if (serverData.lastPositions) {
      Object.entries(serverData.lastPositions).forEach(([layout, position]: [string, any]) => {
        const localPosition = getLastPosition(layout);

        if (!localPosition || new Date(position.timestamp) > new Date(localPosition.timestamp)) {
          localStorage.setItem(
            `typing_last_position_${layout}`,
            JSON.stringify(position)
          );
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Error syncing from server:', error);
    return false;
  }
}

/**
 * Auto-sync on user actions (debounced)
 */
let syncTimeout: NodeJS.Timeout | null = null;

export function scheduleSyncToServer(userId: string) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncToServer(userId);
  }, 2000); // Sync after 2 seconds of inactivity
}
