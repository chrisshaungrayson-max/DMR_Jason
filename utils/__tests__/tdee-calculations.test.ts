import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
  poundsToKg,
  kgToPounds,
  feetInchesToCm,
  cmToFeetInches,
  parseHeight,
  parseWeight
} from '../tdee-calculations';
import { FitnessGoal } from '@/types/tdee';

describe('BMR Calculations', () => {
  test('calculates BMR for males using Harris-Benedict equation', () => {
    // Test case: 30-year-old male, 80kg, 180cm
    const bmr = calculateBMR('male', 30, 80, 180);
    const expected = 88.362 + (13.397 * 80) + (4.799 * 180) - (5.677 * 30);
    expect(bmr).toBeCloseTo(expected, 2);
    expect(bmr).toBeCloseTo(1853.632, 1);
  });

  test('calculates BMR for females using Harris-Benedict equation', () => {
    // Test case: 25-year-old female, 65kg, 165cm
    const bmr = calculateBMR('female', 25, 65, 165);
    const expected = 447.593 + (9.247 * 65) + (3.098 * 165) - (4.330 * 25);
    expect(bmr).toBeCloseTo(expected, 2);
    expect(bmr).toBeCloseTo(1451.568, 1);
  });

  test('calculates BMR for other gender as average of male/female', () => {
    const age = 28;
    const weight = 70;
    const height = 175;
    
    const maleBMR = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    const femaleBMR = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    const expectedAverage = (maleBMR + femaleBMR) / 2;
    
    const bmr = calculateBMR('other', age, weight, height);
    expect(bmr).toBeCloseTo(expectedAverage, 2);
  });

  test('handles edge cases for BMR calculation', () => {
    // Very young person
    expect(calculateBMR('male', 18, 70, 175)).toBeGreaterThan(0);
    
    // Older person
    expect(calculateBMR('female', 80, 60, 160)).toBeGreaterThan(0);
    
    // Very light weight
    expect(calculateBMR('male', 30, 50, 170)).toBeGreaterThan(0);
    
    // Very heavy weight
    expect(calculateBMR('female', 30, 120, 170)).toBeGreaterThan(0);
  });
});

describe('TDEE Calculations', () => {
  const baseBMR = 1500;

  test('calculates TDEE with sedentary activity level', () => {
    const tdee = calculateTDEE(baseBMR, 'sedentary');
    expect(tdee).toBe(Math.round(baseBMR * 1.2));
    expect(tdee).toBe(1800);
  });

  test('calculates TDEE with light activity level', () => {
    const tdee = calculateTDEE(baseBMR, 'light');
    expect(tdee).toBe(Math.round(baseBMR * 1.375));
    expect(tdee).toBe(2063);
  });

  test('calculates TDEE with moderate activity level', () => {
    const tdee = calculateTDEE(baseBMR, 'moderate');
    expect(tdee).toBe(Math.round(baseBMR * 1.55));
    expect(tdee).toBe(2325);
  });

  test('calculates TDEE with heavy activity level', () => {
    const tdee = calculateTDEE(baseBMR, 'heavy');
    expect(tdee).toBe(Math.round(baseBMR * 1.725));
    expect(tdee).toBe(2588);
  });

  test('calculates TDEE with athlete activity level', () => {
    const tdee = calculateTDEE(baseBMR, 'athlete');
    expect(tdee).toBe(Math.round(baseBMR * 1.9));
    expect(tdee).toBe(2850);
  });

  test('throws error for invalid activity level', () => {
    expect(() => {
      calculateTDEE(baseBMR, 'invalid' as any);
    }).toThrow('Invalid activity level: invalid');
  });
});

describe('Target Calories Calculations', () => {
  const baseTDEE = 2000;

  test('returns TDEE when no goals selected', () => {
    const targetCalories = calculateTargetCalories(baseTDEE, []);
    expect(targetCalories).toBe(baseTDEE);
  });

  test('calculates target calories for single weight loss goal', () => {
    const targetCalories = calculateTargetCalories(baseTDEE, ['lose_weight']);
    expect(targetCalories).toBe(baseTDEE - 500);
    expect(targetCalories).toBe(1500);
  });

  test('calculates target calories for single muscle gain goal', () => {
    const targetCalories = calculateTargetCalories(baseTDEE, ['gain_lean_muscle']);
    expect(targetCalories).toBe(baseTDEE + 400);
    expect(targetCalories).toBe(2400);
  });

  test('calculates target calories for maintenance goal', () => {
    const targetCalories = calculateTargetCalories(baseTDEE, ['maintain_weight']);
    expect(targetCalories).toBe(baseTDEE);
  });

  test('calculates average adjustment for multiple goals', () => {
    const goals: FitnessGoal[] = ['lose_weight', 'gain_lean_muscle']; // -500 + 400 = -100 / 2 = -50
    const targetCalories = calculateTargetCalories(baseTDEE, goals);
    expect(targetCalories).toBe(baseTDEE - 50);
    expect(targetCalories).toBe(1950);
  });

  test('handles multiple goals with same adjustment', () => {
    const goals: FitnessGoal[] = ['maintain_weight', 'general_health']; // 0 + 0 = 0
    const targetCalories = calculateTargetCalories(baseTDEE, goals);
    expect(targetCalories).toBe(baseTDEE);
  });

  test('throws error for invalid goal', () => {
    expect(() => {
      calculateTargetCalories(baseTDEE, ['invalid_goal' as FitnessGoal]);
    }).toThrow('Invalid fitness goal: invalid_goal');
  });
});

