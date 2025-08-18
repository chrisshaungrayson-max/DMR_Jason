import { StyleSheet, Text, View, TouchableOpacity, TextInput, Modal, Pressable, ScrollView, Switch, Alert, Platform, Image } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useUser } from '@/store/user-store';
import { useGoals } from '@/store/goals-store';
import Colors from '@/constants/colors';
import { UserInfo } from '@/types/user';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarAsync } from '@/services/storage';
import CustomDatePicker from '@/app/components/CustomDatePicker';
import type { GoalType } from '@/types/goal';
import { validateGoalInput } from '@/store/goals-helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout, colorScheme } = useUser();
  const { goals, archived, isLoading: goalsLoading, error: goalsError, topNActive, refreshProgress, createGoal, setActive, deactivate, deleteGoal } = useGoals();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserInfo | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [formData, setFormData] = useState<UserInfo>({ ...user });

  // --- Goal creation state (5.2) ---
  const todayISO = new Date().toISOString().slice(0, 10);
  const [createVisible, setCreateVisible] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('calorie_streak');
  const [startDateISO] = useState<string>(todayISO); // auto start today, non-editable
  const [endDateISO, setEndDateISO] = useState<string>(todayISO);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  // type-specific params
  const [bodyFatTargetPct, setBodyFatTargetPct] = useState('15');
  const [weightTargetKg, setWeightTargetKg] = useState('75');
  const [weightDirection, setWeightDirection] = useState<'down' | 'up'>('down');
  const [leanGainKg, setLeanGainKg] = useState('2');
  const [calStreakDays, setCalStreakDays] = useState('14');
  const [calBasis, setCalBasis] = useState<'recommended' | 'custom'>('recommended');
  const [calMin, setCalMin] = useState('');
  const [calMax, setCalMax] = useState('');
  const [proteinPerDay, setProteinPerDay] = useState('140');
  const [proteinDays, setProteinDays] = useState('14');
  const [creatingGoal, setCreatingGoal] = useState(false);

  const resetCreateState = () => {
    setGoalType('calorie_streak');
    setEndDateISO(todayISO);
    setBodyFatTargetPct('15');
    setWeightTargetKg('75');
    setWeightDirection('down');
    setLeanGainKg('2');
    setCalStreakDays('14');
    setCalBasis('recommended');
    setCalMin('');
    setCalMax('');
    setProteinPerDay('140');
    setProteinDays('14');
  };

  const onOpenCreate = () => {
    resetCreateState();
    setCreateVisible(true);
  };

  const onConfirmCreate = async () => {
    try {
      const result = validateGoalInput({
        goalType,
        startDateISO,
        endDateISO,
        fields: {
          bodyFatTargetPct,
          weightTargetKg,
          weightDirection,
          leanGainKg,
          calStreakDays,
          calBasis,
          calMin,
          calMax,
          proteinPerDay,
          proteinDays,
        },
      });
      if (!result.ok) {
        Alert.alert('Check your inputs', result.message);
        return;
      }
      setCreatingGoal(true);
      await createGoal({
        type: goalType,
        params: result.params,
        start_date: startDateISO,
        end_date: endDateISO!,
        active: true,
      });
      setCreateVisible(false);
      Alert.alert('Goal created', 'Nice work. Your new goal is live!');
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('conflict') || msg.includes('active') || msg.includes('23505')) {
        Alert.alert('Already have one running', 'You can only have one active goal of this type. Deactivate the current one first.');
      } else {
        Alert.alert('Could not create goal', e?.message ?? 'Unknown error.');
      }
    } finally {
      setCreatingGoal(false);
    }
  };

  // Update profile photo (component scope)
  const updatePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library to update your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const publicUrl = await uploadAvatarAsync(asset.uri, asset.mimeType || 'image/jpeg');
      await updateUser({ profilePicture: publicUrl });
      Alert.alert('Updated', 'Profile photo updated.');
    } catch (e) {
      console.error('Avatar update failed', e);
      Alert.alert('Error', 'Failed to update profile photo.');
    }
  };

  // Calculate TDEE (Total Daily Energy Expenditure) using Mifflin-St Jeor Equation
  const tdee = useMemo(() => {
    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      heavy: 1.725, // Heavy exercise 6-7 days/week
      athlete: 1.9 // Very heavy exercise, physical job or training twice a day
    };

    // Default to moderate if no activity level is set
    const activityLevel = user.activityLevel || 'moderate';
    const multiplier = activityMultipliers[activityLevel];

    // Parse height and weight based on units
    let heightCm = 0;
    let weightKg = 0;

    if (user.useMetricUnits) {
      // Metric units - assume height is in cm and weight in kg
      heightCm = parseFloat(user.height) || 170;
      weightKg = parseFloat(user.weight) || 70;
    } else {
      // Imperial units - assume height is in ft/in format like 5'10" and weight in lbs
      const heightMatch = user.height.match(/([0-9]+)'([0-9]+)"?/);
      if (heightMatch) {
        const feet = parseInt(heightMatch[1]);
        const inches = parseInt(heightMatch[2]);
        heightCm = (feet * 30.48) + (inches * 2.54);
      } else {
        heightCm = 170; // Default if parsing fails
      }
      
      weightKg = (parseFloat(user.weight) || 160) / 2.205;
    }

    const age = parseInt(user.age) || 30;
    
    // Mifflin-St Jeor Equation for BMR
    let bmr = 0;
    if (user.sex === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Calculate TDEE
    return Math.round(bmr * multiplier);
  }, [user]);

  // --- Unit conversion helpers ---
  const parseImperialHeightToCm = (h: string): number => {
    const m = h.match(/([0-9]+)'\s*([0-9]+)"?/);
    if (!m) return Math.round(parseFloat(h) || 170);
    const feet = parseInt(m[1]);
    const inches = parseInt(m[2]);
    return Math.round(feet * 30.48 + inches * 2.54);
  };

  const cmToImperialString = (cmInput: string | number): string => {
    const cm = Math.round(typeof cmInput === 'string' ? parseFloat(cmInput) || 170 : cmInput);
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  };

  const lbsToKg = (lbsInput: string | number): number => {
    const lbs = typeof lbsInput === 'string' ? parseFloat(lbsInput) || 160 : lbsInput;
    return Math.round((lbs / 2.205) * 10) / 10; // 1 decimal
  };

  const kgToLbs = (kgInput: string | number): number => {
    const kg = typeof kgInput === 'string' ? parseFloat(kgInput) || 70 : kgInput;
    return Math.round(kg * 2.205);
  };

  const openEditModal = (field: keyof UserInfo, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const openEditProfile = () => {
    setFormData({ ...user });
    setEditProfileVisible(true);
  };

  const handleFormChange = (field: keyof UserInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEdit = async () => {
    if (editingField) {
      await updateUser({ [editingField]: editValue });
      setEditModalVisible(false);
      setEditingField(null);
      setEditValue('');
    }
  };

  const saveProfile = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await updateUser(formData);
      setEditProfileVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      await logout();
      Alert.alert('Success', 'You have been logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.name || 'J D')
                  .split(' ')
                  .map((s) => s.charAt(0))
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={updatePhoto} style={styles.updatePhotoButton}>
          <Text style={styles.updatePhotoText}>Update Photo</Text>
        </TouchableOpacity>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.bio}>Fitness enthusiast, tracking my nutrition journey</Text>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={openEditProfile}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Goal Management */}
      <View style={styles.infoSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>Goal Management</Text>
          <TouchableOpacity onPress={onOpenCreate} style={[styles.refreshGoalsButton, { backgroundColor: Colors.light.darkText }]}> 
            <Text style={styles.refreshGoalsText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Heads up</Text>
          <Text style={styles.noticeText}>Goals cannot be edited after creation. To make changes, delete and recreate the goal.</Text>
        </View>
        {goalsLoading ? (
          <Text style={styles.infoValue}>Loading goals…</Text>
        ) : goalsError ? (
          <Text style={[styles.infoValue, { color: 'crimson' }]}>{goalsError}</Text>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Goals</Text>
              <Text style={styles.infoValue}>{goals.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Archived Goals</Text>
              <Text style={styles.infoValue}>{archived.length}</Text>
            </View>
            {goals.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Top Goals</Text>
                {topNActive(3).map((g) => (
                  <View key={g.id} style={styles.goalRow}>
                    <Text style={styles.goalTitle}>{g.type.replaceAll('_', ' ')}</Text>
                    <Text style={styles.goalMeta}>From {g.start_date} to {g.end_date || '—'}</Text>
                    <View style={styles.goalActionsRow}>
                      <TouchableOpacity onPress={() => deactivate(g.id)} style={styles.goalActionButton}>
                        <Text style={styles.goalActionText}>Deactivate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Active goals list with Deactivate */}
            {goals.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Active</Text>
                {goals.map((g) => (
                  <View key={g.id} style={styles.goalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{g.type.replaceAll('_', ' ')}</Text>
                      <Text style={styles.goalMeta}>From {g.start_date} to {g.end_date || '—'}</Text>
                    </View>
                    <View style={styles.goalActionsRow}>
                      <TouchableOpacity onPress={() => deactivate(g.id)} style={styles.goalActionButton}>
                        <Text style={styles.goalActionText}>Deactivate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Archived goals list with Activate/Delete */}
            {archived.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Archived</Text>
                {archived.map((g) => (
                  <View key={g.id} style={styles.goalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{g.type.replaceAll('_', ' ')}</Text>
                      <Text style={styles.goalMeta}>Ended {g.end_date || '—'}</Text>
                    </View>
                    <View style={styles.goalActionsRow}>
                      <TouchableOpacity onPress={() => setActive(g.id)} style={styles.goalActionButton}>
                        <Text style={styles.goalActionText}>Activate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Delete goal', 'This cannot be undone. Delete this goal?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(g.id) },
                          ])
                        }
                        style={[styles.goalActionButton, styles.deleteButton]}
                      >
                        <Text style={[styles.goalActionText, { color: '#fff' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.refreshGoalsButton} onPress={() => refreshProgress()}>
              <Text style={styles.refreshGoalsText}>Refresh Goal Progress</Text>
            </TouchableOpacity>
            <Text style={styles.goalHint}>Tip: Goals are not editable. Delete and recreate to change details.</Text>
          </>
        )}
      </View>

      {/* Create Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createVisible}
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={styles.fullModalOverlay}>
          <View style={[styles.fullModalContainer, { backgroundColor: theme.cardBackground }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.fullModalTitle}>Create Goal</Text>
              <Pressable style={styles.closeButton} onPress={() => setCreateVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScrollView}>
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Basics</Text>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.pickerContainer}>
                  {(['calorie_streak','protein_streak','body_fat','weight','lean_mass_gain'] as GoalType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.activityButton, goalType === t && styles.activityButtonSelected]}
                      onPress={() => setGoalType(t)}
                    >
                      <Text style={[styles.activityButtonText, goalType === t && styles.activityTextSelected]}>
                        {t.replaceAll('_',' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.formField, { marginTop: 12 }]}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <Text style={styles.infoValue}>{startDateISO} (auto)</Text>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>End Date</Text>
                  <TouchableOpacity onPress={() => setEndPickerVisible(true)} style={styles.formInput}>
                    <Text style={{ color: Colors.light.darkText }}>{endDateISO}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {goalType === 'body_fat' && (
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Body Fat Goal</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Target %</Text>
                    <TextInput value={bodyFatTargetPct} onChangeText={setBodyFatTargetPct} keyboardType="numeric" style={styles.formInput} />
                  </View>
                </View>
              )}

              {goalType === 'weight' && (
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Weight Goal</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Target Weight (kg)</Text>
                    <TextInput value={weightTargetKg} onChangeText={setWeightTargetKg} keyboardType="numeric" style={styles.formInput} />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Direction</Text>
                    <View style={styles.pickerContainer}>
                      {(['down','up'] as const).map((d) => (
                        <TouchableOpacity key={d} style={[styles.activityButton, weightDirection === d && styles.activityButtonSelected]} onPress={() => setWeightDirection(d)}>
                          <Text style={[styles.activityButtonText, weightDirection === d && styles.activityTextSelected]}>{d === 'down' ? 'Lose' : 'Gain'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {goalType === 'lean_mass_gain' && (
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Lean Mass Gain</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Target Gain (kg)</Text>
                    <TextInput value={leanGainKg} onChangeText={setLeanGainKg} keyboardType="numeric" style={styles.formInput} />
                  </View>
                </View>
              )}

              {goalType === 'calorie_streak' && (
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Calorie Streak</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Target Days</Text>
                    <TextInput value={calStreakDays} onChangeText={setCalStreakDays} keyboardType="numeric" style={styles.formInput} />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Basis</Text>
                    <View style={styles.pickerContainer}>
                      {(['recommended','custom'] as const).map((b) => (
                        <TouchableOpacity key={b} style={[styles.activityButton, calBasis === b && styles.activityButtonSelected]} onPress={() => setCalBasis(b)}>
                          <Text style={[styles.activityButtonText, calBasis === b && styles.activityTextSelected]}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {calBasis === 'custom' && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={styles.formLabel}>Min Calories</Text>
                        <TextInput value={calMin} onChangeText={setCalMin} keyboardType="numeric" style={styles.formInput} />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={styles.formLabel}>Max Calories</Text>
                        <TextInput value={calMax} onChangeText={setCalMax} keyboardType="numeric" style={styles.formInput} />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {goalType === 'protein_streak' && (
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Protein Streak</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Grams / Day</Text>
                    <TextInput value={proteinPerDay} onChangeText={setProteinPerDay} keyboardType="numeric" style={styles.formInput} />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Target Days</Text>
                    <TextInput value={proteinDays} onChangeText={setProteinDays} keyboardType="numeric" style={styles.formInput} />
                  </View>
                </View>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={onConfirmCreate}
                  disabled={creatingGoal}
                  style={[
                    styles.saveProfileButton,
                    { width: '100%', opacity: creatingGoal ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.saveProfileButtonText}>
                    {creatingGoal ? 'Creating…' : 'Create Goal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomDatePicker
        visible={endPickerVisible}
        date={new Date(endDateISO + 'T00:00:00')}
        onDateChange={(d) => setEndDateISO(d.toISOString().slice(0, 10))}
        onClose={() => setEndPickerVisible(false)}
        minimumDate={new Date(todayISO + 'T00:00:00')}
      />
      
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>28</Text>
          <Text style={styles.statLabel}>Days Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tdee}</Text>
          <Text style={styles.statLabel}>TDEE</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>2350</Text>
          <Text style={styles.statLabel}>Avg. Calories</Text>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Height</Text>
          <Text style={styles.infoValue}>
            {user.useMetricUnits ? `${user.height} cm` : user.height}
          </Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => openEditModal('height', user.height)}
            >
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>
            {user.useMetricUnits ? `${user.weight} kg` : user.weight}
          </Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => openEditModal('weight', user.weight)}
            >
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Age</Text>
          <Text style={styles.infoValue}>{user.age}</Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => openEditModal('age', user.age)}
            >
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sex</Text>
          <Text style={styles.infoValue}>{user.sex.charAt(0).toUpperCase() + user.sex.slice(1)}</Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => openEditModal('sex', user.sex)}
            >
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Activity Level</Text>
          <Text style={styles.infoValue}>{user.activityLevel ? user.activityLevel.charAt(0).toUpperCase() + user.activityLevel.slice(1) : 'Moderate'}</Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => openEditModal('activityLevel', user.activityLevel || 'moderate')}
            >
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Daily Energy Needs</Text>
          <Text style={styles.infoValue}>{tdee} calories</Text>
        </View>
      </View>
          
      {/* Single field edit modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.modalTitle}>Edit {editingField}</Text>
            {editingField === 'activityLevel' ? (
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={[styles.activityButton, editValue === 'sedentary' && styles.activityButtonSelected]}
                  onPress={() => setEditValue('sedentary')}
                >
                  <Text style={[styles.activityButtonText, editValue === 'sedentary' && styles.activityTextSelected]}>Sedentary</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, editValue === 'light' && styles.activityButtonSelected]}
                  onPress={() => setEditValue('light')}
                >
                  <Text style={[styles.activityButtonText, editValue === 'light' && styles.activityTextSelected]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, editValue === 'moderate' && styles.activityButtonSelected]}
                  onPress={() => setEditValue('moderate')}
                >
                  <Text style={[styles.activityButtonText, editValue === 'moderate' && styles.activityTextSelected]}>Moderate</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, editValue === 'heavy' && styles.activityButtonSelected]}
                  onPress={() => setEditValue('heavy')}
                >
                  <Text style={[styles.activityButtonText, editValue === 'heavy' && styles.activityTextSelected]}>Heavy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, editValue === 'athlete' && styles.activityButtonSelected]}
                  onPress={() => setEditValue('athlete')}
                >
                  <Text style={[styles.activityButtonText, editValue === 'athlete' && styles.activityTextSelected]}>Athlete</Text>
                </TouchableOpacity>
              </View>
            ) : editingField === 'sex' ? (
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={[styles.radioButton, editValue === 'male' && styles.radioButtonSelected]}
                  onPress={() => setEditValue('male')}
                >
                  <Text style={[styles.radioText, editValue === 'male' && styles.radioTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.radioButton, editValue === 'female' && styles.radioButtonSelected]}
                  onPress={() => setEditValue('female')}
                >
                  <Text style={[styles.radioText, editValue === 'female' && styles.radioTextSelected]}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.radioButton, editValue === 'other' && styles.radioButtonSelected]}
                  onPress={() => setEditValue('other')}
                >
                  <Text style={[styles.radioText, editValue === 'other' && styles.radioTextSelected]}>Other</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={styles.modalInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Enter new ${editingField}`}
                keyboardType={editingField === 'age' ? 'number-pad' : 'default'}
              />
            )}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full profile edit modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editProfileVisible}
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.fullModalOverlay}>
          <View style={[styles.fullModalContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.fullModalTitle}>Edit Profile</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScrollView}>
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Personal Information</Text>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(value) => handleFormChange('name', value)}
                    placeholder="Your name"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.email}
                    onChangeText={(value) => handleFormChange('email', value)}
                    placeholder="Your email"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Age</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.age}
                    onChangeText={(value) => handleFormChange('age', value)}
                    placeholder="Your age"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Sex</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity 
                      style={[styles.radioButton, formData.sex === 'male' && styles.radioButtonSelected]}
                      onPress={() => handleFormChange('sex', 'male')}
                    >
                      <Text style={[styles.radioText, formData.sex === 'male' && styles.radioTextSelected]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.radioButton, formData.sex === 'female' && styles.radioButtonSelected]}
                      onPress={() => handleFormChange('sex', 'female')}
                    >
                      <Text style={[styles.radioText, formData.sex === 'female' && styles.radioTextSelected]}>Female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.radioButton, formData.sex === 'other' && styles.radioButtonSelected]}
                      onPress={() => handleFormChange('sex', 'other')}
                    >
                      <Text style={[styles.radioText, formData.sex === 'other' && styles.radioTextSelected]}>Other</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Phone Number (optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.phoneNumber || ''}
                    onChangeText={(value) => handleFormChange('phoneNumber', value)}
                    placeholder="Your phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Body Measurements</Text>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Height</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.height}
                    onChangeText={(value) => handleFormChange('height', value)}
                    placeholder={formData.useMetricUnits ? "Height in cm" : "Height in ft/in"}
                    keyboardType={formData.useMetricUnits ? 'numeric' : 'default'}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Weight</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.weight}
                    onChangeText={(value) => handleFormChange('weight', value)}
                    placeholder={formData.useMetricUnits ? "Weight in kg" : "Weight in lbs"}
                    keyboardType='numeric'
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Activity Level</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity 
                      style={[styles.activityButton, formData.activityLevel === 'sedentary' && styles.activityButtonSelected]}
                      onPress={() => handleFormChange('activityLevel', 'sedentary')}
                    >
                      <Text style={[styles.activityButtonText, formData.activityLevel === 'sedentary' && styles.activityTextSelected]}>Sedentary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.activityButton, formData.activityLevel === 'light' && styles.activityButtonSelected]}
                      onPress={() => handleFormChange('activityLevel', 'light')}
                    >
                      <Text style={[styles.activityButtonText, formData.activityLevel === 'light' && styles.activityTextSelected]}>Light</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.activityButton, formData.activityLevel === 'moderate' && styles.activityButtonSelected]}
                      onPress={() => handleFormChange('activityLevel', 'moderate')}
                    >
                      <Text style={[styles.activityButtonText, formData.activityLevel === 'moderate' && styles.activityTextSelected]}>Moderate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.activityButton, formData.activityLevel === 'heavy' && styles.activityButtonSelected]}
                      onPress={() => handleFormChange('activityLevel', 'heavy')}
                    >
                      <Text style={[styles.activityButtonText, formData.activityLevel === 'heavy' && styles.activityTextSelected]}>Heavy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.activityButton, formData.activityLevel === 'athlete' && styles.activityButtonSelected]}
                      onPress={() => handleFormChange('activityLevel', 'athlete')}
                    >
                      <Text style={[styles.activityButtonText, formData.activityLevel === 'athlete' && styles.activityTextSelected]}>Athlete</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.activityLevelInfo}>
                    <Text style={styles.activityLevelInfoText}>• Sedentary: Little or no exercise</Text>
                    <Text style={styles.activityLevelInfoText}>• Light: Light exercise 1-3 days/week</Text>
                    <Text style={styles.activityLevelInfoText}>• Moderate: Moderate exercise 3-5 days/week</Text>
                    <Text style={styles.activityLevelInfoText}>• Heavy: Heavy exercise 6-7 days/week</Text>
                    <Text style={styles.activityLevelInfoText}>• Athlete: Very heavy exercise, physical job or training twice a day</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Preferences</Text>
                
                <View style={styles.formField}>
                  <View style={styles.switchRow}>
                    <Text style={styles.formLabel}>Use Metric Units</Text>
                    <Switch
                      value={formData.useMetricUnits}
                      onValueChange={async (value) => {
                        // Convert values and sync to global user immediately
                        if (value) {
                          // Imperial -> Metric
                          const cm = parseImperialHeightToCm(formData.height);
                          const kg = lbsToKg(formData.weight);
                          const updated = { ...formData, useMetricUnits: true, height: String(cm), weight: String(kg) };
                          setFormData(updated);
                          await updateUser({ useMetricUnits: true, height: String(cm), weight: String(kg) });
                        } else {
                          // Metric -> Imperial
                          const ftin = cmToImperialString(formData.height);
                          const lbs = kgToLbs(formData.weight);
                          const updated = { ...formData, useMetricUnits: false, height: ftin, weight: `${lbs} lbs` };
                          setFormData(updated);
                          await updateUser({ useMetricUnits: false, height: ftin, weight: `${lbs} lbs` });
                        }
                      }}
                      trackColor={{ false: isDarkMode ? '#555' : '#767577', true: theme.lightGold }}
                      thumbColor={formData.useMetricUnits ? theme.gold : isDarkMode ? '#777' : '#f4f3f4'}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.formFooter}>
              <TouchableOpacity 
                style={styles.cancelProfileButton}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.cancelProfileButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveProfileButton}
                onPress={saveProfile}
              >
                <Text style={styles.saveProfileButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  activityLevelInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.gold,
  },
  activityLevelInfoText: {
    fontSize: 12,
    color: Colors.light.lightText,
    marginBottom: 4,
  },
  activityTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editProfileButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.gold,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editIcon: {
    padding: 5,
  },
  editIconText: {
    fontSize: 16,
    color: Colors.light.gold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: Colors.light.darkText,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: Colors.light.gold,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  updatePhotoButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  updatePhotoText: {
    color: Colors.light.darkText,
    fontSize: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.darkText,
    marginBottom: 5,
  },
  bio: {
    fontSize: 16,
    color: Colors.light.lightText,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.gold,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.lightText,
    marginTop: 5,
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.darkText,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.light.lightText,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.darkText,
  },
  // Full profile edit modal styles
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fullModalContainer: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.darkText,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.light.lightText,
  },
  formScrollView: {
    flex: 1,
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.darkText,
    marginBottom: 15,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: Colors.light.lightText,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.darkText,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  radioButtonSelected: {
    backgroundColor: Colors.light.gold,
    borderColor: Colors.light.gold,
  },
  radioText: {
    color: Colors.light.darkText,
  },
  radioTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activityButtonSelected: {
    backgroundColor: Colors.light.gold,
    borderColor: Colors.light.gold,
  },
  activityButtonText: {
    fontSize: 14,
    color: Colors.light.darkText,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formActions: {
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelProfileButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelProfileButtonText: {
    color: Colors.light.darkText,
    fontSize: 16,
  },
  saveProfileButton: {
    flex: 1,
    padding: 15,
    backgroundColor: Colors.light.gold,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // --- Goal management styles ---
  goalRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.darkText,
  },
  goalMeta: {
    fontSize: 12,
    color: Colors.light.lightText,
  },
  goalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  goalActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#fff',
    marginLeft: 8,
  },
  goalActionText: {
    color: Colors.light.darkText,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  refreshGoalsButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.gold,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  refreshGoalsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  goalHint: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.light.lightText,
  },
  noticeBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: Colors.light.gold,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.darkText,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.light.lightText,
    lineHeight: 18,
  },
});