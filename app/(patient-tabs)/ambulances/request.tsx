import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAmbulance } from '../../../contexts/AmbulanceContext';

export default function AmbulanceRequest() {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { requestAmbulance } = useAmbulance();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!pickupLocation.trim() || !destinationLocation.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      console.log('🚨 Submitting ambulance request...');
      
      await requestAmbulance(
        pickupLocation,
        destinationLocation,
        emergencyLevel,
        notes
      );
      
      Alert.alert(
        'Emergency Request Submitted', 
        'Your ambulance request has been submitted successfully! You will be redirected to track your ambulance.',
        [
          { 
            text: 'Track Ambulance', 
            onPress: () => router.replace('/(patient-tabs)/ambulances/tracking')
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Request submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'For immediate life-threatening emergencies, call emergency services directly.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', onPress: () => Linking.openURL('tel:112') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚨 Emergency Ambulance Request</Text>
        <Text style={styles.subtitle}>Fill in the details for immediate medical assistance</Text>
      </View>

      {/* Emergency Call Button */}
      <TouchableOpacity style={styles.emergencyCallButton} onPress={handleEmergencyCall}>
        <Text style={styles.emergencyCallText}>🆘 CALL EMERGENCY SERVICES (112)</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Pickup Location *</Text>
        <TextInput
          style={styles.input}
          value={pickupLocation}
          onChangeText={setPickupLocation}
          placeholder="Enter your exact current location (building, street, landmarks)"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Destination Hospital *</Text>
        <TextInput
          style={styles.input}
          value={destinationLocation}
          onChangeText={setDestinationLocation}
          placeholder="Preferred hospital or nearest medical facility"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Emergency Priority Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={emergencyLevel}
            onValueChange={setEmergencyLevel}
            style={styles.picker}
          >
            <Picker.Item label="🟢 Low Priority - Non-urgent transport" value="low" />
            <Picker.Item label="🟡 Medium Priority - Urgent but stable" value="medium" />
            <Picker.Item label="🔴 High Priority - Serious condition" value="high" />
            <Picker.Item label="🆘 Critical Emergency - Life threatening" value="critical" />
          </Picker>
        </View>

        <Text style={styles.label}>Medical Details & Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Describe the medical emergency, symptoms, or special requirements"
          multiline
          numberOfLines={4}
        />

        <View style={styles.importantNote}>
          <Text style={styles.noteTitle}>📋 Important Information</Text>
          <Text style={styles.noteText}>
            • Keep your phone accessible for driver contact{'\n'}
            • Be ready at the pickup location{'\n'}
            • Have medical documents ready{'\n'}
            • You'll receive live tracking updates once accepted
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>🚨 SUBMIT EMERGENCY REQUEST</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  header: { 
    backgroundColor: '#f44336', 
    padding: 20, 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  emergencyCallButton: {
    backgroundColor: '#d50000',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 4,
  },
  emergencyCallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: { 
    backgroundColor: '#fff', 
    margin: 16, 
    padding: 20, 
    borderRadius: 12,
    elevation: 2,
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginTop: 16, 
    marginBottom: 8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  pickerContainer: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  importantNote: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  submitButton: { 
    backgroundColor: '#f44336', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 4,
  },
  disabledButton: { 
    opacity: 0.6 
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
