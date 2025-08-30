import { NutritionItem } from '@/types/nutrition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchFoodsByName, upsertFood } from '@/services/foods';

// Initialize the OpenAI client
const OPENAI_API_TOKEN = process.env.EXPO_PUBLIC_OPENAI_TOKEN;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

export type FoodAnalysisResult = {
  items: NutritionItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

// Simple food validation - filter out obvious non-food items
function isLikelyFood(item: string): boolean {
  const lowerItem = item.toLowerCase().trim();
  
  // Filter out dates, times, and other non-food patterns
  const nonFoodPatterns = [
    /^\d{1,2}\/\d{1,2}\/?\d{0,4}$/,  // dates like 19/8, 19/08/2024
    /^\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,  // dates like 19 aug
    /^\d{1,2}:\d{2}(\s*(am|pm))?$/i,  // times like 10:30, 10:30am
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,  // days of week
    /^(today|yesterday|tomorrow)$/i,  // relative dates
    /^(breakfast|lunch|dinner|snack)$/i,  // meal types (unless part of food name)
    /^\d+\s*(calories?|cal|kcal)$/i,  // calorie counts
    /^(total|sum|amount)$/i,  // summary words
  ];
  
  return !nonFoodPatterns.some(pattern => pattern.test(lowerItem)) && lowerItem.length > 1;
}

// Clean and format food item names
function formatFoodName(item: string): string {
  return item
    .trim()
    // Remove bullet points, dashes, numbers at start
    .replace(/^[-•*\d+.\s]+/, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Convert to sentence case (first letter uppercase, rest lowercase)
    .toLowerCase()
    .replace(/^./, char => char.toUpperCase());
}

// Extract a leading count like "2 eggs", "1.5 cups rice", "2x protein" -> { count: 2, name: 'eggs' }
function parseCount(item: string): { count: number; name: string } {
  const trimmed = item.trim();
  
  // Try multiple patterns for quantity extraction
  // IMPORTANT: Order matters. Test mixed numbers before simple decimals/fractions so
  // "1 1/2" isn't prematurely captured as just "1" with the remainder in the name.
  const patterns = [
    // Mixed numbers: "1 1/2 cups rice"
    /^\s*(\d+\s+\d+\/\d+)\s*x?\s+(.+)$/i,
    // Fractions: "1/2 cup rice", "3/4 chicken breast"  
    /^\s*(\d+\/\d+)\s*x?\s+(.+)$/i,
    // Decimal numbers: "1.5 cups rice", "2.5 protein powder"
    /^\s*(\d+\.?\d*)\s*x?\s+(.+)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let count = 1;
      const quantityStr = match[1].trim();
      const name = match[2].trim();
      
      try {
        if (quantityStr.includes('/')) {
          // Handle fractions and mixed numbers
          if (quantityStr.includes(' ')) {
            // Mixed number like "1 1/2"
            const parts = quantityStr.split(' ');
            const whole = parseInt(parts[0], 10) || 0;
            const fractionParts = parts[1].split('/');
            const numerator = parseInt(fractionParts[0], 10) || 0;
            const denominator = parseInt(fractionParts[1], 10) || 1;
            count = whole + (numerator / denominator);
          } else {
            // Simple fraction like "1/2"
            const fractionParts = quantityStr.split('/');
            const numerator = parseInt(fractionParts[0], 10) || 0;
            const denominator = parseInt(fractionParts[1], 10) || 1;
            count = numerator / denominator;
          }
        } else {
          // Handle decimal numbers
          count = parseFloat(quantityStr) || 1;
        }
        
        // Ensure count is reasonable (between 0.1 and 50)
        count = Math.max(0.1, Math.min(50, count));
        
        return { count, name };
      } catch (error) {
        console.warn('[parseCount] Failed to parse quantity:', quantityStr, error);
      }
    }
  }
  
  // Trailing quantity patterns: e.g., "left over shredded chicken horfun (1/2)", "pizza x2", "pizza (half)"
  // 1) Parenthetical numeric or keyword at end: (1/2), (1.5), (half), (quarter)
  const parenMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/i);
  if (parenMatch) {
    const namePart = parenMatch[1].trim();
    const qtyRaw = parenMatch[2].trim().toLowerCase();
    let count = 1;
    try {
      if (qtyRaw === 'half') count = 0.5;
      else if (qtyRaw === 'quarter' || qtyRaw === '1/4') count = 0.25;
      else if (/^\d+\s+\d+\/\d+$/.test(qtyRaw)) {
        const [wholeStr, fracStr] = qtyRaw.split(/\s+/);
        const [num, den] = fracStr.split('/').map(n => parseInt(n, 10) || 0);
        count = (parseInt(wholeStr, 10) || 0) + (num / Math.max(1, den));
      } else if (/^\d+\/\d+$/.test(qtyRaw)) {
        const [num, den] = qtyRaw.split('/').map(n => parseInt(n, 10) || 0);
        count = num / Math.max(1, den);
      } else if (/^\d+\.?\d*$/.test(qtyRaw)) {
        count = parseFloat(qtyRaw) || 1;
      }
      if (count !== 1) {
        count = Math.max(0.1, Math.min(50, count));
        return { count, name: namePart };
      }
    } catch {}
  }
  
  // 2) Trailing multiplier: "pizza x2" or "pizza × 1.5"
  const multMatch = trimmed.match(/^(.+?)\s*[x×]\s*(\d+\.?\d*)\s*$/i);
  if (multMatch) {
    const namePart = multMatch[1].trim();
    const qtyRaw = multMatch[2].trim();
    let count = parseFloat(qtyRaw) || 1;
    count = Math.max(0.1, Math.min(50, count));
    if (count !== 1) return { count, name: namePart };
  }

  // No quantity found, return the original item with count 1
  return { count: 1, name: trimmed };
}

