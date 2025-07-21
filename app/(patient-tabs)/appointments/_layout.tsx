import { Stack } from 'expo-router';

export default function AppointmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTintColor: '#1e293b',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false, // Tab will show header
        }} 
      />
      <Stack.Screen 
        name="[appointmentId]" 
        options={{ 
          title: 'Appointment Details',
        }} 
      />
    </Stack>
  );
}
