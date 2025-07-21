import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor' | 'driver'>('patient');
  const { signUp } = useAuth();

  const handleRegister = async () => {
    try {
      await signUp(email, password, userType, fullName);
      
      Alert.alert(
        'Registration Successful!',
        'Please check your email and click the confirmation link before logging in.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              router.replace('/(auth)/login');
            }
          }
        ],
        { cancelable: false }
      );
      
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <Text style={styles.label}>Full Name:</Text>
      <TextInput 
        style={styles.input}
        value={fullName} 
        onChangeText={setFullName}
        placeholder="Enter your full name"
      />
      
      <Text style={styles.label}>Email:</Text>
      <TextInput 
        style={styles.input}
        value={email} 
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Password:</Text>
      <TextInput 
        style={styles.input}
        value={password} 
        onChangeText={setPassword} 
        placeholder="Enter your password"
        secureTextEntry 
      />

      <Text style={styles.label}>User Type:</Text>
      <View style={styles.userTypeContainer}>
        {(['patient', 'doctor', 'driver'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.userTypeButton,
              userType === type && styles.selectedUserType
            ]}
            onPress={() => setUserType(type)}
          >
            <Text style={[
              styles.userTypeText,
              userType === type && styles.selectedUserTypeText
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Create Account</Text>
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Already have an account? </Text>
        <TouchableOpacity onPress={navigateToLogin}>
          <Text style={styles.link}>Login here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  userTypeButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedUserType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedUserTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 16,
  },
  link: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
