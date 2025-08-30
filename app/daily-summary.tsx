import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useNutritionStore } from '@/store/nutrition-store';
import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NutritionEntry } from '@/types/nutrition';
import { generateReportHTML } from '@/utils/pdf';
import { loadImageAsDataUrl } from '@/utils/assets';
import { formatDateLabel, normalizeNutritionItems } from '@/utils/report';

export default function DailySummaryScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { dailyRecords, userInfo } = useNutritionStore();
  const { colorScheme, ideal } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [isExporting, setIsExporting] = useState(false);

  const record = useMemo(() => dailyRecords.find(r => r.date === date), [dailyRecords, date]);

  const grouped = useMemo(() => {
    const groups: Record<string, NutritionEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    if (record) {
      for (const e of record.entries) {
        const key = e.mealType || 'snack';
        (groups[key] ||= []).push(e);
      }
      // sort within groups by timestamp ascending
      Object.keys(groups).forEach(k => groups[k].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    }
    return groups;
  }, [record]);

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const formatDateForDisplay = (dateString: string) => {
  try {
    const d = new Date(`${dateString}T00:00:00`);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return 'Invalid Date';
  }
};
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const displayDate = useMemo(() => {
    if (!date) return '';
    const d = new Date(String(date));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [date]);

  const generateDayHTML = () => {
    if (!record) return '<html><body>No data</body></html>';
    const totals = record.total;
    const rCal = Math.round(totals.calories);
    const rP = Math.round(totals.protein);
    const rC = Math.round(totals.carbs);
    const rF = Math.round(totals.fat);
    const kcalTotal = rP * 4 + rC * 4 + rF * 9;
    const pctP = kcalTotal ? Math.round((rP * 4 / kcalTotal) * 100) : 0;
    const pctC = kcalTotal ? Math.round((rC * 4 / kcalTotal) * 100) : 0;
    const pctF = kcalTotal ? Math.round((rF * 9 / kcalTotal) * 100) : 0;
    const mealSections = ['breakfast','lunch','dinner','snack'].map(meal => {
      const entries = grouped[meal] || [];
      if (!entries.length) return '';
      const rows = entries.map(e => `
        <tr>
          <td style="padding:8px 12px">${formatTime(e.timestamp)}</td>
          <td style="padding:8px 12px">${e.foodList}</td>
          <td style=\"padding:8px 12px; text-align:right\">${Math.round(e.total.calories)}</td>
          <td style=\"padding:8px 12px; text-align:right\">${Math.round(e.total.protein)}g</td>
          <td style=\"padding:8px 12px; text-align:right\">${Math.round(e.total.carbs)}g</td>
          <td style=\"padding:8px 12px; text-align:right\">${Math.round(e.total.fat)}g</td>
        </tr>`).join('');
      return `
      <h3 style=\"margin:24px 0 8px 0\">${cap(meal)}</h3>
      <table style=\"width:100%; border-collapse:collapse; font-size:14px\">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="text-align:left; padding:8px 12px">Time</th>
            <th style="text-align:left; padding:8px 12px">Entry</th>
            <th style="text-align:right; padding:8px 12px">Cal</th>
            <th style="text-align:right; padding:8px 12px">P</th>
            <th style="text-align:right; padding:8px 12px">C</th>
            <th style="text-align:right; padding:8px 12px">F</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
    }).join('');

    return `
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>Daily Macros Summary</title>
        <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#222}</style>
      </head>
      <body>
        <h1 style="margin:0 0 4px 0">Daily Macros Summary</h1>
        <div style="margin:0 0 16px 0; color:#777">${displayDate}</div>
        <div style=\"margin-bottom:16px; padding:12px; border:1px solid #eee; border-radius:8px\">
          <div style=\"font-weight:700; font-size:16px; margin-bottom:4px\">Totals</div>
          <div style=\"font-size:28px; font-weight:800; margin-bottom:8px\">${rCal} cal</div>
          <div>Protein: <b>${rP}g</b> &nbsp; Carbs: <b>${rC}g</b> &nbsp; Fat: <b>${rF}g</b></div>
          <div style=\"margin-top:8px;\">
            <span style=\"display:inline-block; padding:6px 10px; background:#BBA46E; color:#fff; border-radius:12px; margin-right:8px\">Protein ${pctP}%</span>
            <span style=\"display:inline-block; padding:6px 10px; background:#8bc34a; color:#fff; border-radius:12px; margin-right:8px\">Carbs ${pctC}%</span>
            <span style=\"display:inline-block; padding:6px 10px; background:#ff9800; color:#fff; border-radius:12px;\">Fat ${pctF}%</span>
          </div>
        </div>
        ${mealSections}
      </body>
    </html>`;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Use shared generator for identical PDF exports
      const items = record ? record.entries.flatMap(e => e.items) : [];
      const normalized = normalizeNutritionItems(items);
      const brandLogo = require('@/assets/images/brand-logo.png');
      const logoDataUrl = await loadImageAsDataUrl(brandLogo);

      const html = generateReportHTML(
        userInfo.name,
        formatDateLabel(String(date)),
        normalized,
        ideal?.percents,
        logoDataUrl
      );
      
      const filename = `${userInfo.name}-Daily-Macros-${String(date)}.pdf`;
      if (Platform.OS === 'web') {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(html);
          w.document.close();
          setTimeout(() => w.print(), 300);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Nutrition Report', UTI: 'com.adobe.pdf' });
        } else {
          Alert.alert('Success', 'PDF has been generated and saved.');
        }
      }
    } catch (e) {
      console.error('Error exporting PDF:', e);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!record) {
    return (
      <Pressable onPress={() => router.back()} style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}> 
        <Stack.Screen options={{ 
          title: 'Daily Summary',
          presentation: 'modal',
          headerStyle: { backgroundColor: theme.cardBackground },
          headerTintColor: theme.darkText,
        }} />
        <View onStartShouldSetResponder={() => true} style={[styles.modalCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.title, { color: theme.darkText }]}>{displayDate}</Text>
          <Text style={{ color: theme.lightText }}>No data for this date.</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.back()} style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}> 
      <Stack.Screen options={{ 
        title: 'Daily Summary',
        presentation: 'modal',
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.darkText,
      }} />
      <View onStartShouldSetResponder={() => true} style={[styles.modalCard, { backgroundColor: theme.cardBackground }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: theme.darkText }]}>{displayDate}</Text>
          <View style={styles.visualTotalsRow}>
            <View style={[styles.visualTotalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : '#F5EEE6' }]}> 
              <Text style={[styles.visualTotalValue, { color: theme.darkText }]}>{Math.ceil(record.total.calories)}</Text>
              <Text style={[styles.visualTotalLabel, { color: theme.lightText }]}>Calories</Text>
            </View>
            <View style={[styles.visualTotalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : '#F5EEE6' }]}> 
              <Text style={[styles.visualTotalValue, { color: theme.darkText }]}>{Math.ceil(record.total.protein)}g</Text>
              <Text style={[styles.visualTotalLabel, { color: theme.lightText }]}>Protein</Text>
            </View>
            <View style={[styles.visualTotalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : '#F5EEE6' }]}> 
              <Text style={[styles.visualTotalValue, { color: theme.darkText }]}>{Math.ceil(record.total.carbs)}g</Text>
              <Text style={[styles.visualTotalLabel, { color: theme.lightText }]}>Carbs</Text>
            </View>
            <View style={[styles.visualTotalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : '#F5EEE6' }]}> 
              <Text style={[styles.visualTotalValue, { color: theme.darkText }]}>{Math.ceil(record.total.fat)}g</Text>
              <Text style={[styles.visualTotalLabel, { color: theme.lightText }]}>Fat</Text>
            </View>
          </View>
          <View style={styles.analyticsSection}>
            <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Analytics</Text>
            {(() => {
              const P = Math.round(record.total.protein);
              const C = Math.round(record.total.carbs);
              const F = Math.round(record.total.fat);
              const kcal = P * 4 + C * 4 + F * 9;
              const pctP = kcal ? Math.round((P * 4 / kcal) * 100) : 0;
              const pctC = kcal ? Math.round((C * 4 / kcal) * 100) : 0;
              const pctF = kcal ? Math.round((F * 9 / kcal) * 100) : 0;
              return (
                <View style={styles.pctRow}>
                  <View style={styles.pctItem}>
                    <View style={[styles.pctBar, { width: `${pctP}%`, backgroundColor: '#BBA46E' }]} />
                    <Text style={[styles.pctLabel, { color: theme.lightText }]}>Protein {pctP}%</Text>
                  </View>
                  <View style={styles.pctItem}>
                    <View style={[styles.pctBar, { width: `${pctC}%`, backgroundColor: '#8bc34a' }]} />
                    <Text style={[styles.pctLabel, { color: theme.lightText }]}>Carbs {pctC}%</Text>
                  </View>
                  <View style={styles.pctItem}>
                    <View style={[styles.pctBar, { width: `${pctF}%`, backgroundColor: '#ff9800' }]} />
                    <Text style={[styles.pctLabel, { color: theme.lightText }]}>Fat {pctF}%</Text>
                  </View>
                </View>
              );
            })()}
          </View>

          <View style={[styles.totalsCard, { backgroundColor: theme.cardBackground }]}> 
            <Text style={[styles.totalsTitle, { color: theme.darkText }]}>Totals</Text>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalItem, { color: theme.darkText }]}>Calories: {Math.ceil(record.total.calories)}</Text>
              <Text style={[styles.totalItem, { color: theme.darkText }]}>P: {Math.ceil(record.total.protein)}g</Text>
              <Text style={[styles.totalItem, { color: theme.darkText }]}>C: {Math.ceil(record.total.carbs)}g</Text>
              <Text style={[styles.totalItem, { color: theme.darkText }]}>F: {Math.ceil(record.total.fat)}g</Text>
            </View>
            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: theme.tint }]} onPress={handleExport} disabled={isExporting}>
              <Text style={[styles.exportText, { color: theme.background }]}>{isExporting ? 'Exporting…' : 'Export Day as PDF'}</Text>
            </TouchableOpacity>
          </View>

          {(['breakfast','lunch','dinner','snack'] as const).map(meal => (
            grouped[meal] && grouped[meal].length > 0 ? (
              <View key={meal} style={[styles.mealSection, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.mealTitle, { color: theme.darkText }]}>{cap(meal)}</Text>
                {grouped[meal].map((e, idx) => (
                  <View key={idx} style={styles.entryRow}>
                    <Text style={[styles.entryTimeTxt, { color: theme.lightText }]}>{formatTime(e.timestamp)}</Text>
                    <Text style={[styles.entryFood, { color: theme.darkText }]}>{e.foodList}</Text>
                    <Text style={[styles.entryCal, { color: theme.lightText }]}>{Math.ceil(e.total.calories)} cal</Text>
                  </View>
                ))}
              </View>
            ) : null
          ))}
        </ScrollView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 720, maxHeight: '85%', borderRadius: 16, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  totalsCard: { borderRadius: 12, padding: 16, gap: 12 },
  totalsTitle: { fontSize: 16, fontWeight: '600' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalItem: { fontSize: 14 },
  exportBtn: { marginTop: 8, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  exportText: { fontSize: 14, fontWeight: '700' },
  mealSection: { borderRadius: 12, padding: 12 },
  mealTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  entryTimeTxt: { width: 70, fontSize: 12 },
  entryFood: { flex: 1, marginHorizontal: 8, fontSize: 14, fontWeight: '600' },
  entryCal: { width: 80, textAlign: 'right', fontSize: 12 },
  visualTotalsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  visualTotalBox: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  visualTotalValue: { fontSize: 18, fontWeight: '800' },
  visualTotalLabel: { fontSize: 12, fontWeight: '600' },
  analyticsSection: { marginTop: 8, borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  pctRow: { gap: 8 },
  pctItem: { },
  pctBar: { height: 10, borderRadius: 6 },
  pctLabel: { marginTop: 4, fontSize: 12 },
});
