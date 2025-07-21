import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDoctor } from '../../../contexts/DoctorContext';
import RemoteImage from '../../../components/common/RemoteImage';

export default function PatientRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { requests, loading, loadRequests, updateRequest } = useDoctor();
  const [reply, setReply] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Detail Screen Debug:');
    console.log('Request ID from params:', requestId, typeof requestId);
    console.log('Requests loaded:', requests.length);
    console.log('Loading state:', loading);
    console.log('Available request IDs:', requests.map(r => ({ id: r.id, type: typeof r.id })));
  }, [requestId, requests, loading]);

  // Show loading while requests are being fetched
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  // Find the request - handle both string and number comparison
  const request = requests.find(r => String(r.id) === String(requestId) || r.id === requestId);

  useEffect(() => {
    if (request) {
      setReply(request.doctor_reply || '');
      setAppointmentTime(request.appointment_time || '');
      setAppointmentLocation(request.appointment_location || '');
    }
  }, [request]);

  // Show detailed error info if request not found
  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Request Not Found</Text>
        <Text style={styles.errorText}>Looking for ID: {requestId} (type: {typeof requestId})</Text>
        <Text style={styles.errorText}>Available requests:</Text>
        {requests.map(r => (
          <Text key={r.id} style={styles.debugText}>
            • ID: {r.id} (type: {typeof r.id}) - Patient: {r.patients?.profiles?.full_name}
          </Text>
        ))}
        
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={loadRequests}
        >
          <Text style={styles.refreshButtonText}>Refresh Requests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStatusUpdate = async (newStatus: string) => {
  console.log('🔄 Starting status update...');
  console.log('Request ID:', request.id, typeof request.id);
  console.log('Current status:', request.status);
  console.log('New status:', newStatus);
  console.log('Reply:', reply);
  console.log('Appointment time:', appointmentTime);
  console.log('Appointment location:', appointmentLocation);
  
  try {
    setUpdating(true);
    await updateRequest(
      String(request.id),
      newStatus,
      reply,
      appointmentTime || undefined,
      appointmentLocation || undefined
    );
    console.log('✅ Status update successful');
    Alert.alert('Success', `Request ${newStatus} successfully!`);
  } catch (error) {
    console.error('❌ Status update failed:', error);
    Alert.alert('Error', `Failed to update request: ${error.message}`);
  } finally {
    setUpdating(false);
  }
};


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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

  // Handle nested profile structure
  const patientProfile = request.patients?.profiles;
  const patientName = patientProfile?.full_name || 'Unknown Patient';
  const patientPhone = patientProfile?.phone || 'No phone provided';
  const avatarUrl = patientProfile?.avatar_url;

  console.log('✅ Found request:', {
    id: request.id,
    patientName,
    status: request.status,
    documentsCount: request.medical_documents?.length || 0
  });

  return (
    <ScrollView style={styles.container}>
      {/* Patient Info */}
      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {patientName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.phone}>{patientPhone}</Text>
            <Text style={styles.requestDate}>Requested: {formatDate(request.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Problem Description */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Patient's Problem</Text>
        <Text style={styles.problemText}>{request.problem_description}</Text>
      </View>

      {/* Medical Documents */}
      {request.medical_documents && request.medical_documents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Medical Documents ({request.medical_documents.length})
          </Text>
          <View style={styles.documentsGrid}>
            {request.medical_documents.map((docPath, index) => (
              <View key={index} style={styles.documentContainer}>
                <RemoteImage
                  path={docPath}
                  fallback="https://via.placeholder.com/100x100/f0f0f0/666?text=Doc"
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Reply</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Write your response to the patient..."
          value={reply}
          onChangeText={setReply}
          textAlignVertical="top"
        />
      </View>

      {/* Appointment Details (for accepted/scheduled requests) */}
      {(request.status === 'accepted' || request.status === 'scheduled') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          
          <Text style={styles.inputLabel}>Appointment Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Tomorrow 3:00 PM or Dec 25, 2024 10:00 AM"
            value={appointmentTime}
            onChangeText={setAppointmentTime}
          />

          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Room 101, City Hospital or Online consultation"
            value={appointmentLocation}
            onChangeText={setAppointmentLocation}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        <View style={styles.buttonGrid}>
          {request.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleStatusUpdate('accepted')}
                disabled={updating}
              >
                <Text style={styles.buttonText}>
                  {updating ? 'Updating...' : '✓ Accept Request'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleStatusUpdate('cancelled')}
                disabled={updating}
              >
                <Text style={styles.buttonText}>✕ Decline</Text>
              </TouchableOpacity>
            </>
          )}

          {request.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.scheduleButton]}
              onPress={() => handleStatusUpdate('scheduled')}
              disabled={updating}
            >
              <Text style={styles.buttonText}>📅 Schedule Appointment</Text>
            </TouchableOpacity>
          )}

          {request.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate('completed')}
              disabled={updating}
            >
              <Text style={styles.buttonText}>✓ Mark Complete</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.updateButton]}
            onPress={() => handleStatusUpdate(request.status)}
            disabled={updating}
          >
            <Text style={styles.buttonText}>💾 Update Reply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug info - remove in production */}
      <View style={styles.debugCard}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>
          Request ID: {request.id} (type: {typeof request.id})
        </Text>
        <Text style={styles.debugText}>
          Medical docs count: {request.medical_documents?.length || 0}
        </Text>
        <Text style={styles.debugText}>
          Status: {request.status}
        </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 16,
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
    textAlign: 'center',
    marginBottom: 4,
  },
  refreshButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#757575',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientHeader: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  documentIndex: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  actionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 32,
  },
  buttonGrid: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  scheduleButton: {
    backgroundColor: '#9c27b0',
  },
  completeButton: {
    backgroundColor: '#2e7d32',
  },
  updateButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 32,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ff9800',
  },
});
