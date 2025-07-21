import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { useDoctor } from '../../contexts/DoctorContext';
import { 
  getDoctorWeeklyAvailability, 
  updateDoctorWeeklyAvailability, 
  DoctorAvailability 
} from '../../services/doctor.service';

export default function DoctorAvailabilityScreen() {
  const { userProfile } = useAuth();
  const { isAvailable, toggleAvailability, doctorId, statistics } = useDoctor();
  const [updating, setUpdating] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<Omit<DoctorAvailability, 'id' | 'doctor_id' | 'created_at'>[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  useEffect(() => {
    loadWeeklySchedule();
  }, [doctorId]);

  const loadWeeklySchedule = async () => {
    if (!doctorId) return;

    try {
      setScheduleLoading(true);
      const existingAvailability = await getDoctorWeeklyAvailability(doctorId);
      
      // Initialize availability for all days
      const initialAvailability = daysOfWeek.map(day => {
        const existing = existingAvailability.find(a => a.day_of_week === day.id);
        return existing ? {
          day_of_week: existing.day_of_week,
          start_time: existing.start_time,
          end_time: existing.end_time,
          is_available: existing.is_available
        } : {
          day_of_week: day.id,
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: false
        };
      });
      
      setWeeklyAvailability(initialAvailability);
    } catch (error) {
      console.error('❌ Error loading weekly schedule:', error);
      Alert.alert('Error', 'Failed to load weekly schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setUpdating(true);
      await toggleAvailability();
      
      Alert.alert(
        'Status Updated',
        `You are now ${!isAvailable ? 'online and available' : 'offline'}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Toggle availability failed:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'Failed to update availability status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUpdating(false);
    }
  };

  const updateDayAvailability = (dayIndex: number, field: string, value: any) => {
    setWeeklyAvailability(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const saveWeeklySchedule = async () => {
    if (!doctorId) {
      Alert.alert('Error', 'Doctor ID not found');
      return;
    }

    try {
      setScheduleLoading(true);
      await updateDoctorWeeklyAvailability(doctorId, weeklyAvailability);
      Alert.alert('Success', 'Weekly schedule updated successfully!');
    } catch (error) {
      console.error('❌ Error saving schedule:', error);
      Alert.alert('Error', 'Failed to update weekly schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Online Status Toggle */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Doctor Status</Text>
          <View style={styles.statusToggle}>
            <Text style={[styles.statusLabel, isAvailable && styles.onlineText]}>
              {isAvailable ? '🟢 Online' : '🔴 Offline'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              disabled={updating}
              trackColor={{ false: '#767577', true: '#4caf50' }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
        <Text style={styles.statusDescription}>
          {isAvailable 
            ? 'Patients can see you and book appointments' 
            : 'You are invisible to patients'}
        </Text>
        
        {updating && (
          <Text style={styles.updatingText}>Updating status...</Text>
        )}
      </View>

      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Request Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.totalRequests}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.pendingColor]}>{statistics.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.scheduledColor]}>{statistics.scheduledRequests}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.completedColor]}>{statistics.completedRequests}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Weekly Schedule */}
      <View style={styles.scheduleCard}>
        <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
        
        {scheduleLoading ? (
          <Text style={styles.loadingText}>Loading schedule...</Text>
        ) : (
          <>
            {weeklyAvailability.map((dayAvail, index) => (
              <View key={daysOfWeek[index].id} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{daysOfWeek[index].name}</Text>
                  <Switch
                    value={dayAvail.is_available}
                    onValueChange={(value) => updateDayAvailability(index, 'is_available', value)}
                    trackColor={{ false: '#767577', true: '#2196f3' }}
                    thumbColor={dayAvail.is_available ? '#fff' : '#f4f3f4'}
                  />
                </View>
                
                {dayAvail.is_available && (
                  <View style={styles.timeContainer}>
                    <View style={styles.timePickerRow}>
                      <Text style={styles.timeLabel}>Start Time:</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={dayAvail.start_time.slice(0, 5)}
                          onValueChange={(value) => updateDayAvailability(index, 'start_time', `${value}:00`)}
                          style={styles.timePicker}
                        >
                          {timeSlots.map(time => (
                            <Picker.Item key={time} label={time} value={time} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                    
                    <View style={styles.timePickerRow}>
                      <Text style={styles.timeLabel}>End Time:</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={dayAvail.end_time.slice(0, 5)}
                          onValueChange={(value) => updateDayAvailability(index, 'end_time', `${value}:00`)}
                          style={styles.timePicker}
                        >
                          {timeSlots.map(time => (
                            <Picker.Item key={time} label={time} value={time} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
            
            <TouchableOpacity
              style={[styles.saveButton, scheduleLoading && styles.disabledButton]}
              onPress={saveWeeklySchedule}
              disabled={scheduleLoading}
            >
              <Text style={styles.saveButtonText}>
                {scheduleLoading ? 'Saving Schedule...' : 'Save Weekly Schedule'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Status Information */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Availability Works</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>
            🟢 <Text style={styles.bold}>Online:</Text> Patients can find you in search results and book appointments
          </Text>
          <Text style={styles.infoItem}>
            🔴 <Text style={styles.bold}>Offline:</Text> You won't appear in patient searches
          </Text>
          <Text style={styles.infoItem}>
            📅 <Text style={styles.bold}>Weekly Schedule:</Text> Define your available hours for each day
          </Text>
          <Text style={styles.infoItem}>
            📋 <Text style={styles.bold}>Scheduled appointments:</Text> Will still show regardless of online status
          </Text>
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
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  onlineText: {
    color: '#4caf50',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  updatingText: {
    fontSize: 14,
    color: '#2196f3',
    fontStyle: 'italic',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pendingColor: {
    color: '#ff9800',
  },
  scheduledColor: {
    color: '#2196f3',
  },
  completedColor: {
    color: '#4caf50',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2196f3',
    paddingBottom: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  dayContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeContainer: {
    gap: 8,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  timePicker: {
    height: 40,
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
});
