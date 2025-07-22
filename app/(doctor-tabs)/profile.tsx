import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import DeleteAccountButton from '../../components/DeleteAccountButton';

export default function DoctorProfile() {
  const { userProfile, signOut } = useAuth();
  const [doctorDetails, setDoctorDetails] = useState({
    specialty: '',
    license_number: '',
    hospital_name: '',
    hospital_address: '',
    experience_years: '',
    consultation_fee: '',
    available_status: true,
  });
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchDoctorDetails();
    }
  }, [userProfile]);

  const fetchDoctorDetails = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();
      
      if (data && !error) {
        setDoctorDetails({
          specialty: data.specialty || '',
          license_number: data.license_number || '',
          hospital_name: data.hospital_name || '',
          hospital_address: data.hospital_address || '',
          experience_years: data.experience_years?.toString() || '',
          consultation_fee: data.consultation_fee?.toString() || '',
          available_status: data.available_status ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!result.canceled && result.assets[0]) {
        setLocalImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfileImage = async () => {
    if (!localImageUri || !userProfile) {
      Alert.alert('Error', 'No image selected');
      return;
    }
    
    try {
      setImageLoading(true);
      
      const timestamp = Date.now();
      const fileExt = localImageUri.split('.').pop() || 'jpg';
      const fileName = `doctor_${userProfile.id}_${timestamp}.${fileExt}`;
      
      const base64 = await FileSystem.readAsStringAsync(localImageUri, {
        encoding: 'base64',
      });
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      Alert.alert('Success', 'Profile picture uploaded successfully!');
      setLocalImageUri(null);
      
    } catch (error: any) {
      console.error('Complete upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  const saveDoctorDetails = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'Please log in again');
      return;
    }

    if (!doctorDetails.specialty.trim()) {
      Alert.alert('Error', 'Specialty is required');
      return;
    }
    if (!doctorDetails.license_number.trim()) {
      Alert.alert('Error', 'License number is required');
      return;
    }
    if (!doctorDetails.hospital_name.trim()) {
      Alert.alert('Error', 'Hospital name is required');
      return;
    }
    if (!doctorDetails.hospital_address.trim()) {
      Alert.alert('Error', 'Hospital address is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const doctorData = {
        user_id: userProfile.id,
        specialty: doctorDetails.specialty.trim(),
        license_number: doctorDetails.license_number.trim(),
        hospital_name: doctorDetails.hospital_name.trim(),
        hospital_address: doctorDetails.hospital_address.trim(),
        experience_years: parseInt(doctorDetails.experience_years) || 0,
        consultation_fee: parseFloat(doctorDetails.consultation_fee) || 0,
        available_status: doctorDetails.available_status,
      };

      const { data: existing, error: checkError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userProfile.id)
        .single();

      if (existing && !checkError) {
        const { error } = await supabase
          .from('doctors')
          .update(doctorData)
          .eq('user_id', userProfile.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert([doctorData]);
        
        if (error) throw error;
      }

      Alert.alert('Success', 'Profile saved successfully!');
      
    } catch (error: any) {
      console.error('Save error:', error);
      
      let errorMessage = 'Failed to save profile. ';
      if (error.code === '23505') {
        errorMessage = 'License number already exists.';
      } else if (error.code === '42501') {
        errorMessage = 'Permission denied. Please contact support.';
      } else {
        errorMessage += error.message || 'Unknown error.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
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
      <View style={styles.imageSection}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Fill in your details to appear in patient searches</Text>
        
        <View style={styles.avatarContainer}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.avatar} />
          ) : userProfile?.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Text style={styles.placeholderText}>👨‍⚕️</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>📷 Choose Photo</Text>
          </TouchableOpacity>
          
          {localImageUri && (
            <TouchableOpacity 
              style={[styles.imageButton, styles.uploadButton]} 
              onPress={uploadProfileImage}
              disabled={imageLoading}
            >
              <Text style={styles.imageButtonText}>
                {imageLoading ? 'Uploading...' : '☁️ Upload Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Medical Specialty *</Text>
          <TextInput
            style={styles.input}
            value={doctorDetails.specialty}
            onChangeText={(text) => setDoctorDetails({ ...doctorDetails, specialty: text })}
            placeholder="e.g., Cardiology, Pediatrics, General Medicine"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Medical License Number *</Text>
          <TextInput
            style={styles.input}
            value={doctorDetails.license_number}
            onChangeText={(text) => setDoctorDetails({ ...doctorDetails, license_number: text })}
            placeholder="Your medical license number"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hospital/Clinic Name *</Text>
          <TextInput
            style={styles.input}
            value={doctorDetails.hospital_name}
            onChangeText={(text) => setDoctorDetails({ ...doctorDetails, hospital_name: text })}
            placeholder="Name of your primary workplace"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hospital/Clinic Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={doctorDetails.hospital_address}
            onChangeText={(text) => setDoctorDetails({ ...doctorDetails, hospital_address: text })}
            placeholder="Complete address including city, state"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Experience (Years)</Text>
            <TextInput
              style={styles.input}
              value={doctorDetails.experience_years}
              onChangeText={(text) => setDoctorDetails({ ...doctorDetails, experience_years: text })}
              placeholder="5"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>Consultation Fee (₹)</Text>
            <TextInput
              style={styles.input}
              value={doctorDetails.consultation_fee}
              onChangeText={(text) => setDoctorDetails({ ...doctorDetails, consultation_fee: text })}
              placeholder="500"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={saveDoctorDetails}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '💾 Saving...' : '✅ Save Profile'}
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            * Required fields. Your profile will be visible to patients after saving.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  imageSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#e3f2fd',
  },
  placeholder: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 40,
  },
  imageButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 5,
    minWidth: 140,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#28a745',
  },
  imageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfField: {
    flex: 0.48,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
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
  footer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
