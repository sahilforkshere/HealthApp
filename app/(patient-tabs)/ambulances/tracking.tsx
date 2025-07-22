import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

import {
  getPatientActiveRequest,
  getPatientIdByUserId,
  AmbulanceRequest,
} from '../../../services/ambulance.service';
import { useAuth } from '../../../contexts/AuthContext';

const { height } = Dimensions.get('window');

/* ────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */

const getStatusColor = (status: string) => {
  switch (status) {
    case 'accepted':
      return '#2196f3';
    case 'en-route':
      return '#ff9800';
    case 'arrived':
      return '#4caf50';
    default:
      return '#757575';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'accepted':
      return '✅';
    case 'en-route':
      return '🚑';
    case 'arrived':
      return '📍';
    default:
      return '❓';
  }
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'Driver accepted your request and is preparing to depart';
    case 'en-route':
      return 'Ambulance is en-route to your location';
    case 'arrived':
      return 'Ambulance has arrived at your location';
    default:
      return 'Request status unknown';
  }
};

const getEmergencyColor = (level: string) => {
  switch (level) {
    case 'critical':
      return '#d50000';
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
    default:
      return '#757575';
  }
};

const formatTime = (timeString?: string) =>
  timeString
    ? new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Calculating…';

/* ────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────── */

