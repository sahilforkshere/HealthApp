import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function IndexPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Small delay to prevent flash
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (userProfile) {
        switch (userProfile.user_type) {
          case 'patient':
            router.replace('/(patient-tabs)/dashboard');
            break;
          case 'doctor':
            router.replace('/(doctor-tabs)/dashboard');
            break;
          case 'driver':
            router.replace('/(driver-tabs)/dashboard');
            break;
          default:
            router.replace('/(auth)/login');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, userProfile, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196f3" />
      <Text style={styles.text}>Healthcare App</Text>
      <Text style={styles.subtext}>Loading your dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
