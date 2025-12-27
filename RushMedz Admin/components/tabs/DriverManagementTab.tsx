import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useAdminData } from '../../contexts/AdminDataContext';

export default function DriverManagementTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const { drivers, loading, refreshDrivers, orders, removeDriver, assignDriver } = useAdminData();
  const [refreshing, setRefreshing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDrivers();
    setRefreshing(false);
  };

  const getAvailableOrders = () => {
    return orders.filter(o => o.status === 'pending' || o.status === 'processing');
  };

  const handleAssignOrder = (driverId: number, orderId: number) => {
    assignDriver(orderId, driverId);
    setShowAssignModal(false);
    setSelectedDriverId(null);
    Alert.alert('Success', 'Order assigned to driver successfully!');
  };

  const getDriverActiveOrders = (driverName: string) => {
    return orders.filter(o => o.driver === driverName || o.driver.includes(driverName.split(' ')[1])).length;
  };

  const handleViewDriverStats = (driver: typeof drivers[0]) => {
    const activeOrders = getDriverActiveOrders(driver.name);
    Alert.alert(
      driver.name,
      `Deliveries: ${driver.deliveries}\nRating: ⭐ ${driver.rating}\nEarnings: ₱${driver.earnings.toLocaleString()}\nActive Orders: ${activeOrders}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleRemoveDriver = (driverId: number, driverName: string) => {
    Alert.alert(
      'Confirm Removal',
      `Are you sure you want to remove ${driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeDriver(driverId);
            await refreshDrivers();
            Alert.alert('Success', 'Driver removed successfully');
          },
        },
      ]
    );
  };

  const handleSuspendDriver = (driverId: number, currentStatus: string, driverName: string) => {
    const isSuspended = currentStatus === 'offline';
    const newStatus = isSuspended ? 'online' : 'offline';
    const action = isSuspended ? 'Activate' : 'Suspend';
    
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()} ${driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            const updatedDrivers = drivers.map(d => 
              d.id === driverId ? { ...d, status: newStatus as 'online' | 'offline' | 'delivering' } : d
            );
            await refreshDrivers();
            Alert.alert('Success', `Driver ${action.toLowerCase()}d successfully`);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  const onlineCount = drivers.filter(d => d.status === 'online').length;
  const deliveringCount = drivers.filter(d => d.status === 'delivering').length;
  const totalEarnings = drivers.reduce((sum, d) => sum + d.earnings, 0);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />}
    >
      <Text style={styles.title}>Driver Management</Text>
      
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#2ECC71' }]}>
          <Text style={styles.summaryValue}>{onlineCount}</Text>
          <Text style={styles.summaryLabel}>🟢 Online</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#3498DB' }]}>
          <Text style={styles.summaryValue}>{deliveringCount}</Text>
          <Text style={styles.summaryLabel}>🚚 Delivering</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#F39C12' }]}>
          <Text style={styles.summaryValue}>₱{totalEarnings.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>💰 Earnings</Text>
        </View>
      </View>

      {drivers.map((item) => (
        <View key={item.id} style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <Text style={styles.driverName}>{item.name}</Text>
            <View style={[styles.statusBadge, 
              { backgroundColor: item.status === 'online' ? '#2ECC71' : item.status === 'delivering' ? '#3498DB' : '#95A5A6' }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.driverLocation}>📍 {item.currentLocation}</Text>
          <Text style={styles.driverVehicle}>🏍️ {item.vehicleType}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {item.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₱{item.earnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
              onPress={() => handleViewDriverStats(item)}>
              <Text style={styles.actionButtonText}>📊 Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#2ECC71' }]}
              onPress={() => {
                setSelectedDriverId(item.id);
                setShowAssignModal(true);
              }}>
              <Text style={styles.actionButtonText}>📦 Assign</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#9B59B6' }]}
              onPress={() => Alert.alert('Call Driver', `Calling ${item.name}...\n\nPhone: Not available in demo\n\nStatus: ${item.status === 'online' ? '✓ Online' : item.status === 'delivering' ? '🚚 Delivering' : '⏸ Offline'}`)}>
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
              onPress={() => handleRemoveDriver(item.id, item.name)}>
              <Text style={styles.actionButtonText}>🗑️ Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: item.status === 'offline' ? '#2ECC71' : '#F39C12' }]}
              onPress={() => handleSuspendDriver(item.id, item.status, item.name)}>
              <Text style={styles.actionButtonText}>{item.status === 'offline' ? '✓ Activate' : '⏸ Suspend'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Order Assignment Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Order to Driver</Text>
            <ScrollView style={styles.orderList}>
              {getAvailableOrders().map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderItem}
                  onPress={() => {
                    if (selectedDriverId) {
                      handleAssignOrder(selectedDriverId, order.id);
                    }
                  }}
                >
                  <View>
                    <Text style={styles.orderItemText}>Order #{order.id}</Text>
                    <Text style={styles.orderItemDetail}>{order.customerName}</Text>
                    <Text style={styles.orderItemDetail}>Amount: ₱{order.totalAmount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAssignModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

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
    fontSize: 16,
    color: '#7F8C8D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flexShrink: 1,
    maxWidth: '100%',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
  },
  driverCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  driverLocation: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECF0F1',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  orderList: {
    marginBottom: 16,
    maxHeight: 300,
  },
  orderItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  orderItemText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  orderItemDetail: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});