export default function AmbulanceTracking() {
  const { userProfile } = useAuth();
  const router = useRouter();

  const [activeRequest, setActiveRequest] = useState<AmbulanceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [patientLoc, setPatientLoc] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const [driverLoc, setDriverLoc] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  const mapRef = useRef<MapView>(null);
  const refreshTimer = useRef<NodeJS.Timeout>();

  /* ───────────── INITIAL LOAD ───────────── */

  useEffect(() => {
    (async () => {
      await getPatientLocation();
      await fetchActiveRequest();
    })();
  }, []);

  /* ───────────── SCREEN FOCUS AUTO-REFRESH ───────────── */

  useFocusEffect(
    useCallback(() => {
      startAutoRefresh();
      return () => stopAutoRefresh();
    }, [patientLoc, activeRequest]),
  );

  const startAutoRefresh = () => {
    stopAutoRefresh(); // clear any existing
    refreshTimer.current = setInterval(() => {
      fetchActiveRequest(false);
    }, 30_000); // 30 s
  };

  const stopAutoRefresh = () => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  };

  /* ───────────── DATA FUNCTIONS ───────────── */

  const fetchActiveRequest = async (showLoader = true) => {
    if (!userProfile) return;
    try {
      showLoader && setLoading(true);

      const patientId = await getPatientIdByUserId(userProfile.id);
      const request = await getPatientActiveRequest(patientId);
      setActiveRequest(request);

      if (request?.driver_location) await geocodeDriver(request.driver_location);
    } catch (e) {
      console.error('Active request fetch error →', e);
    } finally {
      showLoader && setLoading(false);
    }
  };

  const getPatientLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your position.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setPatientLoc({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (e) {
      console.error('Patient location error →', e);
    }
  };

  const geocodeDriver = async (address: string) => {
    try {
      const geocoded = await Location.geocodeAsync(address);
      if (!geocoded.length) throw new Error('No coords');
      const { latitude, longitude } = geocoded[0];
      updateDriverLoc(latitude, longitude);
    } catch {
      /* fallback random demo coords */
      updateDriverLoc(
        37.7749 + (Math.random() - 0.5) * 0.01,
        -122.4194 + (Math.random() - 0.5) * 0.01,
      );
    }
  };

  const updateDriverLoc = (lat: number, lng: number) => {
    const loc = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setDriverLoc(loc);

    /* draw straight line; for production use Google Directions API */
    if (patientLoc)
      setRouteCoords([
        { latitude: patientLoc.latitude, longitude: patientLoc.longitude },
        { latitude: lat, longitude: lng },
      ]);

    /* keep both markers visible */
    setTimeout(() => {
      if (mapRef.current && patientLoc) {
        mapRef.current.fitToCoordinates([patientLoc, loc], {
          animated: true,
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        });
      }
    }, 1000);
  };

  /* ───────────── HANDLERS ───────────── */

  const onRefresh = async () => {
    await fetchActiveRequest(false);
    await getPatientLocation();
  };

  const callDriverNumber = () => {
    const driverPhone = activeRequest?.ambulance_drivers?.profiles?.phone;
    const driverName = activeRequest?.ambulance_drivers?.profiles?.full_name;
    
    console.log('📞 Driver phone data:', {
      phone: driverPhone,
      name: driverName,
      hasDriver: !!activeRequest?.ambulance_drivers,
      hasProfile: !!activeRequest?.ambulance_drivers?.profiles
    });

    if (!driverPhone) {
      Alert.alert(
        'Driver Contact Unavailable', 
        'The driver\'s phone number is not available at this time. You can still call emergency services.',
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: 'Call Emergency (112)', 
            onPress: () => Linking.openURL('tel:112')
          }
        ]
      );
      return;
    }

    // Clean and validate phone number
    const cleanPhone = driverPhone.replace(/[^\d+]/g, '');
    
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Number', 'The driver\'s phone number appears to be invalid');
      return;
    }

    Alert.alert(
      '📞 Call Your Ambulance Driver',
      `Do you want to call ${driverName || 'your driver'}?\n\nPhone: ${driverPhone}\nVehicle: ${activeRequest?.ambulance_drivers?.vehicle_registration || 'Unknown'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Driver', 
          onPress: () => Linking.openURL(`tel:${cleanPhone}`)
        }
      ]
    );
  };

  const callEmergencyNumber = () => {
    Alert.alert(
      'Emergency Call',
      'Call emergency services?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', onPress: () => Linking.openURL('tel:112') }
      ]
    );
  };

  const centerMapOnLocations = () => {
    if (mapRef.current && patientLoc && driverLoc) {
      mapRef.current.fitToCoordinates([patientLoc, driverLoc], {
        animated: true,
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
      });
    }
  };

  /* ───────────── RENDER STATES ───────────── */

  if (loading)
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f44336" />
        <Text style={styles.loadingText}>Loading live tracking…</Text>
      </SafeAreaView>
    );

  if (!activeRequest)
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.noIcon}>🚑</Text>
        <Text style={styles.noRequestTitle}>No active ambulance request</Text>
        <Text style={styles.noRequestText}>
          Your latest emergency request might be pending or already completed.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backTxt}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  /* ───────────── MAIN JSX ───────────── */

  return (
    <SafeAreaView style={styles.container}>
      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        {patientLoc ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={patientLoc}
            showsUserLocation
            showsTraffic
            onMapReady={() => {
              if (driverLoc) {
                setTimeout(() => centerMapOnLocations(), 1000);
              }
            }}
          >
            {/* Patient marker */}
            <Marker coordinate={patientLoc} title="You" pinColor="blue" />
            
            {/* Driver marker */}
            {driverLoc && (
              <Marker
                coordinate={driverLoc}
                title="Ambulance"
                description={`Driver: ${
                  activeRequest.ambulance_drivers?.profiles?.full_name ?? 'Driver'
                }`}
              >
                <View style={styles.ambMarker}>
                  <Text style={styles.ambIcon}>🚑</Text>
                </View>
              </Marker>
            )}
            
            {/* Route line */}
            {routeCoords.length > 0 && (
              <Polyline 
                coordinates={routeCoords} 
                strokeColor="#f44336" 
                strokeWidth={4}
                lineDashPattern={[10, 5]} 
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#f44336" />
            <Text style={styles.mapPlaceholderText}>Loading map…</Text>
          </View>
        )}

        {/* Map controls overlay */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapBtn} onPress={centerMapOnLocations}>
            <Text style={styles.mapBtnText}>📍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} onPress={onRefresh}>
            <Text style={styles.mapBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Status badge overlay */}
        <View style={styles.statusOverlay}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeRequest.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(activeRequest.status)}</Text>
            <Text style={styles.statusText}>{activeRequest.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Bottom info sheet */}
      <View style={styles.bottomSheet}>
        {/* Driver info section */}
        <View style={styles.driverSection}>
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👨‍⚕️</Text>
            </View>
            
            <View style={styles.driverDetails}>
              <Text style={styles.driverName} numberOfLines={1}>
                {activeRequest.ambulance_drivers?.profiles?.full_name ?? 'Driver'}
              </Text>
              <Text style={styles.driverInfo} numberOfLines={1}>
                {activeRequest.ambulance_drivers?.vehicle_type} • {activeRequest.ambulance_drivers?.vehicle_registration}
              </Text>
              {/* Show driver phone number */}
              {activeRequest.ambulance_drivers?.profiles?.phone && (
                <Text style={styles.driverPhone} numberOfLines={1}>
                  📞 {activeRequest.ambulance_drivers.profiles.phone}
                </Text>
              )}
              {activeRequest.driver_location && (
                <Text style={styles.driverLocation} numberOfLines={1}>
                  📍 {activeRequest.driver_location}
                </Text>
              )}
            </View>

            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>ETA</Text>
              <Text style={styles.timeValue}>
                {activeRequest.estimated_arrival_time 
                  ? formatTime(activeRequest.estimated_arrival_time)
                  : '~5 min'
                }
              </Text>
            </View>
          </View>

          {/* Status message */}
          <Text style={styles.statusMessage}>
            {getStatusMessage(activeRequest.status)}
          </Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {/* Driver call button - prominently displayed */}
            <TouchableOpacity
              style={[
                styles.callBtn, 
                !activeRequest.ambulance_drivers?.profiles?.phone && styles.disabledBtn
              ]}
              onPress={callDriverNumber}
            >
              <Text style={styles.callText}>
                {activeRequest.ambulance_drivers?.profiles?.phone 
                  ? '📞 Call Your Driver' 
                  : '📞 Driver Contact N/A'
                }
              </Text>
            </TouchableOpacity>
            
            {/* Emergency call button */}
            <TouchableOpacity
              style={styles.emergBtn}
              onPress={callEmergencyNumber}
            >
              <Text style={styles.emergText}>🆘 Emergency (112)</Text>
            </TouchableOpacity>
          </View>

          {/* Additional info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Priority</Text>
              <Text style={[styles.infoValue, { color: getEmergencyColor(activeRequest.emergency_level) }]}>
                {activeRequest.emergency_level.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Requested</Text>
              <Text style={styles.infoValue}>{formatTime(activeRequest.created_at)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Updated</Text>
              <Text style={styles.infoValue}>{formatTime(activeRequest.updated_at)}</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  /* Loading states */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  noIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noRequestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noRequestText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  backBtn: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  backTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  /* Map container - takes full screen */
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },

  /* Map overlays */
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 12,
  },
  mapBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapBtnText: {
    fontSize: 20,
  },

  statusOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 80,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    maxWidth: 200,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#fff',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  /* Ambulance marker */
  ambMarker: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#f44336',
    elevation: 4,
  },
  ambIcon: {
    fontSize: 24,
  },

  /* Bottom sheet - overlays map */
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    paddingTop: 8,
  },

  /* Driver section */
  driverSection: {
    padding: 20,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  driverDetails: {
    flex: 1,
    marginRight: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  driverInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
    marginBottom: 4,
  },
  driverLocation: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600',
  },
  timeInfo: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
  },

  /* Status message */
  statusMessage: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },

  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  callBtn: {
    backgroundColor: '#4caf50',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  disabledBtn: {
    backgroundColor: '#cccccc',
    elevation: 0,
  },
  callText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emergBtn: {
    backgroundColor: '#f44336',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  emergText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  /* Info row */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
