import { FitnessGoal, MacroTargets, FITNESS_GOALS } from '@/types/tdee';
import Colors from '@/constants/colors';

export interface TDEEExportData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: string;
  goals: FitnessGoal[];
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: MacroTargets;
  isMetric: boolean;
  calculatedAt: string;
}

// Generate HTML for TDEE PDF export
export function generateTDEEReportHTML(
  data: TDEEExportData,
  logoDataUrl?: string
) {
  const {
    name,
    age,
    gender,
    height,
    weight,
    activityLevel,
    goals,
    bmr,
    tdee,
    targetCalories,
    macros,
    isMetric,
    calculatedAt
  } = data;

  // Format user info
  const heightDisplay = isMetric 
    ? `${Math.round(height)} cm`
    : `${Math.floor(height / 30.48)}'${Math.round((height % 30.48) / 2.54)}"`;
  const weightDisplay = isMetric 
    ? `${Math.round(weight)} kg`
    : `${Math.round(weight * 2.205)} lbs`;

  // Calculate calorie difference
  const calorieDifference = targetCalories - tdee;
  const adjustmentType = calorieDifference < -50 ? 'deficit' : 
                        calorieDifference > 50 ? 'surplus' : 'maintenance';
  
  // Get goal information
  const goalsList = goals.map(goal => {
    const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
    return goalInfo?.label || goal;
  }).join(', ');

  // Calculate macro calories
  const proteinCals = macros.protein.grams * 4;
  const carbsCals = macros.carbs.grams * 4;
  const fatCals = macros.fat.grams * 9;

  // Generate macro breakdown
  const macroBreakdown = `
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <div style="width: 20px; height: 20px; background-color: #FF6B6B; border-radius: 4px; margin-right: 12px;"></div>
      <div style="font-size: 14px; color: #333;">Protein: ${macros.protein.grams}g (${proteinCals} cal, ${macros.protein.percentage}%)</div>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <div style="width: 20px; height: 20px; background-color: #4ECDC4; border-radius: 4px; margin-right: 12px;"></div>
      <div style="font-size: 14px; color: #333;">Carbohydrates: ${macros.carbs.grams}g (${carbsCals} cal, ${macros.carbs.percentage}%)</div>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <div style="width: 20px; height: 20px; background-color: #45B7D1; border-radius: 4px; margin-right: 12px;"></div>
      <div style="font-size: 14px; color: #333;">Fat: ${macros.fat.grams}g (${fatCals} cal, ${macros.fat.percentage}%)</div>
    </div>
  `;

  // Generate recommendations based on goals
  const getRecommendations = () => {
    if (goals.length === 0) return '';
    
    const recommendations = {
      'lose_weight': [
        'Aim for 1-2 pounds of weight loss per week for sustainable results',
        'Focus on whole foods and lean proteins to maintain satiety',
        'Consider strength training to preserve muscle mass during weight loss'
      ],
      'lose_body_fat': [
        'Combine resistance training with cardio for optimal body composition',
        'Prioritize protein timing around workouts for muscle preservation',
        'Track body measurements and progress photos, not just weight'
      ],
      'gain_lean_muscle': [
        'Focus on progressive overload in your resistance training',
        'Eat in a moderate surplus to minimize fat gain',
        'Consume protein throughout the day, especially post-workout'
      ],
      'maintain_weight': [
        'Focus on consistent eating patterns and regular exercise',
        'Monitor weight weekly and adjust calories as needed',
        'Prioritize nutrient-dense foods for overall health'
      ],
      'improve_athletic_performance': [
        'Time carbohydrate intake around training sessions',
        'Focus on nutrient timing for optimal recovery',
        'Stay well-hydrated before, during, and after training'
      ],
      'general_health': [
        'Focus on a variety of whole, minimally processed foods',
        'Include plenty of fruits and vegetables for micronutrients',
        'Maintain regular meal timing and portion control'
      ]
    };

    let recommendationHTML = '<div class="chart-section"><div class="section-title">Personalized Recommendations</div>';
    
    goals.forEach(goal => {
      const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
      const tips = recommendations[goal];
      
      if (goalInfo && tips) {
        recommendationHTML += `
          <div style="margin-bottom: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid ${Colors.light.tint};">
            <h4 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">${goalInfo.label}</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${tips.map(tip => `<li style="margin-bottom: 8px; color: #555; font-size: 14px; line-height: 1.4;">${tip}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    });
    
    recommendationHTML += '</div>';
    return recommendationHTML;
  };

  // Brand palette
  const gold = Colors.light.gold;
  const lightBg = '#F2EBE3';
  const tableBorder = '#e0d6c7';

  return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page { size: A4 portrait; margin: 14mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: ${lightBg}; color: #333; }
        .container { max-width: 800px; margin: 24px auto; padding: 24px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
        .header { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid ${tableBorder}; }
        .logo { width: 56px; height: 56px; border-radius: 8px; object-fit: contain; }
        .titleBlock { display: flex; flex-direction: column; }
        .brand { font-size: 12px; font-weight: 800; color: #333; letter-spacing: .3px; margin: 0 0 2px 0; }
        .title { font-size: 22px; font-weight: 800; color: #333; margin: 0; }
        .subtitle { font-size: 13px; color: #666; margin: 2px 0 0 0; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
        .metricCard { background-color: ${lightBg}; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid ${tableBorder}; }
        .metricValue { font-size: 24px; font-weight: bold; color: ${Colors.light.tint}; margin: 0; }
        .metricLabel { font-size: 12px; color: #666; margin: 6px 0 0 0; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
        .info-card { background-color: #fff; border: 1px solid ${tableBorder}; border-radius: 12px; padding: 16px; }
        .info-title { font-size: 16px; font-weight: bold; color: #333; margin: 0 0 12px 0; }
        .info-item { margin-bottom: 8px; font-size: 14px; color: #555; }
        .chart-section { background-color: #fff; border-radius: 12px; margin: 16px 0; padding: 16px; border: 1px solid ${tableBorder}; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; margin: 0 0 16px 0; }
        .adjustment-note { background-color: ${adjustmentType === 'deficit' ? '#ffebee' : adjustmentType === 'surplus' ? '#e8f5e8' : '#f5f5f5'}; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid ${adjustmentType === 'deficit' ? '#f44336' : adjustmentType === 'surplus' ? '#4caf50' : '#9e9e9e'}; }
        .adjustment-title { font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #333; }
        .adjustment-text { font-size: 14px; color: #555; margin: 0; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="${logoDataUrl || 'https://r2-pub.rork.com/attachments/nbnzfjpejlkyi4jjvjdzc'}" alt="Brand Logo" />
          <div class="titleBlock">
            <div class="brand">TDEE Calculator by Jason Lam</div>
            <h1 class="title">${name.toUpperCase()}'S TDEE REPORT</h1>
            <p class="subtitle">${new Date(calculatedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>

        <div class="metrics">
          <div class="metricCard">
            <p class="metricValue">${Math.round(bmr)}</p>
            <p class="metricLabel">BMR (cal)</p>
          </div>
          <div class="metricCard">
            <p class="metricValue">${Math.round(tdee)}</p>
            <p class="metricLabel">TDEE (cal)</p>
          </div>
          <div class="metricCard">
            <p class="metricValue">${Math.round(targetCalories)}</p>
            <p class="metricLabel">Target (cal)</p>
          </div>
        </div>

        ${Math.abs(calorieDifference) > 50 ? `
        <div class="adjustment-note">
          <div class="adjustment-title">
            ${adjustmentType === 'deficit' ? '📉 Safe Deficit Applied' : '📈 Safe Surplus Applied'}
          </div>
          <div class="adjustment-text">
            ${adjustmentType === 'deficit' 
              ? `Your target is ${Math.round(Math.abs(calorieDifference))} calories below your TDEE for safe, sustainable weight loss (max 20% deficit with minimum safety limits).`
              : `Your target is ${Math.round(calorieDifference)} calories above your TDEE for controlled muscle gain (max 15% surplus to minimize fat gain).`
            }
          </div>
        </div>
        ` : ''}

        <div class="info-grid">
          <div class="info-card">
            <div class="info-title">Personal Information</div>
            <div class="info-item"><strong>Age:</strong> ${age} years</div>
            <div class="info-item"><strong>Gender:</strong> ${gender.charAt(0).toUpperCase() + gender.slice(1)}</div>
            <div class="info-item"><strong>Height:</strong> ${heightDisplay}</div>
            <div class="info-item"><strong>Weight:</strong> ${weightDisplay}</div>
            <div class="info-item"><strong>Activity Level:</strong> ${activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)}</div>
          </div>
          
          <div class="info-card">
            <div class="info-title">Fitness Goals</div>
            <div class="info-item">${goalsList}</div>
          </div>
        </div>

        <div class="chart-section">
          <div class="section-title">Daily Macro Targets</div>
          ${macroBreakdown}
          <div style="margin-top: 16px; padding: 12px; background-color: #f8f9fa; border-radius: 8px;">
            <strong>Total:</strong> ${macros.protein.grams + macros.carbs.grams + macros.fat.grams}g macros = ${Math.round(targetCalories)} calories
          </div>
        </div>

        ${getRecommendations()}

        <div class="chart-section">
          <div class="section-title">Important Notes</div>
          <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.6;">
            <li>These calculations are estimates based on established formulas and should be used as starting points.</li>
            <li>Individual metabolic rates can vary by ±10-15% from calculated values.</li>
            <li>Monitor your progress and adjust calories based on real-world results.</li>
            <li>Consult with a healthcare provider before making significant dietary changes.</li>
            <li>Focus on whole foods and adequate hydration for best results.</li>
          </ul>
        </div>
      </div>
    </body>
  </html>`;
}

// Generate formatted text summary for social sharing
export function generateTDEETextSummary(data: TDEEExportData): string {
  const {
    name,
    bmr,
    tdee,
    targetCalories,
    macros,
    goals,
    isMetric,
    weight,
    height
  } = data;

  const goalsList = goals.map(goal => {
    const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
    return goalInfo?.label || goal;
  }).join(', ');

  const heightDisplay = isMetric 
    ? `${Math.round(height)} cm`
    : `${Math.floor(height / 30.48)}'${Math.round((height % 30.48) / 2.54)}"`;
  const weightDisplay = isMetric 
    ? `${Math.round(weight)} kg`
    : `${Math.round(weight * 2.205)} lbs`;

  const calorieDifference = targetCalories - tdee;
  const adjustmentText = Math.abs(calorieDifference) > 50 
    ? calorieDifference < 0 
      ? `\n📉 Safe deficit: ${Math.round(Math.abs(calorieDifference))} cal below TDEE`
      : `\n📈 Safe surplus: ${Math.round(calorieDifference)} cal above TDEE`
    : '';

  return `🎯 ${name}'s TDEE Results

📊 Key Metrics:
• BMR: ${Math.round(bmr)} cal
• TDEE: ${Math.round(tdee)} cal  
• Target: ${Math.round(targetCalories)} cal${adjustmentText}

📏 Stats: ${heightDisplay}, ${weightDisplay}
🎯 Goals: ${goalsList}

🥗 Daily Macro Targets:
• Protein: ${macros.protein.grams}g (${macros.protein.percentage}%)
• Carbs: ${macros.carbs.grams}g (${macros.carbs.percentage}%)
• Fat: ${macros.fat.grams}g (${macros.fat.percentage}%)

Generated by TDEE Calculator by Jason Lam 💪`;
}
