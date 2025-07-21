import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../contexts/DoctorContext';
import PatientRequestCard from '../../../components/doctor/PatientRequestCard';

export default function PatientRequests() {
  const { requests, loading, loadRequests } = useDoctor();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRequests();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestPress = (request: any) => {
    router.push(`/(doctor-tabs)/patients/${request.id}`);
  };

  if (loading && requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading patient requests...</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No patient requests yet</Text>
        <Text style={styles.subText}>Requests will appear here when patients contact you</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PatientRequestCard
            request={item}
            onPress={() => handleRequestPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
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
    fontSize: 18,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
