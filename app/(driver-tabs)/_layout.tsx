import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useDriver } from '../../contexts/DriverContext';
import { View, Text, StyleSheet } from 'react-native';

export default function DriverTabLayout() {
  const { userProfile, loading } = useAuth();
  const { requests } = useDriver();

  // Only render tabs for drivers
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading driver interface...</Text>
      </View>
    );
  }

  if (userProfile?.user_type !== 'driver') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Access denied. Driver account required.</Text>
      </View>
    );
  }

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: '#666',
        headerStyle: { 
          backgroundColor: '#4caf50',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: '🚑 Driver Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'speedometer' : 'speedometer-outline'} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          headerTitle: '🚨 Emergency Requests',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'notifications' : 'notifications-outline'} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
          tabBarBadge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
        }}
      />
      
      <Tabs.Screen
        name="vehicle"
        options={{
          title: 'My Vehicle',
          headerTitle: '🚙 Vehicle Management',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'car' : 'car-outline'} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Availability',
          headerTitle: '⏰ My Schedule',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'time' : 'time-outline'} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: '👤 Driver Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
    </Tabs>
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
