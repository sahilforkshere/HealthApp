import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDriverRequests, 
  getDriverIdByUserId, 
  getDriverAvailabilityStatus,
  AmbulanceRequest 
} from '../../services/ambulance.service';

export default function DriverDashboard() {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      
      const driverIdResult = await getDriverIdByUserId(userProfile.id);
      setDriverId(driverIdResult);
      
      const [requestsData, availabilityStatus] = await Promise.all([
        getDriverRequests(driverIdResult),
        getDriverAvailabilityStatus(userProfile.id)
      ]);
      
      setRequests(requestsData);
      setIsAvailable(availabilityStatus);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => ['accepted', 'en-route'].includes(r.status));
  const completedToday = requests.filter(r => 
    r.status === 'completed' && 
    new Date(r.updated_at).toDateString() === new Date().toDateString()
  );

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
      {/* Status Header */}
      <LinearGradient
        colors={isAvailable ? ['#4caf50', '#2e7d32'] : ['#757575', '#424242']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Hello, Driver!</Text>
          <Text style={styles.statusText}>
            You are {isAvailable ? 'online and available' : 'offline'}
          </Text>
          
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>{pendingRequests.length}</Text>
              <Text style={styles.headerStatLabel}>Pending</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>{activeRequests.length}</Text>
              <Text style={styles.headerStatLabel}>Active</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>{completedToday.length}</Text>
              <Text style={styles.headerStatLabel}>Today</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(driver-tabs)/requests')}
          >
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionText}>Emergency Requests</Text>
            {pendingRequests.length > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(driver-tabs)/vehicle')}
          >
            <Text style={styles.actionIcon}>🚙</Text>
            <Text style={styles.actionText}>My Vehicle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(driver-tabs)/availability')}
          >
            <Text style={styles.actionIcon}>⏰</Text>
            <Text style={styles.actionText}>Availability</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(driver-tabs)/profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <View style={styles.activeRequestsContainer}>
          <Text style={styles.sectionTitle}>🔴 Active Requests</Text>
          
          {activeRequests.map((request) => (
            <TouchableOpacity 
              key={request.id}
              style={styles.activeRequestCard}
              onPress={() => router.push(`/(driver-tabs)/requests/${request.id}`)}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.patientName}>
                  {request.patients?.profiles?.full_name || 'Unknown Patient'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: '#2196f3' }]}>
                  <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.requestLocation}>📍 {request.pickup_location}</Text>
              <Text style={styles.requestDestination}>🏥 {request.destination_location}</Text>
              
              <View style={[styles.emergencyBadge, { backgroundColor: getEmergencyColor(request.emergency_level) }]}>
                <Text style={styles.emergencyText}>{request.emergency_level.toUpperCase()} PRIORITY</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.recentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏳ Pending Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(driver-tabs)/requests')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {pendingRequests.slice(0, 3).map((request) => (
            <TouchableOpacity 
              key={request.id}
              style={styles.requestPreview}
              onPress={() => router.push(`/(driver-tabs)/requests/${request.id}`)}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.patientName}>
                  {request.patients?.profiles?.full_name || 'Unknown Patient'}
                </Text>
                <Text style={styles.requestTime}>
                  {new Date(request.created_at).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.requestLocation}>📍 {request.pickup_location}</Text>
              <Text style={styles.requestDestination}>🏥 {request.destination_location}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Performance Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 Today's Performance</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{requests.length}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedToday.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeRequests.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{isAvailable ? '🟢' : '🔴'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const getEmergencyColor = (level: string) => {
  switch (level) {
    case 'critical': return '#d50000';
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerStatLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    elevation: 3,
    position: 'relative',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeRequestsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  activeRequestCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#f44336',
    elevation: 2,
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
  },
  requestPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  requestTime: {
    fontSize: 12,
    color: '#666',
  },
  requestLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestDestination: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emergencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  emergencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
