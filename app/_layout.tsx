import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DriverProvider } from '../contexts/DriverContext';
import { AmbulanceProvider } from '../contexts/AmbulanceContext';
import CustomSplashScreen from '@/components/ui/CustomSplashScreen';
// Loading component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196f3" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

function RootLayoutNav() {
  const { user, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    const inAuthGroup = segments[0] === '(auth)';
    const inPatientTabs = segments[0] === '(patient-tabs)';
    const inDoctorTabs = segments[0] === '(doctor-tabs)';
    const inDriverTabs = segments[0] === '(driver-tabs)';
    const onIndexPage = segments.length === 0;

    console.log('🔐 Auth State:', { 
      user: !!user, 
      userProfile: userProfile?.user_type, 
      segments,
      loading 
    });

    if (!user && !inAuthGroup && !onIndexPage) {
      // Not logged in - redirect to auth
      console.log('🔄 Redirecting to login - no user');
      router.replace('/(auth)/login');
    } else if (user && userProfile) {
      // User is logged in and profile loaded - redirect based on role
      console.log('✅ User logged in, redirecting based on role:', userProfile.user_type);
      
      switch (userProfile.user_type) {
        case 'patient':
          if (!inPatientTabs) {
            console.log('🔄 Redirecting to patient dashboard');
            router.replace('/(patient-tabs)/dashboard');
          }
          break;
        case 'doctor':
          if (!inDoctorTabs) {
            console.log('🔄 Redirecting to doctor dashboard');
            router.replace('/(doctor-tabs)/dashboard');
          }
          break;
        case 'driver':
          if (!inDriverTabs) {
            console.log('🔄 Redirecting to driver dashboard');
            router.replace('/(driver-tabs)/dashboard');
          }
          break;
        default:
          console.log('❌ Unknown user type, redirecting to login');
          router.replace('/(auth)/login');
      }
    } else if (user && !userProfile && !inAuthGroup) {
      // User exists but profile not loaded - wait for profile or redirect to login
      console.log('⏳ User exists but profile not loaded');
    }
  }, [user, userProfile, loading, segments]);

  if (loading) {
    // Show loading screen while checking auth
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="(auth)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade'
        }} 
      />
      <Stack.Screen 
        name="(patient-tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }} 
      />
      <Stack.Screen 
        name="(doctor-tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }} 
      />
      <Stack.Screen 
        name="(driver-tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const handleSplashFinish = () => {
    console.log('🎨 Splash screen finished, showing main app');
    setAppIsReady(true);
  };

  // Show custom splash screen first
  if (!appIsReady) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  // After splash, show the main app with providers
  return (
    <AuthProvider>
      <DriverProvider>
        <AmbulanceProvider>
          <RootLayoutNav />
        </AmbulanceProvider>
      </DriverProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
});