describe('Macro Targets Calculations', () => {
  const targetCalories = 2000;

  test('calculates macros for weight loss goal', () => {
    const macros = calculateMacroTargets(targetCalories, ['lose_weight']);
    
    // Weight loss: 40% protein, 30% carbs, 30% fat
    expect(macros.protein.percentage).toBe(40);
    expect(macros.carbs.percentage).toBe(30);
    expect(macros.fat.percentage).toBe(30);
    
    // Protein: 2000 * 0.4 / 4 = 200g
    expect(macros.protein.grams).toBe(200);
    // Carbs: 2000 * 0.3 / 4 = 150g
    expect(macros.carbs.grams).toBe(150);
    // Fat: 2000 * 0.3 / 9 = 67g (rounded)
    expect(macros.fat.grams).toBe(67);
  });

  test('calculates macros for muscle gain goal', () => {
    const macros = calculateMacroTargets(targetCalories, ['gain_lean_muscle']);
    
    // Muscle gain: 30% protein, 40% carbs, 30% fat
    expect(macros.protein.percentage).toBe(30);
    expect(macros.carbs.percentage).toBe(40);
    expect(macros.fat.percentage).toBe(30);
    
    expect(macros.protein.grams).toBe(150); // 2000 * 0.3 / 4
    expect(macros.carbs.grams).toBe(200);   // 2000 * 0.4 / 4
    expect(macros.fat.grams).toBe(67);      // 2000 * 0.3 / 9
  });

  test('calculates default macros for no goals', () => {
    const macros = calculateMacroTargets(targetCalories, []);
    
    // Default: 25% protein, 45% carbs, 30% fat
    expect(macros.protein.percentage).toBe(25);
    expect(macros.carbs.percentage).toBe(45);
    expect(macros.fat.percentage).toBe(30);
  });

  test('calculates averaged macros for multiple goals', () => {
    const goals: FitnessGoal[] = ['lose_weight', 'gain_lean_muscle'];
    // Weight loss: 40% protein, 30% carbs, 30% fat
    // Muscle gain: 30% protein, 40% carbs, 30% fat
    // Average: 35% protein, 35% carbs, 30% fat
    
    const macros = calculateMacroTargets(targetCalories, goals);
    
    expect(macros.protein.percentage).toBe(35);
    expect(macros.carbs.percentage).toBe(35);
    expect(macros.fat.percentage).toBe(30);
  });

  test('handles rounding correctly', () => {
    const macros = calculateMacroTargets(2100, ['maintain_weight']);
    
    // All values should be rounded to nearest integer
    expect(Number.isInteger(macros.protein.grams)).toBe(true);
    expect(Number.isInteger(macros.carbs.grams)).toBe(true);
    expect(Number.isInteger(macros.fat.grams)).toBe(true);
  });
});

describe('Unit Conversion Functions', () => {
  test('converts pounds to kilograms', () => {
    expect(poundsToKg(150)).toBeCloseTo(68.04, 2);
    expect(poundsToKg(200)).toBeCloseTo(90.72, 2);
    expect(poundsToKg(0)).toBe(0);
  });

  test('converts kilograms to pounds', () => {
    expect(kgToPounds(70)).toBeCloseTo(154.32, 2);
    expect(kgToPounds(80)).toBeCloseTo(176.37, 2);
    expect(kgToPounds(0)).toBe(0);
  });

  test('converts feet and inches to centimeters', () => {
    expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 1);
    expect(feetInchesToCm(5, 6)).toBeCloseTo(167.64, 1);
  });

  test('converts centimeters to feet and inches', () => {
    const result1 = cmToFeetInches(180);
    expect(result1.feet).toBe(5);
    expect(result1.inches).toBe(11);

    const result2 = cmToFeetInches(165);
    expect(result2.feet).toBe(5);
    expect(result2.inches).toBe(5);
  });

  test('round trip conversions are consistent', () => {
    // Pounds <-> Kg
    const originalPounds = 150;
    const convertedBack = kgToPounds(poundsToKg(originalPounds));
    expect(convertedBack).toBeCloseTo(originalPounds, 1);

    // Feet/Inches <-> Cm
    const originalCm = 175;
    const { feet, inches } = cmToFeetInches(originalCm);
    const convertedBackCm = feetInchesToCm(feet, inches);
    expect(convertedBackCm).toBeCloseTo(originalCm, 0);
  });
});

