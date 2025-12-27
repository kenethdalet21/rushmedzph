import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TabBar from './TabBar';
import { AdminDataProvider } from '../contexts/AdminDataContext';
import DashboardTab from './tabs/DashboardTab';
import MerchantManagementTab from './tabs/MerchantManagementTab';
import DriverManagementTab from './tabs/DriverManagementTab';
import SalesAnalyticsTab from './tabs/SalesAnalyticsTab';
import OrderManagementTab from './tabs/OrderManagementTab';
import PaymentsTab from './tabs/PaymentsTab';
import PushNotificationsTab from './tabs/PushNotificationsTab';
import SystemConfigTab from './tabs/SystemConfigTab';

const tabs = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'merchant-management', title: 'Merchants', icon: '🏪' },
  { id: 'driver-management', title: 'Drivers', icon: '🚚' },
  { id: 'sales-analytics', title: 'Sales', icon: '💹' },
  { id: 'order-management', title: 'Orders', icon: '📦' },
  { id: 'payments', title: 'Payments', icon: '💳' },
  { id: 'push-notifications', title: 'Notifications', icon: '🔔' },
  { id: 'system-config', title: 'Config', icon: '⚙️' },
];

export default function AdminAppUnified() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onNavigateToTab={setActiveTab} appRole="admin" />;
      case 'merchant-management':
        return <MerchantManagementTab />;
      case 'driver-management':
        return <DriverManagementTab />;
      case 'sales-analytics':
        return <SalesAnalyticsTab />;
      case 'order-management':
        return <OrderManagementTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'push-notifications':
        return <PushNotificationsTab />;
      case 'system-config':
        return <SystemConfigTab />;
      default:
        return <Text>Tab not found</Text>;
    }
  };

  return (
    <AdminDataProvider>
      <View style={styles.container}>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
          color="#3498DB"
        />
        <View style={styles.content}>{renderTabContent()}</View>
      </View>
    </AdminDataProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});