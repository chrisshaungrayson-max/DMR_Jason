import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share2, Download, Calculator } from 'lucide-react-native';
import { useUser } from '@/store/user-store';
import Colors from '@/constants/colors';
import { FitnessGoal, FITNESS_GOALS } from '@/types/tdee';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
} from '@/utils/tdee-calculations';
import { generateTDEETextSummary, TDEEExportData } from '@/utils/tdee-export';
import { exportViewAsImage, getDevicePerformanceTier } from '@/utils/tdee-image-export';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import ViewShot, { captureRef, captureScreen } from 'react-native-view-shot';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import RadarChart from './components/RadarChart';
import ImageExportButton from './components/ImageExportButton';

export default function TDEEResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const [isCapturingExport, setIsCapturingExport] = useState(false);
  const viewRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const exportViewRef = useRef<View>(null);
  const viewShotRef = useRef<any>(null);
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Parse parameters
  const name = params.name as string;
  const age = Number(params.age);
  const gender = params.gender as 'male' | 'female' | 'other';
  const height = Number(params.height);
  const weight = Number(params.weight);
  const bodyFat = Number(params.bodyFat) || 0;
  const activityLevel = params.activityLevel as 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  const goals = JSON.parse(params.goals as string) as FitnessGoal[];
  const isMetric = params.isMetric === 'true';

  // Calculate TDEE values
  const bmr = calculateBMR(gender, age, weight, height);
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // Calculate safe target calories based on goals
  const getSafeTargetCalories = () => {
    if (goals.length === 0) return tdee;
    
    const hasWeightLossGoal = goals.some(goal => 
      goal === 'lose_weight' || goal === 'lose_body_fat'
    );
    const hasMuscleGainGoal = goals.some(goal => 
      goal === 'gain_lean_muscle'
    );
    const hasPerformanceGoal = goals.some(goal => 
      goal === 'improve_athletic_performance'
    );
    const hasMaintenanceGoal = goals.some(goal => 
      goal === 'maintain_weight' || goal === 'general_health'
    );

    // Safe deficit calculation (max 20% of TDEE, minimum 1200 cal for women, 1500 for men)
    if (hasWeightLossGoal) {
      const maxDeficit = Math.min(tdee * 0.2, 750); // Max 20% or 750 cal deficit
      const minCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350;
      return Math.max(tdee - maxDeficit, minCalories);
    }
    
    // Safe surplus calculation (max 15% of TDEE, typically 300-500 cal)
    if (hasMuscleGainGoal) {
      const maxSurplus = Math.min(tdee * 0.15, 500); // Max 15% or 500 cal surplus
      return tdee + maxSurplus;
    }
    
    // Performance goals - slight surplus
    if (hasPerformanceGoal) {
      return tdee + 250;
    }
    
    // Maintenance
    return tdee;
  };

  const targetCalories = getSafeTargetCalories();
  const macros = calculateMacroTargets(targetCalories, goals);

  // Get macro percentages for radar chart
  const getMacroPercents = () => {
    return {
      protein: macros.protein.percentage,
      carbs: macros.carbs.percentage,
      fat: macros.fat.percentage
    };
  };

  // Default ideal macro split for comparison
  const idealMacros = {
    protein: 30,
    carbs: 40,
    fat: 30
  };

  // Generate goal-specific recommendations
  const getGoalRecommendations = () => {
    if (goals.length === 0) return null;

    const primaryGoal = goals[0];
    const goalInfo = FITNESS_GOALS.find(g => g.key === primaryGoal);
    
    if (!goalInfo) return null;

    const recommendations = {
      'lose_weight': {
        title: 'Weight Loss Recommendations',
        tips: [
          'Aim for 1-2 pounds of weight loss per week for sustainable results',
          'Focus on whole foods and lean proteins to maintain satiety',
          'Consider strength training to preserve muscle mass during weight loss',
          'Stay hydrated and prioritize sleep for optimal metabolism'
        ],
        macroExplanation: 'Higher protein (40%) helps preserve muscle mass and increases satiety during caloric deficit.'
      },
      'lose_body_fat': {
        title: 'Body Fat Reduction Recommendations',
        tips: [
          'Combine resistance training with cardio for optimal body composition',
          'Prioritize protein timing around workouts for muscle preservation',
          'Consider intermittent fasting or meal timing strategies',
          'Track body measurements and progress photos, not just weight'
        ],
        macroExplanation: 'High protein intake supports muscle preservation while in a moderate caloric deficit.'
      },
      'gain_lean_muscle': {
        title: 'Muscle Building Recommendations',
        tips: [
          'Focus on progressive overload in your resistance training',
          'Eat in a moderate surplus to minimize fat gain',
          'Consume protein throughout the day, especially post-workout',
          'Prioritize compound movements and adequate recovery time'
        ],
        macroExplanation: 'Balanced macros with adequate carbs (40%) fuel intense training sessions for muscle growth.'
      },
      'maintain_weight': {
        title: 'Weight Maintenance Recommendations',
        tips: [
          'Focus on consistent eating patterns and regular exercise',
          'Monitor weight weekly and adjust calories as needed',
          'Prioritize nutrient-dense foods for overall health',
          'Maintain an active lifestyle with both cardio and strength training'
        ],
        macroExplanation: 'Balanced macro distribution supports stable energy and overall health maintenance.'
      },
      'improve_athletic_performance': {
        title: 'Athletic Performance Recommendations',
        tips: [
          'Time carbohydrate intake around training sessions',
          'Focus on nutrient timing for optimal recovery',
          'Stay well-hydrated before, during, and after training',
          'Consider sport-specific nutrition strategies'
        ],
        macroExplanation: 'Higher carbs (50%) provide sustained energy for intense training and optimal performance.'
      },
      'general_health': {
        title: 'General Health Recommendations',
        tips: [
          'Focus on a variety of whole, minimally processed foods',
          'Include plenty of fruits and vegetables for micronutrients',
          'Maintain regular meal timing and portion control',
          'Stay active with a mix of cardio and strength activities'
        ],
        macroExplanation: 'Balanced macros support overall health, energy levels, and long-term wellness.'
      }
    };

    return recommendations[primaryGoal] || null;
  };

  // Bar Chart Component for Calorie Comparison
  const CalorieBarChart = ({ width = 300, height = 150 }: { width?: number; height?: number }) => {
    const maxValue = Math.max(tdee, targetCalories) * 1.1;
    const tdeeBarHeight = (tdee / maxValue) * (height - 40);
    const targetBarHeight = (targetCalories / maxValue) * (height - 40);
    const barWidth = 60;
    const spacing = 80;
    
    return (
      <View style={{ alignItems: 'center' }}>
        <Svg width={width} height={height}>
          {/* TDEE Bar */}
          <Rect
            x={(width / 2) - spacing - (barWidth / 2)}
            y={height - tdeeBarHeight - 20}
            width={barWidth}
            height={tdeeBarHeight}
            fill={theme.tint}
            rx={4}
          />
          
          {/* Target Calories Bar */}
          <Rect
            x={(width / 2) + spacing - (barWidth / 2)}
            y={height - targetBarHeight - 20}
            width={barWidth}
            height={targetBarHeight}
            fill="#6CC04A"
            rx={4}
          />
          
          {/* TDEE Label */}
          <SvgText
            x={(width / 2) - spacing}
            y={height - 5}
            fontSize={12}
            fill={theme.text}
            textAnchor="middle"
            fontWeight="600"
          >
            TDEE
          </SvgText>
          
          {/* Target Label */}
          <SvgText
            x={(width / 2) + spacing}
            y={height - 5}
            fontSize={12}
            fill={theme.text}
            textAnchor="middle"
            fontWeight="600"
          >
            Target
          </SvgText>
          
          {/* TDEE Value */}
          <SvgText
            x={(width / 2) - spacing}
            y={height - tdeeBarHeight - 25}
            fontSize={11}
            fill={theme.text}
            textAnchor="middle"
            fontWeight="500"
          >
            {Math.round(tdee)}
          </SvgText>
          
          {/* Target Value */}
          <SvgText
            x={(width / 2) + spacing}
            y={height - targetBarHeight - 25}
            fontSize={11}
            fill={theme.text}
            textAnchor="middle"
            fontWeight="500"
          >
            {Math.round(targetCalories)}
          </SvgText>
        </Svg>
      </View>
    );
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      padding: 8,
    },
    scrollContainer: {
      padding: 16,
    },
    welcomeSection: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.placeholder,
      textAlign: 'center',
      lineHeight: 22,
    },
    resultsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    resultCard: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    resultValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.tint,
      marginBottom: 4,
    },
    resultLabel: {
      fontSize: 14,
      color: theme.placeholder,
      textAlign: 'center',
    },
    section: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    macroRowLast: {
      borderBottomWidth: 0,
    },
    macroInfo: {
      flex: 1,
    },
    macroName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 2,
    },
    macroPercentage: {
      fontSize: 14,
      color: theme.placeholder,
    },
    macroGrams: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.tint,
    },
    goalsSection: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    goalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    goalBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.tint,
      marginRight: 12,
    },
    goalText: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    summarySection: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 16,
      color: theme.text,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    actionsSection: {
      gap: 12,
      marginBottom: 32,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.tint,
      padding: 16,
      borderRadius: 12,
    },
    actionButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    actionButtonTextSecondary: {
      color: theme.text,
    },
    chartDescription: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    tableContainer: {
      marginTop: 16,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: theme.tint,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    tableHeaderCell: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    evenRow: {
      backgroundColor: theme.background,
    },
    oddRow: {
      backgroundColor: theme.cardBackground,
    },
    tableCell: {
      fontSize: 14,
      color: theme.text,
      textAlign: 'center',
    },
    totalRow: {
      flexDirection: 'row',
      backgroundColor: theme.tint + '20',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 2,
      borderTopColor: theme.tint,
    },
    totalCell: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    macroNameColumn: {
      flex: 2,
      textAlign: 'left',
    },
    macroDataColumn: {
      flex: 1,
    },
    recommendationCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      marginTop: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.tint,
    },
    macroExplanationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    macroExplanation: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
    },
    tipsContainer: {
      marginTop: 16,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
      paddingRight: 16,
    },
    tipBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.tint,
      marginTop: 7,
      marginRight: 12,
      flexShrink: 0,
    },
    tipText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
      flex: 1,
    },
    additionalGoalsNote: {
      backgroundColor: theme.tint + '15',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
    },
    noteText: {
      fontSize: 13,
      color: theme.text,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    metricsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    metricCard: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    metricLabel: {
      fontSize: 14,
      color: theme.placeholder,
      marginBottom: 4,
      textAlign: 'center',
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.tint,
      marginBottom: 4,
    },
    metricDescription: {
      fontSize: 12,
      color: theme.placeholder,
      textAlign: 'center',
      lineHeight: 16,
    },
    goalsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    goalCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.tint,
      flex: 1,
      minWidth: '45%',
      maxWidth: '48%',
    },
    goalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    goalDescription: {
      fontSize: 14,
      color: theme.placeholder,
      lineHeight: 18,
    },
    adjustmentCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: targetCalories < tdee ? '#FF6B6B' : '#6CC04A',
    },
    adjustmentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    adjustmentText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.tint,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 8,
    },
    exportButtonDisabled: {
      opacity: 0.6,
    },
    exportButtonPressed: {
      opacity: 0.8,
    },
    exportButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.tint,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    shareButtonPressed: {
      opacity: 0.8,
    },
    shareButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    saveImageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D4A574',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    infoTable: {
      backgroundColor: '#fff',
      borderRadius: 8,
      overflow: 'hidden',
    },
    infoTableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tableLabel: {
      fontSize: 14,
      color: theme.placeholder,
      fontWeight: '500',
    },
    tableValue: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '600',
    },
    exportContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: theme.background,
      zIndex: -1,
    },
  });

  // Utility: protect long-running native calls with a timeout so UI doesn't stay stuck
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      promise.then(
        (result) => {
          clearTimeout(t);
          resolve(result);
        },
        (error) => {
          clearTimeout(t);
          reject(error);
        }
      );
    });
  }

  // Get device-appropriate timeout values
  function getDeviceTimeouts() {
    const deviceTier = getDevicePerformanceTier();
    return {
      fullExport: deviceTier === 'high' ? 8000 : deviceTier === 'medium' ? 12000 : 18000,
      visibleCapture: deviceTier === 'high' ? 6000 : deviceTier === 'medium' ? 9000 : 15000,
      screenCapture: deviceTier === 'high' ? 5000 : deviceTier === 'medium' ? 8000 : 12000
    };
  }

  // Hooks used by ImageExportButton to prepare/cleanup the hidden export view
  const prepareExportView = useCallback(async () => {
    setIsCapturingExport(true);
    // Give RN a frame to render the hidden export view before capture
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => setTimeout(resolve, 120));
      });
    });
  }, []);

  const cleanupExportView = useCallback(() => {
    setIsCapturingExport(false);
  }, []);

  // Export handlers
  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (Platform.OS === 'web') {
        window.print();
        return;
      }

      // Render hidden flattened export view and capture full scroll content
      setIsCapturingExport(true);
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => setTimeout(() => resolve(), 120));
        });
      });

      if (exportViewRef.current) {
        try {
          const timeouts = getDeviceTimeouts();
          const deviceTier = getDevicePerformanceTier();
          const exportQuality = deviceTier === 'high' ? 1 : deviceTier === 'medium' ? 0.9 : 0.8;
          
          const uri = await withTimeout(
            captureRef(exportViewRef.current, {
              format: 'png',
              quality: exportQuality,
              result: 'tmpfile',
              fileName: `tdee-results-${Date.now()}`,
            }),
            timeouts.fullExport,
            'Full export capture'
          );
          // Remove overlay and spinner before opening share sheet so UI isn't stuck
          setIsCapturingExport(false);
          setIsExporting(false);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Export TDEE Results',
            });
          }
          return;
        } catch (e) {
          console.warn('Full export capture failed, falling back to visible capture:', e);
          // Hide the export overlay before fallbacks
          setIsCapturingExport(false);
        }
      }

      // As a fallback, capture the currently visible screen
      try {
        if (viewShotRef.current?.capture) {
          const timeouts = getDeviceTimeouts();
          const deviceTier = getDevicePerformanceTier();
          const captureQuality = deviceTier === 'high' ? 1 : deviceTier === 'medium' ? 0.9 : 0.8;
          
          const uri: string = await withTimeout(
            viewShotRef.current.capture({
              format: 'png',
              quality: captureQuality,
              result: 'tmpfile',
              fileName: `tdee-results-${Date.now()}`,
            }),
            timeouts.visibleCapture,
            'Visible capture'
          );
          setIsExporting(false);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Export TDEE Results',
            });
          }
          return;
        }
      } catch (err) {
        console.warn('Visible screen capture failed, trying captureScreen:', err);
      }

      const timeouts = getDeviceTimeouts();
      const deviceTier = getDevicePerformanceTier();
      const screenQuality = deviceTier === 'high' ? 1 : deviceTier === 'medium' ? 0.9 : 0.8;
      
      const uri = await withTimeout(
        captureScreen({ format: 'png', quality: screenQuality, result: 'tmpfile' }),
        timeouts.screenCapture,
        'Device screen capture'
      );
      setIsExporting(false);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Export TDEE Results',
        });
      }
    } catch (error) {
      console.error('Error exporting image:', error);
      Alert.alert('Error', 'Failed to export image. Please try again.');
    } finally {
      setIsCapturingExport(false);
      setIsExporting(false);
    }
  };
  
  const handleShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const exportData: TDEEExportData = {
        name: name,
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
        calculatedAt: new Date().toISOString(),
      };
      
      const message = generateTDEETextSummary(exportData);
      
      await Share.share({
        message,
        title: `${name}'s TDEE Report`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      ref={viewRef}
      collapsable={false}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <ViewShot
        ref={viewShotRef}
        style={{ flex: 1, backgroundColor: theme.background }}
        options={{ format: 'png', quality: 1, result: 'tmpfile', fileName: `tdee-results` }}
      >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Your TDEE Results</Text>
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Download size={16} color="#fff" />
            )}
            <Text style={styles.exportButtonText}>
              {isExporting ? 'Exporting...' : 'Export'}
            </Text>
          </Pressable>

          <ImageExportButton
            viewRef={exportViewRef}
            title="Save Image"
            style={styles.saveImageButton}
            onBeforeCapture={prepareExportView}
            onAfterCapture={cleanupExportView}
            captureOptions={{
              format: 'jpg',
              quality: 0.8,
              result: 'tmpfile'
            }}
            saveOptions={{
              album: 'TDEE Reports'
            }}
          />
          
          <Pressable 
            style={({ pressed }) => [
              styles.shareButton,
              pressed && Platform.OS === 'ios' && styles.shareButtonPressed
            ]} 
            onPress={handleShare}
          >
            <Share2 size={16} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollContainer, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        collapsable={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Hello {name}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Here are your personalized calorie and macro recommendations based on your goals
          </Text>
        </View>

        {/* BMR, TDEE, and Target Display */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Your BMR</Text>
            <Text style={styles.metricValue}>{Math.round(bmr)} cal</Text>
            <Text style={styles.metricDescription}>
              Base Metabolic Rate
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Your TDEE</Text>
            <Text style={styles.metricValue}>{Math.round(tdee)} cal</Text>
            <Text style={styles.metricDescription}>
              Total Daily Energy Expenditure
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Your Target</Text>
            <Text style={styles.metricValue}>{Math.round(targetCalories)} cal</Text>
            <Text style={styles.metricDescription}>
              {targetCalories < tdee ? 'Safe Calorie Deficit' : 
               targetCalories > tdee ? 'Safe Calorie Surplus' : 
               'Maintenance Calories'}
            </Text>
          </View>
        </View>

        {/* User Information Summary Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Your Information</Text>
          <View style={styles.infoTable}>
            <View style={styles.infoTableRow}>
              <Text style={styles.tableLabel}>Age</Text>
              <Text style={styles.tableValue}>{age} years</Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.tableLabel}>Gender</Text>
              <Text style={styles.tableValue}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.tableLabel}>Height</Text>
              <Text style={styles.tableValue}>
                {isMetric 
                  ? `${height} cm` 
                  : `${Math.floor(parseFloat(height.toString()) / 12)}'${Math.round(parseFloat(height.toString()) % 12)}"`
                }
              </Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.tableLabel}>Weight</Text>
              <Text style={styles.tableValue}>
                {isMetric 
                  ? `${weight} kg` 
                  : `${weight} lbs`
                }
              </Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.tableLabel}>Activity Level</Text>
              <Text style={styles.tableValue}>{activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)}</Text>
            </View>
            {bodyFat > 0 && (
              <View style={styles.infoTableRow}>
                <Text style={styles.tableLabel}>Body Fat</Text>
                <Text style={styles.tableValue}>{bodyFat}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Your Fitness Goals</Text>
          <View style={styles.goalsGrid}>
            {goals.map((goal) => {
              const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
              return (
                <View key={goal} style={styles.goalCard}>
                  <Text style={styles.goalTitle}>{goalInfo?.label || goal}</Text>
                  <Text style={styles.goalDescription}>{goalInfo?.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Goal-Specific Recommendations */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Personalized Recommendations</Text>
            
            {goals.map((goal) => {
              const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
              const recommendations = getGoalRecommendations();
              
              if (!goalInfo || !recommendations) return null;
              
              const goalRecommendations = {
                'lose_weight': {
                  title: 'Weight Loss Tips',
                  tips: [
                    'Aim for 1-2 pounds of weight loss per week for sustainable results',
                    'Focus on whole foods and lean proteins to maintain satiety',
                    'Consider strength training to preserve muscle mass during weight loss'
                  ]
                },
                'lose_body_fat': {
                  title: 'Body Fat Reduction Tips',
                  tips: [
                    'Combine resistance training with cardio for optimal body composition',
                    'Prioritize protein timing around workouts for muscle preservation',
                    'Track body measurements and progress photos, not just weight'
                  ]
                },
                'gain_lean_muscle': {
                  title: 'Muscle Building Tips',
                  tips: [
                    'Focus on progressive overload in your resistance training',
                    'Eat in a moderate surplus to minimize fat gain',
                    'Consume protein throughout the day, especially post-workout'
                  ]
                },
                'maintain_weight': {
                  title: 'Weight Maintenance Tips',
                  tips: [
                    'Focus on consistent eating patterns and regular exercise',
                    'Monitor weight weekly and adjust calories as needed',
                    'Prioritize nutrient-dense foods for overall health'
                  ]
                },
                'improve_athletic_performance': {
                  title: 'Athletic Performance Tips',
                  tips: [
                    'Time carbohydrate intake around training sessions',
                    'Focus on nutrient timing for optimal recovery',
                    'Stay well-hydrated before, during, and after training'
                  ]
                },
                'general_health': {
                  title: 'General Health Tips',
                  tips: [
                    'Focus on a variety of whole, minimally processed foods',
                    'Include plenty of fruits and vegetables for micronutrients',
                    'Maintain regular meal timing and portion control'
                  ]
                }
              };

              const goalRec = goalRecommendations[goal];
              if (!goalRec) return null;

              return (
                <View key={goal} style={styles.recommendationCard}>
                  <Text style={styles.macroExplanationTitle}>{goalRec.title}</Text>
                  {goalRec.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <View style={styles.tipBullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Calorie Comparison Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calorie Comparison</Text>
          <CalorieBarChart width={Dimensions.get('window').width - 80} height={160} />
          <Text style={[styles.chartDescription, { color: theme.placeholder }]}>
            Your TDEE vs target calories based on your fitness goals
          </Text>
          
          {/* Calorie Adjustment Explanation */}
          {Math.abs(targetCalories - tdee) > 50 && (
            <View style={styles.adjustmentCard}>
              <Text style={styles.adjustmentTitle}>
                {targetCalories < tdee ? '📉 Safe Deficit Applied' : '📈 Safe Surplus Applied'}
              </Text>
              <Text style={styles.adjustmentText}>
                {targetCalories < tdee 
                  ? `Your target is ${Math.round(tdee - targetCalories)} calories below your TDEE for safe, sustainable weight loss (max 20% deficit with minimum safety limits).`
                  : `Your target is ${Math.round(targetCalories - tdee)} calories above your TDEE for controlled muscle gain (max 15% surplus to minimize fat gain).`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Macro Breakdown Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macro Distribution</Text>
          <RadarChart 
            values={getMacroPercents()} 
            ideal={idealMacros}
            size={240}
            brandPrimary={theme.tint}
            brandAccent="#6CC04A"
            labelColor={theme.text}
          />
          <Text style={[styles.chartDescription, { color: theme.placeholder }]}>
            Your macro targets vs balanced ideal split
          </Text>
        </View>

        {/* Macro Breakdown Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Macro Targets</Text>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.macroNameColumn]}>Macro</Text>
              <Text style={[styles.tableHeaderCell, styles.macroDataColumn]}>Grams</Text>
              <Text style={[styles.tableHeaderCell, styles.macroDataColumn]}>Calories</Text>
              <Text style={[styles.tableHeaderCell, styles.macroDataColumn]}>% of Total</Text>
            </View>
            
            <View style={[styles.tableRow, styles.evenRow]}>
              <Text style={[styles.tableCell, styles.macroNameColumn]}>Protein</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.protein.grams}g</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.protein.grams * 4}</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.protein.percentage}%</Text>
            </View>
            
            <View style={[styles.tableRow, styles.oddRow]}>
              <Text style={[styles.tableCell, styles.macroNameColumn]}>Carbohydrates</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.carbs.grams}g</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.carbs.grams * 4}</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.carbs.percentage}%</Text>
            </View>
            
            <View style={[styles.tableRow, styles.evenRow]}>
              <Text style={[styles.tableCell, styles.macroNameColumn]}>Fat</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.fat.grams}g</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.fat.grams * 9}</Text>
              <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.fat.percentage}%</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, styles.macroNameColumn]}>TOTAL</Text>
              <Text style={[styles.totalCell, styles.macroDataColumn]}>
                {macros.protein.grams + macros.carbs.grams + macros.fat.grams}g
              </Text>
              <Text style={[styles.totalCell, styles.macroDataColumn]}>{targetCalories}</Text>
              <Text style={[styles.totalCell, styles.macroDataColumn]}>100%</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Share2 size={20} color="white" />
            <Text style={styles.actionButtonText}>Share Results</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.actionButton, styles.actionButtonSecondary]} 
            onPress={() => router.push('/tdee-input')}
          >
            <Calculator size={20} color={theme.text} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Recalculate
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </ViewShot>
      
      {/* Hidden Export View - Flattened Layout */}
      {isCapturingExport && (
        <View
          ref={exportViewRef}
          style={[
            styles.exportContainer,
            { backgroundColor: theme.background }
          ]}
          pointerEvents="none"
          collapsable={false}
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Hello {name}! 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Here are your personalized calorie and macro recommendations based on your goals
            </Text>
          </View>

          {/* BMR, TDEE, and Target Display */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Your BMR</Text>
              <Text style={styles.metricValue}>{Math.round(bmr)} cal</Text>
              <Text style={styles.metricDescription}>Base Metabolic Rate</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Your TDEE</Text>
              <Text style={styles.metricValue}>{Math.round(tdee)} cal</Text>
              <Text style={styles.metricDescription}>Total Daily Energy Expenditure</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Your Target</Text>
              <Text style={styles.metricValue}>{Math.round(targetCalories)} cal</Text>
              <Text style={styles.metricDescription}>
                {targetCalories < tdee ? 'Safe Calorie Deficit' : 
                 targetCalories > tdee ? 'Safe Calorie Surplus' : 
                 'Maintenance Calories'}
              </Text>
            </View>
          </View>

          {/* User Information Summary Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Your Information</Text>
            <View style={styles.infoTable}>
              <View style={styles.infoTableRow}>
                <Text style={styles.tableLabel}>Age</Text>
                <Text style={styles.tableValue}>{age} years</Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.tableLabel}>Gender</Text>
                <Text style={styles.tableValue}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.tableLabel}>Height</Text>
                <Text style={styles.tableValue}>
                  {isMetric 
                    ? `${height} cm` 
                    : `${Math.floor(parseFloat(height.toString()) / 12)}'${Math.round(parseFloat(height.toString()) % 12)}"`
                  }
                </Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.tableLabel}>Weight</Text>
                <Text style={styles.tableValue}>
                  {isMetric 
                    ? `${weight} kg` 
                    : `${weight} lbs`
                  }
                </Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.tableLabel}>Activity Level</Text>
                <Text style={styles.tableValue}>{activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)}</Text>
              </View>
              {bodyFat > 0 && (
                <View style={styles.infoTableRow}>
                  <Text style={styles.tableLabel}>Body Fat</Text>
                  <Text style={styles.tableValue}>{bodyFat}%</Text>
                </View>
              )}
            </View>
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Your Fitness Goals</Text>
            <View style={styles.goalsGrid}>
              {goals.map((goal) => {
                const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
                return (
                  <View key={goal} style={styles.goalCard}>
                    <Text style={styles.goalTitle}>{goalInfo?.label || goal}</Text>
                    <Text style={styles.goalDescription}>{goalInfo?.description}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Calorie Comparison Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calorie Comparison</Text>
            <CalorieBarChart width={Dimensions.get('window').width - 80} height={160} />
            <Text style={[styles.chartDescription, { color: theme.placeholder }]}>
              Your TDEE vs target calories based on your fitness goals
            </Text>

            {/* Calorie Adjustment Explanation */}
            {Math.abs(targetCalories - tdee) > 50 && (
              <View style={styles.adjustmentCard}>
                <Text style={styles.adjustmentTitle}>
                  {targetCalories < tdee ? '📉 Safe Deficit Applied' : '📈 Safe Surplus Applied'}
                </Text>
                <Text style={styles.adjustmentText}>
                  {targetCalories < tdee 
                    ? `Your target is ${Math.round(tdee - targetCalories)} calories below your TDEE for safe, sustainable weight loss (max 20% deficit with minimum safety limits).`
                    : `Your target is ${Math.round(targetCalories - tdee)} calories above your TDEE for controlled muscle gain (max 15% surplus to minimize fat gain).`
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Macro Breakdown Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macro Distribution</Text>
            <RadarChart 
              values={getMacroPercents()} 
              ideal={idealMacros}
              size={240}
              brandPrimary={theme.tint}
              brandAccent="#6CC04A"
              labelColor={theme.text}
            />
            <Text style={[styles.chartDescription, { color: theme.placeholder }]}>
              Your macro targets vs balanced ideal split
            </Text>
          </View>

          {/* Macro Breakdown Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Macro Targets</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.macroNameColumn]}>Macro</Text>
                <Text style={[styles.tableHeaderCell, styles.macroDataColumn]}>Grams</Text>
                <Text style={[styles.tableHeaderCell, styles.macroDataColumn]}>Calories</Text>
                <Text style={[styles.tableHeaderCell, styles.macroDataColumn]}>% of Total</Text>
              </View>
              <View style={[styles.tableRow, styles.evenRow]}>
                <Text style={[styles.tableCell, styles.macroNameColumn]}>Protein</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.protein.grams}g</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.protein.grams * 4}</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.protein.percentage}%</Text>
              </View>
              <View style={[styles.tableRow, styles.oddRow]}>
                <Text style={[styles.tableCell, styles.macroNameColumn]}>Carbohydrates</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.carbs.grams}g</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.carbs.grams * 4}</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.carbs.percentage}%</Text>
              </View>
              <View style={[styles.tableRow, styles.evenRow]}>
                <Text style={[styles.tableCell, styles.macroNameColumn]}>Fat</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.fat.grams}g</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.fat.grams * 9}</Text>
                <Text style={[styles.tableCell, styles.macroDataColumn]}>{macros.fat.percentage}%</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalCell, styles.macroNameColumn]}>TOTAL</Text>
                <Text style={[styles.totalCell, styles.macroDataColumn]}>
                  {macros.protein.grams + macros.carbs.grams + macros.fat.grams}g
                </Text>
                <Text style={[styles.totalCell, styles.macroDataColumn]}>{targetCalories}</Text>
                <Text style={[styles.totalCell, styles.macroDataColumn]}>100%</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
