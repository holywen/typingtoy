// Matchmaking service

import { GameType, MatchQueueEntry } from '@/types/multiplayer';
import { MatchQueue } from '@/lib/redis/matchQueue';
import { SkillRatingService, SkillTier } from './skillRating';
import { RoomManager } from './roomManager';

const MATCH_CHECK_INTERVAL = 5000; // 5 seconds
const MATCH_TIMEOUT = 60000; // 60 seconds
const MIN_PLAYERS_PER_MATCH = 2;
const MAX_PLAYERS_PER_MATCH = 4;

export class MatchmakingService {
  private static matchingIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add player to matchmaking queue
   */
  static async addToQueue(params: {
    playerId: string;
    displayName: string;
    gameType: GameType;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculate player's skill rating
      const skillRating = await SkillRatingService.calculateSkillRating(
        params.playerId,
        params.gameType
      );

      const tier = skillRating ? skillRating.tier : 'beginner';

      // Add to queue
      const entry: MatchQueueEntry = {
        playerId: params.playerId,
        displayName: params.displayName,
        gameType: params.gameType,
        skillTier: tier,
        joinedAt: Date.now(),
      };

      await MatchQueue.addToQueue(entry);

      // Start matching process for this game type if not already running
      this.ensureMatchingProcess(params.gameType);

      return { success: true };
    } catch (error) {
      console.error('Error adding to queue:', error);
      return { success: false, error: 'Failed to join matchmaking' };
    }
  }

  /**
   * Remove player from matchmaking queue
   */
  static async removeFromQueue(playerId: string): Promise<void> {
    await MatchQueue.removeFromAllQueues(playerId);
  }

  /**
   * Ensure matching process is running for a game type
   */
  private static ensureMatchingProcess(gameType: GameType): void {
    if (!this.matchingIntervals.has(gameType)) {
      const interval = setInterval(() => {
        this.findMatches(gameType);
      }, MATCH_CHECK_INTERVAL);

      this.matchingIntervals.set(gameType, interval);
    }
  }

