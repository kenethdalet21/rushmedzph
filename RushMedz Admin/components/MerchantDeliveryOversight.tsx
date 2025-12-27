import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import NavigationScreen from './NavigationScreen';
import * as Maps from '../services/maps';

interface MerchantDelivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  driverCoordinates?: Maps.Coordinates;
  pharmacyCoordinates: Maps.Coordinates;
  customerCoordinates: Maps.Coordinates;
  medicineCount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'ready' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled';
  priority: 'normal' | 'urgent' | 'express';
  createdAt: string;
  eta?: string;
}

interface MerchantDeliveryStats {
  today: number;
  inTransit: number;
  delivered: number;
  revenue: number;
  avgDeliveryTime: string;
}

interface FilterOptions {
  status: MerchantDelivery['status'] | 'all';
  priority: MerchantDelivery['priority'] | 'all';
  sortBy: 'recent' | 'priority' | 'eta';
}

export default function MerchantDeliveryOversight() {
  const [deliveries, setDeliveries] = useState<MerchantDelivery[]>([]);
  const [stats, setStats] = useState<MerchantDeliveryStats>({
    today: 0,
    inTransit: 0,
    delivered: 0,
    revenue: 0,
    avgDeliveryTime: '0 min',
  });
  const [selectedDelivery, setSelectedDelivery] = useState<MerchantDelivery | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    sortBy: 'recent',
  });
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = () => {
    setLoading(true);
    setTimeout(() => {
      const mockDeliveries: MerchantDelivery[] = [
        {
          id: 'MER001',
          orderId: 'ORD001',
          customerName: 'Juan Dela Cruz',
          customerPhone: '09123456789',
          customerLocation: 'Manila City, Philippines',
          driverName: 'John Driver',
          driverPhone: '+639123456789',
          driverRating: 4.8,
          driverCoordinates: { latitude: 14.5950, longitude: 120.9880 },
          pharmacyCoordinates: { latitude: 14.5515, longitude: 120.9881 },
          customerCoordinates: { latitude: 14.5995, longitude: 120.9842 },
          medicineCount: 3,
          totalAmount: 250,
          status: 'in-transit',
          priority: 'normal',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          eta: Maps.calculateETA(12),
        },
        {
          id: 'MER002',
          orderId: 'ORD002',
          customerName: 'Maria Santos',
          customerPhone: '09198765432',
          customerLocation: 'Quezon City, Philippines',
          driverName: 'Maria Driver',
          driverPhone: '+639198765432',
          driverRating: 4.9,
          pharmacyCoordinates: { latitude: 14.6349, longitude: 121.0388 },
          customerCoordinates: { latitude: 14.6500, longitude: 121.0600 },
          medicineCount: 5,
          totalAmount: 450,
          status: 'assigned',
          priority: 'urgent',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'MER003',
          orderId: 'ORD003',
          customerName: 'Pedro Garcia',
          customerPhone: '09111111111',
          customerLocation: 'Pasig City, Philippines',
          driverName: 'Juan Driver',
          driverPhone: '+639765432100',
          driverRating: 4.7,
          pharmacyCoordinates: { latitude: 14.5790, longitude: 121.5598 },
          customerCoordinates: { latitude: 14.5900, longitude: 121.5700 },
          medicineCount: 2,
          totalAmount: 180,
          status: 'delivered',
          priority: 'normal',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'MER004',
          orderId: 'ORD004',
          customerName: 'Ana Reyes',
          customerPhone: '09222222222',
          customerLocation: 'Makati City, Philippines',
          driverName: 'Luis Driver',
          driverPhone: '+639222222222',
          driverRating: 4.6,
          pharmacyCoordinates: { latitude: 14.5794, longitude: 121.0238 },
          customerCoordinates: { latitude: 14.5550, longitude: 121.0150 },
          medicineCount: 4,
          totalAmount: 380,
          status: 'ready',
          priority: 'express',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ];

      setDeliveries(mockDeliveries);
      setStats({
        today: mockDeliveries.length,
        inTransit: mockDeliveries.filter((d) => d.status === 'in-transit').length,
        delivered: mockDeliveries.filter((d) => d.status === 'delivered').length,
        revenue: mockDeliveries.reduce((sum, d) => sum + d.totalAmount, 0),
        avgDeliveryTime: '28 minutes',
      });
      setLoading(false);
    }, 800);
  };

  const handleViewDriver = (delivery: MerchantDelivery) => {
    if (!delivery.driverCoordinates) {
      Alert.alert('Driver Location', 'Driver location is not yet available.');
      return;
    }

    Alert.alert(
      `${delivery.driverName} - ⭐${delivery.driverRating}`,
      `Location: ${delivery.driverCoordinates?.latitude.toFixed(4)}, ${delivery.driverCoordinates?.longitude.toFixed(4)}\n\nPhone: ${delivery.driverPhone}`,
      [
        {
          text: 'Track on Map',
          onPress: () => {
            setSelectedDelivery(delivery);
            setShowNavigation(true);
          },
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const getFilteredAndSortedDeliveries = () => {
    let filtered = [...deliveries];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((d) => d.status === filters.status);
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter((d) => d.priority === filters.priority);
    }

    // Sort
    switch (filters.sortBy) {
      case 'priority':
        const priorityOrder = { express: 0, urgent: 1, normal: 2 };
        filtered.sort(
          (a, b) =>
            (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
        );
        break;
      case 'eta':
        filtered.sort((a, b) => {
          const aTime = parseInt(a.eta?.split(' ')[0] || '999');
          const bTime = parseInt(b.eta?.split(' ')[0] || '999');
          return aTime - bTime;
        });
        break;
      case 'recent':
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#f39c12',
      confirmed: '#3498db',
      ready: '#2ecc71',
      assigned: '#e67e22',
      'in-transit': '#e74c3c',
      delivered: '#27ae60',
      cancelled: '#95a5a6',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✓',
      ready: '📦',
      assigned: '🚗',
      'in-transit': '🚗💨',
      delivered: '✅',
      cancelled: '❌',
    };
    return icons[status] || '📍';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      normal: '#3498db',
      urgent: '#e74c3c',
      express: '#e67e22',
    };
    return colors[priority] || '#95a5a6';
  };

  if (showNavigation && selectedDelivery && selectedDelivery.driverCoordinates) {
    return (
      <NavigationScreen
        originLatitude={selectedDelivery.driverCoordinates.latitude}
        originLongitude={selectedDelivery.driverCoordinates.longitude}
        destinationLatitude={selectedDelivery.customerCoordinates.latitude}
        destinationLongitude={selectedDelivery.customerCoordinates.longitude}
        originLabel={`Driver - ${selectedDelivery.driverName}`}
        destinationLabel={selectedDelivery.customerLocation}
        userType="merchant"
        onClose={() => setShowNavigation(false)}
      />
    );
  }

  const filteredDeliveries = getFilteredAndSortedDeliveries();

  const renderDeliveryItem = ({ item: delivery }: { item: MerchantDelivery }) => (
    <TouchableOpacity
      style={[styles.deliveryCard, { borderLeftColor: getStatusColor(delivery.status) }]}
      onPress={() => setExpandedDeliveryId(expandedDeliveryId === delivery.id ? null : delivery.id)}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderId}>#{delivery.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(delivery.status)}</Text>
            <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(delivery.priority) }]}>
            <Text style={styles.priorityText}>{delivery.priority.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.amount}>₱{delivery.totalAmount}</Text>
      </View>

      {/* Quick Info Row */}
      <View style={styles.quickInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>👤</Text>
          <Text style={styles.infoValue}>{delivery.customerName}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>💊</Text>
          <Text style={styles.infoValue}>{delivery.medicineCount} items</Text>
        </View>
      </View>

      {/* Driver Info */}
      <TouchableOpacity
        style={styles.driverCard}
        onPress={() => handleViewDriver(delivery)}
      >
        <View style={styles.driverInfoLeft}>
          <Text style={styles.driverName}>🚗 {delivery.driverName}</Text>
          <Text style={styles.driverRating}>⭐ {delivery.driverRating}</Text>
        </View>
        <View style={styles.driverPhone}>
          <Text style={styles.driverPhoneText}>{delivery.driverPhone}</Text>
          <Text style={styles.trackText}>→ Track</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expandedDeliveryId === delivery.id && (
        <>
          {/* Locations */}
          <View style={styles.expandedSection}>
            <Text style={styles.sectionTitle}>📍 Delivery Route</Text>
            <View style={styles.locationRoute}>
              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>📦</Text>
                <Text style={styles.routeText}>{delivery.pharmacyCoordinates.latitude.toFixed(4)}, {delivery.pharmacyCoordinates.longitude.toFixed(4)}</Text>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>🏠</Text>
                <Text style={styles.routeText}>{delivery.customerLocation}</Text>
              </View>
            </View>
          </View>

          {/* Distance & ETA */}
          {delivery.eta && (
            <View style={styles.expandedSection}>
              <Text style={styles.sectionTitle}>⏱️ Delivery Time</Text>
              <View style={styles.etaInfo}>
                <View style={styles.etaItem}>
                  <Text style={styles.etaLabel}>Distance</Text>
                  <Text style={styles.etaValue}>
                    {Maps.formatDistance(
                      Maps.calculateDistance(delivery.pharmacyCoordinates, delivery.customerCoordinates)
                    )}
                  </Text>
                </View>
                <View style={styles.etaItem}>
                  <Text style={styles.etaLabel}>ETA</Text>
                  <Text style={[styles.etaValue, { color: '#e74c3c' }]}>{delivery.eta}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Customer Contact */}
          <View style={styles.expandedSection}>
            <Text style={styles.sectionTitle}>👤 Customer Details</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{delivery.customerName}</Text>
              <Text style={styles.contactPhone}>📱 {delivery.customerPhone}</Text>
              <Text style={styles.contactLocation}>📍 {delivery.customerLocation}</Text>
            </View>
          </View>

          {/* Action Button */}
          {delivery.status === 'in-transit' && delivery.driverCoordinates && (
            <TouchableOpacity
              style={styles.expandedActionButton}
              onPress={() => {
                setSelectedDelivery(delivery);
                setShowNavigation(true);
              }}
            >
              <Text style={styles.expandedActionText}>🗺️ Track Driver Location</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </TouchableOpacity>
  );

  const statusOptions: Array<MerchantDelivery['status'] | 'all'> = [
    'all',
    'pending',
    'ready',
    'in-transit',
    'delivered',
  ];

  const priorityOptions: Array<MerchantDelivery['priority'] | 'all'> = ['all', 'normal', 'urgent', 'express'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Delivery Oversight</Text>
        <Text style={styles.headerSubtitle}>Real-time tracking & management</Text>
      </View>

      {/* Stats Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>{stats.today}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>In Transit</Text>
          <Text style={styles.statValue}>{stats.inTransit}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Delivered</Text>
          <Text style={styles.statValue}>{stats.delivered}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>₱{stats.revenue}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Time</Text>
          <Text style={styles.statValue}>{stats.avgDeliveryTime}</Text>
        </View>
      </ScrollView>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filters.status === status && styles.filterChipActive,
              ]}
              onPress={() => setFilters({ ...filters, status })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.status === status && styles.filterChipTextActive,
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Priority Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Priority</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {priorityOptions.map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterChip,
                filters.priority === priority && styles.filterChipActive,
              ]}
              onPress={() => setFilters({ ...filters, priority })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.priority === priority && styles.filterChipTextActive,
                ]}
              >
                {priority.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Sort By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['recent', 'priority', 'eta'] as const).map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterChip,
                filters.sortBy === sort && styles.filterChipActive,
              ]}
              onPress={() => setFilters({ ...filters, sortBy: sort })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.sortBy === sort && styles.filterChipTextActive,
                ]}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Deliveries List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      ) : filteredDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No deliveries found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          refreshing={loading}
          onRefresh={loadDeliveries}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#e74c3c',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e74c3c',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  orderId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  priorityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  amount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  quickInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 11,
    color: '#2c3e50',
    fontWeight: '500',
  },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  driverInfoLeft: {
    flex: 1,
  },
  driverName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 11,
    color: '#e74c3c',
  },
  driverPhone: {
    alignItems: 'flex-end',
  },
  driverPhoneText: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  trackText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3498db',
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  locationRoute: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  routeIcon: {
    fontSize: 14,
  },
  routeText: {
    fontSize: 11,
    color: '#34495e',
    flex: 1,
  },
  routeConnector: {
    height: 16,
    width: 2,
    backgroundColor: '#bdc3c7',
    marginLeft: 6,
    marginVertical: 2,
  },
  etaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff9e6',
    borderRadius: 6,
    padding: 8,
  },
  etaItem: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  etaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  contactInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    padding: 8,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 11,
    color: '#3498db',
    marginBottom: 2,
  },
  contactLocation: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  expandedActionButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
  },
  expandedActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
