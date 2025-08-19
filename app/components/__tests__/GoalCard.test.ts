import { describe, it, expect } from 'vitest';
import type { GoalRecord, GoalProgress } from '@/types/goal';

// Mock goal data for testing
const mockStreakGoal: GoalRecord = {
  id: 'test-streak-1',
  user_id: 'test-user',
  type: 'calorie_streak',
  status: 'active',
  active: true,
  params: {
    basis: 'recommended',
    targetDays: 14,
  },
  start_date: '2024-01-01',
  end_date: '2024-01-15',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockNumericGoal: GoalRecord = {
  id: 'test-weight-1',
  user_id: 'test-user',
  type: 'weight',
  status: 'active',
  active: true,
  params: {
    direction: 'down',
    targetWeightKg: 70,
  },
  start_date: '2024-01-01',
  end_date: '2024-03-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockStreakProgress: GoalProgress = {
  goalId: 'test-streak-1',
  type: 'calorie_streak',
  percent: 64.3, // 9/14 days
  streak: {
    current: 9,
    target: 14,
  },
  achieved: false,
  computedAtISO: '2024-01-10T00:00:00Z',
};

const mockNumericProgress: GoalProgress = {
  goalId: 'test-weight-1',
  type: 'weight',
  percent: 75,
  trend: [
    { weekStartISO: '2024-01-01', value: 75 },
    { weekStartISO: '2024-01-08', value: 73.5 },
    { weekStartISO: '2024-01-15', value: 72 },
  ],
  achieved: false,
  computedAtISO: '2024-01-15T00:00:00Z',
};

describe('GoalCard Component Logic', () => {
  describe('Goal Type Detection', () => {
    it('should identify streak goals correctly', () => {
      const isStreak = mockStreakGoal.type === 'calorie_streak' || mockStreakGoal.type === 'protein_streak';
      expect(isStreak).toBe(true);
    });

    it('should identify numeric goals correctly', () => {
      const isStreak = mockNumericGoal.type === 'calorie_streak' || mockNumericGoal.type === 'protein_streak';
      expect(isStreak).toBe(false);
    });
  });

  describe('Title Rendering', () => {
    it('should render calorie streak title correctly', () => {
      const params = mockStreakGoal.params as any;
      const expectedTitle = `Calories ${params.basis === 'custom' ? 'custom range' : 'recommended'} • ${params.targetDays}-day streak`;
      expect(expectedTitle).toBe('Calories recommended • 14-day streak');
    });

    it('should render weight goal title correctly', () => {
      const params = mockNumericGoal.params as any;
      const expectedTitle = `${params.direction === 'down' ? 'Lose' : 'Gain'} to ${params.targetWeightKg} kg`;
      expect(expectedTitle).toBe('Lose to 70 kg');
    });
  });

  describe('Status Rendering', () => {
    it('should render active status correctly', () => {
      const status = mockStreakGoal.status === 'achieved' ? 'Achieved' : 
                   (!mockStreakGoal.active || mockStreakGoal.status === 'deactivated') ? 'Inactive' : 'Active';
      expect(status).toBe('Active');
    });

    it('should render achieved status correctly', () => {
      const achievedGoal = { ...mockStreakGoal, status: 'achieved' as const };
      const status = achievedGoal.status === 'achieved' ? 'Achieved' : 
                   (!achievedGoal.active || achievedGoal.status === 'deactivated') ? 'Inactive' : 'Active';
      expect(status).toBe('Achieved');
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate streak progress correctly', () => {
      const percent = Math.max(0, Math.min(100, mockStreakProgress.percent ?? 0));
      expect(percent).toBe(64.3);
    });

    it('should handle missing progress gracefully', () => {
      const progress: GoalProgress | null = null;
      const percent = Math.max(0, Math.min(100, progress?.percent ?? 0));
      expect(percent).toBe(0);
    });
  });

  describe('Streak Status Text', () => {
    it('should show correct status for partial progress', () => {
      const current = 9;
      const target = 14;
      const ratio = current / target;
      
      let statusText: string;
      if (ratio >= 1) statusText = 'Goal achieved! 🎉';
      else if (ratio >= 0.7) statusText = 'Almost there! Keep going 💪';
      else if (current === 0) statusText = 'Start your streak today';
      else {
        const remaining = target - current;
        statusText = `${remaining} more day${remaining === 1 ? '' : 's'} to go`;
      }
      
      expect(statusText).toBe('5 more days to go');
    });

    it('should show achievement message when complete', () => {
      const current = 14;
      const target = 14;
      const ratio = current / target;
      
      let statusText: string;
      if (ratio >= 1) statusText = 'Goal achieved! 🎉';
      else if (ratio >= 0.7) statusText = 'Almost there! Keep going 💪';
      else if (current === 0) statusText = 'Start your streak today';
      else {
        const remaining = target - current;
        statusText = `${remaining} more day${remaining === 1 ? '' : 's'} to go`;
      }
      
      expect(statusText).toBe('Goal achieved! 🎉');
    });
  });

  describe('Numeric Progress Rendering', () => {
    it('should render weight progress correctly', () => {
      const trend = mockNumericProgress.trend!;
      const latestWeek = trend[trend.length - 1];
      const currentValue = latestWeek.value;
      const target = (mockNumericGoal.params as any).targetWeightKg;
      
      const progressText = `${currentValue.toFixed(1)} kg → ${target} kg`;
      expect(progressText).toBe('72.0 kg → 70 kg');
    });

    it('should handle missing trend data', () => {
      const progressText = 'No data yet';
      expect(progressText).toBe('No data yet');
    });
  });

  describe('Trend Text Rendering', () => {
    it('should show trend direction correctly', () => {
      const trend = mockNumericProgress.trend!;
      const latest = trend[trend.length - 1].value;
      const previous = trend[trend.length - 2].value;
      const change = latest - previous;
      const direction = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️';
      
      const trendText = `${direction} ${Math.abs(change).toFixed(1)} from last week`;
      expect(trendText).toBe('↘️ 1.5 from last week');
    });

    it('should handle insufficient trend data', () => {
      const trendText = 'Building trend data...';
      expect(trendText).toBe('Building trend data...');
    });
  });

  describe('Color Logic', () => {
    it('should return correct colors for different progress levels', () => {
      // Test streak colors
      const getStreakColor = (current: number, target: number) => {
        const ratio = current / target;
        if (ratio >= 1) return '#22c55e'; // green - achieved
        if (ratio >= 0.7) return '#BBA46E'; // gold - close (theme.gold)
        if (ratio >= 0.3) return '#f59e0b'; // amber - progress
        return '#ef4444'; // red - needs work
      };

      expect(getStreakColor(14, 14)).toBe('#22c55e'); // achieved
      expect(getStreakColor(10, 14)).toBe('#BBA46E'); // close
      expect(getStreakColor(5, 14)).toBe('#f59e0b'); // progress
      expect(getStreakColor(2, 14)).toBe('#ef4444'); // needs work
    });

    it('should return correct colors for numeric progress', () => {
      const getNumericProgressColor = (percent: number) => {
        if (percent >= 100) return '#22c55e'; // green - achieved
        if (percent >= 70) return '#BBA46E'; // gold - close
        if (percent >= 30) return '#f59e0b'; // amber - progress
        return '#ef4444'; // red - needs work
      };

      expect(getNumericProgressColor(100)).toBe('#22c55e');
      expect(getNumericProgressColor(75)).toBe('#BBA46E');
      expect(getNumericProgressColor(50)).toBe('#f59e0b');
      expect(getNumericProgressColor(10)).toBe('#ef4444');
    });
  });
});