  /**
   * Find and create matches for a game type
   */
  static async findMatches(gameType: GameType): Promise<void> {
    try {
      const tiers: SkillTier[] = ['beginner', 'intermediate', 'advanced', 'expert'];

      for (const tier of tiers) {
        await this.findMatchesInTier(gameType, tier);
      }

      // Clean up expired queue entries
      for (const tier of tiers) {
        await MatchQueue.cleanExpired(gameType, tier);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
    }
  }

  /**
   * Find matches within a skill tier
   */
  private static async findMatchesInTier(gameType: GameType, tier: SkillTier): Promise<void> {
    // Get waiting players in this tier
    const players = await MatchQueue.getWaitingPlayers(gameType, tier, 10);

    if (players.length < MIN_PLAYERS_PER_MATCH) {
      // Not enough players, try cross-tier matching for players who waited long
      await this.tryCrossTierMatching(gameType, tier, players);
      return;
    }

    // Group players into matches
    while (players.length >= MIN_PLAYERS_PER_MATCH) {
      const matchSize = Math.min(players.length, MAX_PLAYERS_PER_MATCH);
      const matchedPlayers = players.splice(0, matchSize);

      // Create room for matched players
      await this.createMatchedRoom(gameType, matchedPlayers);
    }
  }

  /**
   * Try to match players across different tiers if they waited long enough
   */
  private static async tryCrossTierMatching(
    gameType: GameType,
    tier: SkillTier,
    waitingPlayers: MatchQueueEntry[]
  ): Promise<void> {
    const now = Date.now();

    for (const player of waitingPlayers) {
      const waitTime = now - player.joinedAt;

      // After 30 seconds, allow cross-tier matching
      if (waitTime > 30000) {
        // Try to find players in adjacent tiers
        const adjacentTiers = this.getAdjacentTiers(tier);

        for (const adjTier of adjacentTiers) {
          const adjPlayers = await MatchQueue.getWaitingPlayers(gameType, adjTier, 5);

          if (adjPlayers.length > 0) {
            // Combine with current player
            const allPlayers = [player, ...adjPlayers.slice(0, MAX_PLAYERS_PER_MATCH - 1)];

            if (allPlayers.length >= MIN_PLAYERS_PER_MATCH) {
              await this.createMatchedRoom(gameType, allPlayers);

              // Remove matched players from queue
              for (const p of allPlayers) {
                await MatchQueue.removeFromQueue(p.playerId, gameType, p.skillTier);
              }

              return;
            }
          }
        }
      }

      // After 60 seconds, notify timeout
      if (waitTime > MATCH_TIMEOUT) {
        // Player will be notified via socket event (handled in socket handlers)
        await MatchQueue.removeFromQueue(player.playerId, gameType, tier);
      }
    }
  }

  /**
   * Get adjacent skill tiers for cross-tier matching
   */
  private static getAdjacentTiers(tier: SkillTier): SkillTier[] {
    const tiers: SkillTier[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const index = tiers.indexOf(tier);

    const adjacent: SkillTier[] = [];
    if (index > 0) adjacent.push(tiers[index - 1]);
    if (index < tiers.length - 1) adjacent.push(tiers[index + 1]);

    return adjacent;
  }

  /**
   * Create a room for matched players
   */
  private static async createMatchedRoom(
    gameType: GameType,
    players: MatchQueueEntry[]
  ): Promise<void> {
    try {
      // Select first player as host
      const host = players[0];

      // Create room with MAX_PLAYERS_PER_MATCH capacity (not players.length)
      // because createRoom already adds the host, so if maxPlayers=2 and we have 2 players,
      // the room would be full after host joins and the second player can't join
      const room = await RoomManager.createRoom({
        gameType,
        roomName: `Quick Match - ${gameType}`,
        maxPlayers: MAX_PLAYERS_PER_MATCH,
        hostId: host.playerId,
        hostName: host.displayName,
        settings: {
          matchmade: true,
        },
      });

      // Add other players to room
      for (let i = 1; i < players.length; i++) {
        const player = players[i];
        await RoomManager.joinRoom({
          roomId: room.roomId,
          playerId: player.playerId,
          playerName: player.displayName,
        });
      }

      // Auto-ready all players
      for (const player of players) {
        await RoomManager.toggleReady(room.roomId, player.playerId, true);
      }

      // Remove players from queue
      for (const player of players) {
        await MatchQueue.removeFromQueue(player.playerId, gameType, player.skillTier);
      }

      // Notify all players about the match
      const { getSocketServer } = await import('./socketServer');
      const { notifyMatchFound } = await import('./socketHandlers/matchHandlers');
      const io = getSocketServer();

      if (io) {
        for (const player of players) {
          await notifyMatchFound(io, player.playerId, room.roomId);
        }
        console.log(`✅ Created matched room ${room.roomId} for ${players.length} players and notified all`);
      } else {
        console.log(`✅ Created matched room ${room.roomId} for ${players.length} players (no socket server to notify)`);
      }
    } catch (error) {
      console.error('Error creating matched room:', error);
    }
  }

  /**
   * Get queue size for a game type
   */
  static async getQueueSize(gameType: GameType): Promise<number> {
    const tiers: SkillTier[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    let total = 0;

    for (const tier of tiers) {
      const size = await MatchQueue.getQueueSize(gameType, tier);
      total += size;
    }

    return total;
  }

  /**
   * Check if player is in queue
   */
  static async isPlayerInQueue(playerId: string, gameType: GameType): Promise<boolean> {
    const tiers: SkillTier[] = ['beginner', 'intermediate', 'advanced', 'expert'];

    for (const tier of tiers) {
      const inQueue = await MatchQueue.isInQueue(playerId, gameType, tier);
      if (inQueue) return true;
    }

    return false;
  }

  /**
   * Stop all matching processes
   */
  static stopAllMatchingProcesses(): void {
    for (const [gameType, interval] of this.matchingIntervals) {
      clearInterval(interval);
      console.log(`🛑 Stopped matching process for ${gameType}`);
    }

    this.matchingIntervals.clear();
  }
}
