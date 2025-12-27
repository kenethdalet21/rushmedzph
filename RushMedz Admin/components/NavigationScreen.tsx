import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as Maps from '../services/maps';

interface NavigationProps {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  originLabel: string;
  destinationLabel: string;
  onClose?: () => void;
  userType?: 'user' | 'driver' | 'merchant' | 'admin';
}

export default function NavigationScreen({
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
  originLabel,
  destinationLabel,
  onClose,
  userType = 'user',
}: NavigationProps) {
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking' | 'bicycling'>('driving');
  const [loading, setLoading] = useState(false);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');

  useEffect(() => {
    calculateRoute();
  }, [originLatitude, originLongitude, destinationLatitude, destinationLongitude, travelMode]);

  const calculateRoute = () => {
    try {
      setLoading(true);
      
      // Calculate straight-line distance using Haversine formula
      const distanceKm = Maps.calculateDistance(
        { latitude: originLatitude, longitude: originLongitude },
        { latitude: destinationLatitude, longitude: destinationLongitude }
      );
      
      setDistance(Maps.formatDistance(distanceKm));
      
      // Estimate duration based on travel mode and distance
      let estimatedMinutes = 0;
      
      switch (travelMode) {
        case 'driving':
          // Average speed ~40 km/h in urban Philippines
          estimatedMinutes = (distanceKm / 40) * 60;
          break;
        case 'transit':
          // Average speed ~25 km/h for public transport
          estimatedMinutes = (distanceKm / 25) * 60;
          break;
        case 'walking':
          // Average walking speed ~5 km/h
          estimatedMinutes = (distanceKm / 5) * 60;
          break;
        case 'bicycling':
          // Average cycling speed ~15 km/h
          estimatedMinutes = (distanceKm / 15) * 60;
          break;
      }
      
      setEstimatedDuration(Maps.formatDuration(estimatedMinutes));
      setEta(Maps.calculateETA(estimatedMinutes));
      
      setLoading(false);
    } catch (error) {
      console.error('Error calculating route:', error);
      setLoading(false);
    }
  };

  const handleStartNavigation = () => {
    try {
      Maps.openRoute(
        originLatitude,
        originLongitude,
        destinationLatitude,
        destinationLongitude,
        travelMode
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open navigation');
    }
  };

  const handleViewOnMaps = () => {
    try {
      Maps.openGoogleMaps(destinationLatitude, destinationLongitude, destinationLabel);
    } catch (error) {
      Alert.alert('Error', 'Failed to open maps');
    }
  };

  const getTravelModeLabel = (mode: string): string => {
    const modes: Record<string, string> = {
      driving: '🚗 Driving',
      transit: '🚌 Public Transport',
      walking: '🚶 Walking',
      bicycling: '🚴 Cycling',
    };
    return modes[mode] || mode;
  };

  const getUserTypeColor = (): string => {
    const colors: Record<string, string> = {
      driver: '#3498db',
      user: '#27ae60',
      merchant: '#e74c3c',
      admin: '#9b59b6',
    };
    return colors[userType] || '#3498db';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getUserTypeColor() }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📍 Navigation</Text>
          <Text style={styles.userTypeLabel}>{userType.charAt(0).toUpperCase() + userType.slice(1)}</Text>
        </View>
      </View>

      {/* Route Information */}
      <View style={styles.routeCard}>
        <View style={styles.locationSection}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.locationText}>📍 {originLabel}</Text>
          <Text style={styles.coordinates}>{Maps.formatCoordinates(originLatitude, originLongitude)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationSection}>
          <Text style={styles.label}>To</Text>
          <Text style={styles.locationText}>🏪 {destinationLabel}</Text>
          <Text style={styles.coordinates}>{Maps.formatCoordinates(destinationLatitude, destinationLongitude)}</Text>
        </View>
      </View>

      {/* Route Details */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getUserTypeColor()} />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      ) : (
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📏 Distance</Text>
            <Text style={[styles.detailValue, { color: getUserTypeColor() }]}>{distance}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱️ Estimated Time</Text>
            <Text style={[styles.detailValue, { color: getUserTypeColor() }]}>{estimatedDuration}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕐 Estimated Arrival</Text>
            <Text style={[styles.detailValue, { color: getUserTypeColor() }]}>{eta}</Text>
          </View>
        </View>
      )}

      {/* Travel Mode Selection */}
      <View style={styles.travelModeCard}>
        <Text style={styles.travelModeTitle}>Travel Mode</Text>
        <View style={styles.travelModeGrid}>
          {(['driving', 'transit', 'walking', 'bicycling'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.travelModeButton,
                travelMode === mode && { backgroundColor: getUserTypeColor() },
              ]}
              onPress={() => setTravelMode(mode)}
            >
              <Text
                style={[
                  styles.travelModeButtonText,
                  travelMode === mode && { color: '#fff' },
                ]}
              >
                {getTravelModeLabel(mode)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleViewOnMaps}
        >
          <Text style={styles.secondaryButtonText}>📍 View on Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: getUserTypeColor() }]}
          onPress={handleStartNavigation}
        >
          <Text style={styles.buttonText}>🧭 Start Navigation</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Navigation Tips</Text>
        <Text style={styles.infoText}>
          {userType === 'driver'
            ? '• Keep your phone mounted for safe navigation\n• Follow speed limits and traffic rules\n• Update your location periodically'
            : userType === 'merchant'
            ? '• Track your deliveries in real-time\n• Monitor driver locations\n• Receive delivery updates'
            : userType === 'admin'
            ? '• Monitor all active deliveries\n• View driver routes\n• Track overall fleet movement'
            : '• Track your delivery status\n• View driver location\n• Get real-time updates'}
        </Text>
      </View>

      {/* Close Button */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userTypeLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  routeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationSection: {
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#95a5a6',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  travelModeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  travelModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  travelModeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  travelModeButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelModeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#ecf0f1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2980b9',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#2c3e50',
    lineHeight: 18,
  },
  closeButton: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
