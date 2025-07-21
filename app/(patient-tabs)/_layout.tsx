import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PatientProvider } from '../../contexts/PatientContext';
import { PatientAppointmentProvider } from '../../contexts/PatientAppointmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';

export default function PatientTabLayout() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading patient interface...</Text>
      </View>
    );
  }

  if (userProfile?.user_type !== 'patient') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Access denied. Patient account required.</Text>
      </View>
    );
  }

  return (
    <PatientProvider>
      <PatientAppointmentProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#2196f3',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#333',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              elevation: 8,
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
              ),
            }}
          />
          <Tabs.Screen
            name="doctors"
            options={{
              title: 'Find Doctors',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'medical' : 'medical-outline'} color={color} size={24} />
              ),
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              title: 'Appointments',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />
              ),
            }}
          />
          <Tabs.Screen
            name="ambulances"
            options={{
              title: 'Emergency',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'car-sport' : 'car-sport-outline'} color={color} size={24} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
              ),
            }}
          />
        </Tabs>
      </PatientAppointmentProvider>
    </PatientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    textAlign: 'center',
    fontWeight: '600',
  },
});
