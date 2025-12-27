import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type {
  Product,
  Order,
  PaymentTransaction,
  Payout,
  PaymentStatus,
} from '../types';
import { productsAPI, ordersAPI } from '../services/api';
import paymentAPI from '../services/payments';

export default function MerchantAppWithPayments() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'revenue' | 'payouts'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    currency: 'PHP',
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Payout request modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'gcash' | 'paymaya'>('bank');
  const [accountDetails, setAccountDetails] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  const merchantId = 'merchant123'; // Replace with actual merchant ID from auth context

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadTransactions(),
        loadPayouts(),
        loadBalance(),
      ]);
    } catch (error) {
      console.error('Failed to load merchant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll(merchantId); // Adjusted to pass merchantId as a string
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll({ merchantId });
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await paymentAPI.transactions.getAll({ merchantId });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadPayouts = async () => {
    try {
      const data = await paymentAPI.payouts.getAll(merchantId);
      setPayouts(data);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const data = await paymentAPI.payouts.getMerchantBalance(merchantId);
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const requestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payout amount');
      return;
    }

    const amount = parseFloat(payoutAmount);
    if (amount > balance.availableBalance) {
      Alert.alert('Error', 'Insufficient available balance');
      return;
    }

    if (!accountDetails.trim()) {
      Alert.alert('Error', 'Please enter account details');
      return;
    }

    try {
      setProcessingPayout(true);
      await paymentAPI.payouts.requestPayout(
        merchantId,
        amount,
        payoutMethod,
        { accountDetails }
      );
      
      Alert.alert('Success', 'Payout request submitted successfully');
      setShowPayoutModal(false);
      setPayoutAmount('');
      setAccountDetails('');
      await loadBalance();
      await loadPayouts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const getRevenueStats = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const completedTransactions = transactions.filter(tx => tx.status === 'completed');

    const dailyRevenue = completedTransactions
      .filter(tx => new Date(tx.createdAt) >= startOfDay)
      .reduce((sum, tx) => sum + (tx.netAmount || 0), 0);

    const weeklyRevenue = completedTransactions
      .filter(tx => new Date(tx.createdAt) >= startOfWeek)
      .reduce((sum, tx) => sum + (tx.netAmount || 0), 0);

    const monthlyRevenue = completedTransactions
      .filter(tx => new Date(tx.createdAt) >= startOfMonth)
      .reduce((sum, tx) => sum + (tx.netAmount || 0), 0);

    return { dailyRevenue, weeklyRevenue, monthlyRevenue };
  };

  const getPaymentMethodBreakdown = () => {
    const breakdown: Record<string, { count: number; amount: number }> = {};
    
    transactions
      .filter(tx => tx.status === 'completed')
      .forEach(tx => {
        const method = tx.paymentMethod;
        if (!breakdown[method]) {
          breakdown[method] = { count: 0, amount: 0 };
        }
        breakdown[method].count += 1;
        breakdown[method].amount += tx.amount;
      });

    return breakdown;
  };

  const getPendingOrders = () => {
    return orders.filter(o => 
      ['pending', 'confirmed'].includes(o.status) && 
      o.paymentStatus === 'completed'
    );
  };

  const getOrdersWithPaymentIssues = () => {
    return orders.filter(o => 
      ['failed', 'pending'].includes(o.paymentStatus || '')
    );
  };

  // Render Dashboard Tab
  const renderDashboardTab = () => {
    const stats = getRevenueStats();
    const pendingOrders = getPendingOrders();
    const paymentIssues = getOrdersWithPaymentIssues();

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Overview */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {paymentAPI.utils.formatAmount(balance.availableBalance, balance.currency)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceDetail}>
              <Text style={styles.balanceDetailLabel}>Pending</Text>
              <Text style={styles.balanceDetailValue}>
                {paymentAPI.utils.formatAmount(balance.pendingBalance, balance.currency)}
              </Text>
            </View>
            <View style={styles.balanceDetail}>
              <Text style={styles.balanceDetailLabel}>Total Earnings</Text>
              <Text style={styles.balanceDetailValue}>
                {paymentAPI.utils.formatAmount(balance.totalEarnings, balance.currency)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.payoutButton}
            onPress={() => setShowPayoutModal(true)}
            disabled={balance.availableBalance <= 0}
          >
            <Text style={styles.payoutButtonText}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Revenue Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Today</Text>
              <Text style={styles.statValue}>₱{stats.dailyRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statValue}>₱{stats.weeklyRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={styles.statValue}>₱{stats.monthlyRevenue.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStatCard, { backgroundColor: '#3498DB' }]}>
            <Text style={styles.quickStatValue}>{pendingOrders.length}</Text>
            <Text style={styles.quickStatLabel}>Pending Orders</Text>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: '#E74C3C' }]}>
            <Text style={styles.quickStatValue}>{paymentIssues.length}</Text>
            <Text style={styles.quickStatLabel}>Payment Issues</Text>
          </View>
        </View>

        {/* Payment Method Breakdown */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Payment Methods</Text>
          {Object.entries(getPaymentMethodBreakdown()).map(([method, data]) => (
            <View key={method} style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodIcon}>
                {paymentAPI.utils.getPaymentMethodIcon(method as any)}
              </Text>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>{method.toUpperCase()}</Text>
                <Text style={styles.paymentMethodCount}>{data.count} transactions</Text>
              </View>
              <Text style={styles.paymentMethodAmount}>₱{data.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Render Orders Tab
  const renderOrdersTab = () => {
    const groupedOrders = {
      pending: orders.filter(o => o.paymentStatus === 'pending' || o.paymentStatus === 'processing'),
      completed: orders.filter(o => o.paymentStatus === 'completed'),
      issues: orders.filter(o => ['failed', 'cancelled', 'refunded'].includes(o.paymentStatus || '')),
    };

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Pending Payments */}
        <Text style={styles.sectionTitle}>Pending Payments ({groupedOrders.pending.length})</Text>
        {groupedOrders.pending.map(order => renderOrderCard(order))}

        {/* Completed */}
        <Text style={styles.sectionTitle}>Completed Orders ({groupedOrders.completed.length})</Text>
        {groupedOrders.completed.slice(0, 5).map(order => renderOrderCard(order))}

        {/* Issues */}
        {groupedOrders.issues.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: '#E74C3C' }]}>
              Payment Issues ({groupedOrders.issues.length})
            </Text>
            {groupedOrders.issues.map(order => renderOrderCard(order))}
          </>
        )}
      </ScrollView>
    );
  };

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
        <View>
          <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
            {order.status.toUpperCase()}
          </Text>
          {order.paymentStatus && (
            <Text style={[styles.paymentStatus, { color: paymentAPI.utils.getStatusColor(order.paymentStatus) }]}>
              {order.paymentStatus.toUpperCase()}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString()}</Text>
      <Text style={styles.orderAmount}>₱{order.totalAmount.toFixed(2)}</Text>
      <Text style={styles.orderPayment}>
        {paymentAPI.utils.getPaymentMethodIcon(order.paymentMethod || 'cod')} {' '}
        {order.paymentMethod?.toUpperCase() || 'COD'}
      </Text>
    </View>
  );

  // Render Revenue Tab
  const renderRevenueTab = () => {
    const completedTx = transactions.filter(tx => tx.status === 'completed');
    const totalRevenue = completedTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalFees = completedTx.reduce((sum, tx) => sum + (tx.processingFee || 0), 0);
    const netRevenue = completedTx.reduce((sum, tx) => sum + (tx.netAmount || 0), 0);
    const refundedAmount = transactions.reduce((sum, tx) => sum + (tx.refundedAmount || 0), 0);

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Revenue Summary */}
        <View style={styles.revenueSummary}>
          <Text style={styles.revenueTitle}>Revenue Summary</Text>
          
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Gross Revenue</Text>
            <Text style={styles.revenueValue}>₱{totalRevenue.toFixed(2)}</Text>
          </View>
          
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Processing Fees</Text>
            <Text style={[styles.revenueValue, { color: '#E74C3C' }]}>
              -₱{totalFees.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Refunds</Text>
            <Text style={[styles.revenueValue, { color: '#E74C3C' }]}>
              -₱{refundedAmount.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.revenueItem, styles.revenueItemTotal]}>
            <Text style={styles.revenueLabelTotal}>Net Revenue</Text>
            <Text style={styles.revenueValueTotal}>₱{netRevenue.toFixed(2)}</Text>
          </View>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.slice(0, 20).map(tx => (
          <View key={tx.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionIcon}>
                {paymentAPI.utils.getPaymentMethodIcon(tx.paymentMethod)}
              </Text>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionMethod}>{tx.paymentMethod.toUpperCase()}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(tx.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.transactionId}>TX: {tx.gatewayTransactionId || tx.id.slice(0, 12)}</Text>
              </View>
              <View style={styles.transactionAmounts}>
                <Text style={styles.transactionAmount}>₱{tx.amount?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.transactionFee}>Fee: ₱{tx.processingFee?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.transactionNet}>Net: ₱{tx.netAmount?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
            <View style={styles.transactionFooter}>
              <Text style={[styles.transactionStatus, { color: paymentAPI.utils.getStatusColor(tx.status) }]}>
                {tx.status.toUpperCase()}
              </Text>
              {tx.refundedAmount && tx.refundedAmount > 0 && (
                <Text style={styles.refundBadge}>Refunded: ₱{tx.refundedAmount.toFixed(2)}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render Payouts Tab
  const renderPayoutsTab = () => {
    const pendingPayouts = payouts.filter(p => ['pending', 'processing'].includes(p.status));
    const completedPayouts = payouts.filter(p => p.status === 'completed');
    const failedPayouts = payouts.filter(p => p.status === 'failed');

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Payout Balance */}
        <View style={styles.payoutBalanceCard}>
          <Text style={styles.payoutBalanceTitle}>Available for Payout</Text>
          <Text style={styles.payoutBalanceAmount}>
            {paymentAPI.utils.formatAmount(balance.availableBalance, balance.currency)}
          </Text>
          <TouchableOpacity
            style={styles.requestPayoutButton}
            onPress={() => setShowPayoutModal(true)}
            disabled={balance.availableBalance <= 0}
          >
            <Text style={styles.requestPayoutButtonText}>Request New Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Payouts */}
        {pendingPayouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending Payouts ({pendingPayouts.length})</Text>
            {pendingPayouts.map(payout => renderPayoutCard(payout))}
          </>
        )}

        {/* Failed Payouts */}
        {failedPayouts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: '#E74C3C' }]}>
              Failed Payouts ({failedPayouts.length})
            </Text>
            {failedPayouts.map(payout => renderPayoutCard(payout))}
          </>
        )}

        {/* Completed Payouts */}
        <Text style={styles.sectionTitle}>Payout History</Text>
        {completedPayouts.slice(0, 10).map(payout => renderPayoutCard(payout))}
      </ScrollView>
    );
  };

  const renderPayoutCard = (payout: Payout) => (
    <View key={payout.id} style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View>
          <Text style={styles.payoutAmount}>₱{payout.amount.toFixed(2)}</Text>
          <Text style={styles.payoutMethod}>{payout.payoutMethod.toUpperCase()}</Text>
        </View>
        <Text style={[styles.payoutStatus, { color: paymentAPI.utils.getStatusColor(payout.status) }]}>
          {payout.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.payoutDate}>
        Requested: {new Date(payout.createdAt).toLocaleString()}
      </Text>
      {payout.completedDate && (
        <Text style={styles.payoutCompletedDate}>
          Completed: {new Date(payout.completedDate).toLocaleString()}
        </Text>
      )}
      <Text style={styles.payoutTransactions}>
        {payout.transactionIds.length} transactions included
      </Text>
    </View>
  );

  // Payout Request Modal
  const renderPayoutModal = () => (
    <Modal
      visible={showPayoutModal}
      transparent
      animationType="slide"
      onRequestClose={() => !processingPayout && setShowPayoutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Request Payout</Text>
          
          <View style={styles.modalBalance}>
            <Text style={styles.modalBalanceLabel}>Available Balance</Text>
            <Text style={styles.modalBalanceAmount}>
              {paymentAPI.utils.formatAmount(balance.availableBalance, balance.currency)}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Payout Amount"
            keyboardType="numeric"
            value={payoutAmount}
            onChangeText={setPayoutAmount}
            editable={!processingPayout}
          />

          <Text style={styles.inputLabel}>Payout Method</Text>
          <View style={styles.payoutMethodOptions}>
            {['bank', 'gcash', 'paymaya'].map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.payoutMethodOption,
                  payoutMethod === method && styles.payoutMethodOptionSelected,
                ]}
                onPress={() => setPayoutMethod(method as any)}
                disabled={processingPayout}
              >
                <Text style={[
                  styles.payoutMethodOptionText,
                  payoutMethod === method && styles.payoutMethodOptionTextSelected,
                ]}>
                  {method.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={`${payoutMethod === 'bank' ? 'Account Number' : 'Mobile Number'}`}
            value={accountDetails}
            onChangeText={setAccountDetails}
            editable={!processingPayout}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPayoutModal(false)}
              disabled={processingPayout}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, processingPayout && styles.submitButtonDisabled]}
              onPress={requestPayout}
              disabled={processingPayout}
            >
              {processingPayout ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F39C12',
      confirmed: '#3498DB',
      preparing: '#9B59B6',
      ready: '#1ABC9C',
      in_transit: '#3498DB',
      delivered: '#27AE60',
      cancelled: '#E74C3C',
    };
    return colors[status] || '#7F8C8D';
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading merchant data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
            📊 Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            📦 Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'revenue' && styles.tabActive]}
          onPress={() => setActiveTab('revenue')}
        >
          <Text style={[styles.tabText, activeTab === 'revenue' && styles.tabTextActive]}>
            💰 Revenue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payouts' && styles.tabActive]}
          onPress={() => setActiveTab('payouts')}
        >
          <Text style={[styles.tabText, activeTab === 'payouts' && styles.tabTextActive]}>
            💸 Payouts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboardTab()}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'revenue' && renderRevenueTab()}
      {activeTab === 'payouts' && renderPayoutsTab()}

      {/* Payout Modal */}
      {renderPayoutModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#7F8C8D',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498DB',
  },
  tabText: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  tabTextActive: {
    color: '#3498DB',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  balanceCard: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceDetail: {
    flex: 1,
  },
  balanceDetailLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  balanceDetailValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payoutButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  payoutButtonText: {
    color: '#3498DB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#fff',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  paymentMethodCount: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  paymentMethodAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  paymentStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'right',
  },
  orderDate: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 4,
  },
  orderPayment: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  revenueSummary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  revenueItemTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#3498DB',
    marginTop: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  revenueLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  revenueValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMethod: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  transactionId: {
    fontSize: 9,
    color: '#7F8C8D',
    fontFamily: 'monospace',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionFee: {
    fontSize: 11,
    color: '#E74C3C',
    marginBottom: 2,
  },
  transactionNet: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  refundBadge: {
    fontSize: 10,
    color: '#9B59B6',
    backgroundColor: '#F4ECF7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  payoutBalanceCard: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  payoutBalanceTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  payoutBalanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  requestPayoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  requestPayoutButtonText: {
    color: '#27AE60',
    fontWeight: 'bold',
    fontSize: 14,
  },
  payoutCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 4,
  },
  payoutMethod: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  payoutStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  payoutDate: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  payoutCompletedDate: {
    fontSize: 12,
    color: '#27AE60',
    marginBottom: 4,
  },
  payoutTransactions: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBalance: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  modalBalanceLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  modalBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498DB',
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  payoutMethodOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  payoutMethodOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  payoutMethodOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#3498DB',
  },
  payoutMethodOptionText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: 'bold',
  },
  payoutMethodOptionTextSelected: {
    color: '#3498DB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    flex: 2,
    padding: 14,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
