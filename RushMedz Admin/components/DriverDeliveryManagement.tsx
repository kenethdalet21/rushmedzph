import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import NavigationScreen from './NavigationScreen';
import * as Maps from '../services/maps';

interface DeliveryOrder {
  id: string;
  orderId: string;
  userPhone: string;
  userName: string;
  userLocation: string;
  pharmacyLocation: string;
  pharmacyCoordinates: Maps.Coordinates;
  userCoordinates: Maps.Coordinates;
  medicineList: string[];
  status: 'assigned' | 'accepted' | 'picked-up' | 'delivering' | 'delivered';
  priority: 'normal' | 'urgent' | 'express';
  assignedAt: string;
  pickupTime?: string;
  deliveryTime?: string;
}

interface DriverStats {
  totalDeliveries: number;
  completedToday: number;
  activeDeliveries: number;
  earnings: number;
  rating: number;
}

export default function DriverDeliveryManagement() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    totalDeliveries: 0,
    completedToday: 0,
    activeDeliveries: 0,
    earnings: 0,
    rating: 4.8,
  });
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Maps.Coordinates>({
    latitude: 14.5995,
    longitude: 120.9842,
  });

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = () => {
    setLoading(true);
    setTimeout(() => {
      const mockDeliveries: DeliveryOrder[] = [
        {
          id: 'DRV001',
          orderId: 'ORD001',
          userPhone: '09123456789',
          userName: 'Juan Dela Cruz',
          userLocation: 'Manila City, Philippines',
          pharmacyLocation: 'SM Mall of Asia Pharmacy',
          pharmacyCoordinates: { latitude: 14.5515, longitude: 120.9881 },
          userCoordinates: { latitude: 14.5995, longitude: 120.9842 },
          medicineList: ['Aspirin 500mg', 'Vitamin C 1000mg'],
          status: 'picked-up',
          priority: 'normal',
          assignedAt: new Date(Date.now() - 1800000).toISOString(),
          pickupTime: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: 'DRV002',
          orderId: 'ORD002',
          userPhone: '09198765432',
          userName: 'Maria Santos',
          userLocation: 'Quezon City, Philippines',
          pharmacyLocation: 'Puregold QC Pharmacy',
          pharmacyCoordinates: { latitude: 14.6349, longitude: 121.0388 },
          userCoordinates: { latitude: 14.6500, longitude: 121.0600 },
          medicineList: ['Paracetamol 500mg x2', 'Antibiotic ointment'],
          status: 'accepted',
          priority: 'urgent',
          assignedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'DRV003',
          orderId: 'ORD003',
          userPhone: '09111111111',
          userName: 'Pedro Garcia',
          userLocation: 'Pasig City, Philippines',
          pharmacyLocation: 'Watsons Pasig Pharmacy',
          pharmacyCoordinates: { latitude: 14.5790, longitude: 121.5598 },
          userCoordinates: { latitude: 14.5900, longitude: 121.5700 },
          medicineList: ['Blood pressure monitor'],
          status: 'delivered',
          priority: 'normal',
          assignedAt: new Date(Date.now() - 7200000).toISOString(),
          deliveryTime: new Date(Date.now() - 300000).toISOString(),
        },
      ];

      setDeliveries(mockDeliveries);
      setStats({
        totalDeliveries: 24,
        completedToday: 8,
        activeDeliveries: 2,
        earnings: 2400,
        rating: 4.8,
      });
      setLoading(false);
    }, 800);
  };

  const handleStartDelivery = (delivery: DeliveryOrder) => {
    Alert.alert('Start Delivery', `Ready to deliver to ${delivery.userName}?`, [
      {
        text: 'Start Navigation',
        onPress: () => {
          updateDeliveryStatus(delivery.id, 'delivering');
          setSelectedDelivery(delivery);
          setShowNavigation(true);
        },
      },
      {
        text: 'Pick Up First',
        onPress: () => {
          Alert.alert('Pickup Required', 'Please pick up the medicine from the pharmacy first.');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCompleteDelivery = (delivery: DeliveryOrder) => {
    Alert.alert('Delivery Complete?', `Mark delivery to ${delivery.userName} as complete?`, [
      {
        text: 'Confirm',
        onPress: () => {
          updateDeliveryStatus(delivery.id, 'delivered');
          Alert.alert('Success', '✅ Delivery marked as complete!');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const updateDeliveryStatus = (deliveryId: string, newStatus: DeliveryOrder['status']) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: newStatus,
              deliveryTime: newStatus === 'delivered' ? new Date().toISOString() : d.deliveryTime,
            }
          : d
      )
    );
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      normal: '#3498db',
      urgent: '#e74c3c',
      express: '#e67e22',
    };
    return colors[priority] || '#95a5a6';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      assigned: '#95a5a6',
      accepted: '#f39c12',
      'picked-up': '#3498db',
      delivering: '#e67e22',
      delivered: '#27ae60',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      assigned: '📋',
      accepted: '✋',
      'picked-up': '📦',
      delivering: '🚗',
      delivered: '✅',
    };
    return icons[status] || '📍';
  };

  if (showNavigation && selectedDelivery) {
    return (
      <NavigationScreen
        originLatitude={selectedDelivery.pharmacyCoordinates.latitude}
        originLongitude={selectedDelivery.pharmacyCoordinates.longitude}
        destinationLatitude={selectedDelivery.userCoordinates.latitude}
        destinationLongitude={selectedDelivery.userCoordinates.longitude}
        originLabel={selectedDelivery.pharmacyLocation}
        destinationLabel={`${selectedDelivery.userName} - ${selectedDelivery.userLocation}`}
        userType="driver"
        onClose={() => setShowNavigation(false)}
      />
    );
  }

  const activeDeliveries = deliveries.filter((d) => !['delivered'].includes(d.status));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Delivery Dashboard</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeDeliveries}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₱{stats.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.rating}⭐</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Current Location Info */}
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 Current Location</Text>
        <Text style={styles.coordinateText}>
          {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
        </Text>
        <Text style={styles.locationHint}>Location updates every 30 seconds</Text>
      </View>

      {/* Active Deliveries Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Active Deliveries ({activeDeliveries.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
        ) : activeDeliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>All deliveries completed!</Text>
          </View>
        ) : (
          activeDeliveries.map((delivery) => (
            <View key={delivery.id} style={styles.deliveryCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.orderId}>#{delivery.orderId}</Text>
                  <View
                    style={[styles.priorityBadge, { backgroundColor: getPriorityColor(delivery.priority) }]}
                  >
                    <Text style={styles.priorityText}>{delivery.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(delivery.status)}</Text>
                  <Text style={styles.statusText}>{delivery.status.toUpperCase().replace('-', ' ')}</Text>
                </View>
              </View>

              {/* Recipient Info */}
              <View style={styles.recipientCard}>
                <Text style={styles.recipientName}>👤 {delivery.userName}</Text>
                <Text style={styles.recipientPhone}>📱 {delivery.userPhone}</Text>
              </View>

              {/* Locations */}
              <View style={styles.locationsSection}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>From (Pickup):</Text>
                  <Text style={styles.locationText}>{delivery.pharmacyLocation}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>↓</Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>To (Delivery):</Text>
                  <Text style={styles.locationText}>{delivery.userLocation}</Text>
                </View>
              </View>

              {/* Medicines List */}
              {delivery.medicineList.length > 0 && (
                <View style={styles.medicinesCard}>
                  <Text style={styles.medicinesTitle}>💊 Items:</Text>
                  {delivery.medicineList.map((medicine, index) => (
                    <Text key={index} style={styles.medicineItem}>
                      • {medicine}
                    </Text>
                  ))}
                </View>
              )}

              {/* Distance & ETA */}
              <View style={styles.etaCard}>
                <Text style={styles.etaText}>
                  📏 Distance: {Maps.formatDistance(Maps.calculateDistance(delivery.pharmacyCoordinates, delivery.userCoordinates))}
                </Text>
                <Text style={styles.etaText}>
                  ⏱️ ETA: {Maps.calculateETA(Maps.calculateDistance(delivery.pharmacyCoordinates, delivery.userCoordinates) / 60)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {delivery.status === 'picked-up' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.navigateButton]}
                    onPress={() => handleStartDelivery(delivery)}
                  >
                    <Text style={styles.actionButtonText}>🧭 Navigate to Customer</Text>
                  </TouchableOpacity>
                )}

                {delivery.status === 'delivering' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteDelivery(delivery)}
                  >
                    <Text style={styles.actionButtonText}>✅ Mark as Delivered</Text>
                  </TouchableOpacity>
                )}

                {delivery.status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.pickupButton]}
                    onPress={() => {
                      updateDeliveryStatus(delivery.id, 'picked-up');
                      Alert.alert('Success', '✅ Medicine picked up! Ready for delivery.');
                    }}
                  >
                    <Text style={styles.actionButtonText}>📦 Confirm Pickup</Text>
                  </TouchableOpacity>
                )}

                {(delivery.status === 'assigned' || delivery.status === 'accepted') && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => {
                      if (delivery.status === 'assigned') {
                        updateDeliveryStatus(delivery.id, 'accepted');
                        Alert.alert('Success', '✅ Delivery accepted!');
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>
                      {delivery.status === 'assigned' ? '✋ Accept Delivery' : '→ View Details'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Completed Deliveries Preview */}
      {deliveries.filter((d) => d.status === 'delivered').length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Completed Today</Text>
          <Text style={styles.completedCount}>
            {deliveries.filter((d) => d.status === 'delivered').length} deliveries
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#3498db',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  locationCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  coordinateText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#3498db',
    marginBottom: 4,
  },
  locationHint: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  recipientCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: 12,
    color: '#3498db',
  },
  locationsSection: {
    marginBottom: 10,
  },
  locationItem: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrow: {
    fontSize: 18,
    color: '#bdc3c7',
    fontWeight: 'bold',
  },
  medicinesCard: {
    backgroundColor: '#fef5e7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  medicinesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d68910',
    marginBottom: 6,
  },
  medicineItem: {
    fontSize: 12,
    color: '#7d6608',
    marginBottom: 3,
  },
  etaCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  etaText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 4,
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  navigateButton: {
    backgroundColor: '#3498db',
  },
  completeButton: {
    backgroundColor: '#27ae60',
  },
  pickupButton: {
    backgroundColor: '#e67e22',
  },
  acceptButton: {
    backgroundColor: '#9b59b6',
  },
  completedCount: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '600',
  },
});
