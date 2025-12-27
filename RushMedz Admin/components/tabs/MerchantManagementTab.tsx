import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAdminData } from '../../contexts/AdminDataContext';

export default function MerchantManagementTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
    const { merchants, loading, refreshMerchants, updateMerchantStatus, removeMerchant, orders } = useAdminData();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
      setRefreshing(true);
      await refreshMerchants();
      setRefreshing(false);
    };

    const getMerchantOrderCount = (merchantName: string) => {
      return orders.filter(o => o.merchant.includes(merchantName.split(' ')[0])).length;
    };

    const handleViewOrders = (merchantName: string) => {
      Alert.alert('Orders', `${merchantName} has ${getMerchantOrderCount(merchantName)} active orders`);
    };

    const handleRemoveMerchant = (merchantId: number, merchantName: string) => {
      Alert.alert(
        'Confirm Removal',
        `Are you sure you want to remove ${merchantName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              await removeMerchant(merchantId);
              await refreshMerchants();
              Alert.alert('Success', 'Merchant removed successfully');
            },
          },
        ]
      );
    };

    const handleSuspendMerchant = (merchantId: number, currentStatus: string, merchantName: string) => {
      const isSuspended = currentStatus === 'inactive';
      const newStatus = isSuspended ? 'active' : 'inactive';
      const action = isSuspended ? 'Activate' : 'Suspend';
      
      Alert.alert(
        `Confirm ${action}`,
        `Are you sure you want to ${action.toLowerCase()} ${merchantName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: action,
            style: isSuspended ? 'default' : 'destructive',
            onPress: async () => {
              await updateMerchantStatus(merchantId, newStatus as 'active' | 'inactive' | 'pending');
              await refreshMerchants();
              Alert.alert('Success', `Merchant ${action.toLowerCase()}d successfully`);
            },
          },
        ]
      );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Loading merchants...</Text>
            </View>
        );
    }

    const activeCount = merchants.filter(m => m.status === 'active').length;
    const pendingCount = merchants.filter(m => m.status === 'pending').length;
    const totalSales = merchants.reduce((sum, m) => sum + m.sales, 0);

    return (
        <ScrollView 
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />}
        >
            <Text style={styles.title}>Merchant Management</Text>
            
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#2ECC71' }]}>
                    <Text style={styles.summaryValue}>{activeCount}</Text>
                    <Text style={styles.summaryLabel}>Active</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#F39C12' }]}>
                    <Text style={styles.summaryValue}>{pendingCount}</Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#3498DB' }]}>
                    <Text style={styles.summaryValue}>₱{Math.round(totalSales).toLocaleString()}</Text>
                    <Text style={styles.summaryLabel}>Total Sales</Text>
                </View>
            </View>

            {merchants.map((item) => (
                <View key={item.id} style={styles.merchantCard}>
                    <View style={styles.merchantHeader}>
                        <Text style={styles.merchantName}>{item.name}</Text>
                        <View style={[styles.statusBadge, 
                            { backgroundColor: item.status === 'active' ? '#2ECC71' : item.status === 'pending' ? '#F39C12' : '#E74C3C' }]}>
                            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.merchantLocation}>📍 {item.location}</Text>
                    <Text style={styles.merchantContact}>📞 {item.contact}</Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>₱{Math.round(item.sales).toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Sales</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{item.totalOrders}</Text>
                            <Text style={styles.statLabel}>Orders</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>⭐ {Math.round(item.rating)}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
                          onPress={() => Alert.alert(item.name, `Sales: ₱${Math.round(item.sales).toLocaleString()}\nOrders: ${item.totalOrders}\nRating: ⭐ ${Math.round(item.rating)}`)}>
                            <Text style={styles.actionButtonText}>📊 View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: '#9B59B6' }]}
                          onPress={() => Alert.alert('Call', `Calling ${item.contact}...`)}>
                            <Text style={styles.actionButtonText}>📞 Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                          onPress={() => handleRemoveMerchant(item.id, item.name)}>
                            <Text style={styles.actionButtonText}>🗑️ Remove</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: item.status === 'inactive' ? '#2ECC71' : '#F39C12' }]}
                          onPress={() => handleSuspendMerchant(item.id, item.status, item.name)}>
                            <Text style={styles.actionButtonText}>{item.status === 'inactive' ? '✓ Activate' : '⏸ Suspend'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
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
    fontSize: 15,
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
  merchantCard: {
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
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantName: {
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
  merchantLocation: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  merchantContact: {
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
});