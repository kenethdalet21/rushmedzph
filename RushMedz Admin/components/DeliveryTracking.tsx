import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import NavigationScreen from './NavigationScreen';
import * as Maps from '../services/maps';

interface Delivery {
  id: string;
  orderId: string;
  userPhone: string;
  userLocation: string;
  pharmacyLocation: string;
  pharmacyCoordinates: Maps.Coordinates;
  userCoordinates: Maps.Coordinates;
  driverName?: string;
  driverPhone?: string;
  status: 'pending' | 'pickup' | 'in-transit' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery?: string;
}

interface DeliveryTrackingProps {
  userType: 'user' | 'driver' | 'merchant' | 'admin';
  currentUserLocation?: Maps.Coordinates;
  onNavigate?: (delivery: Delivery) => void;
}

export default function DeliveryTracking({
  userType,
  currentUserLocation,
  onNavigate,
}: DeliveryTrackingProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = () => {
    setLoading(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      // Mock delivery data
      const mockDeliveries: Delivery[] = [
        {
          id: 'DEL001',
          orderId: 'ORD001',
          userPhone: '09123456789',
          userLocation: 'Manila City, Philippines',
          pharmacyLocation: 'SM Mall of Asia',
          pharmacyCoordinates: { latitude: 14.5515, longitude: 120.9881 },
          userCoordinates: { latitude: 14.5995, longitude: 120.9842 },
          driverName: 'John Driver',
          driverPhone: '+639987654321',
          status: 'in-transit',
          createdAt: new Date().toISOString(),
          estimatedDelivery: Maps.calculateETA(12),
        },
        {
          id: 'DEL002',
          orderId: 'ORD002',
          userPhone: '09198765432',
          userLocation: 'Quezon City, Philippines',
          pharmacyLocation: 'Puregold QC',
          pharmacyCoordinates: { latitude: 14.6349, longitude: 121.0388 },
          userCoordinates: { latitude: 14.6500, longitude: 121.0600 },
          driverName: 'Maria Driver',
          driverPhone: '+639876543210',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'DEL003',
          orderId: 'ORD003',
          userPhone: '09111111111',
          userLocation: 'Pasig City, Philippines',
          pharmacyLocation: 'Watsons Pasig',
          pharmacyCoordinates: { latitude: 14.5790, longitude: 121.5598 },
          userCoordinates: { latitude: 14.5900, longitude: 121.5700 },
          driverName: 'Juan Driver',
          driverPhone: '+639765432100',
          status: 'delivered',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      setDeliveries(mockDeliveries);
      setLoading(false);
    }, 800);
  };

  const handleStartNavigation = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowNavigation(true);
    if (onNavigate) {
      onNavigate(delivery);
    }
  };

  const handleViewDetails = (delivery: Delivery) => {
    let message = `Order #${delivery.orderId}\n`;
    message += `Status: ${delivery.status.toUpperCase()}\n`;
    message += `From: ${delivery.pharmacyLocation}\n`;
    message += `To: ${delivery.userLocation}\n`;

    if (delivery.driverName) {
      message += `\nDriver: ${delivery.driverName}\n`;
      message += `Driver Phone: ${delivery.driverPhone}`;
    }

    if (delivery.estimatedDelivery) {
      message += `\nEstimated Arrival: ${delivery.estimatedDelivery}`;
    }

    Alert.alert('Delivery Details', message, [
      {
        text: 'Start Navigation',
        onPress: () => handleStartNavigation(delivery),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (filter === 'active') return ['pending', 'pickup', 'in-transit'].includes(d.status);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(d.status);
    return true;
  });

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#f39c12',
      pickup: '#e67e22',
      'in-transit': '#3498db',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      pending: '⏳',
      pickup: '📦',
      'in-transit': '🚗',
      delivered: '✅',
      cancelled: '❌',
    };
    return icons[status] || '📍';
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

  const renderDeliveryItem = ({ item: delivery }: { item: Delivery }) => (
    <TouchableOpacity
      style={[styles.deliveryCard, { borderLeftColor: getStatusColor(delivery.status) }]}
      onPress={() => handleViewDetails(delivery)}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>{getStatusIcon(delivery.status)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(delivery.status) }]}>
            {delivery.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.orderId}>#{delivery.orderId}</Text>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>From:</Text>
          <Text style={styles.locationValue}>{delivery.pharmacyLocation}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>To:</Text>
          <Text style={styles.locationValue}>{delivery.userLocation}</Text>
        </View>

        {delivery.driverName && (
          <View style={styles.driverRow}>
            <Text style={styles.driverLabel}>🚗 {delivery.driverName}</Text>
          </View>
        )}

        {delivery.estimatedDelivery && (
          <View style={styles.etaRow}>
            <Text style={styles.etaLabel}>ETA:</Text>
            <Text style={styles.etaValue}>{delivery.estimatedDelivery}</Text>
          </View>
        )}
      </View>

      {['pickup', 'in-transit'].includes(delivery.status) && (
        <TouchableOpacity
          style={[styles.navigateButton, { backgroundColor: getUserTypeColor() }]}
          onPress={() => handleStartNavigation(delivery)}
        >
          <Text style={styles.navigateButtonText}>🧭 Navigate</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (showNavigation && selectedDelivery) {
    return (
      <NavigationScreen
        originLatitude={selectedDelivery.pharmacyCoordinates.latitude}
        originLongitude={selectedDelivery.pharmacyCoordinates.longitude}
        destinationLatitude={selectedDelivery.userCoordinates.latitude}
        destinationLongitude={selectedDelivery.userCoordinates.longitude}
        originLabel={selectedDelivery.pharmacyLocation}
        destinationLabel={selectedDelivery.userLocation}
        userType={userType}
        onClose={() => setShowNavigation(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getUserTypeColor() }]}>
        <Text style={styles.headerTitle}>📦 Delivery Tracking</Text>
        <Text style={styles.headerSubtitle}>{deliveries.length} active deliveries</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'active', 'completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab && { color: getUserTypeColor(), fontWeight: '700' },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Deliveries List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getUserTypeColor()} />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      ) : filteredDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No {filter === 'all' ? 'deliveries' : filter + ' deliveries'} found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadDeliveries}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#e3f2fd',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  deliveryDetails: {
    marginBottom: 10,
  },
  locationRow: {
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2c3e50',
  },
  driverRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  driverLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  etaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  etaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  navigateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  navigateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
