import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDoctor } from '../../../contexts/DoctorContext';
import RemoteImage from '../../../components/common/RemoteImage';
import { getPatientProfileByPatientId, PatientProfile } from '../../../services/patient-profile.service';
import { createCalendarEvent } from '../../../services/calendar.service';

export default function PatientRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { requests, loading, loadRequests, updateRequest } = useDoctor();
  const [reply, setReply] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [updating, setUpdating] = useState(false);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
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
      loadPatientProfile();
    }
  }, [request]);

  const loadPatientProfile = async () => {
    if (!request) return;
    
    try {
      setProfileLoading(true);
      const profile = await getPatientProfileByPatientId(request.patient_id);
      setPatientProfile(profile);
      console.log('✅ Patient profile loaded:', profile ? 'Found' : 'Not found');
    } catch (error) {
      console.error('❌ Error loading patient profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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
  try {
    setUpdating(true);
    
    // Update the request status first
    await updateRequest(
      String(request.id),
      newStatus,
      reply,
      appointmentTime || undefined,
      appointmentLocation || undefined
    );

    // Try to create calendar event (non-blocking)
    if (newStatus === 'scheduled' && appointmentTime && appointmentLocation) {
      try {
        const appointmentDate = new Date(appointmentTime);
        if (isNaN(appointmentDate.getTime())) {
          throw new Error('Invalid appointment time format');
        }
        
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour

        await createCalendarEvent({
          patient_request_id: request.id,
          doctor_id: request.doctor_id,
          patient_id: request.patient_id,
          title: `Consultation with ${request.patients?.profiles?.full_name}`,
          description: request.problem_description,
          start_datetime: appointmentDate.toISOString(),
          end_datetime: endDate.toISOString(),
          location: appointmentLocation,
          event_type: 'consultation',
          status: 'scheduled'
        });
        
        console.log('✅ Calendar event created successfully');
      } catch (calendarError) {
        console.warn('⚠️ Calendar event creation failed (non-critical):', calendarError);
        // Don't show error to user as main operation succeeded
      }
    }
    
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

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'Not specified';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} years`;
  };

  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return 'Not available';
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // Handle nested profile structure
  const patientProfile_basic = request.patients?.profiles;
  const patientName = patientProfile_basic?.full_name || 'Unknown Patient';
  const patientPhone = patientProfile_basic?.phone || 'No phone provided';
  const avatarUrl = patientProfile_basic?.avatar_url;

  console.log('✅ Found request:', {
    id: request.id,
    patientName,
    status: request.status,
    documentsCount: request.medical_documents?.length || 0
  });

  return (
    <ScrollView style={styles.container}>
      {/* Patient Basic Info */}
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

      {/* Patient Medical Profile */}
      {profileLoading ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Medical Information</Text>
          <Text style={styles.loadingText}>Loading patient profile...</Text>
        </View>
      ) : patientProfile ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Medical Information</Text>
          
          {/* Basic Medical Info Grid */}
          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>🩸 Blood Group:</Text>
              <Text style={styles.profileValue}>{patientProfile.blood_group || 'Not specified'}</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>👤 Gender:</Text>
              <Text style={styles.profileValue}>{patientProfile.gender || 'Not specified'}</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>🎂 Age:</Text>
              <Text style={styles.profileValue}>{calculateAge(patientProfile.date_of_birth || '')}</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>📏 Height:</Text>
              <Text style={styles.profileValue}>{patientProfile.height ? `${patientProfile.height} cm` : 'Not specified'}</Text>
            </View>
            
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>⚖️ Weight:</Text>
              <Text style={styles.profileValue}>{patientProfile.weight ? `${patientProfile.weight} kg` : 'Not specified'}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>📊 BMI:</Text>
              <Text style={styles.profileValue}>{calculateBMI(patientProfile.height, patientProfile.weight)}</Text>
            </View>
          </View>
          
          {/* Emergency Contact */}
          {patientProfile.emergency_contact_name && (
            <View style={styles.emergencyContact}>
              <Text style={styles.emergencyTitle}>🚨 Emergency Contact</Text>
              <Text style={styles.emergencyText}>
                <Text style={styles.emergencyName}>{patientProfile.emergency_contact_name}</Text>
                {patientProfile.emergency_contact_relation && (
                  <Text style={styles.emergencyRelation}> ({patientProfile.emergency_contact_relation})</Text>
                )}
              </Text>
              {patientProfile.emergency_contact_phone && (
                <Text style={styles.emergencyPhone}>📞 {patientProfile.emergency_contact_phone}</Text>
              )}
            </View>
          )}
          
          {/* Medical History */}
          {patientProfile.medical_history && (
            <View style={styles.medicalSection}>
              <Text style={styles.medicalTitle}>📋 Medical History</Text>
              <Text style={styles.medicalText}>{patientProfile.medical_history}</Text>
            </View>
          )}
          
          {/* Allergies */}
          {patientProfile.allergies && (
            <View style={styles.medicalSection}>
              <Text style={styles.medicalTitle}>⚠️ Allergies</Text>
              <Text style={[styles.medicalText, styles.allergyText]}>{patientProfile.allergies}</Text>
            </View>
          )}
          
          {/* Current Medications */}
          {patientProfile.current_medications && (
            <View style={styles.medicalSection}>
              <Text style={styles.medicalTitle}>💊 Current Medications</Text>
              <Text style={styles.medicalText}>{patientProfile.current_medications}</Text>
            </View>
          )}

          {/* Insurance Information */}
          {(patientProfile.insurance_provider || patientProfile.insurance_policy_number) && (
            <View style={styles.medicalSection}>
              <Text style={styles.medicalTitle}>🏥 Insurance Information</Text>
              {patientProfile.insurance_provider && (
                <Text style={styles.medicalText}>Provider: {patientProfile.insurance_provider}</Text>
              )}
              {patientProfile.insurance_policy_number && (
                <Text style={styles.medicalText}>Policy: {patientProfile.insurance_policy_number}</Text>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Medical Information</Text>
          <Text style={styles.noProfileText}>
            Patient has not completed their medical profile yet.
          </Text>
        </View>
      )}

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
          
          <Text style={styles.inputLabel}>📅 Appointment Date & Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2024-12-25 15:30 or Tomorrow 3:00 PM"
            value={appointmentTime}
            onChangeText={setAppointmentTime}
          />

          <Text style={styles.inputLabel}>📍 Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Room 101, City Hospital or Online consultation"
            value={appointmentLocation}
            onChangeText={setAppointmentLocation}
          />

          <View style={styles.appointmentHelper}>
            <Text style={styles.helperTitle}>💡 Quick Tips:</Text>
            <Text style={styles.helperText}>• Use clear date format: YYYY-MM-DD HH:MM</Text>
            <Text style={styles.helperText}>• Include room number for in-person visits</Text>
            <Text style={styles.helperText}>• Specify "Online" for telemedicine</Text>
          </View>
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
                <Text style={styles.buttonText}>✕ Decline Request</Text>
              </TouchableOpacity>
            </>
          )}

          {request.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.scheduleButton]}
              onPress={() => {
                if (!appointmentTime || !appointmentLocation) {
                  Alert.alert('Missing Information', 'Please set appointment time and location before scheduling.');
                  return;
                }
                handleStatusUpdate('scheduled');
              }}
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
            <Text style={styles.buttonText}>💾 Update Reply & Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug info - remove in production */}
      <View style={styles.debugCard}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>Request ID: {request.id} (type: {typeof request.id})</Text>
        <Text style={styles.debugText}>Medical docs count: {request.medical_documents?.length || 0}</Text>
        <Text style={styles.debugText}>Status: {request.status}</Text>
        <Text style={styles.debugText}>Patient profile loaded: {patientProfile ? 'Yes' : 'No'}</Text>
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
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
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  profileItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  emergencyContact: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  emergencyName: {
    fontWeight: 'bold',
  },
  emergencyRelation: {
    fontStyle: 'italic',
  },
  emergencyPhone: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  medicalSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  medicalText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  allergyText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  noProfileText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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
    fontSize: 10,
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
  appointmentHelper: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 4,
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
