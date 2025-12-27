import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAdminData } from '../../contexts/AdminDataContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7F8C8D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  highlightLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
    opacity: 0.9,
    maxWidth: 90,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
    elevation: 2,
  },
  metricCardClickable: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    flexShrink: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
  actionSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
});


interface DashboardTabProps {
  onNavigateToTab?: (tabId: string) => void;
  appRole?: 'admin' | 'merchant' | 'driver' | 'user';
}

export default function DashboardTab({ onNavigateToTab, appRole = 'admin' }: DashboardTabProps) {
  const adminData = useAdminData();
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const loading = adminData?.loading || false;
  const orders = adminData?.orders || [];
  const merchants = adminData?.merchants || [];
  const drivers = adminData?.drivers || [];
  const totalUsers = adminData?.metrics?.totalUsers || 0;

  const refreshOrders = adminData?.refreshOrders || (() => Promise.resolve());
  const refreshMerchants = adminData?.refreshMerchants || (() => Promise.resolve());
  const refreshDrivers = adminData?.refreshDrivers || (() => Promise.resolve());

  // Get metrics based on role
  const getMetricValue = (metricKey: string): number | string => {
    if (adminData?.metrics) {
      const adminMetrics = adminData.metrics;
      switch (metricKey) {
        case 'totalRevenue': return adminMetrics.totalRevenue.toLocaleString();
        case 'pendingOrders': return adminMetrics.pendingOrders;
        case 'totalOrders': return adminMetrics.totalOrders;
        case 'completedToday': return adminMetrics.completedToday;
        case 'activeUsers': return adminMetrics.totalUsers;
        case 'avgDeliveryTime': return adminMetrics.avgDeliveryTime;
        default: return 0;
      }
    }
    return 0;
  };
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshOrders(), refreshMerchants(), refreshDrivers()]);
    setRefreshing(false);
  };

  // Handler for metric navigation based on app role
  const handleMetricPress = (metricType: string) => {
    if (!onNavigateToTab) {
      Alert.alert('Navigate', `Go to ${metricType} for more details`);
      return;
    }

    // Map metrics to tabs based on app role
    const tabMap: Record<string, Record<string, string>> = {
      admin: {
        'total-revenue': 'sales-analytics',
        'pending-orders': 'order-management',
        'total-orders': 'order-management',
        'completed-today': 'sales-analytics',
        'active-merchants': 'merchant-management',
        'active-drivers': 'driver-management',
        'active-doctors': 'doctor-management',
        'total-users': 'dashboard',
      },
      merchant: {
        'total-revenue': 'payments',
        'pending-orders': 'orders',
        'total-orders': 'orders',
        'completed-today': 'dashboard',
        'active-merchants': 'dashboard',
        'active-drivers': 'dashboard',
        'active-doctors': 'dashboard',
        'total-users': 'dashboard',
      },
      driver: {
        'total-revenue': 'earnings',
        'pending-orders': 'available',
        'total-orders': 'history',
        'completed-today': 'history',
        'active-merchants': 'active',
        'active-drivers': 'active',
        'active-doctors': 'active',
        'total-users': 'profile',
      },
      user: {
        'total-revenue': 'payments',
        'pending-orders': 'orders',
        'total-orders': 'orders',
        'completed-today': 'orders',
        'active-merchants': 'browse',
        'active-drivers': 'browse',
        'active-doctors': 'browse',
        'total-users': 'profile',
      },
    };

    const tabId = tabMap[appRole]?.[metricType] || 'dashboard';
    onNavigateToTab(tabId);
  };

  useEffect(() => {
    // Initial load is handled by context provider
    // Load doctors data for monitoring
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      // In a real app, this would call your backend API
      // For now, we'll use mock data - replace with actual API call
      const mockDoctors = [
        { id: '1', name: 'Dr. Maria Santos', status: 'active', specialization: 'General Medicine' },
        { id: '2', name: 'Dr. John Cruz', status: 'active', specialization: 'Cardiology' },
        { id: '3', name: 'Dr. Lisa Reyes', status: 'active', specialization: 'Pediatrics' },
        { id: '4', name: 'Dr. Robert Tan', status: 'inactive', specialization: 'Dermatology' },
      ];
      setDoctors(mockDoctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />}
      >
        <Text style={styles.title}>Dashboard Overview</Text>
        <View style={styles.highlightRow}>
          <TouchableOpacity
            style={[styles.highlightCard, { backgroundColor: '#2ECC71' }]}
            onPress={() => handleMetricPress('total-revenue')}>
            <Text style={styles.highlightValue}>₱{getMetricValue('totalRevenue')}</Text>
            <Text style={styles.highlightLabel} numberOfLines={1} ellipsizeMode="tail">Total Revenue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.highlightCard, { backgroundColor: '#3498DB' }]}
            onPress={() => handleMetricPress('pending-orders')}>
            <Text style={styles.highlightValue}>{getMetricValue('pendingOrders')}</Text>
            <Text style={styles.highlightLabel} numberOfLines={1} ellipsizeMode="tail">Pending Orders</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => handleMetricPress('total-orders')}>
            <Text style={styles.metricIcon}>📦</Text>
            <Text style={styles.metricValue}>{getMetricValue('totalOrders')}</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Total Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => handleMetricPress('completed-today')}>
            <Text style={styles.metricIcon}>✅</Text>
            <Text style={styles.metricValue}>{getMetricValue('completedToday')}</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Completed Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => handleMetricPress('active-merchants')}>
            <Text style={styles.metricIcon}>🏪</Text>
            <Text style={styles.metricValue}>{merchants.filter(m => m.status === 'active').length}</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Active Merchants</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => handleMetricPress('active-drivers')}>
            <Text style={styles.metricIcon}>🚚</Text>
            <Text style={styles.metricValue}>{drivers.filter(d => d.status === 'online' || d.status === 'delivering').length}</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Active Drivers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => handleMetricPress('active-doctors')}>
            <Text style={styles.metricIcon}>👨‍⚕️</Text>
            <Text style={styles.metricValue}>{doctors.filter(d => d.status === 'active').length}</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Active Doctors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => handleMetricPress('total-users')}>
            <Text style={styles.metricIcon}>👥</Text>
            <Text style={styles.metricValue}>{getMetricValue('activeUsers')}</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Total Users</Text>
          </TouchableOpacity>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⏱️</Text>
            <Text style={styles.metricValue}>{getMetricValue('avgDeliveryTime')}m</Text>
            <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">Avg Delivery</Text>
          </View>
        </View>
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (onNavigateToTab) {
                onNavigateToTab('sales-analytics');
              } else {
                Alert.alert('Analytics', 'Navigate to Sales Analytics tab for detailed reports');
              }
            }}>
            <Text style={styles.actionButtonText}>📊 View Full Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (onNavigateToTab) {
                onNavigateToTab('push-notifications');
              } else {
                Alert.alert('Notifications', 'Navigate to Notifications tab to send messages');
              }
            }}>
            <Text style={styles.actionButtonText}>🔔 Send Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (onNavigateToTab) {
                onNavigateToTab('system-config');
              } else {
                Alert.alert('Settings', 'Navigate to System Config tab for settings');
              }
            }}>
            <Text style={styles.actionButtonText}>⚙️ System Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