describe('Height Parsing', () => {
  test('parses metric height formats', () => {
    expect(parseHeight('175', true)).toBe(175);
    expect(parseHeight('175cm', true)).toBe(175);
    expect(parseHeight('175 cm', true)).toBe(175);
    expect(parseHeight('175.5cm', true)).toBe(175.5);
  });

  test('parses imperial height formats', () => {
    expect(parseHeight('5\'10"', false)).toBeCloseTo(177.8, 1);
    expect(parseHeight('5\'10', false)).toBeCloseTo(177.8, 1);
    expect(parseHeight('5′10″', false)).toBeCloseTo(177.8, 1);
    expect(parseHeight('6\'0"', false)).toBeCloseTo(182.88, 1);
  });

  test('parses inches only format', () => {
    expect(parseHeight('70', false)).toBeCloseTo(177.8, 1);
    expect(parseHeight('70in', false)).toBeCloseTo(177.8, 1);
    expect(parseHeight('70 inches', false)).toBeCloseTo(177.8, 1);
  });

  test('throws error for invalid height formats', () => {
    expect(() => parseHeight('invalid', true)).toThrow('Unable to parse height');
    expect(() => parseHeight('', true)).toThrow('Unable to parse height');
    expect(() => parseHeight('abc cm', true)).toThrow('Unable to parse height');
  });
});

describe('Weight Parsing', () => {
  test('parses metric weight formats', () => {
    expect(parseWeight('70', true)).toBe(70);
    expect(parseWeight('70kg', true)).toBe(70);
    expect(parseWeight('70 kg', true)).toBe(70);
    expect(parseWeight('70.5kg', true)).toBe(70.5);
  });

  test('parses imperial weight formats', () => {
    expect(parseWeight('150', false)).toBeCloseTo(68.04, 2);
    expect(parseWeight('150lbs', false)).toBeCloseTo(68.04, 2);
    expect(parseWeight('150 lbs', false)).toBeCloseTo(68.04, 2);
    expect(parseWeight('150 pounds', false)).toBeCloseTo(68.04, 2);
  });

  test('respects explicit units regardless of metric preference', () => {
    expect(parseWeight('70kg', false)).toBe(70); // kg overrides imperial preference
    expect(parseWeight('150lbs', true)).toBeCloseTo(68.04, 2); // lbs overrides metric preference
  });

  test('throws error for invalid weight formats', () => {
    expect(() => parseWeight('invalid', true)).toThrow('Unable to parse weight');
    expect(() => parseWeight('', true)).toThrow('Unable to parse weight');
    expect(() => parseWeight('abc kg', true)).toThrow('Unable to parse weight');
  });
});

describe('Integration Tests', () => {
  test('complete TDEE calculation flow', () => {
    // 30-year-old male, 80kg, 180cm, moderate activity, weight loss goal
    const bmr = calculateBMR('male', 30, 80, 180);
    const tdee = calculateTDEE(bmr, 'moderate');
    const targetCalories = calculateTargetCalories(tdee, ['lose_weight']);
    const macros = calculateMacroTargets(targetCalories, ['lose_weight']);

    expect(bmr).toBeCloseTo(1854, 0);
    expect(tdee).toBeCloseTo(2873, 0);
    expect(targetCalories).toBeCloseTo(2373, 0);
    expect(macros.protein.percentage).toBe(40);
    expect(macros.protein.grams).toBeGreaterThan(0);
  });

  test('handles edge case with multiple conflicting goals', () => {
    const tdee = 2000;
    const conflictingGoals: FitnessGoal[] = ['lose_weight', 'gain_lean_muscle', 'maintain_weight'];
    
    const targetCalories = calculateTargetCalories(tdee, conflictingGoals);
    const macros = calculateMacroTargets(targetCalories, conflictingGoals);
    
    // Should not crash and should produce reasonable results
    expect(targetCalories).toBeGreaterThan(0);
    expect(macros.protein.grams).toBeGreaterThan(0);
    expect(macros.carbs.grams).toBeGreaterThan(0);
    expect(macros.fat.grams).toBeGreaterThan(0);
  });
});
