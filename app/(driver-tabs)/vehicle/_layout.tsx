import { Stack } from 'expo-router';

export default function VehicleLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4caf50',
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
          headerShown: false, // Tab will show header
        }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Edit Vehicle Details',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}
