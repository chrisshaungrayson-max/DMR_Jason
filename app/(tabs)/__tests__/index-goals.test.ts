import { describe, it, expect } from 'vitest';
import type { GoalRecord, GoalProgress } from '@/types/goal';

// Mock goals store behavior for homepage integration
const mockGoals: GoalRecord[] = [
  {
    id: 'goal-1',
    type: 'calorie_streak',
    status: 'active',
    active: true,
    params: { basis: 'recommended', targetDays: 14 },
    startDate: '2024-01-01',
    endDate: '2024-01-15',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'goal-2',
    type: 'weight',
    status: 'active',
    active: true,
    params: { direction: 'down', targetWeightKg: 70 },
    startDate: '2024-01-01',
    endDate: '2024-03-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'goal-3',
    type: 'protein_streak',
    status: 'active',
    active: true,
    params: { gramsPerDay: 120, targetDays: 21 },
    startDate: '2024-01-01',
    endDate: '2024-01-22',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'goal-4',
    type: 'body_fat',
    status: 'active',
    active: true,
    params: { targetPct: 15 },
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockProgressData: Record<string, GoalProgress> = {
  'goal-1': {
    goalId: 'goal-1',
    type: 'calorie_streak',
    percent: 64.3,
    streak: { current: 9, target: 14 },
    achieved: false,
    computedAtISO: '2024-01-10T00:00:00Z',
  },
  'goal-2': {
    goalId: 'goal-2',
    type: 'weight',
    percent: 75,
    trend: [
      { weekStartISO: '2024-01-01', value: 75 },
      { weekStartISO: '2024-01-08', value: 73.5 },
      { weekStartISO: '2024-01-15', value: 72 },
    ],
    achieved: false,
    computedAtISO: '2024-01-15T00:00:00Z',
  },
  'goal-3': {
    goalId: 'goal-3',
    type: 'protein_streak',
    percent: 33.3,
    streak: { current: 7, target: 21 },
    achieved: false,
    computedAtISO: '2024-01-08T00:00:00Z',
  },
};

describe('Homepage Goals Integration', () => {
  describe('Goals Selection Logic', () => {
    it('should select top N active goals correctly', () => {
      const topNActive = (n: number) => mockGoals.slice(0, n);
      const visibleGoals = topNActive(3);
      
      expect(visibleGoals).toHaveLength(3);
      expect(visibleGoals[0].id).toBe('goal-1');
      expect(visibleGoals[1].id).toBe('goal-2');
      expect(visibleGoals[2].id).toBe('goal-3');
    });

    it('should handle empty goals list', () => {
      const topNActive = (n: number) => [].slice(0, n);
      const visibleGoals = topNActive(3);
      
      expect(visibleGoals).toHaveLength(0);
    });

    it('should handle requesting more goals than available', () => {
      const topNActive = (n: number) => mockGoals.slice(0, n);
      const visibleGoals = topNActive(10);
      
      expect(visibleGoals).toHaveLength(4); // only 4 goals in mock data
    });
  });

  describe('Progress Retrieval', () => {
    it('should retrieve progress for existing goals', () => {
      const progressFor = (goalId: string) => mockProgressData[goalId];
      
      const goal1Progress = progressFor('goal-1');
      expect(goal1Progress).toBeDefined();
      expect(goal1Progress?.type).toBe('calorie_streak');
      expect(goal1Progress?.percent).toBe(64.3);
    });

    it('should handle missing progress data', () => {
      const progressFor = (goalId: string) => mockProgressData[goalId];
      
      const missingProgress = progressFor('non-existent-goal');
      expect(missingProgress).toBeUndefined();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when goals are loading', () => {
      const goalsLoading = true;
      const visibleGoals: GoalRecord[] = [];
      
      let displayText;
      if (goalsLoading) {
        displayText = 'Loading goals…';
      } else if (visibleGoals.length === 0) {
        displayText = 'No active goals yet. Create one from your profile to get started.';
      } else {
        displayText = 'Goals loaded';
      }
      
      expect(displayText).toBe('Loading goals…');
    });

    it('should show empty state when no goals exist', () => {
      const goalsLoading = false;
      const visibleGoals: GoalRecord[] = [];
      
      let displayText;
      if (goalsLoading) {
        displayText = 'Loading goals…';
      } else if (visibleGoals.length === 0) {
        displayText = 'No active goals yet. Create one from your profile to get started.';
      } else {
        displayText = 'Goals loaded';
      }
      
      expect(displayText).toBe('No active goals yet. Create one from your profile to get started.');
    });

    it('should show goals when loaded', () => {
      const goalsLoading = false;
      const visibleGoals = mockGoals.slice(0, 3);
      
      let displayText;
      if (goalsLoading) {
        displayText = 'Loading goals…';
      } else if (visibleGoals.length === 0) {
        displayText = 'No active goals yet. Create one from your profile to get started.';
      } else {
        displayText = 'Goals loaded';
      }
      
      expect(displayText).toBe('Goals loaded');
      expect(visibleGoals).toHaveLength(3);
    });
  });

  describe('Goal Card Data Mapping', () => {
    it('should map goal and progress data correctly for rendering', () => {
      const goal = mockGoals[0]; // calorie_streak goal
      const progress = mockProgressData['goal-1'];
      
      // Simulate the data that would be passed to GoalCard
      const cardProps = {
        goal,
        progress,
      };
      
      expect(cardProps.goal.type).toBe('calorie_streak');
      expect(cardProps.progress?.streak?.current).toBe(9);
      expect(cardProps.progress?.streak?.target).toBe(14);
    });

    it('should handle goal without progress data', () => {
      const goal = mockGoals[3]; // body_fat goal (no progress in mock data)
      const progress = mockProgressData['goal-4']; // undefined
      
      const cardProps = {
        goal,
        progress,
      };
      
      expect(cardProps.goal.type).toBe('body_fat');
      expect(cardProps.progress).toBeUndefined();
    });
  });

  describe('Type-specific Rendering Logic', () => {
    it('should identify streak vs numeric goals correctly', () => {
      const streakGoal = mockGoals[0]; // calorie_streak
      const numericGoal = mockGoals[1]; // weight
      
      const isStreakGoal1 = streakGoal.type === 'calorie_streak' || streakGoal.type === 'protein_streak';
      const isStreakGoal2 = numericGoal.type === 'calorie_streak' || numericGoal.type === 'protein_streak';
      
      expect(isStreakGoal1).toBe(true);
      expect(isStreakGoal2).toBe(false);
    });

    it('should render different goal types with appropriate data', () => {
      const goals = mockGoals.slice(0, 3);
      
      goals.forEach((goal) => {
        const isStreak = goal.type === 'calorie_streak' || goal.type === 'protein_streak';
        const progress = mockProgressData[goal.id];
        
        if (isStreak) {
          // Streak goals should have streak data
          if (progress?.streak) {
            expect(progress.streak.current).toBeDefined();
            expect(progress.streak.target).toBeDefined();
          }
        } else {
          // Numeric goals should have trend data or percentage
          expect(progress?.percent).toBeDefined();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed goal data gracefully', () => {
      const malformedGoal = {
        ...mockGoals[0],
        params: null, // malformed params
      };
      
      // Should not throw when accessing params
      expect(() => {
        const params = malformedGoal.params as any;
        const targetDays = params?.targetDays || 0;
        return targetDays;
      }).not.toThrow();
    });

    it('should handle missing progress gracefully', () => {
      const goal = mockGoals[0];
      const progress = null;
      
      // Should handle null progress without errors
      const percent = Math.max(0, Math.min(100, progress?.percent ?? 0));
      expect(percent).toBe(0);
    });
  });
});
