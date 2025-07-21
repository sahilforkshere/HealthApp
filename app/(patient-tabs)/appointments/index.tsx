import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatientAppointments } from '../../../contexts/PatientAppointmentContext';
import AppointmentCard from '../../../components/patient/AppointmentCard';

export default function PatientAppointments() {
  const { appointments, loading, loadAppointments } = usePatientAppointments();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAppointments();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAppointmentPress = (appointment: any) => {
    router.push(`/(patient-tabs)/appointments/${appointment.id}`);
  };

  // Group appointments by status
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const otherAppointments = appointments.filter(apt => 
    !['pending', 'scheduled', 'completed'].includes(apt.status)
  );

  if (loading && appointments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading your appointments...</Text>
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No consultation requests yet</Text>
        <Text style={styles.subText}>Your requests to doctors will appear here</Text>
        <TouchableOpacity 
          style={styles.findDoctorsButton}
          onPress={() => router.push('/(patient-tabs)/doctors')}
        >
          <Text style={styles.findDoctorsText}>Find Doctors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSection = (title: string, data: PatientAppointment[], color: string) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color }]}>
          {title} ({data.length})
        </Text>
        {data.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onPress={() => handleAppointmentPress(appointment)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[1]} // Dummy data for FlatList
        keyExtractor={() => 'appointments'}
        renderItem={() => (
          <View>
            {renderSection('⏳ Pending Requests', pendingAppointments, '#ff9800')}
            {renderSection('📅 Scheduled Appointments', scheduledAppointments, '#2196f3')}
            {renderSection('✅ Completed', completedAppointments, '#4caf50')}
            {renderSection('📋 Other', otherAppointments, '#757575')}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
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
    fontSize: 20,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  findDoctorsButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findDoctorsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 16,
  },
});
