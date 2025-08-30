import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import { useNutritionStore } from '@/store/nutrition-store';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NutritionItem, NutritionTotal } from '@/types/nutrition';
import { generateReportHTML } from '@/utils/pdf';
import { loadImageAsDataUrl } from '@/utils/assets';
import { formatDateLabel, normalizeNutritionItems } from '@/utils/report';
import RadarChart from './components/RadarChart';

function ceil(n: number) { return Math.ceil(n || 0); }

export default function ResultsPopover() {
  const params = useLocalSearchParams<{ macros?: string; date?: string; foodList?: string }>();
  const { colorScheme, user, ideal } = useUser();
  const { dailyRecords } = useNutritionStore();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const { userInfo } = useNutritionStore();

  const items: NutritionItem[] = useMemo(() => {
    if (params.macros) {
      try {
        const parsed = JSON.parse(params.macros as string);
        return normalizeNutritionItems(parsed.items || []);
      } catch {
        return [];
      }
    }
    if (params.date) {
      const record = dailyRecords.find(r => r.date === params.date);
      if (!record) return [];
      return normalizeNutritionItems(record.entries.flatMap(e => e.items));
    }
    return [];
  }, [params.macros, params.date, dailyRecords]);

  const totals: NutritionTotal = useMemo(() => {
    return items.reduce<NutritionTotal>((acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein: acc.protein + (Number(it.protein) || 0),
      carbs: acc.carbs + (Number(it.carbs) || 0),
      fat: acc.fat + (Number(it.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [items]);

  const totalKcal = useMemo(() => (totals.protein*4 + totals.carbs*4 + totals.fat*9), [totals]);
  const pct = useMemo(() => {
    const safe = (n: number) => {
      if (!isFinite(n)) return 0;
      return Math.max(0, Math.min(100, Math.round(n)));
    };
    return {
      P: totalKcal > 0 ? safe((totals.protein*4/totalKcal)*100) : 0,
      C: totalKcal > 0 ? safe((totals.carbs*4/totalKcal)*100) : 0,
      F: totalKcal > 0 ? safe((totals.fat*9/totalKcal)*100) : 0,
    };
  }, [totalKcal, totals]);

  const displayDate = useMemo(() => formatDateLabel(String(params.date ?? new Date())), [params.date]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const brandLogo = require('@/assets/images/brand-logo.png');
      const logoDataUrl = await loadImageAsDataUrl(brandLogo);

      const html = generateReportHTML(
        user.name,
        displayDate,
        items,
        ideal?.percents,
        logoDataUrl
      );
      
      const filename = `${user.name}-Daily-Macros-${(params.date ?? '').toString() || new Date().toISOString().split('T')[0]}.pdf`;
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

  return (
    <Pressable onPress={() => router.back()} style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}>
      <Stack.Screen options={{
        title: 'Report',
        presentation: 'modal',
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.darkText,
      }} />
      <View onStartShouldSetResponder={() => true} style={[styles.modalCard, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.headerRow, { borderBottomColor: isDarkMode ? '#444' : '#e2e2e2' }]}>
          <Text style={[styles.title, { color: theme.darkText }]}>{displayDate}</Text>
          <View style={[styles.tabRow, { backgroundColor: `${theme.lightGold}33` } ]}>
            <TouchableOpacity onPress={() => setActiveTab('list')} style={[styles.tabBtn, { borderColor: theme.tint }, activeTab === 'list' ? [styles.tabActive, { backgroundColor: theme.tint }] : null]}>
              <Text style={[styles.tabText, { color: activeTab === 'list' ? theme.background : theme.darkText }]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('analytics')} style={[styles.tabBtn, { borderColor: theme.tint }, activeTab === 'analytics' ? [styles.tabActive, { backgroundColor: theme.tint }] : null]}>
              <Text style={[styles.tabText, { color: activeTab === 'analytics' ? theme.background : theme.darkText }]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'list' ? (
            <>
              {/* Info Block */}
              <View style={styles.infoContainer}>
                <Text style={[styles.infoItem, { color: theme.darkText }]}>Name: {userInfo?.name ?? ''}</Text>
                <Text style={[styles.infoItem, { color: theme.darkText }]}>Goal: Daily Intake Overview</Text>
                <Text style={[styles.infoItem, { color: theme.darkText }]}>Method: AI Estimation</Text>
              </View>

              {/* List tab does not show RadarChart */}

              <Text style={[styles.description, { color: theme.darkText }]}>Here is a detailed breakdown of your food and drink intake for the day, along with estimated macronutrient values.</Text>

              {/* Totals */}
              <View style={styles.totalsRow}>
                <View style={[styles.totalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : `${theme.lightGold}33` }]}>
                  <Text style={[styles.totalValue, { color: theme.darkText }]}>{ceil(totals.calories)}</Text>
                  <Text style={[styles.totalLabel, { color: theme.lightText }]}>Calories</Text>
                </View>
                <View style={[styles.totalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : `${theme.lightGold}33` }]}>
                  <Text style={[styles.totalValue, { color: theme.darkText }]}>{ceil(totals.protein)}g</Text>
                  <Text style={[styles.totalLabel, { color: theme.lightText }]}>Protein</Text>
                </View>
                <View style={[styles.totalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : `${theme.lightGold}33` }]}>
                  <Text style={[styles.totalValue, { color: theme.darkText }]}>{ceil(totals.carbs)}g</Text>
                  <Text style={[styles.totalLabel, { color: theme.lightText }]}>Carbs</Text>
                </View>
                <View style={[styles.totalBox, { backgroundColor: isDarkMode ? '#2e2e2e' : `${theme.lightGold}33` }]}>
                  <Text style={[styles.totalValue, { color: theme.darkText }]}>{ceil(totals.fat)}g</Text>
                  <Text style={[styles.totalLabel, { color: theme.lightText }]}>Fat</Text>
                </View>
              </View>

              {/* Table */}
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { backgroundColor: theme.tint }]}>
                  <Text style={[styles.tableHeaderCell, styles.itemColumn]}>Item</Text>
                  <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Calories</Text>
                  <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Protein (g)</Text>
                  <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Carbs (g)</Text>
                  <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Fat (g)</Text>
                </View>
                {items.map((item, index) => (
                  <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                    <Text style={[styles.tableCell, styles.itemColumn]}>{item.name}</Text>
                    <Text style={[styles.tableCell, styles.macroColumn]}>{ceil(item.calories)}</Text>
                    <Text style={[styles.tableCell, styles.macroColumn]}>{ceil(item.protein)}</Text>
                    <Text style={[styles.tableCell, styles.macroColumn]}>{ceil(item.carbs)}</Text>
                    <Text style={[styles.tableCell, styles.macroColumn]}>{ceil(item.fat)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalCell, styles.itemColumn]}>TOTAL</Text>
                  <Text style={[styles.totalCell, styles.macroColumn]}>{ceil(totals.calories)}</Text>
                  <Text style={[styles.totalCell, styles.macroColumn]}>{ceil(totals.protein)}</Text>
                  <Text style={[styles.totalCell, styles.macroColumn]}>{ceil(totals.carbs)}</Text>
                  <Text style={[styles.totalCell, styles.macroColumn]}>{ceil(totals.fat)}</Text>
                </View>
              </View>
              <Text style={[styles.tableNote, { color: theme.lightText }]}>Note: These values are based on average nutritional data and portion size estimations. Individual ingredients or preparation methods may vary.</Text>
            </>
          ) : (
            <>
              {/* Analytics */}
              <View style={styles.analyticsSection}>
                <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Macro Distribution</Text>
                {/* Radar: Ideal vs Actual */}
                <View style={[styles.analyticsSection, { backgroundColor: `${theme.lightGold}33`, alignItems: 'center' }]}>
                  <RadarChart
                    size={220}
                    values={{ protein: pct.P, carbs: pct.C, fat: pct.F }}
                    ideal={{ protein: ideal.percents.protein, carbs: ideal.percents.carbs, fat: ideal.percents.fat }}
                    // Brand-aligned styling
                    color={theme.tint}
                    dashColor={theme.lightGold}
                    brandPrimary={theme.tint}
                    brandAccent={theme.lightGold}
                    labelColor={theme.darkText}
                    backgroundColor={'transparent'}
                    gridColor={isDarkMode ? '#3A3A3A' : '#BFC6CF'}
                    strokeWidth={2}
                    gridWidth={1}
                    curveTension={0.55}
                    fillOpacity={0.18}
                    showGradientBg
                  />
                </View>
                <View style={styles.pctRow}>
                  <View style={styles.pctItem}>
                    <View style={[styles.pctBar, { width: `${pct.P}%`, backgroundColor: theme.tint }]} />
                    <Text style={[styles.pctLabel, { color: theme.lightText }]}>Protein {pct.P}%</Text>
                  </View>
                  <View style={styles.pctItem}>
                    <View style={[styles.pctBar, { width: `${pct.C}%`, backgroundColor: theme.tint }]} />
                    <Text style={[styles.pctLabel, { color: theme.lightText }]}>Carbs {pct.C}%</Text>
                  </View>
                  <View style={styles.pctItem}>
                    <View style={[styles.pctBar, { width: `${pct.F}%`, backgroundColor: theme.tint }]} />
                    <Text style={[styles.pctLabel, { color: theme.lightText }]}>Fat {pct.F}%</Text>
                  </View>
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkText, marginTop: 16 }]}>Macro Goals vs Consumed (%)</Text>
                <View style={styles.barRow}>
                  {/* reuse same bars for simplicity; in main Results these map to goal bars */}
                  {['Protein','Carbs','Fat'].map((label, index) => {
                    const value = [pct.P, pct.C, pct.F][index];
                    return (
                      <View key={label} style={styles.barItem}>
                        <Text style={styles.barValue}>{Math.max(Math.round(value), 0)}%</Text>
                        <View style={[styles.barContainer, { backgroundColor: `${theme.lightGold}33` }]}>
                          <View style={[styles.bar, { height: `${Math.max(value, 5)}%`, backgroundColor: theme.tint }]} />
                        </View>
                        <Text style={styles.barLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: theme.tint }]} onPress={handleExport} disabled={isExporting}>
            <Text style={[styles.exportText, { color: theme.background }]}>{isExporting ? 'Exporting…' : 'Export as PDF'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 720, maxHeight: '85%', borderRadius: 16, overflow: 'hidden' },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  tabRow: { flexDirection: 'row', gap: 8, backgroundColor: '#EFE7DB', padding: 4, borderRadius: 24 },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: '#BBA46E' },
  tabActive: { backgroundColor: '#BBA46E' },
  tabText: { fontSize: 12, fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  infoContainer: { gap: 2 },
  infoItem: { fontSize: 14 },
  description: { fontSize: 14, marginTop: 8 },
  tableNote: { fontSize: 12, marginTop: 8 },
  totalBox: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  totalLabel: { fontSize: 12, fontWeight: '600' },
  tableContainer: { borderRadius: 12, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#e0d6c7' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#BBA46E', paddingVertical: 10, paddingHorizontal: 12 },
  tableHeaderCell: { color: '#fff', fontWeight: '700', fontSize: 12 },
  itemColumn: { flex: 2 },
  macroColumn: { flex: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12 },
  evenRow: { backgroundColor: '#fff' },
  oddRow: { backgroundColor: '#F5EEE6' },
  tableCell: { fontSize: 14, color: '#333' },
  totalRow: { flexDirection: 'row', backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 12 },
  totalCell: { color: '#fff', fontWeight: '800' },
  analyticsSection: { backgroundColor: '#F5EEE6', borderRadius: 12, padding: 16, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  pctRow: { gap: 12 },
  pctItem: { marginBottom: 8 },
  pctBar: { height: 8, borderRadius: 6 },
  pctLabel: { marginTop: 6, fontSize: 12 },
  barRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 8, gap: 16 },
  barItem: { alignItems: 'center', width: 80 },
  barValue: { fontSize: 12, fontWeight: '700', marginBottom: 6, color: '#333' },
  barContainer: { width: 24, height: 120, borderRadius: 12, backgroundColor: '#e9e4da', overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  barLabel: { marginTop: 6, fontSize: 12, color: '#333' },
  exportBtn: { marginTop: 12, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  exportText: { fontWeight: '800' },
});
