import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

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

    console.log('Auth State:', { user: !!user, userProfile, segments }); // Debug log

    if (!user && !inAuthGroup) {
      // Not logged in - redirect to auth
      console.log('Redirecting to login - no user');
      router.replace('/(auth)/login');
    } else if (user && userProfile) {
      // User is logged in and profile loaded - redirect based on role
      console.log('User logged in, redirecting based on role:', userProfile.user_type);
      
      if (userProfile.user_type === 'patient' && !inPatientTabs) {
        router.replace('/(patient-tabs)/dashboard');
      } else if (userProfile.user_type === 'doctor' && !inDoctorTabs) {
        router.replace('/(doctor-tabs)/dashboard');
      } else if (userProfile.user_type === 'driver' && !inDriverTabs) {
        router.replace('/(driver-tabs)/dashboard');
      }
    } else if (user && !userProfile && !inAuthGroup) {
      // User exists but profile not loaded - stay in auth or show loading
      console.log('User exists but profile not loaded');
    }
  }, [user, userProfile, loading, segments]);

  if (loading) {
    // Show loading screen while checking auth
    return null; // or a loading component
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(patient-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(doctor-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(driver-tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
