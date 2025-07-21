import { Stack } from 'expo-router';

export default function RequestsLayout() {
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
        name="[requestId]" 
        options={{ 
          title: 'Request Details',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}
