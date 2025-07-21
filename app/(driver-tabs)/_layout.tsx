import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorTabLayout() {
  return (
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
    </Tabs>
  );
}
