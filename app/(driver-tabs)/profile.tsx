import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDriverProfile, 
  updateDriverProfile 
} from '../../services/driver-profile.service';
import DeleteAccountButton from '../../components/DeleteAccountButton';

export default function DriverProfileScreen() {
  const { userProfile, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [driverData, setDriverData] = useState({
    license_number: '',
    vehicle_registration: '',
    vehicle_type: '',
    current_location: '',
    available_status: false
  });

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });

  const vehicleTypes = [
    { label: 'Basic Life Support (BLS)', value: 'BLS' },
    { label: 'Advanced Life Support (ALS)', value: 'ALS' },
    { label: 'Critical Care Transport', value: 'CCT' },
    { label: 'Emergency Response Vehicle', value: 'ERV' },
    { label: 'Mobile ICU', value: 'MICU' }
  ];

  useEffect(() => {
    loadCompleteProfile();
  }, []);

  const loadCompleteProfile = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      const driverProfile = await getDriverProfile(userProfile.id);
      if (driverProfile) {
        setDriverData({
          license_number: driverProfile.license_number || '',
          vehicle_registration: driverProfile.vehicle_registration || '',
          vehicle_type: driverProfile.vehicle_type || '',
          current_location: driverProfile.current_location || '',
          available_status: driverProfile.available_status || false
        });
      }

      setProfileData({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        avatar_url: userProfile.avatar_url || ''
      });
      
      console.log('✅ Complete profile loaded');
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', `Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileData({
          ...profileData,
          avatar_url: result.assets[0].uri
        });
        
        console.log('📷 New image selected:', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile image');
    }
  };

  const saveCompleteProfile = async () => {
    if (!userProfile) return;

    if (!profileData.full_name?.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!profileData.phone?.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return;
    }

    if (!driverData.license_number?.trim() || !driverData.vehicle_registration?.trim()) {
      Alert.alert('Validation Error', 'Please fill in required driver information');
      return;
    }
    
    try {
      setSaving(true);
      console.log('💾 Saving complete profile...');
      
      await updateProfile(profileData);
      await updateDriverProfile(userProfile.id, driverData);
      
      Alert.alert('Success', 'Profile updated successfully! Patients will now see your information when requesting ambulance services.');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', `Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚑 Driver Profile</Text>
        <Text style={styles.subtitle}>This information will be visible to patients</Text>
      </View>

      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoContainer} onPress={updateProfileImage}>
          {profileData.avatar_url ? (
            <Image source={{ uri: profileData.avatar_url }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePhotoButton} onPress={updateProfileImage}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
        <Text style={styles.photoNote}>Patients will see this photo when requesting your ambulance</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.full_name}
          onChangeText={(text) => setProfileData({...profileData, full_name: text})}
          placeholder="Enter your full name"
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={profileData.phone}
          onChangeText={(text) => setProfileData({...profileData, phone: text})}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Driver's License Number *</Text>
        <TextInput
          style={styles.input}
          value={driverData.license_number}
          onChangeText={(text) => setDriverData({...driverData, license_number: text})}
          placeholder="Enter your license number"
        />

        <Text style={styles.label}>Current Location</Text>
        <TextInput
          style={styles.input}
          value={driverData.current_location}
          onChangeText={(text) => setDriverData({...driverData, current_location: text})}
          placeholder="Enter your current area/location"
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <Text style={styles.label}>Vehicle Registration Number *</Text>
        <TextInput
          style={styles.input}
          value={driverData.vehicle_registration}
          onChangeText={(text) => setDriverData({...driverData, vehicle_registration: text})}
          placeholder="Enter registration number"
        />

        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={driverData.vehicle_type}
            onValueChange={(value) => setDriverData({...driverData, vehicle_type: value})}
            style={styles.picker}
          >
            <Picker.Item label="Select Vehicle Type" value="" />
            {vehicleTypes.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.noticeSection}>
        <Text style={styles.noticeTitle}>📱 Important Notice</Text>
        <Text style={styles.noticeText}>
          Your name, phone number, and photo will be visible to patients when they request ambulance services. 
          Please ensure all information is accurate and professional.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={saveCompleteProfile}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Updating Profile...' : 'Update Complete Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
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

      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>User ID: {userProfile?.id}</Text>
        <Text style={styles.debugText}>User Type: {userProfile?.user_type}</Text>
        <Text style={styles.debugText}>Name: {profileData.full_name || 'Not set'}</Text>
        <Text style={styles.debugText}>Phone: {profileData.phone || 'Not set'}</Text>
        <Text style={styles.debugText}>License: {driverData.license_number || 'Not set'}</Text>
        <Text style={styles.debugText}>Registration: {driverData.vehicle_registration || 'Not set'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  photoContainer: {
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#2196f3',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#2196f3',
  },
  photoPlaceholderText: {
    fontSize: 40,
  },
  changePhotoButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  noticeSection: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
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
  debugContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 40,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
