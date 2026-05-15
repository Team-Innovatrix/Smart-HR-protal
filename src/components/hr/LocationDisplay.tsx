/**
 * Location Display Component
 * Shows geolocation information for attendance records
 */

import { MapPinIcon } from '@heroicons/react/24/outline'

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface LocationDisplayProps {
  location?: LocationData;
  label: string;
  className?: string;
}

export default function LocationDisplay({ location, label, className = '' }: LocationDisplayProps) {
  if (!location) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <MapPinIcon className="h-4 w-4 inline mr-1" />
        {label}: No location recorded
      </div>
    );
  }

  const formatCoordinates = (lat: number, lon: number) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return '';
    return ` (±${Math.round(accuracy)}m)`;
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-start space-x-2">
        <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-gray-700 font-medium">{label}</div>
          {location.address ? (
            <div className="text-gray-600 truncate" title={location.address}>
              {location.address}
            </div>
          ) : null}
          <div className="text-gray-500 text-xs">
            <button
              onClick={openInMaps}
              className="hover:text-blue-600 hover:underline"
              title="Open in Google Maps"
            >
              {formatCoordinates(location.latitude, location.longitude)}
              {formatAccuracy(location.accuracy)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact location display for lists
 */
export function CompactLocationDisplay({ location, className = '' }: { location?: LocationData; className?: string }) {
  if (!location) {
    return <span className={`text-gray-400 text-xs ${className}`}>No location</span>;
  }

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={openInMaps}
      className={`text-xs text-blue-600 hover:text-blue-800 hover:underline ${className}`}
      title={location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
    >
      <MapPinIcon className="h-3 w-3 inline mr-1" />
      {location.address ? location.address.split(',')[0] : 'View Location'}
    </button>
  );
}
