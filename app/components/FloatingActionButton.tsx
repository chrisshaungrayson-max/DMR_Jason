import React, { useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { Pressable } from '@gluestack-ui/themed';
import { Plus } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface FloatingActionButtonProps {
  onPress: () => void;
  visible?: boolean;
}

export default function FloatingActionButton({ onPress, visible = true }: FloatingActionButtonProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Spring-in animation when FAB becomes visible
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      opacity.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      // Spring-out animation when FAB becomes hidden
      scale.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(scale.value, [0, 1], [0.3, 1]),
        },
      ],
      opacity: opacity.value,
    };
  });

  const handlePress = async () => {
    // Haptic feedback for better UX
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Brief scale animation on press
    scale.value = withSpring(0.9, { duration: 100 });
    setTimeout(() => {
      scale.value = withSpring(1, { duration: 100 });
    }, 100);
    
    onPress();
  };

  if (!visible) {
    return null;
  }

  return (
    <AnimatedView
      style={[
        {
          position: 'absolute',
          bottom: 90,
          right: 24,
          zIndex: 1000,
        },
        styles.container,
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        w={56}
        h={56}
        borderRadius={28}
        backgroundColor="$primary500"
        alignItems="center"
        justifyContent="center"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.3}
        shadowRadius={8}
        elevation={8}
        accessibilityRole="button"
        accessibilityLabel="Add"
        accessibilityHint="Open actions menu"
        testID="floating-action-button"
        style={styles.pressable}
      >
        <Plus 
          size={24} 
          color="white" 
          strokeWidth={2.5}
        />
      </Pressable>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    // Ensure proper hit area and positioning
    minWidth: 56,
    minHeight: 56,
  },
  pressable: {
    // Additional styling for better interaction
    borderWidth: 0,
  },
});
