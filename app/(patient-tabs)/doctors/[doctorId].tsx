import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePatient } from '../../../contexts/PatientContext';
import * as ImagePicker from 'expo-image-picker';

export default function DoctorDetail() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { doctors, requestConsultation, loading } = usePatient();
  const [problemDescription, setProblemDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [medicalDocuments, setMedicalDocuments] = useState<string[]>([]);
  const router = useRouter();

  const doctor = doctors?.find(d => String(d.id) === String(doctorId));

  const pickMedicalDocument = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to photos to upload medical documents');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newDoc = result.assets[0].uri;
        setMedicalDocuments(prev => [...prev, newDoc]);
        console.log('Medical document selected:', newDoc);
      }
    } catch (error) {
      console.error('Error picking medical document:', error);
      Alert.alert('Error', 'Failed to pick medical document');
    }
  };

  const removeMedicalDocument = (index: number) => {
    setMedicalDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = async () => {
    if (!problemDescription.trim()) {
      Alert.alert('Error', 'Please describe your problem');
      return;
    }

    if (!doctor) {
      Alert.alert('Error', 'Doctor information not available');
      return;
    }

    try {
      setSubmitting(true);
      await requestConsultation(doctorId, problemDescription, medicalDocuments);
      Alert.alert('Success', 'Request submitted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      setProblemDescription('');
      setMedicalDocuments([]);
    } catch (error: any) {
      console.error('Request submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !doctors || doctors.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading doctor information...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Doctor Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getInitials = (fullName: string) => {
    return fullName?.split(' ').map(name => name[0]).slice(0, 2).join('').toUpperCase() || 'DR';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {doctor.profiles?.avatar_url ? (
          <Image source={{ uri: doctor.profiles.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.initialsText}>
              {getInitials(doctor.profiles?.full_name || '')}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{doctor.profiles?.full_name || 'Doctor'}</Text>
        <Text style={styles.specialty}>{doctor.specialty || 'General Practice'}</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Doctor Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🏥 Hospital</Text>
          <Text style={styles.detailValue}>{doctor.hospital_name || 'Not specified'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Location</Text>
          <Text style={styles.detailValue}>{doctor.hospital_address || 'Not specified'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏰ Experience</Text>
          <Text style={styles.detailValue}>{doctor.experience_years || 0} years</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Consultation Fee</Text>
          <Text style={styles.feeValue}>₹{doctor.consultation_fee || 0}</Text>
        </View>
      </View>

      <View style={styles.requestCard}>
        <Text style={styles.cardTitle}>Request Consultation</Text>
        <Text style={styles.subtitle}>Describe your symptoms or health concerns</Text>
        
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder="Please describe your problem, symptoms, or reason for consultation in detail..."
          value={problemDescription}
          onChangeText={setProblemDescription}
          textAlignVertical="top"
        />

        {/* Medical Documents Section */}
        <View style={styles.documentsSection}>
          <Text style={styles.documentsTitle}>Medical Documents (Optional)</Text>
          <Text style={styles.documentsSubtitle}>Upload any relevant medical reports, test results, or prescriptions</Text>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickMedicalDocument}>
            <Text style={styles.uploadButtonText}>📎 Add Medical Document</Text>
          </TouchableOpacity>

          {medicalDocuments.length > 0 && (
            <View style={styles.documentsPreview}>
              {medicalDocuments.map((doc, index) => (
                <View key={index} style={styles.documentItem}>
                  <Image source={{ uri: doc }} style={styles.documentThumbnail} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMedicalDocument(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={handleSubmitRequest}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? '⏳ Submitting Request...' : '📤 Send Request'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#e3f2fd',
  },
  defaultAvatar: {
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  specialty: {
    fontSize: 18,
    color: '#2196f3',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  feeValue: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  requestCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    height: 120,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  documentsSection: {
    marginBottom: 20,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  documentsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  },
  documentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  documentThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196f3',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
