import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Text, Heading } from '@gluestack-ui/themed';

export default function PhoneVerificationScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.text}>Phone Verification Screen</Text>
      {/* Add your phone verification UI components here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});
