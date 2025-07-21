import { Stack } from 'expo-router';

export default function DoctorsLayout() {
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
        name="[doctorId]" 
        options={{ 
          title: 'Doctor Profile',
        }} 
      />
    </Stack>
  );
}
