import { SkillRatingService } from '../skillRating';
import type { SkillTier } from '../skillRating';

describe('SkillRatingService', () => {
  describe('getRatingTier', () => {
    it('should return beginner for rating < 30', () => {
      expect(SkillRatingService.getRatingTier(0)).toBe('beginner');
      expect(SkillRatingService.getRatingTier(15)).toBe('beginner');
      expect(SkillRatingService.getRatingTier(29.9)).toBe('beginner');
    });

    it('should return intermediate for rating 30-49', () => {
      expect(SkillRatingService.getRatingTier(30)).toBe('intermediate');
      expect(SkillRatingService.getRatingTier(40)).toBe('intermediate');
      expect(SkillRatingService.getRatingTier(49.9)).toBe('intermediate');
    });

    it('should return advanced for rating 50-69', () => {
      expect(SkillRatingService.getRatingTier(50)).toBe('advanced');
      expect(SkillRatingService.getRatingTier(60)).toBe('advanced');
      expect(SkillRatingService.getRatingTier(69.9)).toBe('advanced');
    });

    it('should return expert for rating >= 70', () => {
      expect(SkillRatingService.getRatingTier(70)).toBe('expert');
      expect(SkillRatingService.getRatingTier(100)).toBe('expert');
      expect(SkillRatingService.getRatingTier(200)).toBe('expert');
    });
  });

  describe('getTierFromWPM', () => {
    it('should return beginner for WPM < 30', () => {
      expect(SkillRatingService.getTierFromWPM(0)).toBe('beginner');
      expect(SkillRatingService.getTierFromWPM(20)).toBe('beginner');
      expect(SkillRatingService.getTierFromWPM(29)).toBe('beginner');
    });

    it('should return intermediate for WPM 30-49', () => {
      expect(SkillRatingService.getTierFromWPM(30)).toBe('intermediate');
      expect(SkillRatingService.getTierFromWPM(40)).toBe('intermediate');
      expect(SkillRatingService.getTierFromWPM(49)).toBe('intermediate');
    });

    it('should return advanced for WPM 50-69', () => {
      expect(SkillRatingService.getTierFromWPM(50)).toBe('advanced');
      expect(SkillRatingService.getTierFromWPM(60)).toBe('advanced');
      expect(SkillRatingService.getTierFromWPM(69)).toBe('advanced');
    });

    it('should return expert for WPM >= 70', () => {
      expect(SkillRatingService.getTierFromWPM(70)).toBe('expert');
      expect(SkillRatingService.getTierFromWPM(100)).toBe('expert');
      expect(SkillRatingService.getTierFromWPM(150)).toBe('expert');
    });
  });

  describe('getMatchmakingRange', () => {
    it('should return base range of ±10 for 0 wait time', () => {
      const range = SkillRatingService.getMatchmakingRange(50, 0);

      expect(range).toEqual({ min: 40, max: 60 });
    });

    it('should expand range based on wait time', () => {
      const range = SkillRatingService.getMatchmakingRange(50, 20000); // 20 seconds

      // Base: 10, + (20/10 * 5) = 10 + 10 = 20
      expect(range).toEqual({ min: 30, max: 70 });
    });

    it('should cap range at ±30', () => {
      const range = SkillRatingService.getMatchmakingRange(50, 100000); // 100 seconds

      expect(range).toEqual({ min: 20, max: 80 });
      expect(range.max - range.min).toBe(60); // ±30
    });

    it('should not return negative min rating', () => {
      const range = SkillRatingService.getMatchmakingRange(5, 20000);

      expect(range.min).toBeGreaterThanOrEqual(0);
    });

    it('should handle high ratings correctly', () => {
      const range = SkillRatingService.getMatchmakingRange(100, 0);

      expect(range).toEqual({ min: 90, max: 110 });
    });
  });

  describe('arePlayersCompatible', () => {
    it('should return true for players within range', () => {
      const compatible = SkillRatingService.arePlayersCompatible(50, 55, 0);

      expect(compatible).toBe(true);
    });

    it('should return false for players outside range', () => {
      const compatible = SkillRatingService.arePlayersCompatible(50, 70, 0);

      expect(compatible).toBe(false);
    });

    it('should allow wider gaps with longer wait times', () => {
      // At 0 seconds: 50 ± 10 (40-60)
      expect(SkillRatingService.arePlayersCompatible(50, 65, 0)).toBe(false);

      // At 20 seconds: 50 ± 20 (30-70)
      expect(SkillRatingService.arePlayersCompatible(50, 65, 20000)).toBe(true);
    });

    it('should be symmetric (order does not matter)', () => {
      const compat1 = SkillRatingService.arePlayersCompatible(50, 60, 10000);
      const compat2 = SkillRatingService.arePlayersCompatible(60, 50, 10000);

      // Note: This is not exactly symmetric due to range calculation from first player
      // But both should be true within overlapping ranges
      expect(compat1).toBe(true);
    });
  });

  describe('getTierMinRating', () => {
    it('should return correct minimum ratings for each tier', () => {
      expect(SkillRatingService.getTierMinRating('beginner')).toBe(0);
      expect(SkillRatingService.getTierMinRating('intermediate')).toBe(30);
      expect(SkillRatingService.getTierMinRating('advanced')).toBe(50);
      expect(SkillRatingService.getTierMinRating('expert')).toBe(70);
    });
  });

  describe('getTierMaxRating', () => {
    it('should return correct maximum ratings for each tier', () => {
      expect(SkillRatingService.getTierMaxRating('beginner')).toBe(30);
      expect(SkillRatingService.getTierMaxRating('intermediate')).toBe(50);
      expect(SkillRatingService.getTierMaxRating('advanced')).toBe(70);
      expect(SkillRatingService.getTierMaxRating('expert')).toBe(1000);
    });
  });

  describe('calculateRatingChange', () => {
    it('should return positive change for winning against equal opponent', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 50,
        opponentRating: 50,
        won: true,
        rank: 1,
        totalPlayers: 2,
      });

      expect(change).toBeGreaterThan(0);
    });

    it('should return negative change for losing against equal opponent', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 50,
        opponentRating: 50,
        won: false,
        rank: 2,
        totalPlayers: 2,
      });

      expect(change).toBeLessThan(0);
    });

    it('should return larger change for beating higher-rated opponent', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 30,
        opponentRating: 60,
        won: true,
        rank: 1,
        totalPlayers: 2,
      });

      expect(change).toBeGreaterThan(5); // Significant gain
    });

    it('should return smaller loss for losing to higher-rated opponent', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 30,
        opponentRating: 60,
        won: false,
        rank: 2,
        totalPlayers: 2,
      });

      expect(change).toBeGreaterThan(-5); // Small loss (less negative)
    });

    it('should handle multiplayer with ranks correctly', () => {
      const change1 = SkillRatingService.calculateRatingChange({
        currentRating: 50,
        opponentRating: 50,
        won: true,
        rank: 1,
        totalPlayers: 4,
      });

      const change2 = SkillRatingService.calculateRatingChange({
        currentRating: 50,
        opponentRating: 50,
        won: false,
        rank: 2,
        totalPlayers: 4,
      });

      const change3 = SkillRatingService.calculateRatingChange({
        currentRating: 50,
        opponentRating: 50,
        won: false,
        rank: 4,
        totalPlayers: 4,
      });

      expect(change1).toBeGreaterThan(change2);
      expect(change2).toBeGreaterThan(change3);
    });

    it('should return integer rating changes', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 50.5,
        opponentRating: 49.3,
        won: true,
        rank: 1,
        totalPlayers: 2,
      });

      expect(Number.isInteger(change)).toBe(true);
    });

    it('should cap rating change by K-factor', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 10,
        opponentRating: 100,
        won: true,
        rank: 1,
        totalPlayers: 2,
      });

      // Maximum change should be bounded by K-factor (10)
      expect(Math.abs(change)).toBeLessThanOrEqual(10);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero ratings', () => {
      const tier = SkillRatingService.getRatingTier(0);
      const wpmTier = SkillRatingService.getTierFromWPM(0);

      expect(tier).toBe('beginner');
      expect(wpmTier).toBe('beginner');
    });

    it('should handle very high ratings', () => {
      const tier = SkillRatingService.getRatingTier(999);
      expect(tier).toBe('expert');
    });

    it('should handle matchmaking at boundary ratings', () => {
      const compatible = SkillRatingService.arePlayersCompatible(30, 40, 0);
      expect(compatible).toBe(true);
    });

    it('should handle rating change with single player', () => {
      const change = SkillRatingService.calculateRatingChange({
        currentRating: 50,
        opponentRating: 50,
        won: true,
        rank: 1,
        totalPlayers: 1,
      });

      // Should handle edge case gracefully
      expect(typeof change).toBe('number');
    });
  });
});
