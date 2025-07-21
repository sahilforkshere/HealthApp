import { Stack } from 'expo-router';

export default function AmbulancesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f44336',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="request" 
        options={{ 
          title: 'Request Emergency Ambulance',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="tracking" 
        options={{ 
          title: 'Live Ambulance Tracking',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}
