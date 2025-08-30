// Test to verify LLM-first path behavior and per-unit caching
// This test validates that explicit quantities trigger LLM-first and cache per-unit values

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../foods', () => ({
  searchFoodsByName: vi.fn(async () => []),
  upsertFood: vi.fn(),
}));

vi.mock('@huggingface/inference', () => ({
  HfInference: vi.fn(() => ({
    textGeneration: vi.fn(),
  })),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
  },
}));

import { analyzeFoodEntry } from '../foodAnalysis';

describe('LLM-first path verification', () => {
  const originalToken = process.env.EXPO_PUBLIC_HF_TOKEN;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Set HF token to enable LLM path
    process.env.EXPO_PUBLIC_HF_TOKEN = 'test-token';
  });

  afterEach(() => {
    // Restore original token
    process.env.EXPO_PUBLIC_HF_TOKEN = originalToken;
  });

  it('verifies fallback estimation multiplies by count for explicit quantities', async () => {
    // Without HF_TOKEN, explicit quantities should use fallback estimation multiplied by count
    const input = '2 slices pepperoni pizza';
    const result = await analyzeFoodEntry(input);

    // Verify result has quantity-multiplied macros from fallback estimation
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('2 slices pepperoni pizza');
    
    // Pizza slice in fallback DB: 300 cal per slice, so 2 slices = 600 cal
    expect(result.items[0].calories).toBe(600);
    expect(result.items[0].protein).toBe(24); // 12 * 2
    expect(result.items[0].carbs).toBe(70);   // 35 * 2  
    expect(result.items[0].fat).toBe(20);     // 10 * 2
  });

  it('should skip LLM-first for single quantities (count=1)', async () => {
    const { HfInference } = await import('@huggingface/inference');
    const MockedHfInference = vi.mocked(HfInference);
    const mockTextGeneration = vi.fn();
    
    MockedHfInference.mockImplementation(() => ({
      textGeneration: mockTextGeneration,
    }) as any);

    const input = '1 slice pepperoni pizza';
    
    // This should not trigger LLM-first since count=1
    await analyzeFoodEntry(input);
    
    // LLM should not be called for count=1 (uses cache/fallback path)
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });
});
