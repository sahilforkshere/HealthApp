import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert } from 'react-native';

interface AppointmentCardProps {
  appointment: {
    id: number;
    status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
    problem_description: string;
    appointment_time?: string;
    appointment_location?: string;
    doctor_reply?: string;
    created_at: string;
    doctors?: {
      specialty: string;
      hospital_name: string;
      consultation_fee: number;
      experience_years?: number;
      profiles?: {
        full_name: string;
        avatar_url?: string;
        phone?: string;
      } | null;
    } | null;
  };
  onPress?: () => void;
}

export default function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const handleCallDoctor = async () => {
    const doctorPhone = appointment.doctors?.profiles?.phone;
    const doctorName = appointment.doctors?.profiles?.full_name;
    
    if (!doctorPhone) {
      Alert.alert('No Phone Number', 'Doctor phone number is not available');
      return;
    }

    // Clean the phone number
    const cleanPhoneNumber = doctorPhone.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhoneNumber}`;
    
    try {
      Alert.alert(
        'Call Doctor',
        `Do you want to call Dr. ${doctorName || 'your doctor'}?\n${doctorPhone}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call Now', 
            style: 'default',
            onPress: async () => {
              const canCall = await Linking.canOpenURL(phoneUrl);
              if (canCall) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Cannot Make Call', 'Your device does not support phone calls');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Call Failed', 'Unable to initiate phone call');
    }
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for Doctor';
      case 'accepted': return 'Accepted by Doctor';
      case 'scheduled': return 'Appointment Scheduled';
      case 'completed': return 'Consultation Completed';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCallable = ['accepted', 'scheduled'].includes(appointment.status) && appointment.doctors?.profiles?.phone;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with Doctor Info */}
      <View style={styles.header}>
        <View style={styles.doctorInfo}>
          {appointment.doctors?.profiles?.avatar_url ? (
            <Image 
              source={{ uri: appointment.doctors.profiles.avatar_url }} 
              style={styles.avatar}
              defaultSource={require('../../assets/images/placeholder-avatar.png')}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>👨‍⚕️</Text>
            </View>
          )}
          
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>
              Dr. {appointment.doctors?.profiles?.full_name || 'Unknown Doctor'}
            </Text>
            <Text style={styles.specialty}>
              {appointment.doctors?.specialty || 'General Medicine'}
            </Text>
            <Text style={styles.hospital}>
              🏥 {appointment.doctors?.hospital_name || 'Hospital'}
            </Text>
            {appointment.doctors?.experience_years && (
              <Text style={styles.experience}>
                👨‍⚕️ {appointment.doctors.experience_years} years exp.
              </Text>
            )}
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(appointment.status)}</Text>
            <Text style={styles.statusText}>{appointment.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Appointment Details */}
      <View style={styles.content}>
        <Text style={styles.statusDescription}>
          {getStatusText(appointment.status)}
        </Text>
        
        <Text style={styles.problemTitle}>Your Request:</Text>
        <Text style={styles.problemText} numberOfLines={3}>
          {appointment.problem_description}
        </Text>

        {/* Doctor Reply */}
        {appointment.doctor_reply && (
          <View style={styles.replySection}>
            <Text style={styles.replyTitle}>Doctor's Response:</Text>
            <Text style={styles.replyText} numberOfLines={2}>
              {appointment.doctor_reply}
            </Text>
          </View>
        )}

        {/* Appointment Time & Location */}
        {appointment.appointment_time && (
          <View style={styles.appointmentDetails}>
            <View style={styles.appointmentRow}>
              <Text style={styles.appointmentIcon}>📅</Text>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentLabel}>Appointment Date</Text>
                <Text style={styles.appointmentValue}>
                  {formatDate(appointment.appointment_time)} at {formatTime(appointment.appointment_time)}
                </Text>
              </View>
            </View>
            
            {appointment.appointment_location && (
              <View style={styles.appointmentRow}>
                <Text style={styles.appointmentIcon}>📍</Text>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentLabel}>Location</Text>
                  <Text style={styles.appointmentValue}>
                    {appointment.appointment_location}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Consultation Fee */}
        {appointment.doctors?.consultation_fee && (
          <View style={styles.feeSection}>
            <Text style={styles.feeLabel}>Consultation Fee:</Text>
            <Text style={styles.feeAmount}>₹{appointment.doctors.consultation_fee}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <View style={styles.metaInfo}>
          <Text style={styles.requestDate}>
            Requested: {formatDate(appointment.created_at)}
          </Text>
        </View>

        {isCallable && (
          <TouchableOpacity 
            style={styles.callButton} 
            onPress={handleCallDoctor}
            activeOpacity={0.8}
          >
            <Text style={styles.callButtonText}>📞 Call Doctor</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: getProgressWidth(appointment.status),
                backgroundColor: getStatusColor(appointment.status)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {getProgressText(appointment.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Helper functions
const getProgressWidth = (status: string) => {
  switch (status) {
    case 'pending': return '25%';
    case 'accepted': return '50%';
    case 'scheduled': return '75%';
    case 'completed': return '100%';
    case 'cancelled': return '0%';
    default: return '0%';
  }
};

const getProgressText = (status: string) => {
  switch (status) {
    case 'pending': return 'Request submitted • Waiting for doctor response';
    case 'accepted': return 'Doctor accepted • Scheduling appointment';
    case 'scheduled': return 'Appointment confirmed • Prepare for consultation';
    case 'completed': return 'Consultation completed • Thank you!';
    case 'cancelled': return 'Request cancelled';
    default: return '';
  }
};

const styles = StyleSheet.create({
  card: {
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
    borderLeftColor: '#2196f3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  doctorInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  avatarText: {
    fontSize: 28,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
    marginBottom: 2,
  },
  hospital: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  experience: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  content: {
    marginBottom: 16,
  },
  statusDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  problemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  problemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  replySection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  appointmentDetails: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentLabel: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  appointmentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  feeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
  },
  feeAmount: {
    fontSize: 16,
    color: '#f57c00',
    fontWeight: 'bold',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaInfo: {
    flex: 1,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  callButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
