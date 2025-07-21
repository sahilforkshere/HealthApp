import { supabase } from './supabase';

export interface CalendarEvent {
  id: number;
  patient_request_id: number;
  doctor_id: number;
  patient_id: string;  // UUID as string
  title: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  event_type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

// Make sure this function is exported
export async function getDoctorCalendarEvents(doctorId: number, startDate: string, endDate: string): Promise<CalendarEvent[]> {
  try {
    console.log('📅 Fetching calendar events for doctor:', doctorId);
    console.log('📅 Date range filter:', startDate, 'to', endDate);
    
    // Check if table exists first
    const { error: checkError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.warn('⚠️ calendar_events table does not exist, returning empty array');
      return [];
    }
    
    // Use date() function to compare only the date part, ignoring time
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('start_datetime', startDate)
      .lte('start_datetime', endDate)
      .order('start_datetime');

    if (error) {
      console.error('❌ Error fetching calendar events:', error);
      throw error;
    }

    console.log('✅ Calendar events fetched from DB:', data?.length || 0);
    console.log('📊 Events details:', data);
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    return [];
  }
}

// Export other calendar functions
export async function getPatientCalendarEvents(patientId: string): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('patient_id', patientId)
      .order('start_datetime');

    if (error) {
      if (error.code === '42P01') {
        console.warn('⚠️ calendar_events table does not exist, returning empty array');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching patient calendar events:', error);
    return [];
  }
}

export async function createCalendarEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([{
      patient_request_id: Number(eventData.patient_request_id),
      doctor_id: Number(eventData.doctor_id),
      patient_id: String(eventData.patient_id), // Keep as string for UUID
      title: eventData.title,
      start_datetime: eventData.start_datetime,
      end_datetime: eventData.end_datetime,
      location: eventData.location,
      event_type: eventData.event_type,
      status: eventData.status
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Default export for the entire service
const CalendarService = {
  getDoctorCalendarEvents,
  getPatientCalendarEvents,
  createCalendarEvent
};

export default CalendarService;
