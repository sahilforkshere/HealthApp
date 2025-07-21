import React, { useState } from 'react';
import { View, FlatList, TextInput, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatient } from '../../../contexts/PatientContext';
import DoctorCard from '../../../components/patient/DoctorCard';

export default function DoctorsList() {
  const { doctors, loading, loadDoctors } = usePatient();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredDoctors = doctors.filter(doctor =>
    doctor.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.hospital_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDoctorPress = (doctor: any) => {
    console.log('🔗 Navigating to doctor:', doctor.id, doctor.profiles.full_name);
 router.push(`/(patient-tabs)/doctors/${doctor.id}`);
  };

  const handleRefresh = async () => {
    try {
      await loadDoctors();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors by name, specialty, or hospital..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {loading && doctors.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No doctors found</Text>
          <Text style={styles.subText}>
            {searchQuery ? 'Try a different search term' : 'No doctors available at the moment'}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => handleDoctorPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      
      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Total doctors: {doctors.length} | Filtered: {filteredDoctors.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontSize: 16,
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
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});
