import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  Switch, 
  RefreshControl, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  Modal 
} from 'react-native';
import { 
  getDriverRequests,
  getPendingRequests,
  getDriverIdByUserId,
  updateDriverAvailabilityStatus,
  getDriverAvailabilityStatus,
  acceptAmbulanceRequest,
  updateAmbulanceRequestStatus,
  updateDriverLocation,
  AmbulanceRequest 
} from '../../../services/ambulance.service';
import { useAuth } from '../../../contexts/AuthContext';

export default function DriverRequests() {
  const [myRequests, setMyRequests] = useState<AmbulanceRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AmbulanceRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'available'>('my');
  
  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [driverLocation, setDriverLocation] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  
  const { userProfile } = useAuth();

  useEffect(() => {
    loadDriverData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadRequests, 60000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const loadDriverData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      
      const driverIdResult = await getDriverIdByUserId(userProfile.id);
      setDriverId(driverIdResult);
      
      const availabilityStatus = await getDriverAvailabilityStatus(userProfile.id);
      setIsAvailable(availabilityStatus);
      
      await loadRequests(driverIdResult);
      
    } catch (error) {
      console.error('❌ Error loading driver data:', error);
      Alert.alert('Error', 'Failed to load driver information');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (driverIdToUse?: string) => {
    const idToUse = driverIdToUse || driverId;
    if (!idToUse) return;

    try {
      const myRequestsData = await getDriverRequests(idToUse);
      setMyRequests(myRequestsData);
      
      if (isAvailable) {
        const pendingData = await getPendingRequests();
        setPendingRequests(pendingData);
      } else {
        setPendingRequests([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading requests:', error);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowLocationModal(true);
  };

  const confirmAcceptRequest = async () => {
    if (!driverId || !selectedRequestId) return;

    if (!driverLocation.trim()) {
      Alert.alert('Location Required', 'Please enter your current location');
      return;
    }

    try {
      await acceptAmbulanceRequest(selectedRequestId, driverId, driverLocation);
      await loadRequests();
      setShowLocationModal(false);
      setDriverLocation('');
      setSelectedRequestId('');
      Alert.alert('Success', 'Emergency request accepted! Patient has been notified with your location.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleUpdateStatus = (requestId: string, currentStatus: string) => {
    setSelectedRequestId(requestId);
    
    // Determine next possible status
    let nextStatus = '';
    switch (currentStatus) {
      case 'accepted':
        nextStatus = 'en-route';
        break;
      case 'en-route':
        nextStatus = 'arrived';
        break;
      case 'arrived':
        nextStatus = 'completed';
        break;
      default:
        nextStatus = 'en-route';
    }
    
    setNewStatus(nextStatus);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedRequestId || !newStatus) return;

    if (!driverLocation.trim()) {
      Alert.alert('Location Required', 'Please enter your current location for tracking');
      return;
    }

    try {
      await updateAmbulanceRequestStatus(selectedRequestId, newStatus, driverId, driverLocation);
      await loadRequests();
      setShowStatusModal(false);
      setDriverLocation('');
      setSelectedRequestId('');
      setNewStatus('');
      
      const statusMessages = {
        'en-route': 'Status updated to En-Route. Patient has been notified.',
        'arrived': 'Status updated to Arrived. Patient has been notified.',
        'completed': 'Request marked as completed. Great job!'
      };
      
      Alert.alert('Success', statusMessages[newStatus as keyof typeof statusMessages] || 'Status updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!userProfile) return;

    try {
      setUpdating(true);
      const newAvailability = !isAvailable;
      
      await updateDriverAvailabilityStatus(userProfile.id, newAvailability);
      setIsAvailable(newAvailability);
      await loadRequests();
      
      Alert.alert(
        'Status Updated', 
        `You are now ${newAvailability ? 'available for emergency requests' : 'offline'}`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Toggle availability failed:', error);
      Alert.alert('Error', error.message || 'Failed to update availability status');
    } finally {
      setUpdating(false);
    }
  };

  const getEmergencyColor = (level: string) => {
    switch (level) {
      case 'critical': return '#d50000';
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusActions = (status: string) => {
    switch (status) {
      case 'accepted':
        return { text: 'Start Journey', color: '#2196f3', icon: '🚑' };
      case 'en-route':
        return { text: 'Mark Arrived', color: '#ff9800', icon: '📍' };
      case 'arrived':
        return { text: 'Complete', color: '#4caf50', icon: '✅' };
      default:
        return { text: 'Update', color: '#757575', icon: '🔄' };
    }
  };

  const renderRequestCard = (item: AmbulanceRequest, isMyRequest: boolean = false) => {
    const statusAction = getStatusActions(item.status);
    
    return (
      <View style={[styles.requestCard, { borderLeftColor: getEmergencyColor(item.emergency_level) }]}>
        <View style={styles.requestHeader}>
          <Text style={styles.patientName}>
            {item.patients?.profiles?.full_name || 'Unknown Patient'}
          </Text>
          <View style={[styles.emergencyBadge, { backgroundColor: getEmergencyColor(item.emergency_level) }]}>
            <Text style={styles.emergencyText}>{item.emergency_level.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.location}>📍 From: {item.pickup_location}</Text>
        <Text style={styles.location}>🏥 To: {item.destination_location}</Text>
        <Text style={styles.phone}>📞 {item.patients?.profiles?.phone || 'No phone'}</Text>
        
        {item.notes && (
          <Text style={styles.notes}>Notes: {item.notes}</Text>
        )}
        
        <View style={styles.statusRow}>
          <Text style={styles.status}>Status: {item.status}</Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        {item.driver_location && (
          <Text style={styles.driverLocation}>
            🚑 Your last location: {item.driver_location}
          </Text>
        )}

        <View style={styles.actionButtons}>
          {!isMyRequest ? (
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Text style={styles.acceptButtonText}>Accept Request</Text>
            </TouchableOpacity>
          ) : item.status !== 'completed' && item.status !== 'cancelled' && (
            <TouchableOpacity 
              style={[styles.statusButton, { backgroundColor: statusAction.color }]}
              onPress={() => handleUpdateStatus(item.id, item.status)}
            >
              <Text style={styles.statusButtonText}>
                {statusAction.icon} {statusAction.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Availability Toggle */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Driver Status</Text>
        <View style={styles.statusToggle}>
          <Text style={[styles.statusLabel, isAvailable && styles.availableText]}>
            {isAvailable ? '🟢 Available' : '🔴 Offline'}
          </Text>
          <Switch 
            value={isAvailable} 
            onValueChange={handleAvailabilityToggle}
            disabled={updating || loading}
            trackColor={{ false: '#767577', true: '#4caf50' }}
            thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Requests ({myRequests.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <FlatList
        data={activeTab === 'my' ? myRequests : pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderRequestCard(item, activeTab === 'my')}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadRequests()} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'my' 
                ? 'No assigned requests' 
                : isAvailable 
                  ? 'No pending requests' 
                  : 'Go online to see available requests'
              }
            </Text>
          </View>
        }
      />

      {/* Accept Request Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Accept Emergency Request</Text>
            <Text style={styles.modalSubtitle}>
              Enter your current location so the patient can track your ambulance:
            </Text>
            
            <TextInput
              style={styles.locationInput}
              value={driverLocation}
              onChangeText={setDriverLocation}
              placeholder="e.g., Near City Hospital, Main Street intersection"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowLocationModal(false);
                  setDriverLocation('');
                  setSelectedRequestId('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmAcceptRequest}
              >
                <Text style={styles.confirmButtonText}>Accept Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Request Status</Text>
            <Text style={styles.modalSubtitle}>
              Update your status to: <Text style={styles.statusHighlight}>{newStatus?.toUpperCase()}</Text>
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter your current location for patient tracking:
            </Text>
            
            <TextInput
              style={styles.locationInput}
              value={driverLocation}
              onChangeText={setDriverLocation}
              placeholder="Enter your current location for tracking"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowStatusModal(false);
                  setDriverLocation('');
                  setSelectedRequestId('');
                  setNewStatus('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmStatusUpdate}
              >
                <Text style={styles.confirmButtonText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  statusCard: { 
    backgroundColor: '#fff', 
    margin: 16, 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2
  },
  statusTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  statusToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  statusLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#666' 
  },
  availableText: { 
    color: '#4caf50' 
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#2196f3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  requestCard: { 
    backgroundColor: '#fff', 
    margin: 16, 
    padding: 16, 
    borderRadius: 12, 
    borderLeftWidth: 4,
    elevation: 2
  },
  requestHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  patientName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333',
    flex: 1
  },
  emergencyBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  emergencyText: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  location: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 4 
  },
  phone: { 
    fontSize: 14, 
    color: '#2196f3', 
    fontWeight: '600', 
    marginTop: 8 
  },
  notes: { 
    fontSize: 14, 
    color: '#333', 
    marginTop: 8, 
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  driverLocation: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: 'bold',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  actionButtons: {
    marginTop: 12,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusHighlight: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
