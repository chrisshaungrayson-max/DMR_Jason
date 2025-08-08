import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face Inference client
const HF_ACCESS_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN; // You'll need to set this in your environment
const hf = new HfInference(HF_ACCESS_TOKEN);

export type NutritionalInfo = {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
};

export async function analyzeFoodEntry(foodDescription: string): Promise<NutritionalInfo> {
  try {
    // This is a placeholder for the actual LLM call
    // In a real implementation, you would call the Hugging Face API here
    // with a fine-tuned model for nutritional analysis
    
    // For now, we'll return mock data
    return {
      food: foodDescription,
      calories: Math.floor(Math.random() * 500) + 100, // Random value between 100-600
      protein: Math.floor(Math.random() * 30) + 5,     // Random value between 5-35g
      carbs: Math.floor(Math.random() * 60) + 10,      // Random value between 10-70g
      fat: Math.floor(Math.random() * 30) + 5,         // Random value between 5-35g
      servingSize: '1 serving'
    };
    
    // Example of how to call the actual API (uncomment when you have a model ready):
    /*
    const response = await hf.textGeneration({
      model: 'your-model-name',
      inputs: `Analyze the following food and return nutritional info in JSON format: ${foodDescription}`,
      parameters: {
        max_new_tokens: 200,
        return_full_text: false
      }
    });
    
    // Parse the response and return the nutritional info
    return JSON.parse(response.generated_text);
    */
  } catch (error) {
    console.error('Error analyzing food entry:', error);
    throw new Error('Failed to analyze food entry. Please try again.');
  }
}

// Utility function to format the nutritional info for display
export function formatNutritionalInfo(info: NutritionalInfo): string {
  return `🍽️ ${info.food}\n` +
         `🔥 ${info.calories} cal • ` +
         `🍗 ${info.protein}g protein • ` +
         `🍞 ${info.carbs}g carbs • ` +
         `🥑 ${info.fat}g fat` +
         (info.servingSize ? ` (${info.servingSize})` : '');
}
