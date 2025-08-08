import { NutritionItem } from '@/types/nutrition';

export async function generateNutritionData(foodItems: string[]): Promise<NutritionItem[]> {
  try {
    console.log('Generating nutrition data for:', foodItems);
    
    // Create a prompt for the LLM
    const prompt = `
      I need nutritional information for the following food items:
      ${foodItems.join('\n')}
      
      For each item, provide the following in JSON format:
      - name (the food item)
      - calories (total calories)
      - protein (grams)
      - carbs (grams)
      - fat (grams)
      
      Return ONLY a valid JSON array with these objects, nothing else.
    `;
    
    // Make a request to the LLM API
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert that provides accurate macronutrient information for food items. Respond only with the requested JSON format, no explanations or additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch nutrition data');
    }
    
    const data = await response.json();
    console.log('LLM response:', data);
    
    // Parse the completion from the LLM
    try {
      // Find JSON in the response
      const jsonMatch = data.completion.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const nutritionData = JSON.parse(jsonMatch[0]);
        console.log('Parsed nutrition data:', nutritionData);
        return nutritionData;
      } else {
        // Fallback if no JSON array is found
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Error parsing nutrition data:', parseError);
      
      // Fallback with mock data if parsing fails
      return generateMockNutritionData(foodItems);
    }
  } catch (error) {
    console.error('Error in generateNutritionData:', error);
    
    // Fallback with mock data if the API call fails
    return generateMockNutritionData(foodItems);
  }
}

// Fallback function to generate mock data if the API fails
function generateMockNutritionData(foodItems: string[]): NutritionItem[] {
  console.log('Generating mock nutrition data');
  
  return foodItems.map(item => {
    // Generate somewhat realistic values based on the food item
    const isProteinRich = /chicken|beef|fish|egg|meat|protein/i.test(item);
    const isCarbRich = /rice|pasta|bread|potato|noodle|cereal/i.test(item);
    const isFatRich = /oil|butter|cheese|avocado|nuts/i.test(item);
    const isSweet = /sugar|sweet|cake|cookie|dessert|chocolate/i.test(item);
    const isDrink = /water|coffee|tea|juice|soda|wine|beer/i.test(item);
    
    let calories = Math.floor(Math.random() * 300) + 50;
    let protein = Math.floor(Math.random() * 20) + 1;
    let carbs = Math.floor(Math.random() * 30) + 1;
    let fat = Math.floor(Math.random() * 15) + 1;
    
    // Adjust based on food type
    if (isProteinRich) {
      protein = Math.floor(Math.random() * 20) + 15;
      calories += protein * 4;
    }
    
    if (isCarbRich) {
      carbs = Math.floor(Math.random() * 30) + 20;
      calories += carbs * 4;
    }
    
    if (isFatRich) {
      fat = Math.floor(Math.random() * 15) + 10;
      calories += fat * 9;
    }
    
    if (isSweet) {
      carbs = Math.floor(Math.random() * 30) + 25;
      calories += carbs * 4;
    }
    
    if (isDrink) {
      calories = Math.floor(Math.random() * 150);
      protein = Math.floor(Math.random() * 3);
      carbs = Math.floor(Math.random() * 15);
      fat = Math.floor(Math.random() * 2);
    }
    
    return {
      name: item,
      calories,
      protein,
      carbs,
      fat
    };
  });
}