// Search user's local history stored in AsyncStorage (key: 'nutritionRecords')
// Returns the most recent matching item's per-unit macros if found
async function findHistoryFood(foodItem: string): Promise<NutritionItem | null> {
  try {
    const raw = await AsyncStorage.getItem('nutritionRecords');
    if (!raw) return null;
    const records: any[] = JSON.parse(raw);
    const query = foodItem.trim().toLowerCase();
    // records are assumed sorted newest first in the store, but be defensive and sort by date desc if available
    const sorted = [...records].sort((a, b) => {
      const da = new Date(a.date ?? 0).getTime();
      const db = new Date(b.date ?? 0).getTime();
      return db - da;
    });
    for (const rec of sorted) {
      const items: any[] = rec?.foodItems || rec?.items || [];
      for (const it of items) {
        const name = String(it?.name || '').toLowerCase();
        if (!name) continue;
        if (name === query || name.includes(query) || query.includes(name)) {
          const unit: NutritionItem = {
            name: it.name,
            calories: Math.round(Number(it.calories) || 0),
            protein: Math.round(Number(it.protein) || 0),
            carbs: Math.round(Number(it.carbs) || 0),
            fat: Math.round(Number(it.fat) || 0),
          };
          return unit;
        }
      }
    }
    return null;
  } catch (e) {
    console.warn('[foodAnalysis] History lookup failed, skipping', e);
    return null;
  }
}

// Try to find a local food match in the Supabase `foods` table
async function findLocalFood(foodItem: string): Promise<NutritionItem | null> {
  try {
    const results = await searchFoodsByName(foodItem, 10);
    if (!results || results.length === 0) return null;

    // Prefer exact case-insensitive match on name; else take the top result
    const exact = results.find(r => r.name.trim().toLowerCase() === foodItem.trim().toLowerCase());
    const chosen = exact ?? results[0];
    return {
      name: chosen.name,
      calories: Math.round(chosen.calories || 0),
      protein: Math.round(chosen.protein || 0),
      carbs: Math.round(chosen.carbs || 0),
      fat: Math.round(chosen.fat || 0),
    } as NutritionItem;
  } catch (e) {
    console.warn('[foodAnalysis] Local food lookup failed, skipping to next source', e);
    return null;
  }
}

