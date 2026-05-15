export interface NodeExecutionRecord {
  nodeId: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'skipped';
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface VoiceCommandState {
  isRecording: boolean;
  isProcessing: boolean;
  transcription: string;
  intent: any;
  error: string | null;
  success: boolean;
  // Node-level status tracking
  nodeProgress?: NodeExecutionRecord[];
  currentNode?: string;
  nodeStatus?: 'idle' | 'running' | 'completed' | 'error' | 'skipped';
}

export interface VoiceCommandResult {
  transcription: string;
  intent: any;
  success: boolean;
  message: string;
  data?: any;
  executionResult?: any;
  action?: string;
  apiEndpoint?: string;
  method?: string;
  payload?: any;
  status?: string;
  nodeStatus?: {
    currentNode?: string;
    nodeStatus?: 'idle' | 'running' | 'completed' | 'error' | 'skipped';
    nodeProgress?: NodeExecutionRecord[];
    nodeStartTime?: string;
    nodeEndTime?: string;
  };
}

export class VoiceCommandClient {
  private baseUrl: string;
  private currentSessionId: string | null = null;
  
  constructor() {
    // Use window.location.origin for client-side, fallback to localhost for SSR
    if (typeof window !== 'undefined') {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
  }
  
  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }
  
  /**
   * Clear the current session (forces new session on next command)
   */
  clearSession(): void {
    this.currentSessionId = null;
  }
  
  async processVoiceCommand(audioBlob: Blob, location?: { latitude: number; longitude: number }): Promise<VoiceCommandResult> {
    try {
      // Check if location permission is already granted and get location proactively
      if (!location) {
        console.log('🔍 Checking for existing location permission...');
        
        // Try to get location silently if permission was previously granted
        const existingLocation = await this.checkExistingLocationPermission();
        if (existingLocation) {
          console.log('✅ Location permission already granted, using existing location');
          location = existingLocation;
        }
      }
      
      // If we have location or skip check, proceed with the actual request
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-command.webm');
      
      if (this.currentSessionId) {
        formData.append('sessionId', this.currentSessionId);
      }
      
      if (location) {
        console.log('📍 CLIENT: Sending location with request:', location);
        formData.append('location', JSON.stringify(location));
      } else {
        console.log('📍 CLIENT: No location to send with request');
      }
      
      const response = await fetch(`${this.baseUrl}/api/voice-commands/langgraph/process`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        }
        
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.sessionId) {
        this.currentSessionId = result.sessionId;
      }
      
      // Handle location requirement after execution
      if (result.executionResult?.error === 'LOCATION_REQUIRED' && !location) {
        console.log('🌍 Location required! Requesting permission NOW...');
        
        // Request location permission from browser
        const userLocation = await this.requestLocationPermission();
        
        if (userLocation) {
          // Got location! Now retry with location
          console.log('✅ Location obtained, retrying command with location');
          return this.processVoiceCommand(audioBlob, userLocation);
        } else {
          // Location denied - return error with clear message
          console.error('❌ Location permission denied by user');
          return {
            ...result,
            success: false,
            message: 'Location permission was denied. Location access is required for attendance tracking. Please enable location in your browser settings and try again.',
            executionResult: {
              ...result.executionResult,
              error: 'LOCATION_PERMISSION_DENIED',
              message: 'User denied location permission'
            }
          };
        }
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Processing failed: ${error}`);
    }
  }
  
  /**
   * Check if location permission is already granted and get location silently
   * Returns location coordinates if available, null otherwise
   */
  private async checkExistingLocationPermission(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      // Check permission status first (if supported)
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            // Permission already granted, get location silently
            console.log('🌍 Location permission previously granted, getting location...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              (error) => {
                console.error('Failed to get existing location:', error.message);
                resolve(null);
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 60000 // Use cached location up to 1 minute old
              }
            );
          } else {
            // Permission not granted yet
            resolve(null);
          }
        }).catch(() => {
          // Permissions API not supported, resolve null
          resolve(null);
        });
      } else {
        // Permissions API not supported
        resolve(null);
      }
    });
  }

  /**
   * Request location permission from browser (shows popup)
   * Returns location coordinates if granted, null if denied
   */
  private async requestLocationPermission(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      console.log('🌍 Requesting location permission...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location permission granted');
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('❌ Location permission denied:', error.message);
          
          // Provide specific error messages based on error code
          let errorMessage = 'Location permission denied';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission was denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your device settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          console.error(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
  
  private async getAuthToken(): Promise<string | null> {
    try {
      // Try to get the token from Clerk's session using a safer approach
      if (typeof window !== 'undefined') {
        // Check if Clerk is available on the window object
        const clerk = (window as any).Clerk;
        if (clerk) {
          try {
            // Try different ways to get the session
            let session = null;
            
            if (clerk.session) {
              session = await clerk.session;
            } else if (clerk.user) {
              session = await clerk.user.getSession();
            }
            
            if (session && typeof session.getToken === 'function') {
              const token = await session.getToken();
              if (token) {
                return token;
              }
            }
          } catch (sessionError) {
          }
        }
      }
      
      // Fallback: try to get from localStorage or cookies
      const token = localStorage.getItem('clerk-auth-token') || 
                   this.getCookie('__session') ||
                   this.getCookie('__clerk_session');
      
      if (token) {
        return token;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }
  
  async getVoiceCommandHistory(): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        return [];
      }
      
      // Use new session-based endpoint
      const url = `${this.baseUrl}/api/voice-sessions?limit=20&t=${Date.now()}`;
      
      // Test if the API endpoint is reachable first
      try {
        const testResponse = await fetch(`${this.baseUrl}/api/health`, {
          method: 'GET',
          credentials: 'include',
        });
      } catch (healthError) {
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Return flattened commands from sessions (backward compatible format)
      return result.data?.voiceCommands || result.data?.commands || [];
      
    } catch (error) {
      
      // Return empty array as fallback
      return [];
    }
  }
  
}
