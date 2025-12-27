import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Modal, FlatList } from 'react-native';
import { useAdminData } from '../../contexts/AdminDataContext';

export default function OrderManagementTab() {
  const { orders, loading, drivers, refreshOrders, updateOrderStatus, assignDriver, cancelOrder } = useAdminData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverFilter, setDriverFilter] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleAssignDriver = (orderId: number, driverId: number) => {
    assignDriver(orderId, driverId);
    setShowDriverModal(false);
    setSelectedOrder(null);
    Alert.alert('Success', 'Driver assigned successfully!');
  };

  const handleCancelOrder = (orderId: number) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          cancelOrder(orderId);
          Alert.alert('Success', 'Order cancelled successfully!');
        },
      },
    ]);
  };

  if (loading) {
    return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return '#2ECC71';
        case 'delivering': return '#3498DB';
        case 'processing': return '#F39C12';
        case 'pending': return '#95A5A6';
        case 'cancelled': return '#E74C3C';
        default: return '#95A5A6';
      }
    };

    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      delivering: orders.filter(o => o.status === 'delivering').length,
      completed: orders.filter(o => o.status === 'completed').length,
    };

  return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />}
      >
      <Text style={styles.title}>Order Management</Text>
      
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusCounts.pending}</Text>
            <Text style={styles.summaryLabel}>⏳ Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusCounts.processing}</Text>
            <Text style={styles.summaryLabel}>⚙️ Processing</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusCounts.delivering}</Text>
            <Text style={styles.summaryLabel}>🚚 Delivering</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusCounts.completed}</Text>
            <Text style={styles.summaryLabel}>✅ Done</Text>
          </View>
        </View>

        {orders.map((item) => (
          <View key={item.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          
            <Text style={styles.customerName}>👤 {item.customerName}</Text>
            <Text style={styles.orderDetails}>📦 {item.items}</Text>
            <Text style={styles.orderDetails}>🏪 {item.merchant}</Text>
            <Text style={styles.orderDetails}>🚚 {item.driver}</Text>
            <Text style={styles.orderDetails}>📍 {item.address}</Text>
          
            <View style={styles.orderFooter}>
              <Text style={styles.orderAmount}>₱{item.totalAmount.toFixed(2)}</Text>
              <Text style={styles.orderTime}>🕐 {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
                onPress={() => Alert.alert('Order #' + item.id, `Customer: ${item.customerName}\nStatus: ${item.status}\nTotal: ₱${item.totalAmount.toFixed(2)}`)}>
                <Text style={styles.actionButtonText}>📋 View</Text>
              </TouchableOpacity>
              {item.status === 'pending' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#2ECC71' }]}
                  onPress={() => { setSelectedOrder(item.id); setShowDriverModal(true); }}>
                  <Text style={styles.actionButtonText}>🚚 Assign</Text>
                </TouchableOpacity>
              )}
              {item.status !== 'completed' && item.status !== 'cancelled' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                  onPress={() => handleCancelOrder(item.id)}>
                  <Text style={styles.actionButtonText}>❌ Cancel</Text>
                </TouchableOpacity>
              )}
          </View>
          </View>
        ))}

      <Modal visible={showDriverModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Driver</Text>
            <FlatList
              data={drivers.filter(d => d.status === 'online')}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.driverOption}
                  onPress={() => selectedOrder && handleAssignDriver(selectedOrder, item.id)}>
                  <Text style={styles.driverName}>{item.name}</Text>
                  <Text style={styles.driverRating}>⭐ {item.rating} • {item.deliveries} deliveries</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#95A5A6', marginTop: 12 }]}
              onPress={() => setShowDriverModal(false)}>
              <Text style={styles.actionButtonText}>Close</Text>
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
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flexShrink: 1,
    maxWidth: '100%',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#7F8C8D',
    marginTop: 4,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
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
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  orderDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  orderTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  driverOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  driverRating: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
});