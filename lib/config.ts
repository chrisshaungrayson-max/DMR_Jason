// Application configuration for fitness goals feature
// Centralized settings that can be adjusted without code changes

// Public keys and third-party configuration
// Clerk authentication removed

export const GOALS_CONFIG = {
  // Number of top goals to display on Dashboard/Homepage
  TOP_N_GOALS: parseInt(process.env.EXPO_PUBLIC_TOP_N_GOALS || '3', 10),
  
  // Feature flags
  ENABLE_PROTEIN_GOALS: process.env.EXPO_PUBLIC_ENABLE_PROTEIN_GOALS !== 'false',
  ENABLE_BODY_COMPOSITION_GOALS: process.env.EXPO_PUBLIC_ENABLE_BODY_COMPOSITION_GOALS !== 'false',
  ENABLE_STREAK_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_STREAK_ANALYTICS !== 'false',
  
  // Streak configuration
  STREAK_STRICT_MODE: process.env.EXPO_PUBLIC_STREAK_STRICT_MODE !== 'false',
  DEFAULT_STREAK_DAYS: parseInt(process.env.EXPO_PUBLIC_DEFAULT_STREAK_DAYS || '14', 10),
  
  // Analytics configuration
  TREND_CHART_WEEKS: parseInt(process.env.EXPO_PUBLIC_TREND_CHART_WEEKS || '8', 10),
  HEATMAP_DAYS: parseInt(process.env.EXPO_PUBLIC_HEATMAP_DAYS || '28', 10),
  
  // Goal limits
  MAX_ACTIVE_GOALS_PER_USER: parseInt(process.env.EXPO_PUBLIC_MAX_ACTIVE_GOALS || '10', 10),
  MAX_GOAL_DURATION_DAYS: parseInt(process.env.EXPO_PUBLIC_MAX_GOAL_DURATION_DAYS || '365', 10),
} as const;

// Type-safe config access
export type GoalsConfig = typeof GOALS_CONFIG;

// Validation function to ensure config values are reasonable
export function validateGoalsConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (GOALS_CONFIG.TOP_N_GOALS < 1 || GOALS_CONFIG.TOP_N_GOALS > 10) {
    errors.push('TOP_N_GOALS must be between 1 and 10');
  }
  
  if (GOALS_CONFIG.DEFAULT_STREAK_DAYS < 1 || GOALS_CONFIG.DEFAULT_STREAK_DAYS > 365) {
    errors.push('DEFAULT_STREAK_DAYS must be between 1 and 365');
  }
  
  if (GOALS_CONFIG.TREND_CHART_WEEKS < 1 || GOALS_CONFIG.TREND_CHART_WEEKS > 52) {
    errors.push('TREND_CHART_WEEKS must be between 1 and 52');
  }
  
  if (GOALS_CONFIG.HEATMAP_DAYS < 7 || GOALS_CONFIG.HEATMAP_DAYS > 365) {
    errors.push('HEATMAP_DAYS must be between 7 and 365');
  }
  
  if (GOALS_CONFIG.MAX_ACTIVE_GOALS_PER_USER < 1 || GOALS_CONFIG.MAX_ACTIVE_GOALS_PER_USER > 50) {
    errors.push('MAX_ACTIVE_GOALS_PER_USER must be between 1 and 50');
  }
  
  if (GOALS_CONFIG.MAX_GOAL_DURATION_DAYS < 1 || GOALS_CONFIG.MAX_GOAL_DURATION_DAYS > 1095) {
    errors.push('MAX_GOAL_DURATION_DAYS must be between 1 and 1095 (3 years)');
  }
  
  return { valid: errors.length === 0, errors };
}
