import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface TopProduct {
  name: string;
  sales: number;
  units: number;
}

export default function SalesAnalyticsTab() {
  const [dailySales, setDailySales] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setDailySales([
        { period: 'Today', revenue: 18450.50, orders: 83, avgOrderValue: 222.30 },
        { period: 'Yesterday', revenue: 21340.25, orders: 95, avgOrderValue: 224.64 },
        { period: 'This Week', revenue: 145250.50, orders: 642, avgOrderValue: 226.24 },
        { period: 'This Month', revenue: 580420.75, orders: 2547, avgOrderValue: 227.89 },
      ]);
      setTopProducts([
        { name: '💊 Paracetamol 500mg', sales: 45230.00, units: 3420 },
        { name: '💊 Biogesic', sales: 38150.50, units: 2890 },
        { name: '💊 Vitamin C 1000mg', sales: 32670.25, units: 2456 },
        { name: '💊 Amoxicillin', sales: 28450.75, units: 1987 },
        { name: '💊 Loperamide', sales: 22340.30, units: 1654 },
      ]);
      setLoading(false);
    }, 750);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sales Analytics</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Revenue Overview</Text>
        {dailySales.map((item, index) => (
          <View key={index} style={styles.salesCard}>
            <Text style={styles.periodLabel}>{item.period}</Text>
            <View style={styles.salesRow}>
              <View style={styles.salesItem}>
                <Text style={styles.salesValue}>₱{item.revenue.toLocaleString()}</Text>
                <Text style={styles.salesLabel}>Revenue</Text>
              </View>
              <View style={styles.salesItem}>
                <Text style={styles.salesValue}>{item.orders}</Text>
                <Text style={styles.salesLabel}>Orders</Text>
              </View>
              <View style={styles.salesItem}>
                <Text style={styles.salesValue}>₱{item.avgOrderValue.toFixed(2)}</Text>
                <Text style={styles.salesLabel}>Avg Order</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Top Products</Text>
        {topProducts.map((item, index) => (
          <View key={index} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productRank}>#{index + 1}</Text>
              <Text style={styles.productName}>{item.name}</Text>
            </View>
            <View style={styles.productStats}>
              <Text style={styles.productSales}>₱{item.sales.toLocaleString()} sales</Text>
              <Text style={styles.productUnits}>{item.units} units</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Payment Methods</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentMethod}>💳 GCash</Text>
            <Text style={styles.paymentPercent}>45%</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentMethod}>💳 PayMaya</Text>
            <Text style={styles.paymentPercent}>28%</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentMethod}>💵 Cash on Delivery</Text>
            <Text style={styles.paymentPercent}>18%</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentMethod}>💳 Credit Card</Text>
            <Text style={styles.paymentPercent}>9%</Text>
          </View>
        </View>
      </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  salesCard: {
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
  periodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498DB',
    marginBottom: 12,
  },
  salesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  salesItem: {
    alignItems: 'center',
  },
  salesValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  salesLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F39C12',
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productSales: {
    fontSize: 14,
    color: '#2ECC71',
    fontWeight: '600',
  },
  productUnits: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#2C3E50',
  },
  paymentPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498DB',
  },
});