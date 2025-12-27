import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { eventBus } from '../../services/eventBus';

interface Payment {
  id: number;
  type: 'payment' | 'payout' | 'topup' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  recipient: string;
  method: string;
  createdAt: string;
}

export default function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPayments([
        { id: 5001, type: 'payment', amount: 850.50, status: 'completed', recipient: 'Order #1001 - John Smith', method: 'GCash', createdAt: '2025-11-29T10:35:00' },
        { id: 5002, type: 'payout', amount: 12450.50, status: 'completed', recipient: 'Driver: Juan Dela Cruz', method: 'Bank Transfer', createdAt: '2025-11-29T10:00:00' },
        { id: 5003, type: 'payout', amount: 45320.50, status: 'pending', recipient: 'Merchant: Mercury Drug - Makati', method: 'Bank Transfer', createdAt: '2025-11-29T09:30:00' },
        { id: 5004, type: 'topup', amount: 500.00, status: 'completed', recipient: 'User: Maria Garcia', method: 'PayMaya', createdAt: '2025-11-29T09:15:00' },
        { id: 5005, type: 'refund', amount: 680.00, status: 'completed', recipient: 'Order #1005 - Carlos Reyes', method: 'GCash', createdAt: '2025-11-29T09:00:00' },
        { id: 5006, type: 'payment', amount: 1250.75, status: 'pending', recipient: 'Order #1002 - Maria Garcia', method: 'Credit Card', createdAt: '2025-11-29T11:20:00' },
      ]);
      setLoading(false);
    }, 680);
    const unsubInitiated = eventBus.subscribe('paymentInitiated', ({ transactionId, orderId, amount, method }) => {
      setPayments(prev => [{ id: Number(transactionId.slice(0,6)) || Date.now(), type: 'payment', amount, status: 'pending', recipient: `Order #${orderId}`, method, createdAt: new Date().toISOString() }, ...prev]);
    });
    const unsubCompleted = eventBus.subscribe('paymentCompleted', ({ transactionId, orderId, amount, method }) => {
      setPayments(prev => prev.map(p => p.recipient.includes(orderId) ? { ...p, status: 'completed' } : p));
    });
    const unsubRefund = eventBus.subscribe('refundRequested', ({ transactionId, orderId, amount }) => {
      setPayments(prev => [{ id: Number(transactionId.slice(0,6)) || Date.now(), type: 'refund', amount, status: 'pending', recipient: `Order #${orderId}`, method: 'GCash', createdAt: new Date().toISOString() }, ...prev]);
    });
    return () => { unsubInitiated(); unsubCompleted(); unsubRefund(); };
  }, []);

  if (loading) {
    return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'payment': return '💳';
        case 'payout': return '💰';
        case 'topup': return '📥';
        case 'refund': return '↩️';
        default: return '💵';
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'payment': return '#3498DB';
        case 'payout': return '#E74C3C';
        case 'topup': return '#2ECC71';
        case 'refund': return '#F39C12';
        default: return '#95A5A6';
      }
    };

    const totalPayments = payments.filter(p => p.type === 'payment' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const totalPayouts = payments.filter(p => p.type === 'payout' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const totalTopups = payments.filter(p => p.type === 'topup' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
      <ScrollView style={styles.container}>
      <Text style={styles.title}>Payments and Payouts</Text>
      
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#3498DB' }]}>
            <Text style={styles.summaryValue}>₱{totalPayments.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>💳 Payments</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E74C3C' }]}>
            <Text style={styles.summaryValue}>₱{totalPayouts.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>💰 Payouts</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#2ECC71' }]}>
            <Text style={styles.summaryValue}>₱{totalTopups.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>📥 Top-ups</Text>
          </View>
        </View>

        {payments.map((item) => (
          <View key={item.id} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.typeContainer}>
                <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
                <View>
                  <Text style={[styles.typeLabel, { color: getTypeColor(item.type) }]}>{item.type.toUpperCase()}</Text>
                  <Text style={styles.paymentId}>#{item.id}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#2ECC71' : item.status === 'pending' ? '#F39C12' : '#E74C3C' }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          
            <Text style={styles.paymentRecipient}>{item.recipient}</Text>
            <Text style={styles.paymentMethod}>💳 {item.method}</Text>
          
            <View style={styles.paymentFooter}>
              <Text style={[styles.paymentAmount, { color: item.type === 'payout' || item.type === 'refund' ? '#E74C3C' : '#2ECC71' }]}>
                {item.type === 'payout' || item.type === 'refund' ? '-' : '+'}₱{item.amount.toFixed(2)}
              </Text>
              <Text style={styles.paymentTime}>🕐 {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>

            {item.status === 'pending' && (
              <TouchableOpacity style={styles.processButton}>
                <Text style={styles.processButtonText}>⚡ Process Payment</Text>
              </TouchableOpacity>
            )}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    flexShrink: 1,
    maxWidth: '100%',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#FFF',
    marginTop: 4,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentId: {
    fontSize: 12,
    color: '#95A5A6',
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
  paymentRecipient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  processButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  processButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});