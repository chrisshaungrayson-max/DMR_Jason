import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Heading, Box, HStack, VStack, Text, useColorMode } from '@gluestack-ui/themed';
import { Svg, Circle } from 'react-native-svg';
import { lightTheme, darkTheme } from '@/lib/theme/gluestack-theme';
import { useNutritionStore } from '@/store/nutrition-store';
import { events } from '@/utils/events';
import { getMacroTargetsForUser, type MacroSplit } from '@/lib/idealMacros';
import { getMyMacroSplitOrDefault } from '@/services/macros';
import { useFocusEffect } from 'expo-router';
import { track } from '@/utils/track';

export interface HomeMacrosRadialChartProps {
  loading?: boolean;
  percentages?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function HomeMacrosRadialChart({ loading = false, percentages }: HomeMacrosRadialChartProps) {
  const colorMode = useColorMode();
  const themeCfg = colorMode === 'dark' ? darkTheme : lightTheme;
  const colors = themeCfg.tokens.colors as any;
  const ringColors = {
    calories: colors.info500, // brand tint
    protein: colors.success500,
    carbs: colors.warning500,
    fat: colors.error500,
    guide: colorMode === 'dark' ? '#374151' : '#e5e7eb',
  };

  // Store data and targets
  const { userInfo, dailyRecords, isLoading: storeLoading } = useNutritionStore();
  const [split, setSplit] = useState<MacroSplit | null>(null);
  const [loadingTargets, setLoadingTargets] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedMacro, setSelectedMacro] = useState<'calories' | 'protein' | 'carbs' | 'fat' | null>(null);
  const impressionSentRef = useRef(false);

  // Subscribe to nutrition events to refresh derived calculations on external changes
  useEffect(() => {
    const off = events.on('nutrition:changed', () => setRefreshKey((k) => k + 1));
    return () => off();
  }, []);

