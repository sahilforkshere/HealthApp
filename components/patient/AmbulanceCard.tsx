import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert, Platform } from 'react-native';

interface AmbulanceCardProps {
  ambulance: {
    id: string;
    vehicle_registration: string;
    vehicle_type: string;
    current_location?: string;
    available_status?: boolean;
    profiles: {
      full_name: string;
      phone?: string;
      avatar_url?: string;
    };
  };
  onPress?: () => void;
}

export default function AmbulanceCard({ ambulance, onPress }: AmbulanceCardProps) {
  const handleCallDriver = async () => {
    const phoneNumber = ambulance.profiles?.phone;
    const driverName = ambulance.profiles?.full_name;
    
    console.log('📞 Attempting to call driver:', { phoneNumber, driverName });
    
    if (!phoneNumber) {
      Alert.alert('Contact Unavailable', 'Driver phone number is not available');
      return;
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    console.log('📞 Clean phone number:', cleanPhoneNumber);
    
    if (cleanPhoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'The phone number appears to be invalid');
      return;
    }
    
    // Create the tel: URL
    const phoneUrl = `tel:${cleanPhoneNumber}`;
    
    console.log('📞 Phone URL:', phoneUrl);
    
    try {
      // Check if the device can handle phone calls
      const canCall = await Linking.canOpenURL(phoneUrl);
      console.log('📞 Can make call:', canCall);
      
      if (canCall) {
        Alert.alert(
          'Call Driver',
          `Call ${driverName}?\n\nPhone: ${phoneNumber}\nVehicle: ${ambulance.vehicle_registration}`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Call Now', 
              style: 'default',
              onPress: async () => {
                try {
                  console.log('📞 Opening phone app...');
                  await Linking.openURL(phoneUrl);
                } catch (openError) {
                  console.error('❌ Error opening phone app:', openError);
                  Alert.alert('Call Failed', 'Unable to open phone app');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Call Not Supported', 
          Platform.OS === 'ios' 
            ? 'Phone calls are not supported on this device' 
            : 'Your device does not support phone calls'
        );
      }
    } catch (error) {
      console.error('❌ Error checking phone capability:', error);
      Alert.alert('Error', 'Unable to initiate phone call');
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bls': return '🚑';
      case 'als': return '🏥';
      case 'cct': return '🚨';
      case 'micu': return '💊';
      default: return '🚑';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.driverSection}>
          {ambulance.profiles?.avatar_url ? (
            <Image 
              source={{ uri: ambulance.profiles.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>👨‍⚕️</Text>
            </View>
          )}
          
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {ambulance.profiles?.full_name || 'Driver'}
            </Text>
            <Text style={styles.driverTitle}>Licensed Ambulance Driver</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusDot}>🟢</Text>
          <Text style={styles.statusText}>AVAILABLE</Text>
        </View>
      </View>

      {/* Vehicle Info Section */}
      <View style={styles.vehicleSection}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleIcon}>
            {getVehicleTypeIcon(ambulance.vehicle_type)}
          </Text>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleType}>
              {ambulance.vehicle_type} Ambulance
            </Text>
            <Text style={styles.vehicleReg}>
              {ambulance.vehicle_registration}
            </Text>
          </View>
        </View>
        
        {ambulance.current_location && (
          <Text style={styles.location}>
            📍 {ambulance.current_location}
          </Text>
        )}
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[
            styles.callButton,
            !ambulance.profiles?.phone && styles.disabledButton
          ]}
          onPress={handleCallDriver}
          disabled={!ambulance.profiles?.phone}
        >
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callText}>
            {ambulance.profiles?.phone ? 'Call Driver' : 'No Phone'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.responseTime}>
          <Text style={styles.responseLabel}>ETA</Text>
          <Text style={styles.responseValue}>~5 min</Text>
        </View>
      </View>

      {/* Debug Info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Phone: {ambulance.profiles?.phone || 'Not available'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 24,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  driverTitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    fontSize: 10,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  vehicleSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  vehicleReg: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  location: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  callButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    elevation: 0,
  },
  callIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  callText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseTime: {
    alignItems: 'center',
  },
  responseLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  responseValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});
