import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { PatientRequest } from '../../services/doctor.service';

interface PatientRequestCardProps {
  request: PatientRequest;
  onPress: () => void;
}

export default function PatientRequestCard({ request, onPress }: PatientRequestCardProps) {
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

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        {request.patients.profiles.avatar_url ? (
          <Image 
            source={{ uri: request.patients.profiles.avatar_url }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {request.patients.profiles.full_name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        )}
        
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{request.patients.profiles.full_name}</Text>
          <Text style={styles.requestTime}>{formatDate(request.created_at)}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
        </View>
      </View>

      <Text style={styles.problemPreview} numberOfLines={2}>
        {request.problem_description}
      </Text>

      <View style={styles.footer}>
        {request.medical_documents && request.medical_documents.length > 0 && (
          <Text style={styles.documentsCount}>
            📎 {request.medical_documents.length} document(s)
          </Text>
        )}
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  requestTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  problemPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentsCount: {
    fontSize: 12,
    color: '#2196f3',
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
  },
});
