import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PatientProvider } from '../../contexts/PatientContext';

export default function PatientTabLayout() {
  return (
    <PatientProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerTintColor: '#1e293b',
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
      </Tabs>
    </PatientProvider>
  );
}
