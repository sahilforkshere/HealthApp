import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DoctorProvider } from '../../contexts/DoctorContext';

export default function DoctorTabLayout() {
  return (
    <DoctorProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#059669',
          headerStyle: {
            backgroundColor: '#f0fdf4',
          },
          headerTintColor: '#1e293b',
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={24} />
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
    </DoctorProvider>
  );
}
