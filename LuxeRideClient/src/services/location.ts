// src/services/location.ts

import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import { Platform, Alert, Linking } from 'react-native';

// Types
interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
}

interface DirectionsResult {
  coordinates: Location[];
  distance: number;
  duration: number;
  steps: any[];
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface WatchLocationOptions {
  enableHighAccuracy?: boolean;
  interval?: number;
  fastestInterval?: number;
}

class LocationService {
  private watchId: number | null = null;
  private isWatching = false;
  private lastKnownLocation: Location | null = null;

  // ================================
  // PERMISSIONS
  // ================================

  async requestLocationPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
        this.showLocationPermissionAlert();
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  async checkLocationPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  private showLocationPermissionAlert(): void {
    Alert.alert(
      'Permission de localisation requise',
      'LuxeRide a besoin d\'accéder à votre position pour fonctionner correctement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Paramètres', 
          onPress: () => Linking.openSettings() 
        },
      ]
    );
  }

  // ================================
  // GÉOLOCALISATION
  // ================================

  async getCurrentLocation(options?: LocationOptions): Promise<Location> {
    const defaultOptions: LocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
      ...options,
    };

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          
          this.lastKnownLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
          
          // Fallback vers la dernière position connue
          if (this.lastKnownLocation) {
            resolve(this.lastKnownLocation);
          } else {
            reject(this.getLocationError(error));
          }
        },
        defaultOptions
      );
    });
  }

  async watchLocation(
    onLocationUpdate: (location: Location) => void,
    onError?: (error: Error) => void,
    options?: WatchLocationOptions
  ): Promise<void> {
    if (this.isWatching) {
      this.stopWatchingLocation();
    }

    const defaultOptions: WatchLocationOptions = {
      enableHighAccuracy: true,
      interval: 5000,
      fastestInterval: 2000,
      ...options,
    };

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        this.lastKnownLocation = location;
        onLocationUpdate(location);
      },
      (error) => {
        console.error('Error watching location:', error);
        if (onError) {
          onError(this.getLocationError(error));
        }
      },
      defaultOptions
    );

    this.isWatching = true;
  }

  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  getLastKnownLocation(): Location | null {
    return this.lastKnownLocation;
  }

  // ================================
  // CALCULS DE DISTANCE
  // ================================

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance en mètres
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ================================
  // DIRECTIONS ET ITINÉRAIRES
  // ================================

  async getDirections(
    origin: Location,
    destination: Location,
    waypoints?: Location[]
  ): Promise<DirectionsResult> {
    try {
      // Pour cet exemple, nous utilisons une simulation
      // En production, vous utiliseriez l'API Google Directions
      
      const distance = this.calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      // Simulation d'un itinéraire simple (ligne droite)
      const coordinates: Location[] = [origin, destination];

      // Si des waypoints sont fournis, les inclure
      if (waypoints && waypoints.length > 0) {
        coordinates.splice(1, 0, ...waypoints);
      }

      return {
        coordinates,
        distance,
        duration: Math.round(distance / 50) * 60, // Estimation: 50 km/h
        steps: [],
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      
      // Fallback: ligne droite
      const distance = this.calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      return {
        coordinates: [origin, destination],
        distance,
        duration: Math.round(distance / 50) * 60, // Estimation: 50 km/h
        steps: [],
      };
    }
  }

  // Version avec l'API Google Directions (exemple)
  async getDirectionsWithGoogleAPI(
    origin: Location,
    destination: Location,
    waypoints?: Location[]
  ): Promise<DirectionsResult> {
    try {
      const apiKey = 'YOUR_GOOGLE_DIRECTIONS_API_KEY';
      
      let waypointsParam = '';
      if (waypoints && waypoints.length > 0) {
        const waypointCoords = waypoints
          .map(wp => `${wp.latitude},${wp.longitude}`)
          .join('|');
        waypointsParam = `&waypoints=${waypointCoords}`;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&key=${apiKey}&mode=driving&traffic_model=best_guess&departure_time=now`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Décoder le polyline pour obtenir les coordonnées
        const coordinates = this.decodePolyline(route.overview_polyline.points);

        return {
          coordinates,
          distance: leg.distance.value, // en mètres
          duration: leg.duration_in_traffic?.value || leg.duration.value, // en secondes
          steps: leg.steps,
        };
      } else {
        throw new Error(`Directions API error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting directions from Google API:', error);
      
      // Fallback vers la méthode simple
      return this.getDirections(origin, destination, waypoints);
    }
  }

  // ================================
  // GÉOCODAGE
  // ================================

  async geocodeAddress(address: string): Promise<Location[]> {
    try {
      const apiKey = 'YOUR_GOOGLE_GEOCODING_API_KEY';
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=fr`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.map((result: any) => ({
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          address: result.formatted_address,
        }));
      } else {
        throw new Error(`Geocoding error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      return [];
    }
  }

  async reverseGeocode(location: Location): Promise<string> {
    try {
      const apiKey = 'YOUR_GOOGLE_GEOCODING_API_KEY';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${apiKey}&language=fr`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        throw new Error(`Reverse geocoding error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
  }

  // ================================
  // UTILITAIRES
  // ================================

  private decodePolyline(encoded: string): Location[] {
    const points: Location[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  private getLocationError(error: any): Error {
    switch (error.code) {
      case 1:
        return new Error('Permission de localisation refusée');
      case 2:
        return new Error('Position indisponible');
      case 3:
        return new Error('Délai d\'attente dépassé');
      default:
        return new Error('Erreur de localisation inconnue');
    }
  }

  // ================================
  // MÉTHODES UTILITAIRES
  // ================================

  isWatchingLocation(): boolean {
    return this.isWatching;
  }

  // Calculer le bearing (direction) entre deux points
  calculateBearing(start: Location, end: Location): number {
    const startLat = this.degToRad(start.latitude);
    const startLng = this.degToRad(start.longitude);
    const endLat = this.degToRad(end.latitude);
    const endLng = this.degToRad(end.longitude);

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - 
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  // Calculer le point médian entre deux locations
  calculateMidpoint(location1: Location, location2: Location): Location {
    const lat1 = this.degToRad(location1.latitude);
    const lng1 = this.degToRad(location1.longitude);
    const lat2 = this.degToRad(location2.latitude);
    const lng2 = this.degToRad(location2.longitude);

    const dLng = lng2 - lng1;

    const x = Math.cos(lat2) * Math.cos(dLng);
    const y = Math.cos(lat2) * Math.sin(dLng);

    const lat3 = Math.atan2(
      Math.sin(lat1) + Math.sin(lat2),
      Math.sqrt((Math.cos(lat1) + x) * (Math.cos(lat1) + x) + y * y)
    );
    const lng3 = lng1 + Math.atan2(y, Math.cos(lat1) + x);

    return {
      latitude: (lat3 * 180) / Math.PI,
      longitude: (lng3 * 180) / Math.PI,
    };
  }

  // Vérifier si un point est dans un rayon donné
  isLocationWithinRadius(
    center: Location,
    point: Location,
    radiusInMeters: number
  ): boolean {
    const distance = this.calculateDistance(
      center.latitude,
      center.longitude,
      point.latitude,
      point.longitude
    );
    return distance <= radiusInMeters;
  }

  // ================================
  // NETTOYAGE
  // ================================

  cleanup(): void {
    this.stopWatchingLocation();
    this.lastKnownLocation = null;
  }
}

// Export singleton
export const locationService = new LocationService();