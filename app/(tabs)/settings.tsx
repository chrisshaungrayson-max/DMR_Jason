import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { ChevronRight, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useUser } from '@/store/user-store';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState<boolean>(true);
  const router = useRouter();
  const { user, updateUser, logout, colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => {
          logout();
          router.replace('/');
        }, style: 'destructive' }
      ]
    );
  };

  const toggleNotifications = () => setNotifications(prev => !prev);
  
  const toggleDarkMode = async () => {
    await updateUser({ useDarkMode: !user.useDarkMode });
  };
  
  const toggleMetricUnits = async () => {
    await updateUser({ useMetricUnits: !user.useMetricUnits });
  };

  const navigateTo = (path: string) => {
    console.log(`Navigating to ${path}`);
    // Temporarily disable navigation to non-existent routes
    Alert.alert('Coming Soon', 'This feature is under development.');
    // When routes are implemented, use router.push(path)
  };

  // Get theme-specific colors
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Preferences</Text>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Notifications</Text>
          <Switch
            trackColor={{ false: theme.border, true: theme.lightGold }}
            thumbColor={notifications ? theme.gold : isDarkMode ? '#555' : '#f4f3f4'}
            onValueChange={toggleNotifications}
            value={notifications}
            testID="notifications-switch"
          />
        </View>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Dark Mode</Text>
          <Switch
            trackColor={{ false: theme.border, true: theme.lightGold }}
            thumbColor={user.useDarkMode ? theme.gold : isDarkMode ? '#555' : '#f4f3f4'}
            onValueChange={toggleDarkMode}
            value={user.useDarkMode}
            testID="dark-mode-switch"
          />
        </View>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Use Metric Units</Text>
          <Switch
            trackColor={{ false: theme.border, true: theme.lightGold }}
            thumbColor={user.useMetricUnits ? theme.gold : isDarkMode ? '#555' : '#f4f3f4'}
            onValueChange={toggleMetricUnits}
            value={user.useMetricUnits}
            testID="metric-units-switch"
          />
        </View>
      </View>
      
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Account</Text>
        
        <TouchableOpacity 
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
          onPress={() => navigateTo('/settings/personal-info')}
        >
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Personal Information</Text>
          <ChevronRight size={20} color={theme.lightText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
          onPress={() => navigateTo('/settings/nutrition-goals')}
        >
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Nutrition Goals</Text>
          <ChevronRight size={20} color={theme.lightText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
          onPress={() => navigateTo('/settings/connected-apps')}
        >
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Connected Apps</Text>
          <ChevronRight size={20} color={theme.lightText} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Support</Text>
        
        <TouchableOpacity 
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
          onPress={() => navigateTo('/settings/help')}
        >
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Help Center</Text>
          <ChevronRight size={20} color={theme.lightText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
          onPress={() => navigateTo('/settings/privacy')}
        >
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Privacy Policy</Text>
          <ChevronRight size={20} color={theme.lightText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
          onPress={() => navigateTo('/settings/terms')}
        >
          <Text style={[styles.settingLabel, { color: theme.darkText }]}>Terms of Service</Text>
          <ChevronRight size={20} color={theme.lightText} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: theme.cardBackground }]}
        onPress={handleLogout}
        testID="logout-button"
      >
        <LogOut size={20} color={'#FF0000'} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: '600',
  },
});