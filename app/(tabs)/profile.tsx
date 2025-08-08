import { StyleSheet, Text, View, TouchableOpacity, TextInput, Modal, Pressable, ScrollView, Switch, Alert, Platform } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useUser } from '@/store/user-store';
import Colors from '@/constants/colors';
import { UserInfo } from '@/types/user';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { user, updateUser, logout, colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserInfo | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [formData, setFormData] = useState<UserInfo>({ ...user });

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.bio}>Fitness enthusiast, tracking my nutrition journey</Text>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={openEditProfile}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
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
          <Text style={styles.infoValue}>{user.height}</Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => openEditModal('height', user.height)}
            >
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>{user.weight}</Text>
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
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Weight</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.weight}
                    onChangeText={(value) => handleFormChange('weight', value)}
                    placeholder={formData.useMetricUnits ? "Weight in kg" : "Weight in lbs"}
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
                      onValueChange={(value) => handleFormChange('useMetricUnits', value)}
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
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
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
});