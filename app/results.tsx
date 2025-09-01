import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Share, Platform, Image, Alert } from 'react-native';
import { Text, Heading, Pressable } from '@gluestack-ui/themed';
import { router, useLocalSearchParams } from 'expo-router';
import { useNutritionStore } from '@/store/nutrition-store';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Share2, TrendingUp, TrendingDown, Check, Download, Save } from 'lucide-react-native';
import { NutritionItem, NutritionEntry } from '@/types/nutrition';
import { categorizeMealByHour, combineDateWithNow } from '@/utils/datetime';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateReportHTML } from '@/utils/pdf';
import { loadImageAsDataUrl } from '@/utils/assets';
import { formatDateLabel, normalizeNutritionItems } from '@/utils/report';
import RadarChart from './components/RadarChart';
import SegmentedTabs from './components/SegmentedTabs';
import { useUser } from '@/store/user-store';

export default function ResultsScreen() {
  const { userInfo, addNutritionEntry } = useNutritionStore();
  const { ideal } = useUser();
  const [nutritionData, setNutritionData] = useState<NutritionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const params = useLocalSearchParams();
  const macros = params.macros ? JSON.parse(params.macros as string) : null;
  const date = params.date as string;
  const foodList = params.foodList as string;
  
  const formatDateForDisplay = (dateString: string) => {
    try {
      if (!dateString) {
        return new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      // Handle different date formats
      let date: Date;
      
      // If it's already a full ISO string or Date object
      if (dateString.includes('T') || dateString.includes(':')) {
        date = new Date(dateString);
      } 
      // If it's a YYYY-MM-DD format
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      }
      // Try parsing as-is
      else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const getMacroPercents = (totals: any) => {
    const totalKcal = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
    return {
      protein: totalKcal ? Math.round((totals.protein * 4 / totalKcal) * 100) : 0,
      carbs: totalKcal ? Math.round((totals.carbs * 4 / totalKcal) * 100) : 0,
      fat: totalKcal ? Math.round((totals.fat * 9 / totalKcal) * 100) : 0,
    };
  };
  
  const currentDate = formatDateForDisplay(date || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Only process if we have macros and we're not already in a loading state
    if (macros && loading) {
      setNutritionData(Array.isArray(macros.items) ? macros.items : []);
      setLoading(false);
      setError(null);
    } else if (!macros && loading) {
      setError('No nutrition data available.');
      setLoading(false);
    }
  }, [macros, loading]); // Add loading to dependencies

  const calculateTotals = () => {
    return nutritionData.reduce(
      (acc, item) => {
        return {
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getCalorieStatus = (totalCalories: number) => {
    const targetCalories = 2000;
    const tolerance = 100;
    
    if (totalCalories > targetCalories + tolerance) {
      return { status: 'over', color: '#d32f2f', icon: TrendingUp };
    } else if (totalCalories < targetCalories - tolerance) {
      return { status: 'under', color: '#f57c00', icon: TrendingDown };
    } else {
      return { status: 'on-track', color: '#388e3c', icon: Check };
    }
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
          color: (opacity = 1) => `rgba(187, 164, 110, ${opacity})`,
        }
      ]
    };
  };

  const getPieData = (totals: any) => {
    const total = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
    return [
      {
        name: 'Protein',
        population: Math.round((totals.protein * 4 / total) * 100),
        color: '#BBA46E',
        legendFontColor: '#333333',
        legendFontSize: 14
      },
      {
        name: 'Carbs',
        population: Math.round((totals.carbs * 4 / total) * 100),
        color: '#8bc34a',
        legendFontColor: '#333',
        legendFontSize: 14
      },
      {
        name: 'Fat',
        population: Math.round((totals.fat * 9 / total) * 100),
        color: '#ff9800',
        legendFontColor: '#333',
        legendFontSize: 14
      }
    ];
  };

  const handleBack = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const generatePDFHTML = () => {
    const totals = calculateTotals();
    const calorieStatus = getCalorieStatus(totals.calories);
    
    return generateReportHTML(
      userInfo.name,
      currentDate,
      nutritionData
    );
  };

  const handleExportPDF = async () => {
  try {
    setIsExporting(true);
    
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Prepare local brand logo (base64) for embedding in PDF
    const brandLogo = require('@/assets/images/brand-logo.png');
    const logoDataUrl = await loadImageAsDataUrl(brandLogo);

    // Use shared PDF generator for consistent exports
    const htmlContent = generateReportHTML(
      userInfo.name,
      formatDateLabel(String(date)),
      normalizeNutritionItems(nutritionData),
      ideal?.percents,
      logoDataUrl
    );
    
    const filename = `${userInfo.name}-Daily-Macros-${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (Platform.OS === 'web') {
        // Web implementation using browser's print functionality
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        // Mobile implementation using expo-print
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export Nutrition Report',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', 'PDF has been generated and saved to your device.');
        }
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      let message = `${userInfo.name.toUpperCase()}'S DAILY MACROS - ${currentDate}\n\n`;
      message += `Food and Nutrition Breakdown:\n\n`;
      
      nutritionData.forEach(item => {
        message += `${item.name}: ${item.calories} cal, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fat}g fat\n`;
      });
      
      const totals = calculateTotals();
      message += `\nTOTALS: ${totals.calories} cal, ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat`;
      
      await Share.share({
        message,
        title: `${userInfo.name}'s Nutrition Report`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const totals = calculateTotals();
      const timestamp = combineDateWithNow(date);
      const mealType = categorizeMealByHour(timestamp);
      const nutritionEntry: NutritionEntry = {
        date: date,
        timestamp,
        mealType,
        foodList: foodList,
        items: nutritionData,
        total: totals
      };
      
      addNutritionEntry(nutritionEntry);
      setIsSaved(true);
      
      // Show success feedback
      Alert.alert(
        'Success!', 
        'Your nutrition entry has been saved.',
        [
          {
            text: 'Go to Home',
            onPress: () => router.replace('/'),
          }
        ]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size={Platform.OS === 'ios' ? 'large' : 'large'} 
          color="#BBA46E" 
          style={Platform.OS === 'ios' ? { transform: [{ scale: 1.2 }] } : undefined}
        />
        <Text style={styles.loadingText}>Analyzing your food items...</Text>
        {Platform.OS === 'ios' && (
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text color="$error500" fontSize="$sm">{error}</Text>
      </View>
    );
  }

  const totals = calculateTotals();
  const calorieStatus = getCalorieStatus(totals.calories);
  const StatusIcon = totals.calories > 2500 ? TrendingUp : totals.calories < 1500 ? TrendingDown : Check;

  const renderContent = () => {
    if (activeTab === 'list') {
      return (
        <>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.itemColumn]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Calories</Text>
              <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Protein (g)</Text>
              <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Carbs (g)</Text>
              <Text style={[styles.tableHeaderCell, styles.macroColumn]}>Fat (g)</Text>
            </View>
            
            {nutritionData.map((item, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                <Text style={[styles.tableCell, styles.itemColumn]}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.macroColumn]}>{Math.ceil(item.calories)}</Text>
                <Text style={[styles.tableCell, styles.macroColumn]}>{Math.ceil(item.protein)}</Text>
                <Text style={[styles.tableCell, styles.macroColumn]}>{Math.ceil(item.carbs)}</Text>
                <Text style={[styles.tableCell, styles.macroColumn]}>{Math.ceil(item.fat)}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, styles.itemColumn]}>TOTAL</Text>
              <Text style={[styles.totalCell, styles.macroColumn]}>{Math.ceil(totals.calories)}</Text>
              <Text style={[styles.totalCell, styles.macroColumn]}>{Math.ceil(totals.protein)}</Text>
              <Text style={[styles.totalCell, styles.macroColumn]}>{Math.ceil(totals.carbs)}</Text>
              <Text style={[styles.totalCell, styles.macroColumn]}>{Math.ceil(totals.fat)}</Text>
            </View>
          </View>
          
          <Text style={styles.note}>
            Note: These values are based on average nutritional data and portion size estimations. Individual ingredients or preparation methods may vary.
          </Text>
        </>
      );
    } else {
      return (
        <>
          <View style={styles.analyticsContainer}>
            <View style={styles.calorieStatusContainer}>
              <View style={styles.calorieInfo}>
                <Text style={styles.calorieTitle}>Total Calories</Text>
                <Text style={styles.calorieValue}>{totals.calories}</Text>
              </View>
              <View style={[styles.statusIcon, { backgroundColor: calorieStatus.color }]}>
                <StatusIcon size={24} color="#fff" />
              </View>
            </View>
            
            <Text style={styles.chartTitle}>Macro Distribution</Text>
            <View style={styles.chartContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.webPieChart}>
                  {getPieData(totals).map((item, index) => (
                    <View key={index} style={styles.pieItem}>
                      <View style={[styles.pieColor, { backgroundColor: item.color }]} />
                      <Text style={styles.pieLabel}>{item.name}: {item.population}%</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.webPieChart}>
                  {getPieData(totals).map((item, index) => (
                    <View key={index} style={styles.pieItem}>
                      <View style={[styles.pieColor, { backgroundColor: item.color }]} />
                      <Text style={styles.pieLabel}>{item.name}: {item.population}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <Text style={styles.chartTitle}>Macro Goals vs Consumed (%)</Text>
            <View style={styles.chartContainer}>
              <View style={styles.webBarChart}>
                {getBarData(totals).labels.map((label, index) => {
                  const value = getBarData(totals).datasets[0].data[index];
                  return (
                    <View key={index} style={styles.barItem}>
                      <Text style={styles.barValue}>{Math.round(value)}%</Text>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar, 
                            { height: `${Math.max(value, 5)}%`, backgroundColor: '#BBA46E' }
                          ]} 
                        />
                      </View>
                      <Text style={styles.barLabel}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            
            <Text style={styles.chartTitle}>Macro Balance (Radar)</Text>
            <View style={styles.chartContainer}>
              <RadarChart 
                values={getMacroPercents(totals)} 
                ideal={{ protein: ideal.percents.protein, carbs: ideal.percents.carbs, fat: ideal.percents.fat }} 
                size={260}
              />
            </View>
            
            <View style={styles.macroSummary}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.ceil(totals.protein)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.ceil(totals.carbs)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{Math.ceil(totals.fat)}g</Text>
              </View>
            </View>
          </View>
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://r2-pub.rork.com/attachments/nbnzfjpejlkyi4jjvjdzc' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.titleContainer}>
            <Text style={styles.brandText}>DMR by Jason Lam PT</Text>
            <Text style={styles.title}>{userInfo.name.toUpperCase()}&apos;S DAILY MACROS</Text>
            <Text style={styles.date}>{currentDate}</Text>
          </View>
        </View>
        
        <SegmentedTabs
          options={[
            { label: 'List', value: 'list', testID: 'list-tab' },
            { label: 'Analytics', value: 'analytics', testID: 'analytics-tab' },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'list' | 'analytics')}
          containerStyle={styles.tabContainer}
          activeColor="#BBA46E"
          activeTextColor="#FFFFFF"
          inactiveTextColor="#666666"
          trackColor={Platform.OS === 'ios' ? '#e5e5ea' : '#f0f0f0'}
          borderRadius={Platform.OS === 'ios' ? 12 : 8}
        />
        
        {renderContent()}
        
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && Platform.OS === 'ios' && styles.backButtonPressed
            ]} 
            onPress={handleBack} 
            testID="back-button"
          >
            <ChevronLeft size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          <View style={styles.actionButtons}>
            <Pressable 
              style={({ pressed }) => [
                styles.saveButton,
                isSaving && styles.saveButtonDisabled,
                isSaved && styles.saveButtonSaved,
                pressed && Platform.OS === 'ios' && styles.saveButtonPressed
              ]} 
              onPress={handleSave}
              disabled={isSaving || isSaved}
              testID="save-button"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Save size={20} color="#fff" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Entry'}
              </Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.exportButton,
                isExporting && styles.exportButtonDisabled,
                pressed && Platform.OS === 'ios' && styles.exportButtonPressed
              ]} 
              onPress={handleExportPDF}
              disabled={isExporting}
              testID="export-button"
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Download size={20} color="#fff" />
              )}
              <Text style={styles.exportButtonText}>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.shareButton,
                pressed && Platform.OS === 'ios' && styles.shareButtonPressed
              ]} 
              onPress={handleShare} 
              testID="share-button"
            >
              <Share2 size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEE7DF',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EEE7DF',
  },
  loadingText: {
    marginTop: Platform.OS === 'ios' ? 24 : 16,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BBA46E',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#BBA46E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  brandText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  date: {
    fontSize: 14,
    color: '#333333',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: Platform.OS === 'ios' ? '#e5e5ea' : '#f0f0f0',
    padding: Platform.OS === 'ios' ? 2 : 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    paddingHorizontal: 16,
    borderRadius: Platform.OS === 'ios' ? 10 : 6,
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 36 : 32,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#BBA46E',
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
    elevation: Platform.OS === 'ios' ? 0 : 2,
  },
  tabText: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  activeTabText: {
    color: '#fff',
  },
  analyticsContainer: {
    flex: 1,
  },
  calorieStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 24 : 20,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 1 : 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: 3,
  },
  calorieInfo: {
    flex: 1,
  },
  calorieTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 24,
    padding: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 1 : 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: 3,
    alignItems: 'center',
  },
  webPieChart: {
    width: '100%',
    paddingVertical: 20,
  },
  pieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pieColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  pieLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  webBarChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    width: '100%',
    paddingHorizontal: 20,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  barContainer: {
    height: 150,
    width: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  macroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 24 : 20,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 1 : 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: 3,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoItem: {
    fontSize: 16,
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#BBA46E',
    padding: 12,
  },
  tableHeaderCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#F5F5F5',
  },
  oddRow: {
    backgroundColor: '#F5EEE6',
  },
  tableCell: {
    fontSize: 14,
  },
  itemColumn: {
    flex: 2,
  },
  macroColumn: {
    flex: 1,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#3C3C3C',
  },
  totalCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#388e3c',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 44 : 40,
    justifyContent: 'center',
    minWidth: 100,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  saveButtonSaved: {
    backgroundColor: '#4caf50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  saveButtonPressed: {
    backgroundColor: '#2e7d32',
    transform: [{ scale: 0.98 }],
  },
  exportButton: {
    backgroundColor: '#ff9800',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 44 : 40,
    justifyContent: 'center',
    minWidth: 100,
  },
  exportButtonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  shareButton: {
    backgroundColor: '#BBA46E',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 44 : 40,
    justifyContent: 'center',
    minWidth: 80,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  tabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  exportButtonPressed: {
    backgroundColor: '#f57c00',
    transform: [{ scale: 0.98 }],
  },
  shareButtonPressed: {
    backgroundColor: '#A89660',
    transform: [{ scale: 0.98 }],
  },
});