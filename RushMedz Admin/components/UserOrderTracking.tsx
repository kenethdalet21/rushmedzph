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
  Linking,
} from 'react-native';
import NavigationScreen from './NavigationScreen';
import * as Maps from '../services/maps';

interface OrderWithDelivery {
  id: string;
  orderId: string;
  medicines: string[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  driverCoordinates?: Maps.Coordinates;
  deliveryCoordinates?: Maps.Coordinates;
  deliveryLocation?: string;
  pharmacyCoordinates?: Maps.Coordinates;
  pharmacyLocation?: string;
}

interface UserOrderStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
}

export default function UserOrderTracking() {
  const [orders, setOrders] = useState<OrderWithDelivery[]>([]);
  const [stats, setStats] = useState<UserOrderStats>({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDelivery | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    setTimeout(() => {
      const mockOrders: OrderWithDelivery[] = [
        {
          id: 'USR001',
          orderId: 'ORD001',
          medicines: ['Paracetamol 500mg x10', 'Vitamin C 1000mg x5'],
          totalAmount: 250,
          status: 'in-transit',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          estimatedDelivery: Maps.calculateETA(15),
          driverName: 'John Driver',
          driverPhone: '+639123456789',
          driverRating: 4.8,
          driverCoordinates: { latitude: 14.5950, longitude: 120.9880 },
          deliveryCoordinates: { latitude: 14.5995, longitude: 120.9842 },
          deliveryLocation: 'Manila City, Philippines',
          pharmacyCoordinates: { latitude: 14.5515, longitude: 120.9881 },
          pharmacyLocation: 'SM Mall of Asia Pharmacy',
        },
        {
          id: 'USR002',
          orderId: 'ORD002',
          medicines: ['Ibuprofen 200mg x20', 'Antacid tablets x10'],
          totalAmount: 180,
          status: 'confirmed',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          pharmacyCoordinates: { latitude: 14.6349, longitude: 121.0388 },
          pharmacyLocation: 'Puregold QC Pharmacy',
          deliveryCoordinates: { latitude: 14.6500, longitude: 121.0600 },
          deliveryLocation: 'Quezon City, Philippines',
        },
        {
          id: 'USR003',
          orderId: 'ORD003',
          medicines: ['Blood pressure monitor', 'Thermometer'],
          totalAmount: 1200,
          status: 'delivered',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          estimatedDelivery: 'Delivered',
          driverName: 'Maria Driver',
          driverPhone: '+639198765432',
          driverRating: 4.9,
          pharmacyCoordinates: { latitude: 14.5790, longitude: 121.5598 },
          pharmacyLocation: 'Watsons Pasig Pharmacy',
          deliveryCoordinates: { latitude: 14.5900, longitude: 121.5700 },
          deliveryLocation: 'Pasig City, Philippines',
        },
      ];

      setOrders(mockOrders);
      setStats({
        totalOrders: 12,
        activeOrders: 1,
        completedOrders: 11,
        totalSpent: 3450,
      });
      setLoading(false);
    }, 800);
  };

  const handleTrackDelivery = (order: OrderWithDelivery) => {
    if (order.status !== 'in-transit' || !order.driverCoordinates || !order.deliveryCoordinates) {
      Alert.alert('Tracking Unavailable', 'Delivery tracking will be available when the driver starts navigation.');
      return;
    }
    setSelectedOrder(order);
    setShowNavigation(true);
  };

  const handleContactDriver = (driverPhone?: string) => {
    if (!driverPhone) {
      Alert.alert('Driver Information', 'Driver contact information is not yet available.');
      return;
    }
    Alert.alert('Contact Driver', `Call ${driverPhone}?`, [
      {
        text: 'Call',
        onPress: () => Linking.openURL(`tel:${driverPhone}`),
      },
      {
        text: 'SMS',
        onPress: () => Linking.openURL(`sms:${driverPhone}`),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      ready: '#2ecc71',
      assigned: '#e67e22',
      'in-transit': '#e74c3c',
      delivered: '#27ae60',
      cancelled: '#95a5a6',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✓',
      processing: '⚙️',
      ready: '📦',
      assigned: '🚗',
      'in-transit': '🚗💨',
      delivered: '✅',
      cancelled: '❌',
    };
    return icons[status] || '📍';
  };

  const getStatusMessage = (order: OrderWithDelivery): string => {
    const messages: Record<string, string> = {
      pending: 'Waiting for pharmacy confirmation...',
      confirmed: 'Pharmacy is preparing your medicines...',
      processing: 'Processing your order...',
      ready: 'Order is ready for pickup! Driver will arrive soon.',
      assigned: 'Driver has been assigned to your order',
      'in-transit': `Driver is on the way - ETA ${order.estimatedDelivery}`,
      delivered: '✅ Order delivered successfully',
      cancelled: '❌ Order was cancelled',
    };
    return messages[order.status] || 'Checking status...';
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return !['delivered', 'cancelled'].includes(o.status);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  if (showNavigation && selectedOrder && selectedOrder.driverCoordinates && selectedOrder.deliveryCoordinates) {
    return (
      <NavigationScreen
        originLatitude={selectedOrder.driverCoordinates.latitude}
        originLongitude={selectedOrder.driverCoordinates.longitude}
        destinationLatitude={selectedOrder.deliveryCoordinates.latitude}
        destinationLongitude={selectedOrder.deliveryCoordinates.longitude}
        originLabel={`Driver - ${selectedOrder.driverName || 'Driver'}`}
        destinationLabel={selectedOrder.deliveryLocation || 'Your Location'}
        userType="user"
        onClose={() => setShowNavigation(false)}
      />
    );
  }

  const renderOrderItem = ({ item: order }: { item: OrderWithDelivery }) => (
    <View style={[styles.orderCard, { borderLeftColor: getStatusColor(order.status) }]}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
            <Text style={styles.statusText}>{order.status.toUpperCase().replace('-', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.amount}>₱{order.totalAmount}</Text>
      </View>

      {/* Status Message */}
      <Text style={styles.statusMessage}>{getStatusMessage(order)}</Text>

      {/* Medicines List */}
      <View style={styles.medicinesSection}>
        <Text style={styles.medicinesLabel}>💊 Items ({order.medicines.length}):</Text>
        {order.medicines.map((medicine, index) => (
          <Text key={index} style={styles.medicineItem}>
            • {medicine}
          </Text>
        ))}
      </View>

      {/* Locations */}
      {order.pharmacyLocation && (
        <View style={styles.locationsSection}>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>From:</Text>
            <Text style={styles.locationValue}>{order.pharmacyLocation}</Text>
          </View>
          {order.deliveryLocation && (
            <>
              <Text style={styles.arrow}>↓</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>To:</Text>
                <Text style={styles.locationValue}>{order.deliveryLocation}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Driver Info */}
      {order.driverName && (
        <View style={styles.driverSection}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>🚗 {order.driverName}</Text>
            {order.driverRating && <Text style={styles.driverRating}>⭐ {order.driverRating}</Text>}
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleContactDriver(order.driverPhone)}
            >
              <Text style={styles.callButtonText}>☎️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smsButton}
              onPress={() => handleContactDriver(order.driverPhone)}
            >
              <Text style={styles.smsButtonText}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ETA */}
      {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <View style={styles.etaCard}>
          <Text style={styles.etaText}>⏱️ Estimated Delivery: {order.estimatedDelivery}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {order.status === 'in-transit' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.trackButton]}
            onPress={() => handleTrackDelivery(order)}
          >
            <Text style={styles.actionButtonText}>🗺️ Track Delivery</Text>
          </TouchableOpacity>
        )}

        {['confirmed', 'processing', 'ready'].includes(order.status) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.infoButton]}
            onPress={() =>
              Alert.alert(
                'Order Status',
                'Your order is being processed. You will be notified when the driver is assigned.'
              )
            }
          >
            <Text style={styles.actionButtonText}>ℹ️ Order Status</Text>
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => Alert.alert('Order Details', 'This order was delivered successfully!')}
          >
            <Text style={styles.actionButtonText}>✅ Delivered</Text>
          </TouchableOpacity>
        )}

        {order.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pendingButton]}
            onPress={() => Alert.alert('Pending', 'Waiting for pharmacy confirmation...')}
          >
            <Text style={styles.actionButtonText}>⏳ Pending</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 My Orders</Text>
        <Text style={styles.headerSubtitle}>{stats.totalOrders} total orders</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{stats.activeOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{stats.completedOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValue}>₱{stats.totalSpent}</Text>
        </View>
      </ScrollView>

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
                filter === tab && { color: '#27ae60', fontWeight: '700' },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27ae60" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No {filter === 'all' ? 'orders' : filter + ' orders'} found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          refreshing={loading}
          onRefresh={loadOrders}
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
    backgroundColor: '#27ae60',
    paddingTop: 16,
    paddingBottom: 12,
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
  statsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
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
    backgroundColor: '#e8f5e9',
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
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
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
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  statusMessage: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  medicinesSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  medicinesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  medicineItem: {
    fontSize: 11,
    color: '#34495e',
    marginBottom: 3,
  },
  locationsSection: {
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
    fontSize: 12,
    fontWeight: '500',
    color: '#2c3e50',
  },
  arrow: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 14,
    marginVertical: 2,
  },
  driverSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 11,
    color: '#1565c0',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#1565c0',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 16,
  },
  smsButton: {
    backgroundColor: '#0d47a1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsButtonText: {
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  trackButton: {
    backgroundColor: '#27ae60',
  },
  infoButton: {
    backgroundColor: '#3498db',
  },
  completeButton: {
    backgroundColor: '#95a5a6',
  },
  pendingButton: {
    backgroundColor: '#f39c12',
  },
});