  // Recompute on Home tab focus
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
      return () => {};
    }, [])
  );

  // Fetch user's macro split (fallback to default internally)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingTargets(true);
        const s = await getMyMacroSplitOrDefault();
        if (mounted) setSplit(s);
      } catch {
        // ignore; component will fallback via helpers
      } finally {
        if (mounted) setLoadingTargets(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helpers
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const localDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Select today's totals or recent within 7 days (local time)
  const todaysTotals = useMemo(() => {
    try {
      const now = new Date();
      const todayLocal = localDateStr(now);
      const byDate = (dateStr: string) => dailyRecords.find((r) => r.date === dateStr);
      const today = byDate(todayLocal) || byDate(new Date().toISOString().split('T')[0]);
      if (today) return today.total;
      // fallback: within last 7 days
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const cand = byDate(localDateStr(d));
        if (cand) return cand.total;
      }
    } catch {}
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, [dailyRecords, refreshKey]);

  // Compute targets based on user info and split
  const targets = useMemo(() => {
    try {
      if (!split) return null;
      return getMacroTargetsForUser(userInfo as any, { split });
    } catch {
      return null;
    }
  }, [userInfo, split]);

  // Derived ring values (decimals). Visual clamped in toDash.
  const derivedValues = useMemo(() => {
    if (!targets) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const c = targets.calories || 0;
    const gp = targets.grams.protein || 0;
    const gc = targets.grams.carbs || 0;
    const gf = targets.grams.fat || 0;
    return {
      calories: c > 0 ? todaysTotals.calories / c : 0,
      protein: gp > 0 ? todaysTotals.protein / gp : 0,
      carbs: gc > 0 ? todaysTotals.carbs / gc : 0,
      fat: gf > 0 ? todaysTotals.fat / gf : 0,
    };
  }, [targets, todaysTotals]);

  const values = percentages ?? derivedValues;
  const overage = useMemo(() => {
    const entries = [
      { key: 'calories' as const, pct: values.calories ?? 0 },
      { key: 'protein' as const, pct: values.protein ?? 0 },
      { key: 'carbs' as const, pct: values.carbs ?? 0 },
      { key: 'fat' as const, pct: values.fat ?? 0 },
    ];
    let max = { key: 'calories' as 'calories' | 'protein' | 'carbs' | 'fat', over: 0 };
    for (const e of entries) {
      const o = (e.pct || 0) - 1;
      if (o > max.over) max = { key: e.key, over: o };
    }
    return max.over > 0 ? { macro: max.key, percent: Math.round(max.over * 100) } : null;
  }, [values]);

  // Analytics: impression once when data is ready
  useEffect(() => {
    if (impressionSentRef.current) return;
    if (loading || storeLoading || loadingTargets) return;
    impressionSentRef.current = true;
    const pct = {
      calories: Math.round((values.calories || 0) * 100),
      protein: Math.round((values.protein || 0) * 100),
      carbs: Math.round((values.carbs || 0) * 100),
      fat: Math.round((values.fat || 0) * 100),
    };
    track('home_macros_chart_impression', { percent: pct, hasOverage: !!overage });
  }, [loading, storeLoading, loadingTargets, values, overage]);

  // Tooltip detail for selected macro
  const macroDetail = useMemo(() => {
    if (!selectedMacro || !targets) return null;
    const dataMap = {
      calories: {
        label: 'Calories',
        current: todaysTotals.calories || 0,
        target: targets.calories || 0,
        unit: 'kcal',
        percent: (values.calories || 0) * 100,
      },
      protein: {
        label: 'Protein',
        current: todaysTotals.protein || 0,
        target: targets.grams.protein || 0,
        unit: 'g',
        percent: (values.protein || 0) * 100,
      },
      carbs: {
        label: 'Carbs',
        current: todaysTotals.carbs || 0,
        target: targets.grams.carbs || 0,
        unit: 'g',
        percent: (values.carbs || 0) * 100,
      },
      fat: {
        label: 'Fat',
        current: todaysTotals.fat || 0,
        target: targets.grams.fat || 0,
        unit: 'g',
        percent: (values.fat || 0) * 100,
      },
    } as const;
    const base = dataMap[selectedMacro];
    const pct = Math.round(base.percent);
    const remaining = Math.max(0, (base.target || 0) - (base.current || 0));
    const over = Math.max(0, (base.current || 0) - (base.target || 0));
    return { ...base, percentRounded: pct, remaining, over };
  }, [selectedMacro, targets, todaysTotals, values]);
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const toDash = (radius: number, pct: number) => {
    const c = 2 * Math.PI * radius;
    const p = clamp01(pct);
    return { strokeDasharray: [c, c], strokeDashoffset: c * (1 - p) };
  };

  return (
    <Card
      backgroundColor="$backgroundLight0"
      $dark-backgroundColor="$backgroundDark950"
      borderColor="$borderLight300"
      $dark-borderColor="$borderDark700"
      borderWidth={1}
      borderRadius="$lg"
      p="$3"
      mb="$3"
      testID="home-macros-card"
      accessibilityLabel="Today’s Macros"
    >
      <HStack alignItems="center" justifyContent="space-between" mb="$2">
        <Heading size="md" color="$textLight900" $dark-color="$textDark100">
          Today’s Macros
        </Heading>
      </HStack>

      {loading || storeLoading || loadingTargets ? (
        <VStack space="md" alignItems="center" testID="home-macros-skeleton">
          <Box w={220} h={220} borderRadius={110} backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" />
          <VStack w="100%" mt="$1" space="sm" px="$1">
            <Box h={12} w="40%" borderRadius="$sm" backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" />
            <Box h={12} w="35%" borderRadius="$sm" backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" />
            <Box h={12} w="30%" borderRadius="$sm" backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" />
            <Box h={12} w="25%" borderRadius="$sm" backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" />
          </VStack>
        </VStack>
      ) : (
        <>
          {/* Chart area: tracks + progress arcs with visual cap at 100% */}
          <Box h={260} alignItems="center" justifyContent="center">
            {overage ? (
              <Box
                position="absolute"
                top="$3"
                right="$3"
                backgroundColor="$error500"
                px="$2"
                py="$1"
                borderRadius="$full"
                testID="overage-badge"
                accessibilityLabel={`Over target by ${overage.percent} percent`}
              >
                <Text color="white" fontWeight="$bold">+{overage.percent}%</Text>
              </Box>
            ) : null}
            {macroDetail ? (
              <Box
                position="absolute"
                bottom="$3"
                backgroundColor="$backgroundLight0"
                $dark-backgroundColor="$backgroundDark900"
                borderColor="$borderLight300"
                $dark-borderColor="$borderDark700"
                borderWidth={1}
                px="$3"
                py="$2"
                borderRadius="$md"
                testID="macro-tooltip"
                accessibilityLabel={`${macroDetail.label} details: ${Math.round(macroDetail.current)} ${macroDetail.unit} of ${Math.round(macroDetail.target)} ${macroDetail.unit} (${macroDetail.percentRounded} percent). ${macroDetail.over > 0 ? `Over by ${Math.round(macroDetail.over)} ${macroDetail.unit}` : `Remaining ${Math.round(macroDetail.remaining)} ${macroDetail.unit}`}`}
              >
                <HStack space="sm" alignItems="center">
                  <Box w={10} h={10} borderRadius="$full" backgroundColor={
                    macroDetail.label === 'Calories' ? ringColors.calories :
                    macroDetail.label === 'Protein' ? ringColors.protein :
                    macroDetail.label === 'Carbs' ? ringColors.carbs : ringColors.fat
                  } />
                  <VStack>
                    <Text color="$textLight900" $dark-color="$textDark100" fontWeight="$bold">{macroDetail.label}</Text>
                    <Text color="$textLight700" $dark-color="$textDark300" fontSize="$sm">
                      {Math.round(macroDetail.current)}{macroDetail.unit} / {Math.round(macroDetail.target)}{macroDetail.unit} ({macroDetail.percentRounded}%)
                    </Text>
                    <Text color={macroDetail.over > 0 ? '$error500' : '$textLight600'} $dark-color={macroDetail.over > 0 ? '$error400' : '$textDark300'} fontSize="$xs">
                      {macroDetail.over > 0 ? `Over by ${Math.round(macroDetail.over)}${macroDetail.unit}` : `Remaining ${Math.round(macroDetail.remaining)}${macroDetail.unit}`}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ) : null}

            <Svg width={220} height={220} viewBox="0 0 220 220" accessibilityLabel="macros-radial-rings">
              {/* Tracks (full circles) */}
              <Circle cx={110} cy={110} r={90} stroke={ringColors.guide} strokeWidth={10} fill="none" />
              <Circle cx={110} cy={110} r={70} stroke={ringColors.guide} strokeWidth={10} fill="none" />
              <Circle cx={110} cy={110} r={50} stroke={ringColors.guide} strokeWidth={10} fill="none" />
              <Circle cx={110} cy={110} r={30} stroke={ringColors.guide} strokeWidth={10} fill="none" />

              {/* Progress arcs */}
              <Circle
                cx={110}
                cy={110}
                r={90}
                stroke={ringColors.calories}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                {...toDash(90, values.calories)}
                onPress={() => {
                  const alreadySelected = selectedMacro === 'calories';
                  setSelectedMacro(alreadySelected ? null : 'calories');
                  track('home_macros_ring_tap', {
                    macro: 'calories',
                    wasSelected: alreadySelected,
                    percent: Math.round((values.calories || 0) * 100),
                  });
                }}
                accessibilityLabel={`Calories ring. ${Math.round((values.calories || 0) * 100)} percent of target.`}
                testID="ring-calories"
              />
              <Circle
                cx={110}
                cy={110}
                r={70}
                stroke={ringColors.protein}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                {...toDash(70, values.protein)}
                onPress={() => {
                  const alreadySelected = selectedMacro === 'protein';
                  setSelectedMacro(alreadySelected ? null : 'protein');
                  track('home_macros_ring_tap', {
                    macro: 'protein',
                    wasSelected: alreadySelected,
                    percent: Math.round((values.protein || 0) * 100),
                  });
                }}
                accessibilityLabel={`Protein ring. ${Math.round((values.protein || 0) * 100)} percent of target.`}
                testID="ring-protein"
              />
              <Circle
                cx={110}
                cy={110}
                r={50}
                stroke={ringColors.carbs}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                {...toDash(50, values.carbs)}
                onPress={() => {
                  const alreadySelected = selectedMacro === 'carbs';
                  setSelectedMacro(alreadySelected ? null : 'carbs');
                  track('home_macros_ring_tap', {
                    macro: 'carbs',
                    wasSelected: alreadySelected,
                    percent: Math.round((values.carbs || 0) * 100),
                  });
                }}
                accessibilityLabel={`Carbs ring. ${Math.round((values.carbs || 0) * 100)} percent of target.`}
                testID="ring-carbs"
              />
              <Circle
                cx={110}
                cy={110}
                r={30}
                stroke={ringColors.fat}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                {...toDash(30, values.fat)}
                onPress={() => {
                  const alreadySelected = selectedMacro === 'fat';
                  setSelectedMacro(alreadySelected ? null : 'fat');
                  track('home_macros_ring_tap', {
                    macro: 'fat',
                    wasSelected: alreadySelected,
                    percent: Math.round((values.fat || 0) * 100),
                  });
                }}
                accessibilityLabel={`Fat ring. ${Math.round((values.fat || 0) * 100)} percent of target.`}
                testID="ring-fat"
              />
            </Svg>
          </Box>

          <VStack space="sm" mt="$1" testID="home-macros-legend">
            <HStack space="sm" alignItems="center">
              <Box w={10} h={10} borderRadius="$full" backgroundColor={ringColors.calories} />
              <Text color="$textLight700" $dark-color="$textDark300" fontSize="$sm">Calories</Text>
            </HStack>
            <HStack space="sm" alignItems="center">
              <Box w={10} h={10} borderRadius="$full" backgroundColor={ringColors.protein} />
              <Text color="$textLight700" $dark-color="$textDark300" fontSize="$sm">Protein</Text>
            </HStack>
            <HStack space="sm" alignItems="center">
              <Box w={10} h={10} borderRadius="$full" backgroundColor={ringColors.carbs} />
              <Text color="$textLight700" $dark-color="$textDark300" fontSize="$sm">Carbs</Text>
            </HStack>
            <HStack space="sm" alignItems="center">
              <Box w={10} h={10} borderRadius="$full" backgroundColor={ringColors.fat} />
              <Text color="$textLight700" $dark-color="$textDark300" fontSize="$sm">Fat</Text>
            </HStack>
          </VStack>
        </>
      )}
    </Card>
  );
}
