import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import TabBar from './TabBar';
import { productsAPI, ordersAPI, analyticsAPI } from '../services/api';
import type { Product, Order } from '../types';

const tabs = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'products', title: 'Products', icon: '💊' },
  { id: 'orders', title: 'Orders', icon: '📋' },
  { id: 'inventory', title: 'Inventory', icon: '📦' },
  { id: 'analytics', title: 'Analytics', icon: '💰' },
];

interface DashboardStats {
  todaySales: number;
  pendingOrders: number;
  lowStockItems: number;
  totalProducts: number;
}

export default function MerchantAppEnhanced() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });

  const merchantId = 'merchant-1'; // Replace with actual merchant ID

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      // Mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          merchantId,
          name: 'Paracetamol 500mg',
          description: 'Pain reliever',
          price: 5.99,
          currency: 'PHP',
          stock: 150,
          category: 'medicines',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          merchantId,
          name: 'Vitamin C 1000mg',
          description: 'Immune support',
          price: 12.50,
          currency: 'PHP',
          stock: 5, // Low stock
          category: 'vitamins',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockOrders: Order[] = [
        {
          id: 'order-1',
          userId: 'user-1',
          merchantId,
          items: [{ productId: '1', quantity: 2, price: 5.99 }],
          status: 'pending',
          totalAmount: 11.98,
          currency: 'PHP',
          address: '123 Main St',
          paymentMethod: 'gcash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'order-2',
          userId: 'user-2',
          merchantId,
          items: [{ productId: '2', quantity: 1, price: 12.50 }],
          status: 'accepted',
          totalAmount: 12.50,
          currency: 'PHP',
          address: '456 Oak Ave',
          paymentMethod: 'cod',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setProducts(mockProducts);
      setOrders(mockOrders);

      // Calculate stats
      const pendingCount = mockOrders.filter(o => o.status === 'pending').length;
      const lowStockCount = mockProducts.filter(p => p.stock < 10).length;
      const todaySales = mockOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        todaySales,
        pendingOrders: pendingCount,
        lowStockItems: lowStockCount,
        totalProducts: mockProducts.length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        merchantId,
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        currency: 'PHP',
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
      };

      // await productsAPI.create(product);
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: '', stock: '', category: '' });
      loadData();
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      // await productsAPI.update(productId, { stock: newStock });
      loadData();
      Alert.alert('Success', 'Stock updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      // await ordersAPI.updateStatus(orderId, status);
      loadData();
      Alert.alert('Success', `Order ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const renderDashboard = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#96CEB4' }]}>
          <Text style={styles.statValue}>₱{stats.todaySales.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Today's Sales</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F39C12' }]}>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E74C3C' }]}>
          <Text style={styles.statValue}>{stats.lowStockItems}</Text>
          <Text style={styles.statLabel}>Low Stock Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3498DB' }]}>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {orders.slice(0, 3).map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>#{order.id.slice(0, 8)}</Text>
            <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.orderAmount}>₱{order.totalAmount.toFixed(2)}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderProducts = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Products ({products.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddProduct(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {products.map(product => (
        <View key={product.id} style={styles.productCard}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
            <Text
              style={[
                styles.productStock,
                product.stock < 10 && styles.productStockLow,
              ]}
            >
              Stock: {product.stock}
            </Text>
          </View>
          <View style={styles.productActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUpdateStock(product.id, product.stock + 10)}
            >
              <Text style={styles.actionButtonText}>+ Stock</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={showAddProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Product Name *"
              value={newProduct.name}
              onChangeText={text => setNewProduct({ ...newProduct, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newProduct.description}
              onChangeText={text => setNewProduct({ ...newProduct, description: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Price *"
              value={newProduct.price}
              onChangeText={text => setNewProduct({ ...newProduct, price: text })}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Stock Quantity *"
              value={newProduct.stock}
              onChangeText={text => setNewProduct({ ...newProduct, stock: text })}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={newProduct.category}
              onChangeText={text => setNewProduct({ ...newProduct, category: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddProduct(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddProduct}
              >
                <Text style={styles.saveButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderOrders = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Orders Management</Text>
      
      {orders.map(order => (
        <View key={order.id} style={styles.orderDetailCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{order.id.slice(0, 8)}</Text>
            <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.orderInfo}>Items: {order.items.length}</Text>
          <Text style={styles.orderInfo}>Total: ₱{order.totalAmount.toFixed(2)}</Text>
          <Text style={styles.orderInfo}>Payment: {order.paymentMethod.toUpperCase()}</Text>
          <Text style={styles.orderInfo}>Address: {order.address}</Text>
          
          {order.status === 'pending' && (
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={[styles.orderActionButton, { backgroundColor: '#27AE60' }]}
                onPress={() => handleOrderStatusUpdate(order.id, 'accepted')}
              >
                <Text style={styles.orderActionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderActionButton, { backgroundColor: '#E74C3C' }]}
                onPress={() => handleOrderStatusUpdate(order.id, 'cancelled')}
              >
                <Text style={styles.orderActionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {order.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.orderActionButton, { backgroundColor: '#3498DB' }]}
              onPress={() => handleOrderStatusUpdate(order.id, 'picked_up')}
            >
              <Text style={styles.orderActionButtonText}>Mark as Picked Up</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'accepted': return '#3498DB';
      case 'picked_up': return '#9B59B6';
      case 'in_transit': return '#9B59B6';
      case 'delivered': return '#27AE60';
      case 'cancelled': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProducts();
      case 'orders':
        return renderOrders();
      case 'inventory':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Inventory Management</Text>
            {products
              .filter(p => p.stock < 20)
              .map(product => (
                <View key={product.id} style={styles.inventoryCard}>
                  <Text style={styles.inventoryName}>{product.name}</Text>
                  <Text
                    style={[
                      styles.inventoryStock,
                      product.stock < 10 && styles.inventoryStockCritical,
                    ]}
                  >
                    {product.stock} units
                    {product.stock < 10 && ' ⚠️'}
                  </Text>
                  <TouchableOpacity
                    style={styles.restockButton}
                    onPress={() => handleUpdateStock(product.id, product.stock + 50)}
                  >
                    <Text style={styles.restockButtonText}>Restock</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        );
      case 'analytics':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Sales Analytics</Text>
            
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>This Week</Text>
              <Text style={styles.analyticsValue}>₱{(stats.todaySales * 7).toFixed(2)}</Text>
              <Text style={styles.analyticsSubtext}>Estimated weekly revenue</Text>
            </View>
            
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Best Selling Product</Text>
              <Text style={styles.analyticsValue}>{products[0]?.name || 'N/A'}</Text>
              <Text style={styles.analyticsSubtext}>Top performer this month</Text>
            </View>
            
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Order Completion Rate</Text>
              <Text style={styles.analyticsValue}>87%</Text>
              <Text style={styles.analyticsSubtext}>Orders successfully delivered</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Merchant Dashboard</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {renderContent()}
      </ScrollView>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        color="#4ECDC4"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  topHeader: { backgroundColor: '#4ECDC4', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  statLabel: { fontSize: 14, color: '#FFF' },
  orderCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  orderStatus: { fontSize: 14, fontWeight: 'bold' },
  orderAmount: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', marginBottom: 5 },
  orderDate: { fontSize: 12, color: '#7F8C8D' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  productCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  productDescription: { fontSize: 14, color: '#7F8C8D', marginTop: 5 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', marginTop: 5 },
  productStock: { fontSize: 14, color: '#27AE60', marginTop: 5 },
  productStockLow: { color: '#E74C3C', fontWeight: 'bold' },
  productActions: { justifyContent: 'center' },
  actionButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  actionButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20 },
  input: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: '#E74C3C' },
  cancelButtonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#4ECDC4' },
  saveButtonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  orderDetailCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  orderInfo: { fontSize: 14, color: '#2C3E50', marginBottom: 5 },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  orderActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  orderActionButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  inventoryCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  inventoryName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', flex: 1 },
  inventoryStock: { fontSize: 14, color: '#27AE60', marginRight: 10 },
  inventoryStockCritical: { color: '#E74C3C', fontWeight: 'bold' },
  restockButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  restockButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  analyticsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  analyticsTitle: { fontSize: 16, color: '#7F8C8D', marginBottom: 10 },
  analyticsValue: { fontSize: 28, fontWeight: 'bold', color: '#4ECDC4', marginBottom: 5 },
  analyticsSubtext: { fontSize: 14, color: '#7F8C8D' },
});
