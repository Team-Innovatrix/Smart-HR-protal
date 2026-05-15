/**
 * Location Permission Utilities
 * Handles browser location permission requests and user-friendly messaging
 */

import { getCurrentLocation, GeolocationData, GeolocationOptions } from './geolocationUtils';

export interface LocationPermissionResult {
  granted: boolean;
  location?: GeolocationData;
  error?: string;
  userDeclined?: boolean;
}

/**
 * Request location permission and get current location
 * Shows appropriate messages based on user action
 */
export async function requestLocationPermission(
  options: GeolocationOptions = {}
): Promise<LocationPermissionResult> {
  try {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      return {
        granted: false,
        error: 'Geolocation is not supported by this browser. Please use a modern browser to clock in.'
      };
    }

    // Check current permission state
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permission.state === 'denied') {
          return {
            granted: false,
            userDeclined: true,
            error: 'Location access has been denied. Please enable location permission in your browser settings to clock in.'
          };
        }
      } catch (permissionError) {
        // Permission API not supported, continue with location request
        console.warn('Permission API not supported:', permissionError);
      }
    }

    // Request location with user-friendly options
    const location = await getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 300000, // 5 minutes cache
      ...options
    });

    return {
      granted: true,
      location
    };

  } catch (error: any) {
    console.error('Location permission error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('denied') || error.code === 1) {
      return {
        granted: false,
        userDeclined: true,
        error: 'Location access was denied. Please enable location permission to clock in.'
      };
    } else if (error.message?.includes('timeout') || error.code === 3) {
      return {
        granted: false,
        error: 'Location request timed out. Please try again and ensure you have a good GPS signal.'
      };
    } else if (error.message?.includes('unavailable') || error.code === 2) {
      return {
        granted: false,
        error: 'Location is currently unavailable. Please check your GPS settings and try again.'
      };
    } else {
      return {
        granted: false,
        error: 'Failed to get your location. Please ensure location services are enabled and try again.'
      };
    }
  }
}

/**
 * Show a user-friendly message for location permission issues
 */
export function showLocationPermissionMessage(error: string, userDeclined?: boolean) {
  if (userDeclined) {
    // Show a more detailed message for declined permissions
    alert(`❌ Location Required\n\n${error}\n\nTo enable location:\n1. Click the location icon in your browser's address bar\n2. Select "Allow" for location access\n3. Refresh the page and try clocking in again`);
  } else {
    // Show a general error message
    alert(`❌ Location Error\n\n${error}`);
  }
}

/**
 * Check if location permission is already granted
 */
export async function checkLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }

  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      // Permission API not supported, assume we need to request
      return false;
    }
  }

  // If permission API not available, assume we need to request
  return false;
}