// Basic nutrition estimation fallback when LLM is unavailable
function estimateNutrition(foodItem: string): NutritionItem {
  const lowerItem = foodItem.toLowerCase();
  
  // Basic nutrition database for common foods (per typical serving)
  const nutritionDB: { [key: string]: { calories: number; protein: number; carbs: number; fat: number } } = {
    // Proteins
    'egg': { calories: 70, protein: 6, carbs: 1, fat: 5 },
    'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 4 },
    'salmon': { calories: 206, protein: 22, carbs: 0, fat: 12 },
    'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1 },
    'beef': { calories: 250, protein: 26, carbs: 0, fat: 15 },
    'turkey': { calories: 135, protein: 25, carbs: 0, fat: 3 },
    'pork': { calories: 242, protein: 27, carbs: 0, fat: 14 },
    
    // Protein Supplements (per scoop ~30g)
    'protein powder': { calories: 120, protein: 25, carbs: 3, fat: 1 },
    'whey protein': { calories: 120, protein: 25, carbs: 3, fat: 1 },
    'casein protein': { calories: 110, protein: 24, carbs: 3, fat: 1 },
    'protein shake': { calories: 120, protein: 25, carbs: 3, fat: 1 },
    'scoop of protein': { calories: 120, protein: 25, carbs: 3, fat: 1 },
    
    // Carbs (per cup cooked)
    'rice': { calories: 205, protein: 4, carbs: 45, fat: 0 },
    'brown rice': { calories: 216, protein: 5, carbs: 45, fat: 2 },
    'quinoa': { calories: 222, protein: 8, carbs: 39, fat: 4 },
    'pasta': { calories: 220, protein: 8, carbs: 44, fat: 1 },
    'bread': { calories: 80, protein: 3, carbs: 15, fat: 1 }, // per slice
    'croissant': { calories: 231, protein: 5, carbs: 26, fat: 12 }, // medium butter croissant
    'bagel': { calories: 277, protein: 11, carbs: 56, fat: 2 }, // medium plain bagel
    'muffin': { calories: 174, protein: 3, carbs: 29, fat: 5 }, // medium blueberry muffin
    'danish': { calories: 266, protein: 5, carbs: 34, fat: 13 }, // cheese danish
    'donut': { calories: 269, protein: 4, carbs: 31, fat: 15 }, // glazed donut
    'potato': { calories: 161, protein: 4, carbs: 37, fat: 0 }, // medium potato
    'sweet potato': { calories: 112, protein: 2, carbs: 26, fat: 0 }, // medium baked
    'sandwich': { calories: 350, protein: 15, carbs: 40, fat: 12 }, // typical deli sandwich
    'burger': { calories: 540, protein: 25, carbs: 40, fat: 31 }, // quarter pounder
    'wrap': { calories: 300, protein: 12, carbs: 35, fat: 12 }, // chicken wrap
    'oats': { calories: 154, protein: 6, carbs: 28, fat: 3 }, // per cup cooked
    
    // Pizza (realistic portions)
    'pizza': { calories: 300, protein: 12, carbs: 35, fat: 10 }, // per slice
    'pizza slice': { calories: 300, protein: 12, carbs: 35, fat: 10 },
    'slices of pizza': { calories: 300, protein: 12, carbs: 35, fat: 10 },
    'slice of pizza': { calories: 300, protein: 12, carbs: 35, fat: 10 },
    
    // Asian dishes (crowd-sourced estimates)
    'chicken rice': { calories: 550, protein: 35, carbs: 65, fat: 12 }, // full plate
    'hainanese chicken rice': { calories: 550, protein: 35, carbs: 65, fat: 12 },
    'chicken rice plate': { calories: 550, protein: 35, carbs: 65, fat: 12 },
    'roasted chicken rice': { calories: 580, protein: 38, carbs: 65, fat: 15 },
    'steamed chicken rice': { calories: 520, protein: 35, carbs: 65, fat: 10 },
    'chicken horfun': { calories: 600, protein: 40, carbs: 80, fat: 16 }, // full portion
    'horfun': { calories: 600, protein: 40, carbs: 80, fat: 16 },
    'char kway teow': { calories: 700, protein: 25, carbs: 90, fat: 25 },
    'nasi lemak': { calories: 500, protein: 15, carbs: 60, fat: 20 },
    'laksa': { calories: 450, protein: 20, carbs: 50, fat: 18 },
    
    // Fruits (per medium piece/cup)
    'apple': { calories: 95, protein: 0, carbs: 25, fat: 0 },
    'banana': { calories: 105, protein: 1, carbs: 27, fat: 0 },
    'orange': { calories: 62, protein: 1, carbs: 15, fat: 0 },
    'berries': { calories: 84, protein: 1, carbs: 21, fat: 0 },
    'strawberries': { calories: 49, protein: 1, carbs: 12, fat: 0 },
    'blueberries': { calories: 84, protein: 1, carbs: 21, fat: 0 },
    
    // Vegetables (per cup)
    'broccoli': { calories: 55, protein: 4, carbs: 11, fat: 1 },
    'spinach': { calories: 41, protein: 5, carbs: 7, fat: 0 },
    'carrot': { calories: 52, protein: 1, carbs: 12, fat: 0 },
    'lettuce': { calories: 10, protein: 1, carbs: 2, fat: 0 },
    'tomato': { calories: 32, protein: 2, carbs: 7, fat: 0 },
    
    // Dairy
    'milk': { calories: 150, protein: 8, carbs: 12, fat: 8 }, // per cup
    'skim milk': { calories: 83, protein: 8, carbs: 12, fat: 0 },
    'cheese': { calories: 113, protein: 7, carbs: 1, fat: 9 }, // per oz
    'yogurt': { calories: 150, protein: 13, carbs: 17, fat: 4 }, // per cup
    'greek yogurt': { calories: 130, protein: 23, carbs: 9, fat: 0 },
    'ice cream': { calories: 267, protein: 5, carbs: 31, fat: 14 }, // per cup
    
    // Nuts & Seeds (per oz)
    'almonds': { calories: 164, protein: 6, carbs: 6, fat: 14 },
    'peanuts': { calories: 161, protein: 7, carbs: 5, fat: 14 },
    'walnuts': { calories: 185, protein: 4, carbs: 4, fat: 18 },
    'peanut butter': { calories: 188, protein: 8, carbs: 8, fat: 16 }, // per 2 tbsp
    
    // Fats & Oils (per tbsp)
    'olive oil': { calories: 119, protein: 0, carbs: 0, fat: 14 },
    'butter': { calories: 102, protein: 0, carbs: 0, fat: 12 },
    'avocado': { calories: 234, protein: 3, carbs: 12, fat: 21 }, // per medium avocado
    
    // Beverages (realistic estimates from chain nutrition info)
    'coffee': { calories: 2, protein: 0, carbs: 0, fat: 0 },
    'tea': { calories: 2, protein: 0, carbs: 0, fat: 0 },
    'kopi': { calories: 15, protein: 0, carbs: 3, fat: 0 }, // kosong
    'kopi o': { calories: 15, protein: 0, carbs: 3, fat: 0 },
    'teh': { calories: 15, protein: 0, carbs: 3, fat: 0 },
    'bubble tea': { calories: 200, protein: 4, carbs: 32, fat: 5 }, // less sweet
    'milk tea': { calories: 200, protein: 4, carbs: 32, fat: 5 },
    'iced latte': { calories: 180, protein: 5, carbs: 28, fat: 4 },
    'genmaicha latte': { calories: 180, protein: 5, carbs: 28, fat: 4 },
    'peach oolong': { calories: 220, protein: 4, carbs: 35, fat: 5 },
    'beer': { calories: 150, protein: 1, carbs: 13, fat: 0 }, // per 12oz
    'wine': { calories: 125, protein: 0, carbs: 4, fat: 0 }, // per 5oz
  };
  
  // Find closest match - prioritize longer, more specific matches first
  const sortedFoods = Object.entries(nutritionDB).sort((a, b) => b[0].length - a[0].length);
  
  for (const [food, nutrition] of sortedFoods) {
    if (lowerItem.includes(food)) {
      return {
        name: foodItem,
        ...nutrition
      };
    }
  }
  
  // Default estimation for unknown foods - increased to more realistic baseline
  return {
    name: foodItem,
    calories: 150,
    protein: 6,
    carbs: 20,
    fat: 5
  };
}

