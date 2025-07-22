import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientProfile, updatePatientProfile, PatientProfile } from '../../services/patient-profile.service';
import DeleteAccountButton from '../../components/DeleteAccountButton';

export default function PatientProfileScreen() {
  const { userProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<Partial<PatientProfile>>({
    blood_group: '',
    gender: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    height: undefined,
    weight: undefined,
    insurance_provider: '',
    insurance_policy_number: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      const profile = await getPatientProfile(userProfile.id);
      if (profile) {
        setProfileData(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      await updatePatientProfile(userProfile.id, profileData);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Complete your medical information</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.blood_group}
            onValueChange={(value) => setProfileData({...profileData, blood_group: value})}
            style={styles.picker}
          >
            <Picker.Item label="Select Blood Group" value="" />
            <Picker.Item label="A+" value="A+" />
            <Picker.Item label="A-" value="A-" />
            <Picker.Item label="B+" value="B+" />
            <Picker.Item label="B-" value="B-" />
            <Picker.Item label="AB+" value="AB+" />
            <Picker.Item label="AB-" value="AB-" />
            <Picker.Item label="O+" value="O+" />
            <Picker.Item label="O-" value="O-" />
          </Picker>
        </View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.gender}
            onValueChange={(value) => setProfileData({...profileData, gender: value})}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          value={profileData.date_of_birth || ''}
          onChangeText={(text) => setProfileData({...profileData, date_of_birth: text})}
          placeholder="YYYY-MM-DD"
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={profileData.height?.toString() || ''}
              onChangeText={(text) => setProfileData({...profileData, height: parseFloat(text) || undefined})}
              placeholder="170"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={profileData.weight?.toString() || ''}
              onChangeText={(text) => setProfileData({...profileData, weight: parseFloat(text) || undefined})}
              placeholder="70"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        
        <Text style={styles.label}>Contact Name</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergency_contact_name || ''}
          onChangeText={(text) => setProfileData({...profileData, emergency_contact_name: text})}
          placeholder="Full name of emergency contact"
        />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergency_contact_phone || ''}
          onChangeText={(text) => setProfileData({...profileData, emergency_contact_phone: text})}
          placeholder="+1234567890"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Relationship</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergency_contact_relation || ''}
          onChangeText={(text) => setProfileData({...profileData, emergency_contact_relation: text})}
          placeholder="e.g., Spouse, Parent, Sibling"
        />
      </View>

      {/* Medical Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        
        <Text style={styles.label}>Medical History</Text>
        <TextInput
          style={styles.textArea}
          value={profileData.medical_history || ''}
          onChangeText={(text) => setProfileData({...profileData, medical_history: text})}
          placeholder="Any past medical conditions, surgeries, etc."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={styles.textArea}
          value={profileData.allergies || ''}
          onChangeText={(text) => setProfileData({...profileData, allergies: text})}
          placeholder="Food allergies, drug allergies, etc."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Current Medications</Text>
        <TextInput
          style={styles.textArea}
          value={profileData.current_medications || ''}
          onChangeText={(text) => setProfileData({...profileData, current_medications: text})}
          placeholder="List any medications you're currently taking"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Insurance Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance Information</Text>
        
        <Text style={styles.label}>Insurance Provider</Text>
        <TextInput
          style={styles.input}
          value={profileData.insurance_provider || ''}
          onChangeText={(text) => setProfileData({...profileData, insurance_provider: text})}
          placeholder="e.g., Blue Cross, Aetna"
        />

        <Text style={styles.label}>Policy Number</Text>
        <TextInput
          style={styles.input}
          value={profileData.insurance_policy_number || ''}
          onChangeText={(text) => setProfileData({...profileData, insurance_policy_number: text})}
          placeholder="Insurance policy number"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={saveProfile}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>⚠️ Danger Zone</Text>
          <Text style={styles.dangerZoneText}>
            Once you delete your account, there is no going back. Please be certain.
          </Text>
          <DeleteAccountButton />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#2196f3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2196f3',
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  buttonContainer: {
    margin: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerZone: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f44336',
    marginTop: 20,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
});
