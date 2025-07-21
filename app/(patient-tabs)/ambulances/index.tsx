import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAmbulance } from '../../../contexts/AmbulanceContext';
import { getPatientRequests, getPatientIdByUserId, AmbulanceRequest } from '../../../services/ambulance.service';
import { useAuth } from '../../../contexts/AuthContext';
import AmbulanceCard from '../../../components/patient/AmbulanceCard';

export default function AmbulancesList() {
  const { availableAmbulances, loading, loadAmbulances } = useAmbulance();
  const { userProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my-requests'>('available');
  const [myRequests, setMyRequests] = useState<AmbulanceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (activeTab === 'my-requests') {
      loadMyRequests();
    }
    
    // Auto-refresh every 30 seconds when viewing requests
    const interval = setInterval(() => {
      if (activeTab === 'my-requests') {
        loadMyRequests();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab, userProfile]);

  const loadMyRequests = async () => {
    if (!userProfile) return;

    try {
      setLoadingRequests(true);
      const patientId = await getPatientIdByUserId(userProfile.id);
      const requests = await getPatientRequests(patientId);
      setMyRequests(requests);
      console.log('✅ Loaded patient requests:', requests.length);
    } catch (error) {
      console.error('❌ Error loading patient requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'available') {
        await loadAmbulances();
      } else {
        await loadMyRequests();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmergencyRequest = () => {
    router.push('/(patient-tabs)/ambulances/request');
  };

  const handleTrackRequest = (request: AmbulanceRequest) => {
    if (request.status === 'pending') {
      Alert.alert(
        'Request Pending',
        'Your request is still waiting for a driver to accept. You will be notified when a driver accepts your request.',
        [{ text: 'OK' }]
      );
    } else {
      router.push({
        pathname: '/(patient-tabs)/ambulances/tracking',
        params: { requestId: request.id }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'accepted': return '#2196f3';
      case 'en-route': return '#ff9800';
      case 'arrived': return '#4caf50';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for driver acceptance';
      case 'accepted': return 'Driver accepted - preparing to depart';
      case 'en-route': return 'Ambulance is on the way';
      case 'arrived': return 'Ambulance has arrived';
      case 'completed': return 'Request completed';
      case 'cancelled': return 'Request cancelled';
      default: return status;
    }
  };

  const renderRequestCard = (item: AmbulanceRequest) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => handleTrackRequest(item)}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>Emergency Request</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.requestInfo}>📍 From: {item.pickup_location}</Text>
      <Text style={styles.requestInfo}>🏥 To: {item.destination_location}</Text>
      <Text style={styles.requestInfo}>🚨 Priority: {item.emergency_level.toUpperCase()}</Text>
      
      {item.ambulance_drivers && (
        <View style={styles.driverSection}>
          <Text style={styles.driverTitle}>🚑 Assigned Driver:</Text>
          <Text style={styles.driverName}>
            {item.ambulance_drivers.profiles?.full_name || 'Driver information loading...'}
          </Text>
          <Text style={styles.vehicleInfo}>
            {item.ambulance_drivers.vehicle_type} • {item.ambulance_drivers.vehicle_registration}
          </Text>
          {item.driver_location && (
            <Text style={styles.driverLocation}>
              📍 Current location: {item.driver_location}
            </Text>
          )}
        </View>
      )}

      <View style={styles.requestFooter}>
        <Text style={styles.requestTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        <Text style={styles.statusMessage}>
          {getStatusMessage(item.status)}
        </Text>
      </View>

      {item.status !== 'pending' && item.status !== 'completed' && item.status !== 'cancelled' && (
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={() => handleTrackRequest(item)}
        >
          <Text style={styles.trackButtonText}>📍 Track Live Location</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Emergency Header */}
      <LinearGradient
        colors={['#ff4444', '#cc0000']}
        style={styles.emergencyHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🚨</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Emergency Services</Text>
            <Text style={styles.headerSubtitle}>24/7 Ambulance Support</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.emergencyButton} 
          onPress={handleEmergencyRequest}
        >
          <Text style={styles.emergencyButtonText}>REQUEST AMBULANCE</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available Ambulances ({availableAmbulances.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my-requests' && styles.activeTab]}
          onPress={() => setActiveTab('my-requests')}
        >
          <Text style={[styles.tabText, activeTab === 'my-requests' && styles.activeTabText]}>
            My Requests ({myRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'available' ? (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Available Ambulances Near You</Text>
          
          {loading && availableAmbulances.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Finding nearest ambulances...</Text>
            </View>
          ) : availableAmbulances.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚑</Text>
              <Text style={styles.emptyText}>No ambulances available</Text>
              <Text style={styles.subText}>Emergency requests will be queued for next available unit</Text>
            </View>
          ) : (
            <FlatList
              data={availableAmbulances}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <AmbulanceCard ambulance={item} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      ) : (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Your Emergency Requests</Text>
          
          {loadingRequests && myRequests.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your requests...</Text>
            </View>
          ) : myRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No emergency requests</Text>
              <Text style={styles.subText}>Your ambulance requests will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={myRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderRequestCard(item)}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emergencyHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  emergencyButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#ff4444',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  driverSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  driverTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  driverLocation: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: 'bold',
    marginTop: 4,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
  },
  statusMessage: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  trackButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
