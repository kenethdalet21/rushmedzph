import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Pressable,
} from 'react-native';
import TabBar from './TabBar';
import { eventBus } from '../services/eventBus';
import { DriverAuthProvider, useDriverAuth } from '../contexts/DriverAuthContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import DriverLogin from './DriverLogin';
import DriverSignup from './DriverSignup';
import { ordersAPI, driversAPI } from '../services/api';
import { openGoogleMaps } from '../services/maps';
import type { Order } from '../types';
import { fetchDriverUsers } from './api/driverApi';
import { login } from './api/authApi';
import { setToken } from './api/tokenStorage';

const tabs = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'active', title: 'Active', icon: '🚗' },
  { id: 'available', title: 'Available', icon: '📦' },
  { id: 'earnings', title: 'Earnings', icon: '💰' },
  { id: 'history', title: 'History', icon: '📋' },
  { id: 'support', title: 'Support', icon: '🛟' },
  { id: 'profile', title: 'Profile', icon: '👤' },
  { id: 'logout', title: 'Logout', icon: '🚪' },
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

function DriverAppContent() {
  const { user, loading, signOut } = useDriverAuth();
  const { switchRole, switchingRoles } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [driverUsers, setDriverUsers] = useState([]);
  const [loginError, setLoginError] = useState<string | null>(null);
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
  const [dataLoading, setDataLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState({
    type: 'Motorcycle',
    license: 'ABC-1234',
    model: 'Honda Wave 110',
    color: 'Black',
    year: '2023',
    fuelLevel: 75,
    maintenance: 'Good',
  });
  const [driverStats, setDriverStats] = useState({
    rating: 4.8,
    totalTrips: 156,
    completionRate: 98,
    onTimeRate: 95,
    customerRating: 4.7,
    responseTime: '2.5 min',
  });
  const [todayStats, setTodayStats] = useState({
    trips: 3,
    earnings: 125.50,
    distance: 12.5,
    hours: 3.5,
  });

  const driverId = user?.id || 'driver-1';
  const driverName = user?.name || 'Driver';
  
  // Data loader (function declaration so we can call before definition if needed)
  async function loadData() {
    setDataLoading(true);
    try {
      // Mock notifications
      const mockNotifications = [
        {
          icon: '📦',
          message: 'New order available in your area',
          time: '5 min ago',
        },
        {
          icon: '⭐',
          message: 'You received a 5-star rating!',
          time: '1 hour ago',
        },
        {
          icon: '💰',
          message: 'Weekly earnings deposited to your account',
          time: '3 hours ago',
        },
      ];

      // Mock active deliveries with merchant and user details
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
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setDataLoading(false);
    }
  }

  // Always run hooks in consistent order
  useEffect(() => {
    loadData();
    
    // Subscribe to order ready for pickup from MerchantApp
    const unsubOrderReady = eventBus.subscribe('orderReadyForPickup', (payload) => {
      console.log('DriverApp: Order ready for pickup', payload);
      // Add notification
      setNotifications(prev => [{
        icon: '📦',
        message: `New order ready for pickup: #${payload.orderId?.slice(0, 8)}`,
        time: 'Just now',
      }, ...prev.slice(0, 4)]);
      // Refresh available deliveries to include new order
      loadData();
    });
    
    // Subscribe to new orders placed by UserApp
    const unsubOrderPlaced = eventBus.subscribe('orderPlaced', (payload) => {
      console.log('DriverApp: New order placed', payload);
      if (payload.order?.status === 'accepted' || payload.order?.status === 'picked_up') {
        // Add to available deliveries if driver is online
        if (isOnline) {
          setNotifications(prev => [{
            icon: '🆕',
            message: `New order available in your area`,
            time: 'Just now',
          }, ...prev.slice(0, 4)]);
          loadData();
        }
      }
    });
    
    // Subscribe to order status changes from MerchantApp
    const unsubOrderStatus = eventBus.subscribe('orderStatusChanged', (payload) => {
      console.log('DriverApp: Order status changed', payload);
      // Update delivery status in real-time
      setActiveDeliveries(prev => prev.map(d => 
        d.id === payload.orderId 
          ? { ...d, status: payload.status as any, updatedAt: new Date().toISOString() }
          : d
      ));
      setAvailableDeliveries(prev => prev.map(d => 
        d.id === payload.orderId 
          ? { ...d, status: payload.status as any, updatedAt: new Date().toISOString() }
          : d
      ));
    });
    
    // Subscribe to merchant accepting order
    const unsubMerchantAccept = eventBus.subscribe('merchantAcceptedOrder', (payload) => {
      console.log('DriverApp: Merchant accepted order', payload);
      setNotifications(prev => [{
        icon: '✅',
        message: `Order #${payload.orderId?.slice(0, 8)} accepted by merchant`,
        time: 'Just now',
      }, ...prev.slice(0, 4)]);
      loadData();
    });
    
    // Subscribe to user feedback
    const unsubUserFeedback = eventBus.subscribe('userRatedDriver', (payload) => {
      if (payload.driverId === driverId) {
        console.log('DriverApp: Received rating', payload);
        setNotifications(prev => [{
          icon: '⭐',
          message: `You received a ${payload.rating}-star rating!`,
          time: 'Just now',
        }, ...prev.slice(0, 4)]);
      }
    });
    
    return () => {
      unsubOrderReady();
      unsubOrderPlaced();
      unsubOrderStatus();
      unsubMerchantAccept();
      unsubUserFeedback();
    };
  }, [activeTab, isOnline, driverId]);

  useEffect(() => {
    if (user?.id) {
      eventBus.publish('driverStatusChanged', { driverId: user.id, online: isOnline });
    }
  }, [isOnline, user?.id, isOnline]);

  // Handler for back to role selector - defined before conditionals to preserve hook order
  const handleBackToRoleSelector = async () => {
    try {
      await switchRole();
    } catch (error) {
      console.error('Back to role selector failed:', error);
    }
  };

  // If switching roles, don't render anything
  if (switchingRoles) {
    console.log('DriverApp: switchingRoles is true, returning null');
    return null;
  }

  // Early returns AFTER hooks to preserve hook order
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#45B7D1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return authScreen === 'signup'
      ? <DriverSignup onSwitchToLogin={() => setAuthScreen('login')} onBackToRoleSelector={handleBackToRoleSelector} />
      : <DriverLogin onSwitchToSignup={() => setAuthScreen('signup')} onBackToRoleSelector={handleBackToRoleSelector} />;
  }

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      // Move order from available to active
      const delivery = availableDeliveries.find(d => d.id === orderId);
      if (delivery) {
        const updatedDelivery = { 
          ...delivery, 
          driverId, 
          status: 'in_transit' as any,
          updatedAt: new Date().toISOString() 
        };
        
        setAvailableDeliveries(prev => prev.filter(d => d.id !== orderId));
        setActiveDeliveries(prev => [updatedDelivery, ...prev]);
        
        // Update today's stats
        setTodayStats(prev => ({
          ...prev,
          trips: prev.trips + 1
        }));
        
        // Broadcast comprehensive events to ecosystem
        eventBus.publish('driverAcceptedOrder', { 
          orderId, 
          driverId,
          driverName: driverName || 'Driver',
          vehicleType: vehicleInfo.type,
          vehiclePlate: vehicleInfo.license,
          vehicleColor: vehicleInfo.color,
          estimatedPickupTime: '10 minutes',
          timestamp: new Date().toISOString()
        });
        eventBus.publish('orderStatusChanged', { 
          orderId, 
          status: 'in_transit',
          driverId,
          timestamp: new Date().toISOString()
        });
        eventBus.publish('orderAccepted', { 
          orderId, 
          driverId,
          timestamp: new Date().toISOString()
        });
        
        Alert.alert('Success', 'Delivery accepted! Navigate to pickup location.');
      }
    } catch (error) {
      console.error('Error accepting delivery:', error);
      Alert.alert('Error', 'Failed to accept delivery');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      // await ordersAPI.updateStatus(orderId, status);
      Alert.alert('Success', `Delivery status updated to ${status}`);
      eventBus.publish('orderStatusChanged', { orderId, status });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCompleteDelivery = async (orderId: string, deliveryFee: number) => {
    try {
      // Move order from active to completed
      const delivery = activeDeliveries.find(d => d.id === orderId);
      if (delivery) {
        const completedOrder: Order = {
          ...delivery,
          status: 'delivered',
          updatedAt: new Date().toISOString(),
        };
        
        setActiveDeliveries(prev => prev.filter(d => d.id !== orderId));
        setCompletedDeliveries(prev => [completedOrder, ...prev]);
        
        // Update earnings
        setEarnings(prev => ({
          ...prev,
          today: prev.today + deliveryFee,
          week: prev.week + deliveryFee,
          month: prev.month + deliveryFee,
          totalDeliveries: prev.totalDeliveries + 1,
          avgPerDelivery: (prev.month + deliveryFee) / (prev.totalDeliveries + 1),
        }));
        
        // Update today's stats
        setTodayStats(prev => ({
          ...prev,
          earnings: prev.earnings + deliveryFee,
          distance: prev.distance + (delivery.distance || 0)
        }));
        
        // Update driver stats
        setDriverStats(prev => ({
          ...prev,
          totalTrips: prev.totalTrips + 1
        }));
        
        // Broadcast comprehensive events to ecosystem
        eventBus.publish('orderDelivered', { 
          orderId, 
          driverId,
          driverName: driverName || 'Driver',
          deliveryFee,
          deliveryTime: new Date().toISOString(),
          userId: delivery.userId,
          merchantId: delivery.merchantId,
          timestamp: new Date().toISOString()
        });
        eventBus.publish('orderCompleted', { 
          orderId, 
          amount: deliveryFee, 
          driverId,
          completedAt: new Date().toISOString()
        });
        eventBus.publish('orderStatusChanged', { 
          orderId, 
          status: 'delivered',
          driverId,
          timestamp: new Date().toISOString()
        });
        
        // Add notification for completed delivery
        setNotifications(prev => [{
          icon: '✅',
          message: `Delivery completed! Earned ₱${deliveryFee.toFixed(2)}`,
          time: 'Just now',
        }, ...prev.slice(0, 4)]);
        
        Alert.alert('Success', `Delivery completed! Earned ₱${deliveryFee.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
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
                onPress={() => {
                  // Use sample coordinates for demo; in production, use actual delivery coordinates
                  openGoogleMaps(14.6091, 120.9824, delivery.address);
                }}
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
          <Text style={styles.profileAvatarText}>{user.name?.substring(0, 2).toUpperCase() || 'DR'}</Text>
        </View>
        <Text style={styles.profileName}>{user.name || 'Driver'}</Text>
        <Text style={styles.profilePhone}>{user.phone || ''}</Text>
        <Text style={styles.profileEmail}>{user.email || ''}</Text>
        
        <View style={styles.profileRating}>
          <Text style={styles.profileRatingLabel}>Driver Rating</Text>
          <Text style={styles.profileRatingValue}>⭐ {driverStats.rating} / 5.0</Text>
        </View>
      </View>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleTitle}>Vehicle Information</Text>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleLabel}>🏍️ Type:</Text>
          <Text style={styles.vehicleValue}>{vehicleInfo.type}</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleLabel}>📋 License:</Text>
          <Text style={styles.vehicleValue}>{vehicleInfo.license}</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleLabel}>🚗 Model:</Text>
          <Text style={styles.vehicleValue}>{vehicleInfo.model}</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleLabel}>🎨 Color:</Text>
          <Text style={styles.vehicleValue}>{vehicleInfo.color}</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleLabel}>📅 Year:</Text>
          <Text style={styles.vehicleValue}>{vehicleInfo.year}</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleLabel}>⛽ Fuel Level:</Text>
          <Text style={styles.vehicleValue}>{vehicleInfo.fuelLevel}%</Text>
        </View>
        <View style={styles.fuelBar}>
          <View style={[styles.fuelLevel, { width: `${vehicleInfo.fuelLevel}%` }]} />
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔔</Text>
          <Text style={styles.settingText}>Notification Preferences</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>🌍</Text>
          <Text style={styles.settingText}>Language & Region</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>💳</Text>
          <Text style={styles.settingText}>Payment Methods</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>📄</Text>
          <Text style={styles.settingText}>Documents & Licenses</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔐</Text>
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome back, {user.name || 'Driver'}!</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#27AE60' : '#E74C3C' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.quickStatsGrid}>
        <View style={[styles.quickStatCard, { backgroundColor: '#27AE60' }]}>
          <Text style={styles.quickStatIcon}>🚗</Text>
          <Text style={styles.quickStatValue}>{todayStats.trips}</Text>
          <Text style={styles.quickStatLabel}>Trips Today</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: '#3498DB' }]}>
          <Text style={styles.quickStatIcon}>💰</Text>
          <Text style={styles.quickStatValue}>₱{todayStats.earnings.toFixed(0)}</Text>
          <Text style={styles.quickStatLabel}>Earned Today</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: '#9B59B6' }]}>
          <Text style={styles.quickStatIcon}>📏</Text>
          <Text style={styles.quickStatValue}>{todayStats.distance} km</Text>
          <Text style={styles.quickStatLabel}>Distance</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: '#F39C12' }]}>
          <Text style={styles.quickStatIcon}>⏱️</Text>
          <Text style={styles.quickStatValue}>{todayStats.hours}h</Text>
          <Text style={styles.quickStatLabel}>Active Time</Text>
        </View>
      </View>

      <View style={styles.activeOrdersSummary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Active Deliveries</Text>
          <TouchableOpacity onPress={() => setActiveTab('active')}>
            <Text style={styles.summaryViewAll}>View All ›</Text>
          </TouchableOpacity>
        </View>
        {activeDeliveries.length === 0 ? (
          <View style={styles.noActiveOrders}>
            <Text style={styles.noActiveText}>No active deliveries</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => setActiveTab('available')}
            >
              <Text style={styles.browseButtonText}>Browse Available Orders</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeDeliveries.slice(0, 2).map(delivery => (
            <TouchableOpacity 
              key={delivery.id} 
              style={styles.miniDeliveryCard}
              onPress={() => setActiveTab('active')}
            >
              <View style={styles.miniDeliveryHeader}>
                <Text style={styles.miniDeliveryId}>#{delivery.id.slice(0, 8)}</Text>
                <Text style={styles.miniDeliveryFee}>₱{delivery.deliveryFee?.toFixed(2)}</Text>
              </View>
              <Text style={styles.miniDeliveryRoute} numberOfLines={1}>
                {delivery.pickupAddress} → {delivery.address}
              </Text>
              <View style={styles.miniDeliveryFooter}>
                <Text style={styles.miniDeliveryInfo}>📏 {delivery.distance} km</Text>
                <Text style={styles.miniDeliveryInfo}>⏱️ {delivery.estimatedTime} min</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.performanceCard}>
        <Text style={styles.performanceTitle}>Performance Overview</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Rating</Text>
            <Text style={styles.performanceValue}>⭐ {driverStats.rating}</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Completion</Text>
            <Text style={styles.performanceValue}>{driverStats.completionRate}%</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>On-Time</Text>
            <Text style={styles.performanceValue}>{driverStats.onTimeRate}%</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Response</Text>
            <Text style={styles.performanceValue}>{driverStats.responseTime}</Text>
          </View>
        </View>
      </View>

      <View style={styles.notificationsCard}>
        <View style={styles.notificationsHeader}>
          <Text style={styles.notificationsTitle}>Recent Notifications</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{notifications.length}</Text>
          </View>
        </View>
        {notifications.length === 0 ? (
          <Text style={styles.noNotifications}>No new notifications</Text>
        ) : (
          notifications.slice(0, 3).map((notif, index) => (
            <View key={index} style={styles.notificationItem}>
              <Text style={styles.notificationIcon}>{notif.icon || '🔔'}</Text>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>{notif.message}</Text>
                <Text style={styles.notificationTime}>{notif.time}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickActionsCard}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setActiveTab('available')}
          >
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionLabel}>Find Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionLabel}>My Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setActiveTab('history')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setActiveTab('support')}
          >
            <Text style={styles.quickActionIcon}>🛟</Text>
            <Text style={styles.quickActionLabel}>Get Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSupport = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Help & Support</Text>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>🚨 Emergency Contacts</Text>
        <TouchableOpacity style={styles.emergencyButton}>
          <Text style={styles.emergencyButtonText}>📞 Call Emergency Support</Text>
        </TouchableOpacity>
        <Text style={styles.emergencyNumber}>Hotline: +63 (2) 8123-4567</Text>
      </View>

      <View style={styles.supportCard}>
        <Text style={styles.supportCardTitle}>Common Issues</Text>
        
        <TouchableOpacity style={styles.supportItem}>
          <Text style={styles.supportIcon}>❓</Text>
          <View style={styles.supportContent}>
            <Text style={styles.supportQuestion}>How to accept an order?</Text>
            <Text style={styles.supportAnswer}>
              Go to Available tab, browse orders, and tap "Accept Delivery" on your preferred order.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem}>
          <Text style={styles.supportIcon}>❓</Text>
          <View style={styles.supportContent}>
            <Text style={styles.supportQuestion}>Navigation not working?</Text>
            <Text style={styles.supportAnswer}>
              Make sure location services are enabled and Google Maps is installed on your device.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem}>
          <Text style={styles.supportIcon}>❓</Text>
          <View style={styles.supportContent}>
            <Text style={styles.supportQuestion}>Payment issues?</Text>
            <Text style={styles.supportAnswer}>
              Check your payment method in Profile › Payment Methods. Contact support if issues persist.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem}>
          <Text style={styles.supportIcon}>❓</Text>
          <View style={styles.supportContent}>
            <Text style={styles.supportQuestion}>How to go online/offline?</Text>
            <Text style={styles.supportAnswer}>
              Toggle the online/offline switch in the Active Deliveries tab to control your availability.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Contact Support</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonIcon}>💬</Text>
          <Text style={styles.contactButtonText}>Live Chat Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonIcon}>📧</Text>
          <Text style={styles.contactButtonText}>Email Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonIcon}>📱</Text>
          <Text style={styles.contactButtonText}>Call Support Center</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resourcesCard}>
        <Text style={styles.resourcesTitle}>Resources</Text>
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>📖</Text>
          <Text style={styles.resourceText}>Driver Guidelines</Text>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>🎓</Text>
          <Text style={styles.resourceText}>Training Videos</Text>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>📜</Text>
          <Text style={styles.resourceText}>Terms & Conditions</Text>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>🔒</Text>
          <Text style={styles.resourceText}>Privacy Policy</Text>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderLogoutContent = () => (
    <View style={styles.content}>
      <View style={styles.logoutContainer}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutTitle}>Logout</Text>
        <Text style={styles.logoutText}>Are you sure you want to logout?</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }}
        >
          <Text style={styles.logoutButtonText}>Confirm Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setActiveTab('active')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'active':
        return renderActiveDeliveries();
      case 'available':
        return renderAvailableDeliveries();
      case 'earnings':
        return renderEarnings();
      case 'history':
        return renderHistory();
      case 'support':
        return renderSupport();
      case 'profile':
        return renderProfile();
      case 'logout':
        return renderLogoutContent();
      default:
        return renderDashboard();
    }
  };


  useEffect(() => {
    async function doLoginAndFetch() {
      try {
        const token = await login('driver1', 'password'); // Replace with real credentials
        await setToken(token);
        const users = await fetchDriverUsers();
        setDriverUsers(users);
      } catch (e) {
        setLoginError('Login or fetch failed');
      }
    }
    doLoginAndFetch();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#27AE60' : '#E74C3C' }]}>
            <Text style={styles.statusBadgeText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
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

export default function DriverApp() {
  return (
    <DriverAuthProvider>
      <DriverAppContent />
    </DriverAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 50,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  vehicleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vehicleLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '500' },
  vehicleValue: { fontSize: 14, color: '#2C3E50', fontWeight: 'bold' },
  fuelBar: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  fuelLevel: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
  },
  profileRating: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    alignItems: 'center',
  },
  profileRatingLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 5 },
  profileRatingValue: { fontSize: 18, fontWeight: 'bold', color: '#F39C12' },
  
  // Settings Card
  settingsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  settingsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  settingIcon: { fontSize: 20, marginRight: 15 },
  settingText: { flex: 1, fontSize: 14, color: '#2C3E50' },
  settingArrow: { fontSize: 20, color: '#7F8C8D' },
  
  // Dashboard
  welcomeCard: {
    backgroundColor: '#45B7D1',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#FFF', flex: 1 },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickStatCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  quickStatIcon: { fontSize: 30, marginBottom: 8 },
  quickStatValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  quickStatLabel: { fontSize: 12, color: '#FFF', textAlign: 'center' },
  
  activeOrdersSummary: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  summaryViewAll: { fontSize: 14, color: '#45B7D1', fontWeight: '600' },
  noActiveOrders: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noActiveText: { fontSize: 14, color: '#7F8C8D', marginBottom: 15 },
  browseButton: {
    backgroundColor: '#45B7D1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  miniDeliveryCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#45B7D1',
  },
  miniDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  miniDeliveryId: { fontSize: 12, fontWeight: 'bold', color: '#2C3E50' },
  miniDeliveryFee: { fontSize: 14, fontWeight: 'bold', color: '#27AE60' },
  miniDeliveryRoute: { fontSize: 12, color: '#7F8C8D', marginBottom: 6 },
  miniDeliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniDeliveryInfo: { fontSize: 11, color: '#7F8C8D' },
  
  performanceCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  performanceTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceLabel: { fontSize: 11, color: '#7F8C8D', marginBottom: 4 },
  performanceValue: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  
  notificationsCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  notificationsTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  notificationBadge: {
    backgroundColor: '#E74C3C',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  noNotifications: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', paddingVertical: 10 },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  notificationIcon: { fontSize: 20, marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationText: { fontSize: 13, color: '#2C3E50', marginBottom: 4 },
  notificationTime: { fontSize: 11, color: '#7F8C8D' },
  
  quickActionsCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  quickActionsTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  quickActionIcon: { fontSize: 30, marginBottom: 8 },
  quickActionLabel: { fontSize: 12, color: '#2C3E50', fontWeight: '600', textAlign: 'center' },
  
  // Support
  emergencyCard: {
    backgroundColor: '#E74C3C',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  emergencyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  emergencyButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  emergencyButtonText: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },
  emergencyNumber: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  
  supportCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  supportCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  supportItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  supportIcon: { fontSize: 20, marginRight: 12 },
  supportContent: { flex: 1 },
  supportQuestion: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 6 },
  supportAnswer: { fontSize: 13, color: '#7F8C8D', lineHeight: 18 },
  
  contactCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  contactTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  contactButtonIcon: { fontSize: 24, marginRight: 15 },
  contactButtonText: { fontSize: 14, color: '#2C3E50', fontWeight: '600' },
  
  resourcesCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  resourcesTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  resourceIcon: { fontSize: 20, marginRight: 15 },
  resourceText: { flex: 1, fontSize: 14, color: '#2C3E50' },
  resourceArrow: { fontSize: 20, color: '#7F8C8D' },
  
  // Logout
  logoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  logoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});