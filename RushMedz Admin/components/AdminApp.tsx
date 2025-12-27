import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Pressable, Alert, Modal } from 'react-native';
import TabBar from './TabBar';
import BackendStatusIndicator from './BackendStatusIndicator';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { AdminDataProvider } from '../contexts/AdminDataContext';
import AdminLogin from './AdminLogin';
import AdminSignup from './AdminSignup';
import DashboardTab from './tabs/DashboardTab';
import MerchantManagementTab from './tabs/MerchantManagementTab';
import DriverManagementTab from './tabs/DriverManagementTab';
import DoctorManagementTab from './tabs/DoctorManagementTab';
import SalesAnalyticsTab from './tabs/SalesAnalyticsTab';
import OrderManagementTab from './tabs/OrderManagementTab';
import PaymentsTab from './tabs/PaymentsTab';
import PushNotificationsTab from './tabs/PushNotificationsTab';
import SystemConfigTab from './tabs/SystemConfigTab';
import WalletTopUpsTab from './tabs/WalletTopUpsTab';
import { fetchAdminUsers } from './api/adminApi';

const tabs = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'merchant-management', title: 'Merchants', icon: '🏪' },
  { id: 'driver-management', title: 'Drivers', icon: '🚚' },
  { id: 'doctor-management', title: 'Doctors', icon: '👨‍⚕️' },
  { id: 'logout', title: 'Logout', icon: '🚪' },
];

export default function AdminApp() {
  const { user, loading, signOut, switchRole, switchingRoles } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [menuVisible, setMenuVisible] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);

  console.log('AdminApp render: user=', user?.id || 'null', 'loading=', loading, 'switchingRoles=', switchingRoles);

  useEffect(() => {
    fetchAdminUsers().then(setAdminUsers).catch(console.error);
  }, []);

  // If switching roles, don't render anything
  if (switchingRoles) {
    console.log('AdminApp: switchingRoles is true, returning null');
    return null;
  }

  // Only proceed if user is admin role or not authenticated
  if (user && user.role !== 'admin') {
    console.log('AdminApp: user role is not admin, returning null');
    return null;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show login/signup screens if not authenticated
  if (!user) {
    console.log('AdminApp: not authenticated, showing login/signup. authScreen=', authScreen);
    const handleBackToRoleSelector = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Back to role selector failed:', error);
      }
    };
    
    if (authScreen === 'signup') {
      return <AdminSignup onSwitchToLogin={() => setAuthScreen('login')} onBackToRoleSelector={handleBackToRoleSelector} />;
    }
    return <AdminLogin onSwitchToSignup={() => setAuthScreen('signup')} onBackToRoleSelector={handleBackToRoleSelector} />;
  }

  // Render authenticated app content
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
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onNavigateToTab={setActiveTab} appRole="admin" />;
      case 'merchant-management':
        return <MerchantManagementTab />;
      case 'driver-management':
        return <DriverManagementTab />;
      case 'doctor-management':
        return <DoctorManagementTab />;
      case 'sales-analytics':
        return <SalesAnalyticsTab />;
      case 'order-management':
        return <OrderManagementTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'wallet-topups':
        return <WalletTopUpsTab />;
      case 'push-notifications':
        return <PushNotificationsTab />;
      case 'system-config':
        return <SystemConfigTab />;
      case 'logout':
        return renderLogoutContent();
      default:
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</Text>
            <Text style={styles.placeholder}>Content for {activeTab} tab</Text>
          </View>
        );
    }
  };

  return (
    <AdminDataProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setMenuVisible(!menuVisible)}
            style={styles.hamburgerButton}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.headerRight}>
            <Text style={styles.userNameText}>{user?.name || 'Admin'}</Text>
          </View>
        </View>

        {/* Hamburger Menu */}
        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('sales-analytics');
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItemIcon}>📊</Text>
              <Text style={styles.menuItemText}>Sales Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('order-management');
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItemIcon}>📦</Text>
              <Text style={styles.menuItemText}>Order Management</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('payments');
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItemIcon}>💳</Text>
              <Text style={styles.menuItemText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('wallet-topups');
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItemIcon}>🗃️</Text>
              <Text style={styles.menuItemText}>Wallet Top Ups</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('push-notifications');
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItemIcon}>🔔</Text>
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('system-config');
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItemIcon}>⚙️</Text>
              <Text style={styles.menuItemText}>System Config</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.scrollView}>
          {renderContent()}
          {/* Example rendering fetched users:
          <ScrollView>{adminUsers.map(u => <Text key={u.id}>{u.username}</Text>)}</ScrollView>
          */}
        </ScrollView>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={(tabId) => {
            setActiveTab(tabId);
            setMenuVisible(false);
          }}
          color="#FF6B6B"
        />
      </View>
    </AdminDataProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  hamburgerButton: { 
    padding: 8,
    paddingRight: 12
  },
  hamburgerIcon: { 
    fontSize: 24, 
    color: '#fff',
    fontWeight: 'bold'
  },
  headerTitle: { 
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  headerRight: { 
    padding: 8
  },
  userNameText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500'
  },
  menu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  menuItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  menuItemIcon: { 
    fontSize: 20,
    marginRight: 12,
    width: 24
  },
  menuItemText: { 
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 50,
  },
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