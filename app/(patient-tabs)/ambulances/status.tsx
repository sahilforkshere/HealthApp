import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getPatientRequestHistory, 
  getPatientIdByUserId,
  AmbulanceRequest 
} from '../../../services/ambulance.service';
import { useAuth } from '../../../contexts/AuthContext';

export default function RequestStatus() {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadRequestHistory();
  }, []);

  const loadRequestHistory = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const patientId = await getPatientIdByUserId(userProfile.id);
      const data = await getPatientRequestHistory(patientId);
      setRequests(data);
    } catch (error) {
      console.error('Error loading request history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequestHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'accepted': return '#2196f3';
      case 'en-route': return '#9c27b0';
      case 'arrived': return '#607d8b';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'en-route': return '🚑';
      case 'arrived': return '📍';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const renderRequestCard = ({ item }: { item: AmbulanceRequest }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => {
        if (!['completed', 'cancelled'].includes(item.status)) {
          router.push('/(patient-tabs)/ambulances/tracking');
        }
      }}
    >
      <View style={styles.requestHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.requestTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.locationText}>📍 From: {item.pickup_location}</Text>
      <Text style={styles.locationText}>🏥 To: {item.destination_location}</Text>
      
      {item.ambulance_drivers && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverText}>
            🚑 Driver: {item.ambulance_drivers.profiles?.full_name || 'Unknown'}
          </Text>
          <Text style={styles.vehicleText}>
            {item.ambulance_drivers.vehicle_type} • {item.ambulance_drivers.vehicle_registration}
          </Text>
        </View>
      )}

      {item.status === 'completed' && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✅ Service Completed Successfully</Text>
        </View>
      )}

      {item.status === 'cancelled' && (
        <View style={styles.cancelledBadge}>
          <Text style={styles.cancelledText}>❌ Request Cancelled</Text>
        </View>
      )}

      {!['completed', 'cancelled'].includes(item.status) && (
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={() => router.push('/(patient-tabs)/ambulances/tracking')}
        >
          <Text style={styles.trackButtonText}>📍 Track Live</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 My Emergency Requests</Text>
        <Text style={styles.headerSubtitle}>Track your ambulance request status</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No emergency requests yet</Text>
            <Text style={styles.emptySubtext}>Your request history will appear here</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#f44336',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#fff',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestTime: {
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  driverInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  driverText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  vehicleText: {
    fontSize: 12,
    color: '#666',
  },
  completedBadge: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelledText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  trackButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
