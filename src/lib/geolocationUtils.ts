/**
 * Geolocation Utilities
 * Handles geolocation capture, validation, and distance calculations
 */

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Get current geolocation from browser
 */
export async function getCurrentLocation(options: GeolocationOptions = {}): Promise<GeolocationData> {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    ...options
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if coordinates are within allowed distance from office location
 */
export function validateLocation(
  userLat: number,
  userLon: number,
  officeLat: number,
  officeLon: number,
  maxDistanceMeters: number = 1000 // Default 1km
): { isValid: boolean; distance: number; message: string } {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  
  return {
    isValid: distance <= maxDistanceMeters,
    distance: Math.round(distance),
    message: distance <= maxDistanceMeters 
      ? `Location verified (${Math.round(distance)}m from office)`
      : `Location too far from office (${Math.round(distance)}m, max ${maxDistanceMeters}m)`
  };
}

/**
 * Reverse geocoding to get address from coordinates
 * This would typically use a service like Google Maps API or OpenStreetMap
 */
export async function getAddressFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name;
    }
    
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Check if geolocation is available and enabled
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (!isGeolocationAvailable()) {
    return false;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get location with address
 */
export async function getLocationWithAddress(options: GeolocationOptions = {}): Promise<GeolocationData> {
  const location = await getCurrentLocation(options);
  
  try {
    const address = await getAddressFromCoordinates(location.latitude, location.longitude);
    return {
      ...location,
      address
    };
  } catch (error) {
    console.error('Failed to get address:', error);
    return location;
  }
}
