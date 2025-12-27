import * as Linking from 'expo-linking';

/**
 * Coordinates interface
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Route and navigation information
 */
export interface RouteInfo {
  distance: number; // in kilometers
  duration: number; // in minutes
  eta: string; // estimated time of arrival
}

/**
 * Open a location in Google Maps
 * @param lat Latitude
 * @param lng Longitude
 * @param label Optional label for the location
 */
export function openGoogleMaps(lat: number, lng: number, label?: string) {
  let url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (label) {
    url = `https://www.google.com/maps/search/${encodeURIComponent(label)}/@${lat},${lng},17z`;
  }
  Linking.openURL(url);
}

/**
 * Open navigation directions from origin to destination
 * @param originLat Starting latitude
 * @param originLng Starting longitude
 * @param destLat Destination latitude
 * @param destLng Destination longitude
 * @param travelMode 'driving' | 'transit' | 'walking' | 'bicycling'
 */
export function openRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  travelMode: 'driving' | 'transit' | 'walking' | 'bicycling' = 'driving'
) {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${travelMode}`;
  Linking.openURL(url);
}

/**
 * Calculate estimated time of arrival (ETA) based on current time and estimated duration
 * @param durationMinutes Estimated travel time in minutes
 * @returns Formatted ETA string
 */
export function calculateETA(durationMinutes: number): string {
  const now = new Date();
  const eta = new Date(now.getTime() + durationMinutes * 60000);
  
  return eta.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format distance in kilometers to readable string
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format duration in minutes to readable string
 * @param durationMinutes Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)} min`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.round(durationMinutes % 60);
  
  if (minutes === 0) {
    return `${hours} h`;
  }
  
  return `${hours} h ${minutes} min`;
}

/**
 * Get human-readable address components from coordinates
 * Note: This would require reverse geocoding API call
 * For now, returns formatted coordinates
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Check if two coordinates are the same (within small tolerance)
 */
export function isSameLocation(
  coord1: Coordinates,
  coord2: Coordinates,
  tolerance: number = 0.0001
): boolean {
  return (
    Math.abs(coord1.latitude - coord2.latitude) < tolerance &&
    Math.abs(coord1.longitude - coord2.longitude) < tolerance
  );
}

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get Google Maps Directions API URL for fetching route details
 * Note: Requires API key - set in environment variables
 * @param origin Origin coordinates
 * @param destination Destination coordinates
 * @param apiKey Google Maps API key
 */
export function getDirectionsURL(
  origin: Coordinates,
  destination: Coordinates,
  apiKey: string
): string {
  return `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}&mode=driving`;
}

/**
 * Philippine major cities and coordinates for quick access
 */
export const PHILIPPINES_LOCATIONS = {
  MANILA: { latitude: 14.5995, longitude: 120.9842 },
  CEBU: { latitude: 10.3157, longitude: 123.8854 },
  DAVAO: { latitude: 7.0904, longitude: 125.6144 },
  QUEZON_CITY: { latitude: 14.6349, longitude: 121.0388 },
  MAKATI: { latitude: 14.5547, longitude: 121.0244 },
  BGC: { latitude: 14.5614, longitude: 121.0437 },
  PASIG: { latitude: 14.5790, longitude: 121.5598 },
  CAVITE: { latitude: 14.3571, longitude: 120.8854 },
};

