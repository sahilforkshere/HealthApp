import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { 
  updateDriverAvailabilityStatus, 
  getDriverAvailabilityStatus 
} from '../../services/ambulance.service';

export default function DriverAvailability() {
  const { userProfile } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAvailabilityStatus();
  }, []);

  const loadAvailabilityStatus = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const status = await getDriverAvailabilityStatus(userProfile.id);
      setIsAvailable(status);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!userProfile) return;

    try {
      setUpdating(true);
      const newStatus = !isAvailable;
      
      await updateDriverAvailabilityStatus(userProfile.id, newStatus);
      setIsAvailable(newStatus);
      
      Alert.alert(
        'Status Updated',
        `You are now ${newStatus ? 'available for emergency requests' : 'offline and unavailable'}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update availability status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Main Status Toggle */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Driver Availability</Text>
          <View style={styles.statusToggle}>
            <Text style={[styles.statusLabel, isAvailable && styles.onlineText]}>
              {isAvailable ? '🟢 Available' : '🔴 Offline'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              disabled={updating || loading}
              trackColor={{ false: '#767577', true: '#4caf50' }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <Text style={styles.statusDescription}>
          {isAvailable 
            ? 'You will receive emergency ambulance requests in your area' 
            : 'You will not receive any emergency requests while offline'}
        </Text>
        
        {updating && (
          <Text style={styles.updatingText}>Updating status...</Text>
        )}
      </View>

      {/* Availability Guidelines */}
      <View style={styles.guidelinesCard}>
        <Text style={styles.guidelinesTitle}>📋 Availability Guidelines</Text>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineIcon}>🟢</Text>
          <View style={styles.guidelineContent}>
            <Text style={styles.guidelineTitle}>When Available</Text>
            <Text style={styles.guidelineText}>
              • You'll receive emergency requests from patients
              • Your vehicle will appear in patient searches
              • Response time expectations apply
              • Keep your phone accessible at all times
            </Text>
          </View>
        </View>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineIcon}>🔴</Text>
          <View style={styles.guidelineContent}>
            <Text style={styles.guidelineTitle}>When Offline</Text>
            <Text style={styles.guidelineText}>
              • No new requests will be assigned to you
              • Complete any active emergency calls first
              • Update your location when going back online
              • Use for breaks, maintenance, or end of shift
            </Text>
          </View>
        </View>
      </View>

      {/* Emergency Protocol */}
      <View style={styles.protocolCard}>
        <Text style={styles.protocolTitle}>🚨 Emergency Protocol</Text>
        
        <View style={styles.protocolList}>
          <Text style={styles.protocolItem}>
            1. <Text style={styles.bold}>Always prioritize critical emergencies</Text>
          </Text>
          <Text style={styles.protocolItem}>
            2. <Text style={styles.bold}>Maintain professional communication</Text>
          </Text>
          <Text style={styles.protocolItem}>
            3. <Text style={styles.bold}>Follow traffic safety rules</Text>
          </Text>
          <Text style={styles.protocolItem}>
            4. <Text style={styles.bold}>Update request status in real-time</Text>
          </Text>
          <Text style={styles.protocolItem}>
            5. <Text style={styles.bold}>Contact emergency services if needed</Text>
          </Text>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>📞 Emergency Contacts</Text>
        
        <View style={styles.contactList}>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Emergency Services:</Text>
            <Text style={styles.contactNumber}>112 / 911</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Dispatch Center:</Text>
            <Text style={styles.contactNumber}>+1-800-AMBULANCE</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Technical Support:</Text>
            <Text style={styles.contactNumber}>+1-800-SUPPORT</Text>
          </View>
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
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  onlineText: {
    color: '#4caf50',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  updatingText: {
    fontSize: 14,
    color: '#2196f3',
    fontStyle: 'italic',
    marginTop: 8,
  },
  guidelinesCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  guideline: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  guidelineIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 4,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  protocolCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  protocolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  protocolList: {
    gap: 8,
  },
  protocolItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  contactCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    marginBottom: 32,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  contactNumber: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: 'bold',
  },
});
