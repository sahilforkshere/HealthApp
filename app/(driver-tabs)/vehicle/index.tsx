import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getDriverVehicleDetails, 
  updateVehicleDetails, 
  VehicleDetails 
} from '../../../services/vehicle.service';

export default function VehicleDetailsScreen() {
  const { userProfile } = useAuth();
  const [vehicleData, setVehicleData] = useState<Partial<VehicleDetails>>({
    license_number: '',
    vehicle_registration: '',
    vehicle_type: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_color: '',
    insurance_number: '',
    insurance_expiry: '',
    license_expiry: '',
    vehicle_photos: [],
    current_location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const vehicleTypes = [
    { label: 'Basic Life Support (BLS)', value: 'BLS' },
    { label: 'Advanced Life Support (ALS)', value: 'ALS' },
    { label: 'Critical Care Transport', value: 'CCT' },
    { label: 'Emergency Response Vehicle', value: 'ERV' },
    { label: 'Mobile ICU', value: 'MICU' }
  ];

  const vehicleColors = [
    'White', 'Yellow', 'Orange', 'Red', 'Blue', 'Green', 'Silver', 'Black'
  ];

  useEffect(() => {
    loadVehicleDetails();
  }, [userProfile]);

  const loadVehicleDetails = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const details = await getDriverVehicleDetails(userProfile.id);
      if (details) {
        setVehicleData(details);
        console.log('✅ Vehicle details loaded:', details);
      } else {
        console.log('ℹ️ No vehicle details found, using defaults');
      }
    } catch (error: any) {
      console.error('❌ Error loading vehicle details:', error);
      Alert.alert('Error', `Failed to load vehicle details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveVehicleDetails = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Basic validation
    if (!vehicleData.license_number?.trim() || !vehicleData.vehicle_registration?.trim()) {
      Alert.alert('Validation Error', 'Please fill in required fields (License Number and Vehicle Registration)');
      return;
    }

    try {
      setUpdating(true);
      console.log('💾 Saving vehicle details...');
      
      await updateVehicleDetails(userProfile.id, vehicleData);
      Alert.alert('Success', 'Vehicle details updated successfully!');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', `Failed to update vehicle details: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚑 Vehicle Details</Text>
        <Text style={styles.subtitle}>Manage your ambulance information</Text>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Text style={styles.label}>Driver's License Number *</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.license_number}
          onChangeText={(text) => setVehicleData({...vehicleData, license_number: text})}
          placeholder="Enter license number"
        />

        <Text style={styles.label}>License Expiry Date</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.license_expiry}
          onChangeText={(text) => setVehicleData({...vehicleData, license_expiry: text})}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Current Location</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.current_location}
          onChangeText={(text) => setVehicleData({...vehicleData, current_location: text})}
          placeholder="Enter current location"
          multiline
        />
      </View>

      {/* Vehicle Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <Text style={styles.label}>Vehicle Registration Number *</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.vehicle_registration}
          onChangeText={(text) => setVehicleData({...vehicleData, vehicle_registration: text})}
          placeholder="Enter registration number"
        />

        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={vehicleData.vehicle_type}
            onValueChange={(value) => setVehicleData({...vehicleData, vehicle_type: value})}
          >
            <Picker.Item label="Select Vehicle Type" value="" />
            {vehicleTypes.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Vehicle Model</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.vehicle_model}
          onChangeText={(text) => setVehicleData({...vehicleData, vehicle_model: text})}
          placeholder="Enter vehicle model"
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.vehicle_year?.toString()}
              onChangeText={(text) => setVehicleData({...vehicleData, vehicle_year: parseInt(text) || undefined})}
              placeholder="2023"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={vehicleData.vehicle_color}
                onValueChange={(value) => setVehicleData({...vehicleData, vehicle_color: value})}
              >
                <Picker.Item label="Select Color" value="" />
                {vehicleColors.map(color => (
                  <Picker.Item key={color} label={color} value={color} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Insurance Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance Information</Text>
        
        <Text style={styles.label}>Insurance Policy Number</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.insurance_number}
          onChangeText={(text) => setVehicleData({...vehicleData, insurance_number: text})}
          placeholder="Enter insurance policy number"
        />

        <Text style={styles.label}>Insurance Expiry Date</Text>
        <TextInput
          style={styles.input}
          value={vehicleData.insurance_expiry}
          onChangeText={(text) => setVehicleData({...vehicleData, insurance_expiry: text})}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, updating && styles.disabledButton]}
          onPress={saveVehicleDetails}
          disabled={updating}
        >
          <Text style={styles.saveButtonText}>
            {updating ? 'Saving...' : 'Save Vehicle Details'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>User ID: {userProfile?.id}</Text>
        <Text style={styles.debugText}>License: {vehicleData.license_number || 'Not set'}</Text>
        <Text style={styles.debugText}>Registration: {vehicleData.vehicle_registration || 'Not set'}</Text>
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
    fontSize: 24,
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
    fontSize: 18,
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
  debugSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