export async function analyzeFoodEntry(foodDescription: string): Promise<FoodAnalysisResult> {
  console.info('[foodAnalysis] Starting analysis for:', { input: foodDescription.slice(0, 100) });

  if (!foodDescription || typeof foodDescription !== 'string') {
    throw new Error('Food description must be a non-empty string.');
  }

  // Try OpenAI first with the comprehensive nutrition prompt
  if (OPENAI_API_TOKEN) {
    try {
      const systemPrompt = `You are a nutrition analyst. Your job is to estimate calories, protein, carbs, and fat for a list of foods from free-text notes.

Rules:
- Units & rounding: Use grams (g), millilitres (ml), and kilocalories (kcal). Round macros to whole numbers per item.
- Method: Parse each line into canonical food name, portion, preparation, sweetness/sauces, region-specific meaning.
- Use widely accepted reference items with sensible, conservative assumptions when vague.
- If ambiguous, choose the most common interpretation and record the assumption + confidence score (0–1).
- Output: Return valid JSON only, matching the schema below.

Portion normalisation examples:
- "slice pizza" → 1 slice ≈ 100–140 g
- "half hor fun" → half a typical hawker portion ≈ 250–350 g  
- "scoop protein powder" → 30 g, 24 g protein baseline
- "milk tea less sweet" → assume 25% sugar reduction

Singapore coffee lexicon:
- kopi = coffee + condensed milk + sugar
- kopi-o = black coffee + sugar
- kopi-o kosong = black coffee, no sugar
- kopi-c = coffee + evaporated milk + sugar
- peng = iced (does not imply sugar)
- "less sweet" = –25% sugar; "kosong" = –100%

Milk teas:
- Default size = 500 ml if not given
- "less sweet" = –25% sugar; "half sugar" = –50%; "0 sugar" = none
- No toppings unless stated

Return JSON with this structure:
{
  "per_item": [
    {
      "original_text": "string",
      "canonical_name": "string", 
      "portion": "string",
      "calories_kcal": integer,
      "protein_g": integer,
      "carbs_g": integer,
      "fat_g": integer,
      "assumptions": ["string"],
      "confidence": number
    }
  ],
  "totals": {
    "calories_kcal": integer,
    "protein_g": integer,
    "carbs_g": integer,
    "fat_g": integer
  }
}`;

      const userPrompt = `Task: Estimate macros for the following foods. Use the rules in the system prompt and return JSON only.
Return a compact, minified JSON without code fences or extra text.

Items:
${foodDescription}`;

      const t0 = Date.now();
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_TOKEN}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          // Allow more space for full JSON on longer entries
          max_tokens: 1200,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        // Try to read error body for diagnostics
        const errText = await response.text();
        console.warn('[foodAnalysis] OpenAI error response', { status: response.status, statusText: response.statusText, body: errText.slice(0, 500) });
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const choice = responseData?.choices?.[0];
      const rawResponse = choice?.message?.content ?? '';
      const finishReason = choice?.finish_reason ?? choice?.finishReason ?? 'unknown';
      const usage = responseData?.usage ?? {};
      console.info('[foodAnalysis] Source=OpenAI-comprehensive', { model: OPENAI_MODEL, latencyMs: Date.now() - t0, finishReason, usage, raw: rawResponse.slice(0, 300) });
      
      // 1) Strip common code fences, then parse JSON
      const cleaned = rawResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      let parsed: any;
      const tryParse = (text: string) => {
        try { return JSON.parse(text); } catch { return null; }
      };
      parsed = tryParse(cleaned);
      if (!parsed) {
        // Attempt to extract the largest valid JSON object or array from the text
        const extractLargestJson = (s: string): any => {
          const tryBrackets = (open: string, close: string) => {
            const start = s.indexOf(open);
            const end = s.lastIndexOf(close);
            if (start === -1 || end === -1 || end <= start) return null;
            // Progressively trim from the end until parsable
            for (let i = end; i > start; i--) {
              const candidate = s.slice(start, i + 1).trim();
              const p = tryParse(candidate);
              if (p) return p;
            }
            return null;
          };
          // Prefer object, then array
          return tryBrackets('{', '}') ?? tryBrackets('[', ']');
        };
        parsed = extractLargestJson(cleaned);
      }
      if (!parsed) {
        console.warn('[foodAnalysis] Failed to parse OpenAI JSON after extraction, falling back', { cleanedPreview: cleaned.slice(0, 200) });
        throw new Error('Parse error');
      }

      // 2) Normalize into a common per-item array
      type NormalizedItem = { original_text: string; calories: number; protein: number; carbs: number; fat: number };
      let normalizedItems: NormalizedItem[] = [];

      if (parsed && Array.isArray(parsed.per_item)) {
        // Strict schema from nutrition_prompt.md
        normalizedItems = parsed.per_item.map((it: any) => ({
          original_text: String(it.original_text ?? it.canonical_name ?? it.name ?? ''),
          calories: Math.round(Number(it.calories_kcal) || 0),
          protein: Math.round(Number(it.protein_g) || 0),
          carbs: Math.round(Number(it.carbs_g) || 0),
          fat: Math.round(Number(it.fat_g) || 0),
        }));
      } else if (parsed && Array.isArray(parsed.foods)) {
        // Alternate shape like test output
        normalizedItems = parsed.foods.map((it: any) => {
          const m = it.macros || {};
          const carbsValue = m.carbs ?? m.carbohydrates;
          return {
            original_text: String(it.item ?? it.name ?? ''),
            calories: Math.round(Number(m.calories) || 0),
            protein: Math.round(Number(m.protein) || 0),
            carbs: Math.round(Number(carbsValue) || 0),
            fat: Math.round(Number(m.fat) || 0),
          } as NormalizedItem;
        });
      } else if (Array.isArray(parsed)) {
        // Flat array of items
        normalizedItems = parsed.map((it: any) => ({
          original_text: String(it.original_text ?? it.name ?? it.item ?? ''),
          calories: Math.round(Number(it.calories ?? it.calories_kcal) || 0),
          protein: Math.round(Number(it.protein ?? it.protein_g) || 0),
          carbs: Math.round(Number(it.carbs ?? it.carbs_g ?? it.carbohydrates) || 0),
          fat: Math.round(Number(it.fat ?? it.fat_g) || 0),
        }));
      } else {
        console.warn('[foodAnalysis] Unrecognized OpenAI JSON shape, falling back');
        throw new Error('Unrecognized OpenAI JSON shape');
      }

      // Map to app's NutritionItem[] for display/storage
      const nutritionItems: NutritionItem[] = normalizedItems.map((n) => ({
        name: n.original_text,
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
      }));

      // Cache individual items for future lookups (per-unit)
      for (const n of normalizedItems) {
        try {
          const { count, name: baseNameRaw } = parseCount(n.original_text.replace(/^\s*[-•*]\s*/, ''));
          const baseName = formatFoodName(baseNameRaw);
          await upsertFood({
            name: baseName,
            calories: Math.round(n.calories / Math.max(1e-6, count)),
            protein: Math.round(n.protein / Math.max(1e-6, count)),
            carbs: Math.round(n.carbs / Math.max(1e-6, count)),
            fat: Math.round(n.fat / Math.max(1e-6, count)),
          });
          console.info('[foodAnalysis] Cached per-unit from OpenAI-comprehensive', { baseName, count });
        } catch (cacheErr) {
          console.warn('[foodAnalysis] Failed to cache OpenAI result', cacheErr);
        }
      }

      // Calculate totals from items (ignore any model totals to keep consistent rounding)
      const total = nutritionItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        items: nutritionItems,
        total,
      };

    } catch (error) {
      console.warn('[foodAnalysis] OpenAI comprehensive call failed, using fallback', { error: String(error).slice(0, 200) });
    }
  }

  // Fallback: use the old parsing logic if OpenAI fails or token is missing
  const rawItems = foodDescription
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const validFoodItems = rawItems
    .filter(isLikelyFood)
    .filter(item => item.length > 0);

  if (validFoodItems.length === 0) {
    throw new Error('No valid food items found in the input.');
  }

  const nutritionItems: NutritionItem[] = [];

  for (const originalItem of validFoodItems) {
    const displayName = originalItem.replace(/^\s*[-•*]\s*/, '');
    try {
      const { count, name: baseNameRaw } = parseCount(displayName);
      const baseName = formatFoodName(baseNameRaw);

      // Try history cache first
      let chosen = await findHistoryFood(baseName);
      if (chosen) {
        console.info('[foodAnalysis] Source=history', { item: originalItem, used: chosen.name, count });
        nutritionItems.push({
          name: originalItem,
          calories: chosen.calories * count,
          protein: chosen.protein * count,
          carbs: chosen.carbs * count,
          fat: chosen.fat * count,
        });
        continue;
      }

      // Try local DB
      chosen = await findLocalFood(baseName);
      if (chosen) {
        console.info('[foodAnalysis] Source=local match', { item: originalItem, used: chosen.name, count });
        nutritionItems.push({
          name: originalItem,
          calories: chosen.calories * count,
          protein: chosen.protein * count,
          carbs: chosen.carbs * count,
          fat: chosen.fat * count,
        });
        continue;
      }

      // Fallback estimation
      const est = estimateNutrition(baseName);
      nutritionItems.push({
        name: originalItem,
        calories: Math.round(est.calories * count),
        protein: Math.round(est.protein * count),
        carbs: Math.round(est.carbs * count),
        fat: Math.round(est.fat * count),
      });
      console.info('[foodAnalysis] Source=fallback', { item: originalItem, used: baseName, count });

    } catch (error) {
      console.warn('[foodAnalysis] Error processing item:', { item: originalItem, error: String(error) });
      const est = estimateNutrition(originalItem);
      nutritionItems.push({
        name: originalItem,
        calories: Math.round(est.calories),
        protein: Math.round(est.protein),
        carbs: Math.round(est.carbs),
        fat: Math.round(est.fat),
      });
    }
  }

  // Calculate totals
  const total = nutritionItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    items: nutritionItems,
    total
  };
}

// Utility function to format the nutritional info for display
export function formatNutritionalInfo(result: FoodAnalysisResult): string {
  let formatted = '';
  result.items.forEach(item => {
    formatted += `🍽️ ${item.name}\n` +
                `🔥 ${item.calories} cal • ` +
                `🍗 ${item.protein}g protein • ` +
                `🍞 ${item.carbs}g carbs • ` +
                `🥑 ${item.fat}g fat\n\n`;
  });
  formatted += `TOTAL: ${result.total.calories} cal • ${result.total.protein}g protein • ${result.total.carbs}g carbs • ${result.total.fat}g fat`;
  return formatted;
}
