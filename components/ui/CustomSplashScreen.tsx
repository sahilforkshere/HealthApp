import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('🎨 Custom splash screen started');
    
    // Keep native splash screen visible initially
    SplashScreen.preventAutoHideAsync();

    // Start animations sequence
    const startAnimations = () => {
      // Fade in and slide up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start();
    };

    // Small delay to ensure smooth transition from native splash
    const animationTimer = setTimeout(startAnimations, 300);

    // Hide splash screen and finish after 3.5 seconds total
    const finishTimer = setTimeout(async () => {
      console.log('🎨 Hiding splash screen and finishing');
      await SplashScreen.hideAsync();
      onFinish();
    }, 3500);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Main Logo/Icon */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconBackground}>
            <Text style={styles.mainIcon}>🏥</Text>
          </View>
          <Text style={styles.appName}>HealthcareApp</Text>
          <Text style={styles.tagline}>Emergency Care at Your Fingertips</Text>
        </Animated.View>

        {/* Development Status */}
        <Animated.View
          style={[
            styles.statusContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>⚠️</Text>
            <Text style={styles.statusText}>DEVELOPMENT VERSION</Text>
          </View>
          <Text style={styles.statusSubtext}>
            This app is currently in development phase
          </Text>
        </Animated.View>

        {/* Developer Attribution */}
        <Animated.View
          style={[
            styles.developerContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.developedBy}>Developed by</Text>
          <Text style={styles.developerName}>Sahil Pal</Text>
         
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Initializing amazing features...</Text>
        </Animated.View>

        {/* Copyright */}
        <Animated.View
          style={[
            styles.copyrightContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.copyrightText}>© 2024 Sahil Paal. All rights reserved.</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainIcon: {
    fontSize: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  developerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  developedBy: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  developerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  developerTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  loadingBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  copyrightContainer: {
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
