import { NutritionItem } from '@/types/nutrition';

// Shared HTML generator to ensure PDF exports are identical across the app
export function generateReportHTML(name: string, dateLabel: string, nutritionData: NutritionItem[]) {
  const calculateTotals = () => {
    return nutritionData.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getCalorieStatus = (totalCalories: number) => {
    const targetCalories = 2000;
    const tolerance = 100;
    if (totalCalories > targetCalories + tolerance) {
      return { status: 'over', color: '#d32f2f' };
    } else if (totalCalories < targetCalories - tolerance) {
      return { status: 'under', color: '#f57c00' };
    } else {
      return { status: 'on-track', color: '#388e3c' };
    }
  };

  const getPieData = (totals: any) => {
    const total = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
    return [
      {
        name: 'Protein',
        population: total ? Math.round((totals.protein * 4 / total) * 100) : 0,
        color: '#BBA46E',
      },
      {
        name: 'Carbs',
        population: total ? Math.round((totals.carbs * 4 / total) * 100) : 0,
        color: '#8bc34a',
      },
      {
        name: 'Fat',
        population: total ? Math.round((totals.fat * 9 / total) * 100) : 0,
        color: '#ff9800',
      }
    ];
  };

  const getBarData = (totals: any) => {
    const targets = { protein: 150, carbs: 250, fat: 65 };
    return {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          data: [
            Math.min((totals.protein / targets.protein) * 100, 100),
            Math.min((totals.carbs / targets.carbs) * 100, 100),
            Math.min((totals.fat / targets.fat) * 100, 100)
          ],
        }
      ]
    };
  };

  const totals = calculateTotals();
  const calorieStatus = getCalorieStatus(totals.calories);

  const tableRows = nutritionData.map((item, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F5EEE6'};">
      <td style="padding: 12px; text-align: left; font-size: 14px; color:#333;">${item.name}</td>
      <td style="padding: 12px; text-align: center; font-size: 14px; color:#333;">${Math.ceil(item.calories)}</td>
      <td style="padding: 12px; text-align: center; font-size: 14px; color:#333;">${Math.ceil(item.protein)}</td>
      <td style="padding: 12px; text-align: center; font-size: 14px; color:#333;">${Math.ceil(item.carbs)}</td>
      <td style="padding: 12px; text-align: center; font-size: 14px; color:#333;">${Math.ceil(item.fat)}</td>
    </tr>
  `).join('');

  const totalsRow = `
    <tr style="background-color:#333333; color:#ffffff; font-weight:800;">
      <td style="padding: 12px; text-align: left;">Total</td>
      <td style="padding: 12px; text-align: center;">${Math.ceil(totals.calories)}</td>
      <td style="padding: 12px; text-align: center;">${Math.ceil(totals.protein)}</td>
      <td style="padding: 12px; text-align: center;">${Math.ceil(totals.carbs)}</td>
      <td style="padding: 12px; text-align: center;">${Math.ceil(totals.fat)}</td>
    </tr>
  `;

  const macroData = getPieData(totals);
  const macroBreakdown = macroData.map(item => `
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <div style="width: 20px; height: 20px; background-color: ${item.color}; border-radius: 4px; margin-right: 12px;"></div>
      <div style="font-size: 14px; color: #333;">${item.name}: ${item.population}%</div>
    </div>
  `).join('');

  const barData = getBarData(totals).datasets[0].data;
  const barLabels = ['Protein', 'Carbs', 'Fat'];
  const barColors = ['#BBA46E', '#8bc34a', '#ff9800'];
  const barChart = barLabels.map((label, index) => `
    <div style="margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
        <span style="font-size: 14px; color:#333;">${label}</span>
        <span style="font-size: 14px; color:#333;">${Math.round(barData[index])}%</span>
      </div>
      <div style="width: 100%; background-color: #eee; border-radius: 8px; height: 10px; overflow: hidden;">
        <div style="height: 10px; width: ${Math.max(barData[index], 5)}%; background-color: ${barColors[index]}; border-radius: 8px;"></div>
      </div>
    </div>
  `).join('');

  return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333; }
        .container { max-width: 800px; margin: 24px auto; padding: 24px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
        .subtitle { font-size: 14px; color: #666; margin: 0; }
        .totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
        .totalCard { background-color: #F5EEE6; border-radius: 12px; padding: 16px; text-align: center; }
        .totalValue { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
        .totalLabel { font-size: 12px; color: #666; margin: 6px 0 0 0; }
        .calorieCard { display: flex; justify-content: space-between; align-items: center; background-color: #fff3e0; border-radius: 12px; padding: 16px; margin: 16px 0; }
        .calorie-info h3 { font-size: 16px; color: #666; margin: 0 0 4px 0; }
        .calorie-value { font-size: 32px; font-weight: bold; color: #333; margin: 0; }
        .status-badge { padding: 8px 16px; border-radius: 20px; color: #fff; font-weight: bold; background-color: ${calorieStatus.color}; }
        .chart-section { background-color: #fff; border-radius: 12px; margin: 16px 0; padding: 16px; border: 1px solid #eee; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; margin: 0 0 16px 0; }
        .tableWrap { border-radius: 12px; border: 1px solid #e0d6c7; overflow: hidden; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background-color: #BBA46E; }
        th { color: #fff; text-align: left; padding: 12px; font-size: 12px; font-weight: 700; }
        td { padding: 12px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 class="title">${name.toUpperCase()}'S DAILY MACROS</h1>
            <p class="subtitle">${dateLabel}</p>
          </div>
        </div>

        <div class="totals">
          <div class="totalCard">
            <p class="totalValue">${Math.ceil(totals.calories)}</p>
            <p class="totalLabel">Calories</p>
          </div>
          <div class="totalCard">
            <p class="totalValue">${Math.ceil(totals.protein)}g</p>
            <p class="totalLabel">Protein</p>
          </div>
          <div class="totalCard">
            <p class="totalValue">${Math.ceil(totals.carbs)}g</p>
            <p class="totalLabel">Carbs</p>
          </div>
          <div class="totalCard">
            <p class="totalValue">${Math.ceil(totals.fat)}g</p>
            <p class="totalLabel">Fat</p>
          </div>
        </div>

        <div class="calorieCard">
          <div class="calorie-info">
            <h3>Calorie Status</h3>
            <p class="calorie-value">${Math.ceil(totals.calories)} kcal</p>
          </div>
          <div class="status-badge">${calorieStatus.status.toUpperCase()}</div>
        </div>

        <div class="chart-section">
          <div class="section-title">Macronutrient Distribution</div>
          ${macroBreakdown}
        </div>

        <div class="chart-section">
          <div class="section-title">Progress Toward Targets</div>
          ${barChart}
        </div>

        <div class="chart-section">
          <div class="section-title">Food and Nutrition Breakdown</div>
          <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center;">Calories</th>
                <th style="text-align:center;">Protein (g)</th>
                <th style="text-align:center;">Carbs (g)</th>
                <th style="text-align:center;">Fat (g)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              ${totalsRow}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}
