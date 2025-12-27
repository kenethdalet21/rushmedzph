import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import type {
  PaymentTransaction,
  PaymentMethod,
  PaymentStatus,
  Payout,
  Refund,
} from '../types';
import { AdminDataProvider } from '../contexts/AdminDataContext';
import paymentAPI from '../services/payments';

const { width } = Dimensions.get('window');

export default function AdminAppWithPayments() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payouts' | 'fraud'>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');

  useEffect(() => {
    loadAllData();
  }, [dateFilter, statusFilter, methodFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadPayouts(),
        loadRefunds(),
        loadAnalytics(),
        loadFraudAlerts(),
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const getDateRange = () => {
    const now = new Date();
    let fromDate: Date;

    switch (dateFilter) {
      case 'today':
        fromDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        fromDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        fromDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        fromDate = new Date(0); // All time
    }

    return {
      fromDate: fromDate.toISOString(),
      toDate: new Date().toISOString(),
    };
  };

  const loadTransactions = async () => {
    try {
      const { fromDate, toDate } = getDateRange();
      const filters: any = { fromDate, toDate };
      
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (methodFilter !== 'all') filters.paymentMethod = methodFilter;
      
      const data = await paymentAPI.transactions.getAll(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadPayouts = async () => {
    try {
      const data = await paymentAPI.payouts.getAll();
      setPayouts(data);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    }
  };

  const loadRefunds = async () => {
    try {
      const data = await paymentAPI.refunds.getAll();
      setRefunds(data);
    } catch (error) {
      console.error('Failed to load refunds:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { fromDate, toDate } = getDateRange();
      const data = await paymentAPI.analytics.getSummary({ fromDate, toDate });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadFraudAlerts = async () => {
    try {
      const data = await paymentAPI.analytics.getFraudAlerts();
      setFraudAlerts(data);
    } catch (error) {
      console.error('Failed to load fraud alerts:', error);
    }
  };

  // Calculate platform metrics
  const getPlatformMetrics = () => {
    const totalVolume = transactions.reduce((sum: number, tx: PaymentTransaction) => sum + tx.amount, 0);
    const totalFees = transactions.reduce((sum: number, tx: PaymentTransaction) => sum + (tx.processingFee ?? 0), 0);
    const completedTx = transactions.filter((tx: PaymentTransaction) => tx.status === 'completed');
    const failedTx = transactions.filter((tx: PaymentTransaction) => tx.status === 'failed');
    const pendingTx = transactions.filter((tx: PaymentTransaction) => ['pending', 'processing'].includes(tx.status));
    
    const successRate = transactions.length > 0 
      ? (completedTx.length / transactions.length) * 100 
      : 0;

    const totalRefunds = refunds
      .filter((r: Refund) => r.status === 'completed')
      .reduce((sum: number, r: Refund) => sum + r.amount, 0);

    const pendingPayouts = payouts
      .filter((p: Payout) => ['pending', 'processing'].includes(p.status))
      .reduce((sum: number, p: Payout) => sum + p.amount, 0);

    return {
      totalVolume,
      totalFees,
      completedCount: completedTx.length,
      failedCount: failedTx.length,
      pendingCount: pendingTx.length,
      successRate,
      totalRefunds,
      pendingPayouts,
      averageTransaction: transactions.length > 0 ? totalVolume / transactions.length : 0,
    };
  };

  type MethodStat = { method: PaymentMethod; count: number; volume: number; successRate: number };
  const getPaymentMethodStats = (): MethodStat[] => {
    const stats: Record<string, { count: number; volume: number; success: number }> = {};
    
    transactions.forEach((tx: PaymentTransaction) => {
      const method = tx.paymentMethod;
      if (!stats[method]) {
        stats[method] = { count: 0, volume: 0, success: 0 };
      }
      stats[method].count += 1;
      stats[method].volume += tx.amount;
      if (tx.status === 'completed') stats[method].success += 1;
    });

    return Object.entries(stats).map(([method, data]) => ({
      method: method as PaymentMethod,
      count: data.count,
      volume: data.volume,
      successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
    }));
  };

  type GatewayHealth = { gateway: string; uptime: number; totalTransactions: number; failureRate: number; status: 'healthy' | 'warning' };
  const getGatewayHealth = (): GatewayHealth[] => {
    const gateways: Record<string, { total: number; success: number; failed: number; avgTime: number }> = {};
    
    transactions.forEach((tx: PaymentTransaction) => {
      const gateway = tx.paymentMethod;
      if (!gateways[gateway]) {
        gateways[gateway] = { total: 0, success: 0, failed: 0, avgTime: 0 };
      }
      gateways[gateway].total += 1;
      if (tx.status === 'completed') gateways[gateway].success += 1;
      if (tx.status === 'failed') gateways[gateway].failed += 1;
    });

    return Object.entries(gateways).map(([gateway, data]) => ({
      gateway,
      uptime: data.total > 0 ? (data.success / data.total) * 100 : 0,
      totalTransactions: data.total,
      failureRate: data.total > 0 ? (data.failed / data.total) * 100 : 0,
      status: data.total > 0 && (data.success / data.total) > 0.95 ? 'healthy' : 'warning',
    }));
  };

  // Render Overview Tab
  const renderOverviewTab = () => {
    const metrics = getPlatformMetrics();
    const methodStats = getPaymentMethodStats();

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date Filter */}
        <View style={styles.filterBar}>
          {['today', 'week', 'month', 'all'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                dateFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setDateFilter(filter as any)}
            >
              <Text style={[
                styles.filterText,
                dateFilter === filter && styles.filterTextActive,
              ]}>
                {filter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#3498DB' }]}>
            <Text style={styles.metricValue}>
              {paymentAPI.utils.formatAmount(metrics.totalVolume, 'PHP')}
            </Text>
            <Text style={styles.metricLabel}>Total Volume</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#27AE60' }]}>
            <Text style={styles.metricValue}>{metrics.successRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Success Rate</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#F39C12' }]}>
            <Text style={styles.metricValue}>{metrics.completedCount}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#E74C3C' }]}>
            <Text style={styles.metricValue}>{metrics.failedCount}</Text>
            <Text style={styles.metricLabel}>Failed</Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fees</Text>
            <Text style={[styles.summaryValue, { color: '#27AE60' }]}>
              {paymentAPI.utils.formatAmount(metrics.totalFees, 'PHP')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Refunds Processed</Text>
            <Text style={[styles.summaryValue, { color: '#E74C3C' }]}>
              {paymentAPI.utils.formatAmount(metrics.totalRefunds, 'PHP')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending Payouts</Text>
            <Text style={[styles.summaryValue, { color: '#F39C12' }]}>
              {paymentAPI.utils.formatAmount(metrics.pendingPayouts, 'PHP')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Avg Transaction</Text>
            <Text style={styles.summaryValue}>
              {paymentAPI.utils.formatAmount(metrics.averageTransaction, 'PHP')}
            </Text>
          </View>
        </View>

        {/* Payment Method Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Methods Performance</Text>
          {methodStats.map((stat: MethodStat) => (
            <View key={stat.method} style={styles.methodRow}>
              <Text style={styles.methodIcon}>
                {paymentAPI.utils.getPaymentMethodIcon(stat.method)}
              </Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{stat.method.toUpperCase()}</Text>
                <Text style={styles.methodStats}>
                  {stat.count} transactions • {stat.successRate.toFixed(1)}% success
                </Text>
              </View>
              <Text style={styles.methodVolume}>
                {paymentAPI.utils.formatAmount(stat.volume, 'PHP')}
              </Text>
            </View>
          ))}
        </View>

        {/* Gateway Health */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gateway Health Status</Text>
          {getGatewayHealth().map((gateway: GatewayHealth) => (
            <View key={gateway.gateway} style={styles.gatewayRow}>
              <View style={styles.gatewayInfo}>
                <Text style={styles.gatewayName}>{gateway.gateway.toUpperCase()}</Text>
                <Text style={styles.gatewayStats}>
                  {gateway.totalTransactions} transactions • {gateway.failureRate.toFixed(1)}% failure rate
                </Text>
              </View>
              <View style={styles.gatewayHealth}>
                <View style={[
                  styles.healthIndicator,
                  { backgroundColor: gateway.status === 'healthy' ? '#27AE60' : '#F39C12' }
                ]} />
                <Text style={styles.uptimeText}>{gateway.uptime.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Render Transactions Tab
  const renderTransactionsTab = () => {
    const filteredTransactions: PaymentTransaction[] = transactions;

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'completed', 'pending', 'processing', 'failed', 'refunded'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status as any)}
              >
                <Text style={[
                  styles.filterText,
                  statusFilter === status && styles.filterTextActive,
                ]}>
                  {status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Method:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'gcash', 'paymaya', 'paypal', 'card', 'cod'].map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.filterChip,
                  methodFilter === method && styles.filterChipActive,
                ]}
                onPress={() => setMethodFilter(method as any)}
              >
                <Text style={[
                  styles.filterText,
                  methodFilter === method && styles.filterTextActive,
                ]}>
                  {method.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transaction List */}
        <Text style={styles.sectionTitle}>
          Transactions ({filteredTransactions.length})
        </Text>
        {filteredTransactions.map((tx: PaymentTransaction) => (
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
                <Text style={styles.transactionId}>
                  {tx.gatewayTransactionId || tx.id.slice(0, 16)}
                </Text>
              </View>
              <View style={styles.transactionAmounts}>
                <Text style={styles.transactionAmount}>
                  {paymentAPI.utils.formatAmount(tx.amount, tx.currency)}
                </Text>
                <Text style={[
                  styles.transactionStatus,
                  { color: paymentAPI.utils.getStatusColor(tx.status) }
                ]}>
                  {tx.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.transactionFooter}>
              <Text style={styles.transactionInfo}>
                Order: {tx.orderId.slice(0, 8)}
              </Text>
              <Text style={styles.transactionInfo}>
                Fee: {paymentAPI.utils.formatAmount(tx.processingFee ?? 0, tx.currency)}
              </Text>
              {(tx.refundedAmount ?? 0) > 0 && (
                <Text style={styles.refundBadge}>
                  Refunded: {paymentAPI.utils.formatAmount(tx.refundedAmount ?? 0, tx.currency)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render Payouts Tab
  const renderPayoutsTab = () => {
    const pendingPayouts = payouts.filter((p: Payout) => ['pending', 'processing'].includes(p.status));
    const completedPayouts = payouts.filter((p: Payout) => p.status === 'completed');
    const failedPayouts = payouts.filter((p: Payout) => p.status === 'failed');

    const totalPending = pendingPayouts.reduce((sum: number, p: Payout) => sum + p.amount, 0);
    const totalCompleted = completedPayouts.reduce((sum: number, p: Payout) => sum + p.amount, 0);

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Payout Summary */}
        <View style={styles.payoutSummary}>
          <View style={styles.payoutSummaryItem}>
            <Text style={styles.payoutSummaryLabel}>Pending Payouts</Text>
            <Text style={[styles.payoutSummaryValue, { color: '#F39C12' }]}>
              {paymentAPI.utils.formatAmount(totalPending, 'PHP')}
            </Text>
            <Text style={styles.payoutSummaryCount}>{pendingPayouts.length} requests</Text>
          </View>
          <View style={styles.payoutSummaryItem}>
            <Text style={styles.payoutSummaryLabel}>Completed</Text>
            <Text style={[styles.payoutSummaryValue, { color: '#27AE60' }]}>
              {paymentAPI.utils.formatAmount(totalCompleted, 'PHP')}
            </Text>
            <Text style={styles.payoutSummaryCount}>{completedPayouts.length} payouts</Text>
          </View>
        </View>

        {/* Pending Payouts */}
        {pendingPayouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending Approval ({pendingPayouts.length})</Text>
            {pendingPayouts.map((payout: Payout) => renderPayoutCard(payout))}
          </>
        )}

        {/* Failed Payouts */}
        {failedPayouts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: '#E74C3C' }]}>
              Failed Payouts ({failedPayouts.length})
            </Text>
            {failedPayouts.map((payout: Payout) => renderPayoutCard(payout))}
          </>
        )}

        {/* Recent Completed */}
        <Text style={styles.sectionTitle}>Recently Completed</Text>
        {completedPayouts.slice(0, 10).map((payout: Payout) => renderPayoutCard(payout))}
      </ScrollView>
    );
  };

  const renderPayoutCard = (payout: Payout) => (
    <View key={payout.id} style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View>
          <Text style={styles.payoutMerchant}>Merchant: {payout.merchantId.slice(0, 8)}</Text>
          <Text style={styles.payoutAmount}>
            {paymentAPI.utils.formatAmount(payout.amount, 'PHP')}
          </Text>
          <Text style={styles.payoutMethod}>{payout.payoutMethod.toUpperCase()}</Text>
        </View>
        <Text style={[
          styles.payoutStatus,
          { color: paymentAPI.utils.getStatusColor(payout.status) }
        ]}>
          {payout.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.payoutDate}>
        Requested: {new Date(payout.createdAt).toLocaleString()}
      </Text>
      {payout.scheduledDate && (
        <Text style={styles.payoutScheduled}>
          Scheduled: {new Date(payout.scheduledDate).toLocaleDateString()}
        </Text>
      )}
      {payout.completedDate && (
        <Text style={styles.payoutCompleted}>
          Completed: {new Date(payout.completedDate).toLocaleString()}
        </Text>
      )}
      <Text style={styles.payoutTransactions}>
        {payout.transactionIds.length} transactions
      </Text>
    </View>
  );

  // Render Fraud Detection Tab
  const renderFraudTab = () => {
    // Group transactions by risk level
    const suspiciousPatterns = [
      {
        type: 'Multiple Failed Attempts',
        count: transactions.filter((tx: PaymentTransaction) => tx.status === 'failed').length,
        severity: 'medium',
      },
      {
        type: 'High Value Transactions',
        count: transactions.filter((tx: PaymentTransaction) => tx.amount > 10000).length,
        severity: 'low',
      },
      {
        type: 'Rapid Sequential Transactions',
        count: 0, // Would need timestamp analysis
        severity: 'high',
      },
    ];

    const recentFailures: PaymentTransaction[] = transactions
      .filter((tx: PaymentTransaction) => tx.status === 'failed')
      .slice(0, 10);

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Fraud Alerts Summary */}
        <View style={styles.fraudSummary}>
          <Text style={styles.fraudTitle}>🛡️ Fraud Detection</Text>
          <Text style={styles.fraudSubtitle}>
            {fraudAlerts.length} active alerts
          </Text>
        </View>

        {/* Suspicious Patterns */}
        <Text style={styles.sectionTitle}>Suspicious Patterns</Text>
        {suspiciousPatterns.map((pattern, index) => (
          <View key={index} style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <Text style={styles.patternType}>{pattern.type}</Text>
              <View style={[
                styles.severityBadge,
                {
                  backgroundColor:
                    pattern.severity === 'high' ? '#E74C3C' :
                    pattern.severity === 'medium' ? '#F39C12' : '#3498DB'
                }
              ]}>
                <Text style={styles.severityText}>
                  {pattern.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.patternCount}>{pattern.count} incidents</Text>
          </View>
        ))}

        {/* Recent Failed Transactions */}
        <Text style={styles.sectionTitle}>Recent Failed Transactions</Text>
        {recentFailures.map((tx: PaymentTransaction) => (
          <View key={tx.id} style={styles.failedTxCard}>
            <View style={styles.failedTxHeader}>
              <Text style={styles.failedTxMethod}>
                {paymentAPI.utils.getPaymentMethodIcon(tx.paymentMethod)} {tx.paymentMethod.toUpperCase()}
              </Text>
              <Text style={styles.failedTxAmount}>
                {paymentAPI.utils.formatAmount(tx.amount, tx.currency)}
              </Text>
            </View>
            <Text style={styles.failedTxDate}>
              {new Date(tx.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.failedTxId}>TX: {tx.id.slice(0, 16)}</Text>
            {tx.gatewayResponse && (
              <Text style={styles.failedTxReason}>
                Reason: {JSON.stringify(tx.gatewayResponse).slice(0, 100)}
              </Text>
            )}
          </View>
        ))}

        {/* Gateway Status */}
        <Text style={styles.sectionTitle}>Gateway Monitoring</Text>
        {getGatewayHealth().map(gateway => (
          <View key={gateway.gateway} style={styles.gatewayMonitorCard}>
            <View style={styles.gatewayMonitorHeader}>
              <Text style={styles.gatewayMonitorName}>{gateway.gateway.toUpperCase()}</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: gateway.status === 'healthy' ? '#27AE60' : '#F39C12' }
              ]} />
            </View>
            <Text style={styles.gatewayMonitorUptime}>Uptime: {gateway.uptime.toFixed(2)}%</Text>
            <Text style={styles.gatewayMonitorFailure}>Failure Rate: {gateway.failureRate.toFixed(2)}%</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading payment analytics...</Text>
      </View>
    );
  }

  return (
    <AdminDataProvider>
      <View style={styles.wrapper}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              📊 Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
              💳 Transactions
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fraud' && styles.tabActive]}
            onPress={() => setActiveTab('fraud')}
          >
            <Text style={[styles.tabText, activeTab === 'fraud' && styles.tabTextActive]}>
              🛡️ Fraud
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
        {activeTab === 'payouts' && renderPayoutsTab()}
        {activeTab === 'fraud' && renderFraudTab()}
      </View>
    </AdminDataProvider>
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
  filterBar: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#7F8C8D',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  filterText: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  card: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  methodStats: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  methodVolume: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  gatewayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gatewayStats: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  gatewayHealth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  uptimeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMethod: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 10,
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
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  transactionInfo: {
    fontSize: 10,
    color: '#7F8C8D',
  },
  refundBadge: {
    fontSize: 9,
    color: '#9B59B6',
    backgroundColor: '#F4ECF7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payoutSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  payoutSummaryItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutSummaryLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  payoutSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  payoutSummaryCount: {
    fontSize: 10,
    color: '#7F8C8D',
  },
  payoutCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
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
    alignItems: 'flex-start',
  },
  payoutMerchant: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 2,
  },
  payoutMethod: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  payoutStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  payoutDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  payoutScheduled: {
    fontSize: 11,
    color: '#F39C12',
    marginBottom: 2,
  },
  payoutCompleted: {
    fontSize: 11,
    color: '#27AE60',
    marginBottom: 2,
  },
  payoutTransactions: {
    fontSize: 10,
    color: '#7F8C8D',
  },
  fraudSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fraudTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fraudSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  patternCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternType: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  patternCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  failedTxCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  failedTxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  failedTxMethod: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  failedTxAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  failedTxDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  failedTxId: {
    fontSize: 9,
    color: '#7F8C8D',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  failedTxReason: {
    fontSize: 10,
    color: '#E74C3C',
    fontStyle: 'italic',
  },
  gatewayMonitorCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gatewayMonitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gatewayMonitorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gatewayMonitorUptime: {
    fontSize: 12,
    color: '#27AE60',
    marginBottom: 2,
  },
  gatewayMonitorFailure: {
    fontSize: 12,
    color: '#E74C3C',
  },
});
