import { Stack } from 'expo-router';

export default function PatientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f0fdf4',
        },
        headerTintColor: '#1e293b',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Patient Requests',
          headerShown: false, // Tab will show header
        }} 
      />
      <Stack.Screen 
        name="[requestId]" 
        options={{ 
          title: 'Request Details',
        }} 
      />
    </Stack>
  );
}
