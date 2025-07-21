import * as Location from 'expo-location';
import Constants from 'expo-constants';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

class LocationService {
  private apiKey: string;

  constructor() {
    this.apiKey = Constants.expoConfig?.extra?.googleMapsApiKey || '';
  }

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current user location
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Convert address to coordinates using Google Geocoding API
  async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not found');
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );
      
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Watch location changes (for live tracking)
  watchLocation(callback: (location: LocationCoordinates) => void): () => void {
    let watchSubscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) return;

        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            callback({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        );
      } catch (error) {
        console.error('Error watching location:', error);
      }
    };

    startWatching();

    // Return cleanup function
    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }
}

export const locationService = new LocationService();
