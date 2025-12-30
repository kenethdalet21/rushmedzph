import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import TabBar from './TabBar';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ordersAPI, driversAPI } from '../services/api';
import type { Order } from '../types';

const tabs = [
  { id: 'active', title: 'Active', icon: '🚗' },
  { id: 'available', title: 'Available', icon: '📦' },
  { id: 'earnings', title: 'Earnings', icon: '💰' },
  { id: 'history', title: 'History', icon: '📋' },
  { id: 'profile', title: 'Profile', icon: '👤' },
];

interface DeliveryWithDetails extends Order {
  pickupAddress?: string;
  distance?: number;
  estimatedTime?: number;
  deliveryFee?: number;
}

interface EarningsData {
  today: number;
  week: number;
  month: number;
  totalDeliveries: number;
  avgPerDelivery: number;
  breakdown: {
    date: string;
    amount: number;
    deliveries: number;
  }[];
}

export default function DriverAppEnhanced() {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0,
    totalDeliveries: 0,
    avgPerDelivery: 0,
    breakdown: [],
  });
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  const driverId = 'driver-1'; // Replace with actual driver ID

  useEffect(() => {
    loadData();
  }, [activeTab, isOnline]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock active deliveries
      const mockActive: DeliveryWithDetails[] = [
        {
          id: 'order-1',
          userId: 'user-1',
          merchantId: 'merchant-1',
          driverId,
          items: [{ productId: '1', quantity: 2, price: 5.99 }],
          status: 'picked_up',
          totalAmount: 11.98,
          currency: 'PHP',
          address: '123 Main St, Quezon City',
          pickupAddress: 'Mercury Drug, SM North',
          distance: 2.5,
          estimatedTime: 15,
          deliveryFee: 50,
          paymentMethod: 'gcash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Mock available deliveries
      const mockAvailable: DeliveryWithDetails[] = [
        {
          id: 'order-2',
          userId: 'user-2',
          merchantId: 'merchant-1',
          items: [{ productId: '2', quantity: 1, price: 12.50 }],
          status: 'accepted',
          totalAmount: 12.50,
          currency: 'PHP',
          address: '456 Oak Ave, Makati',
          pickupAddress: 'Watsons, Ayala',
          distance: 3.2,
          estimatedTime: 20,
          deliveryFee: 65,
          paymentMethod: 'cod',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'order-3',
          userId: 'user-3',
          merchantId: 'merchant-2',
          items: [{ productId: '3', quantity: 3, price: 8.99 }],
          status: 'accepted',
          totalAmount: 26.97,
          currency: 'PHP',
          address: '789 Pine Rd, Pasig',
          pickupAddress: 'SouthStar Drug, Ortigas',
          distance: 1.8,
          estimatedTime: 12,
          deliveryFee: 45,
          paymentMethod: 'gcash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Mock completed deliveries
      const mockCompleted: Order[] = [
        {
          id: 'order-100',
          userId: 'user-10',
          merchantId: 'merchant-1',
          driverId,
          items: [{ productId: '1', quantity: 1, price: 5.99 }],
          status: 'delivered',
          totalAmount: 5.99,
          currency: 'PHP',
          address: '111 Test St',
          paymentMethod: 'gcash',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Mock earnings data
      const mockEarnings: EarningsData = {
        today: 125.50,
        week: 890.25,
        month: 3456.80,
        totalDeliveries: 45,
        avgPerDelivery: 76.82,
        breakdown: [
          { date: '2025-11-28', amount: 125.50, deliveries: 3 },
          { date: '2025-11-27', amount: 210.75, deliveries: 5 },
          { date: '2025-11-26', amount: 180.00, deliveries: 4 },
          { date: '2025-11-25', amount: 165.50, deliveries: 4 },
          { date: '2025-11-24', amount: 208.50, deliveries: 5 },
        ],
      };

      setActiveDeliveries(mockActive);
      setAvailableDeliveries(isOnline ? mockAvailable : []);
      setCompletedDeliveries(mockCompleted);
      setEarnings(mockEarnings);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      // await ordersAPI.assignDriver(orderId, driverId);
      // await ordersAPI.updateStatus(orderId, 'picked_up');
      Alert.alert('Success', 'Delivery accepted! Navigate to pickup location.');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept delivery');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      // await ordersAPI.updateStatus(orderId, status);
      Alert.alert('Success', `Delivery status updated to ${status}`);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCompleteDelivery = async (orderId: string, deliveryFee: number) => {
    try {
      // await ordersAPI.updateStatus(orderId, 'delivered');
      // await driversAPI.updateEarnings(driverId, deliveryFee);
      Alert.alert('Success', `Delivery completed! Earned ₱${deliveryFee.toFixed(2)}`);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete delivery');
    }
  };

  const renderActiveDeliveries = () => (
    <View style={styles.content}>
      <View style={styles.statusHeader}>
        <Text style={styles.sectionTitle}>Active Deliveries ({activeDeliveries.length})</Text>
        <View style={styles.onlineToggle}>
          <Text style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#E74C3C', true: '#27AE60' }}
          />
        </View>
      </View>

      {activeDeliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyText}>No active deliveries</Text>
          <TouchableOpacity
            style={styles.viewAvailableButton}
            onPress={() => setActiveTab('available')}
          >
            <Text style={styles.viewAvailableText}>View Available Orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        activeDeliveries.map(delivery => (
          <View key={delivery.id} style={styles.activeDeliveryCard}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryId}>#{delivery.id.slice(0, 8)}</Text>
              <Text style={[styles.deliveryStatus, { color: '#9B59B6' }]}>
                {delivery.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.deliveryRoute}>
              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>📍</Text>
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.routeAddress}>{delivery.pickupAddress}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>🏠</Text>
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Dropoff</Text>
                  <Text style={styles.routeAddress}>{delivery.address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.deliveryInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📏</Text>
                <Text style={styles.infoText}>{delivery.distance} km</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏱️</Text>
                <Text style={styles.infoText}>{delivery.estimatedTime} min</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💰</Text>
                <Text style={styles.infoText}>₱{delivery.deliveryFee?.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.deliveryActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
                onPress={() => Alert.alert('Navigation', 'Opening Google Maps...')}
              >
                <Text style={styles.actionButtonText}>🗺️ Navigate</Text>
              </TouchableOpacity>
              {delivery.status === 'picked_up' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#27AE60' }]}
                  onPress={() => handleCompleteDelivery(delivery.id, delivery.deliveryFee || 0)}
                >
                  <Text style={styles.actionButtonText}>✓ Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAvailableDeliveries = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Available Orders ({availableDeliveries.length})</Text>

      {!isOnline ? (
        <View style={styles.offlineState}>
          <Text style={styles.offlineIcon}>😴</Text>
          <Text style={styles.offlineText}>You're offline</Text>
          <Text style={styles.offlineSubtext}>Go online to see available deliveries</Text>
        </View>
      ) : availableDeliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No available orders nearby</Text>
        </View>
      ) : (
        availableDeliveries.map(delivery => (
          <View key={delivery.id} style={styles.availableDeliveryCard}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryId}>#{delivery.id.slice(0, 8)}</Text>
              <Text style={styles.deliveryFee}>₱{delivery.deliveryFee?.toFixed(2)}</Text>
            </View>

            <View style={styles.routePreview}>
              <Text style={styles.routePreviewText}>
                {delivery.pickupAddress} → {delivery.address}
              </Text>
            </View>

            <View style={styles.deliveryInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📏</Text>
                <Text style={styles.infoText}>{delivery.distance} km away</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏱️</Text>
                <Text style={styles.infoText}>~{delivery.estimatedTime} min</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💳</Text>
                <Text style={styles.infoText}>{delivery.paymentMethod.toUpperCase()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptDelivery(delivery.id)}
            >
              <Text style={styles.acceptButtonText}>Accept Delivery</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderEarnings = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Earnings Overview</Text>

      <View style={styles.earningsGrid}>
        <View style={[styles.earningCard, { backgroundColor: '#27AE60' }]}>
          <Text style={styles.earningLabel}>Today</Text>
          <Text style={styles.earningAmount}>₱{earnings.today.toFixed(2)}</Text>
        </View>
        <View style={[styles.earningCard, { backgroundColor: '#3498DB' }]}>
          <Text style={styles.earningLabel}>This Week</Text>
          <Text style={styles.earningAmount}>₱{earnings.week.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.earningsGrid}>
        <View style={[styles.earningCard, { backgroundColor: '#9B59B6' }]}>
          <Text style={styles.earningLabel}>This Month</Text>
          <Text style={styles.earningAmount}>₱{earnings.month.toFixed(2)}</Text>
        </View>
        <View style={[styles.earningCard, { backgroundColor: '#F39C12' }]}>
          <Text style={styles.earningLabel}>Avg/Delivery</Text>
          <Text style={styles.earningAmount}>₱{earnings.avgPerDelivery.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Performance Stats</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Deliveries:</Text>
          <Text style={styles.statValue}>{earnings.totalDeliveries}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Success Rate:</Text>
          <Text style={styles.statValue}>96%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Avg Rating:</Text>
          <Text style={styles.statValue}>4.8 ⭐</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Earnings</Text>
      {earnings.breakdown.map(day => (
        <View key={day.date} style={styles.earningHistoryCard}>
          <View>
            <Text style={styles.earningDate}>{new Date(day.date).toLocaleDateString()}</Text>
            <Text style={styles.earningDeliveries}>{day.deliveries} deliveries</Text>
          </View>
          <Text style={styles.earningHistoryAmount}>₱{day.amount.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Delivery History</Text>

      {completedDeliveries.map(delivery => (
        <View key={delivery.id} style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyId}>#{delivery.id.slice(0, 8)}</Text>
            <Text style={[styles.historyStatus, { color: '#27AE60' }]}>DELIVERED</Text>
          </View>
          <Text style={styles.historyAddress}>{delivery.address}</Text>
          <View style={styles.historyFooter}>
            <Text style={styles.historyDate}>
              {new Date(delivery.updatedAt).toLocaleDateString()}
            </Text>
            <Text style={styles.historyAmount}>₱{delivery.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderProfile = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Driver Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'DR'}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'Driver'}</Text>
        <Text style={styles.profilePhone}>{user?.phone || ''}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleTitle}>Vehicle Information</Text>
        <Text style={styles.vehicleInfo}>🏍️ Motorcycle</Text>
        <Text style={styles.vehicleInfo}>License: ABC-1234</Text>
        <Text style={styles.vehicleInfo}>Model: Honda Wave 110</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'active':
        return renderActiveDeliveries();
      case 'available':
        return renderAvailableDeliveries();
      case 'earnings':
        return renderEarnings();
      case 'history':
        return renderHistory();
      case 'profile':
        return renderProfile();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#27AE60' : '#E74C3C' }]}>
          <Text style={styles.statusBadgeText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        {renderContent()}
      </ScrollView>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        color="#45B7D1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  onlineToggle: { flexDirection: 'row', alignItems: 'center' },
  onlineLabel: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginRight: 10 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#7F8C8D', marginBottom: 20 },
  viewAvailableButton: {
    backgroundColor: '#45B7D1',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  viewAvailableText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  offlineState: { alignItems: 'center', marginTop: 50 },
  offlineIcon: { fontSize: 60, marginBottom: 20 },
  offlineText: { fontSize: 18, fontWeight: 'bold', color: '#E74C3C', marginBottom: 10 },
  offlineSubtext: { fontSize: 14, color: '#7F8C8D' },
  activeDeliveryCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#45B7D1',
  },
  availableDeliveryCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deliveryId: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  deliveryStatus: { fontSize: 14, fontWeight: 'bold' },
  deliveryFee: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },
  deliveryRoute: { marginBottom: 15 },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  routeIcon: { fontSize: 20, marginRight: 10 },
  routeDetails: { flex: 1 },
  routeLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 2 },
  routeAddress: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#BDC3C7',
    marginLeft: 10,
    marginVertical: 2,
  },
  routePreview: { marginBottom: 10 },
  routePreviewText: { fontSize: 14, color: '#7F8C8D', lineHeight: 20 },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECF0F1',
    marginBottom: 10,
  },
  infoItem: { alignItems: 'center' },
  infoIcon: { fontSize: 16, marginBottom: 5 },
  infoText: { fontSize: 12, color: '#2C3E50', fontWeight: '500' },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: '#45B7D1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  earningCard: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  earningLabel: { fontSize: 14, color: '#FFF', marginBottom: 8 },
  earningAmount: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  statsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: { fontSize: 14, color: '#7F8C8D' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  earningHistoryCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  earningDate: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
  earningDeliveries: { fontSize: 12, color: '#7F8C8D' },
  earningHistoryAmount: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },
  historyCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyId: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  historyStatus: { fontSize: 12, fontWeight: 'bold' },
  historyAddress: { fontSize: 14, color: '#7F8C8D', marginBottom: 8 },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDate: { fontSize: 12, color: '#7F8C8D' },
  historyAmount: { fontSize: 14, fontWeight: 'bold', color: '#45B7D1' },
  profileCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#45B7D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileAvatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
  profileEmail: { fontSize: 14, color: '#7F8C8D', marginBottom: 5 },
  profilePhone: { fontSize: 14, color: '#7F8C8D' },
  vehicleCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  vehicleTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  vehicleInfo: { fontSize: 14, color: '#2C3E50', marginBottom: 8 },
  logoutButton: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
