import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../contexts/AuthContext';
// Fix the import - make sure the path is correct
import { getDoctorCalendarEvents, CalendarEvent } from '../../services/calendar.service';
import { getDoctorIdByUserId } from '../../services/doctor.service';

export default function DoctorCalendar() {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadEvents();
    }
  }, [doctorId, selectedDate]);

  const loadDoctorId = async () => {
    if (!userProfile) return;
    
    try {
      const docId = await getDoctorIdByUserId(userProfile.id);
      setDoctorId(docId);
      console.log('✅ Doctor ID loaded:', docId);
    } catch (error) {
      console.error('❌ Error loading doctor ID:', error);
      setCalendarError('Failed to load doctor information');
    }
  };

  const loadEvents = async () => {
  if (!doctorId) {
    console.warn('⚠️ No doctor ID available for loading events');
    return;
  }

  try {
    setLoading(true);
    setCalendarError(null);
    
    console.log('📅 Loading events for doctor:', doctorId, 'on date:', selectedDate);
    
    // Fix date range to include entire month instead of just one day
    const currentDate = new Date(selectedDate);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDate = startOfMonth.toISOString();
    const endDate = endOfMonth.toISOString();
    
    console.log('📅 Loading events for date range:', startDate, 'to', endDate);
    
    const calendarEvents = await getDoctorCalendarEvents(doctorId, startDate, endDate);
    setEvents(calendarEvents);
    
    console.log('📊 All events loaded:', calendarEvents);
    
    // Filter events for selected date for display
    const selectedDateEvents = calendarEvents.filter(event => {
      const eventDate = event.start_datetime.split('T')[0];
      return eventDate === selectedDate;
    });
    
    console.log('📅 Events for selected date:', selectedDate, selectedDateEvents);
    
    // Mark all dates with events on calendar
    const marked = {};
    calendarEvents.forEach(event => {
      const eventDate = event.start_datetime.split('T')[0];
      marked[eventDate] = {
        marked: true,
        dotColor: getEventColor(event.event_type),
        activeOpacity: 0.5
      };
    });
    
    // Highlight selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#2196f3'
    };
    
    setMarkedDates(marked);
    
    // Set events for display (only selected date)
    setEvents(selectedDateEvents);
    
    console.log('✅ Events loaded successfully. Total:', calendarEvents.length, 'Selected date:', selectedDateEvents.length);
  } catch (error: any) {
    console.error('❌ Error loading events:', error);
    setCalendarError(error.message || 'Calendar feature is currently unavailable');
  } finally {
    setLoading(false);
  }
};


  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'consultation': return '#2196f3';
      case 'follow-up': return '#ff9800';
      case 'emergency': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      case 'rescheduled': return '#ff9800';
      default: return '#757575';
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (calendarError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Calendar Unavailable</Text>
        <Text style={styles.errorText}>{calendarError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Calendar */}
      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#2196f3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196f3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#2196f3',
            selectedDotColor: '#ffffff',
            arrowColor: '#2196f3',
            disabledArrowColor: '#d9e1e8',
            monthTextColor: '#2d4150',
            indicatorColor: '#2196f3',
          }}
        />
      </View>

      {/* Selected Date Events */}
      <View style={styles.eventsCard}>
        <Text style={styles.eventsTitle}>
          Appointments on {formatDate(`${selectedDate}T12:00:00.000Z`)}
        </Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading appointments...</Text>
        ) : events.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No appointments scheduled</Text>
            <Text style={styles.noEventsSubtext}>Your calendar is free for this day</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                    <Text style={styles.statusText}>{event.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <Text style={styles.eventTime}>
                  {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                </Text>
                
                {event.location && (
                  <Text style={styles.eventLocation}>📍 {event.location}</Text>
                )}
                
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Debug Info */}
      <View style={styles.debugCard}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>Doctor ID: {doctorId}</Text>
        <Text style={styles.debugText}>Selected Date: {selectedDate}</Text>
        <Text style={styles.debugText}>Events Count: {events.length}</Text>
        <Text style={styles.debugText}>Function Available: {typeof getDoctorCalendarEvents === 'function' ? 'Yes' : 'No'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  eventsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  debugCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
