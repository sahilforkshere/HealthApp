import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePatientAppointments } from '../../../contexts/PatientAppointmentContext';
import RemoteImage from '../../../components/common/RemoteImage';

export default function AppointmentDetail() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { appointments, loading } = usePatientAppointments();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Appointment Detail Debug:');
    console.log('Appointment ID from params:', appointmentId, typeof appointmentId);
    console.log('Appointments loaded:', appointments.length);
    console.log('Available appointment IDs:', appointments.map(a => ({ id: a.id, type: typeof a.id })));
  }, [appointmentId, appointments]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  // Find appointment with both string and number comparison
  const appointment = appointments.find(apt => 
    String(apt.id) === String(appointmentId) || 
    apt.id === appointmentId ||
    Number(apt.id) === Number(appointmentId)
  );

  if (!appointment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Appointment Not Found</Text>
        <Text style={styles.errorText}>
          Looking for ID: {appointmentId} (type: {typeof appointmentId})
        </Text>
        <Text style={styles.errorText}>Available appointments:</Text>
        {appointments.map(apt => (
          <Text key={apt.id} style={styles.debugText}>
            • ID: {apt.id} (type: {typeof apt.id}) - Status: {apt.status}
          </Text>
        ))}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'accepted': return '#2196f3';
      case 'scheduled': return '#9c27b0';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'scheduled': return '📅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Doctor Info */}
      <View style={styles.doctorCard}>
        <View style={styles.doctorHeader}>
          {appointment.doctors.profiles.avatar_url ? (
            <Image 
              source={{ uri: appointment.doctors.profiles.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>👨‍⚕️</Text>
            </View>
          )}
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr. {appointment.doctors.profiles.full_name}</Text>
            <Text style={styles.specialty}>{appointment.doctors.specialty}</Text>
            <Text style={styles.hospital}>{appointment.doctors.hospital_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(appointment.status)}</Text>
            <Text style={styles.statusText}>{appointment.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Request Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Request</Text>
        <Text style={styles.problemText}>{appointment.problem_description}</Text>
        <Text style={styles.requestDate}>
          Submitted: {formatDate(appointment.created_at)}
        </Text>
      </View>

      {/* Medical Documents */}
      {appointment.medical_documents && appointment.medical_documents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Medical Documents ({appointment.medical_documents.length})
          </Text>
          <View style={styles.documentsGrid}>
            {appointment.medical_documents.map((docPath, index) => (
              <View key={index} style={styles.documentContainer}>
                <RemoteImage
                  path={docPath}
                  fallback="https://via.placeholder.com/80x80/f0f0f0/666?text=Doc"
                  bucket="medical-documents"
                  style={styles.documentImage}
                />
                <Text style={styles.documentIndex}>Doc {index + 1}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Doctor Reply */}
      {appointment.doctor_reply && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doctor's Response</Text>
          <View style={styles.replySection}>
            <Text style={styles.replyText}>{appointment.doctor_reply}</Text>
          </View>
        </View>
      )}

      {/* Appointment Details */}
      {appointment.appointment_time && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentLabel}>📅 Date & Time</Text>
            <Text style={styles.appointmentValue}>{appointment.appointment_time}</Text>
          </View>

          {appointment.appointment_location && (
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentLabel}>📍 Location</Text>
              <Text style={styles.appointmentValue}>{appointment.appointment_location}</Text>
            </View>
          )}

          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentLabel}>💰 Consultation Fee</Text>
            <Text style={styles.feeValue}>₹{appointment.doctors.consultation_fee}</Text>
          </View>
        </View>
      )}

      {/* Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request Status</Text>
        
        <View style={styles.statusTimeline}>
          <View style={[styles.timelineItem, styles.completedStep]}>
            <Text style={styles.timelineIcon}>📝</Text>
            <Text style={styles.timelineText}>Request Submitted</Text>
          </View>
          
          <View style={[styles.timelineItem, ['accepted', 'scheduled', 'completed'].includes(appointment.status) && styles.completedStep]}>
            <Text style={styles.timelineIcon}>👨‍⚕️</Text>
            <Text style={styles.timelineText}>Doctor Review</Text>
          </View>
          
          <View style={[styles.timelineItem, ['scheduled', 'completed'].includes(appointment.status) && styles.completedStep]}>
            <Text style={styles.timelineIcon}>📅</Text>
            <Text style={styles.timelineText}>Appointment Scheduled</Text>
          </View>
          
          <View style={[styles.timelineItem, appointment.status === 'completed' && styles.completedStep]}>
            <Text style={styles.timelineIcon}>✅</Text>
            <Text style={styles.timelineText}>Consultation Complete</Text>
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
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doctorCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  specialty: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '600',
    marginTop: 2,
  },
  hospital: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  problemText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentContainer: {
    alignItems: 'center',
  },
  documentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  documentIndex: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  replySection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  replyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  appointmentInfo: {
    marginBottom: 16,
  },
  appointmentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  appointmentValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  statusTimeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    opacity: 0.5,
  },
  completedStep: {
    backgroundColor: '#e8f5e8',
    opacity: 1,
  },
  timelineIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  timelineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
