import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
} from 'react-native';
import TabBar from './TabBar';
import { productsAPI, ordersAPI } from '../services/api';
import { eventBus } from '../services/eventBus';
import type { Product, Order } from '../types';

const tabs = [
  { id: 'browse', title: 'Browse', icon: '🔍' },
  { id: 'cart', title: 'Cart', icon: '🛒' },
  { id: 'prescription', title: 'Rx', icon: '📄' },
  { id: 'orders', title: 'Orders', icon: '📦' },
  { id: 'profile', title: 'Profile', icon: '👤' },
];

const categories = [
  { id: 'medicines', name: 'Medicines', icon: '💊', color: '#FF6B6B' },
  { id: 'vitamins', name: 'Vitamins', icon: '🔬', color: '#4ECDC4' },
  { id: 'supplies', name: 'Supplies', icon: '🩺', color: '#45B7D1' },
  { id: 'wellness', name: 'Wellness', icon: '🧘', color: '#96CEB4' },
];

interface CartItem {
  product: Product;
  quantity: number;
}

export default function UserAppEnhanced() {
  const [activeTab, setActiveTab] = useState('browse');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

    const fallbackProducts: Product[] = [
      {
        id: 'fallback-1',
        merchantId: 'merchant-1',
        name: 'Paracetamol 500mg',
        description: 'Pain reliever and fever reducer',
        price: 5.99,
        currency: 'PHP',
        stock: 150,
        category: 'medicines',
        requiresPrescription: false,
        imageUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'fallback-2',
        merchantId: 'merchant-1',
        name: 'Vitamin C 1000mg',
        description: 'Immune system support',
        price: 12.5,
        currency: 'PHP',
        stock: 75,
        category: 'vitamins',
        requiresPrescription: false,
        imageUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

  // Fetch per-tab data
  useEffect(() => {
    if (activeTab === 'browse') {
      loadProducts();
    } else if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  // Keep products/cart in sync with merchant events regardless of active tab
  useEffect(() => {
    const upsertProduct = (prod: Product) => {
      console.log('UserAppEnhanced: upserting product', prod.id, prod.name);
      setProducts(prev => {
        const index = prev.findIndex(p => p.id === prod.id);
        if (index === -1) {
          console.log('UserAppEnhanced: adding new product', prod.id);
          return [...prev, prod];
        }
        console.log('UserAppEnhanced: updating existing product', prod.id);
        const next = [...prev];
        next[index] = { ...next[index], ...prod };
        return next;
      });
      setCart(prev => prev.map(item => item.product.id === prod.id ? { ...item, product: { ...item.product, ...prod } } : item));
    };

    const removeProduct = (productId: string) => {
      console.log('UserAppEnhanced: removing product', productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const unsubProductAdded = eventBus.subscribe('productAdded', (payload: { product: Product }) => {
      console.log('UserAppEnhanced: received productAdded event', payload.product.id);
      const normalized = { imageUrl: 'https://via.placeholder.com/150', ...payload.product } as Product;
      upsertProduct(normalized);
    });

    const unsubProductUpdated = eventBus.subscribe('productUpdated', (payload: { product: Product }) => {
      console.log('UserAppEnhanced: received productUpdated event', payload.product.id);
      const normalized = { imageUrl: 'https://via.placeholder.com/150', ...payload.product } as Product;
      upsertProduct(normalized);
    });

    const unsubProductDeleted = eventBus.subscribe('productDeleted', (payload: { productId: string }) => {
      console.log('UserAppEnhanced: received productDeleted event', payload.productId);
      removeProduct(payload.productId);
    });

    return () => {
      unsubProductAdded?.();
      unsubProductUpdated?.();
      unsubProductDeleted?.();
    };
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('UserAppEnhanced: loadProducts starting');
      const fetched = await productsAPI.getAll();
      console.log('UserAppEnhanced: fetched products from API:', fetched.length);
      const withDefaults = fetched.map(p => ({ imageUrl: p.imageUrl || 'https://via.placeholder.com/150', ...p }));

      if (withDefaults.length === 0) {
        console.warn('UserAppEnhanced: Products API returned empty list; waiting for products via eventBus.');
        console.log('UserAppEnhanced: keeping empty products state, will populate via events');
        setProducts([]);
      } else {
        console.log('UserAppEnhanced: setting fetched products:', withDefaults.length);
        setProducts(withDefaults);
      }
    } catch (error) {
      console.warn('UserAppEnhanced: Failed to load products; waiting for products via eventBus:', error);
      console.log('UserAppEnhanced: keeping empty products state, will populate via events');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Mock orders
      const mockOrders: Order[] = [
        {
          id: 'order-1',
          userId: 'user-1',
          merchantId: 'merchant-1',
          items: [{ productId: '1', quantity: 2, price: 5.99 }],
          status: 'in_transit',
          totalAmount: 11.98,
          currency: 'PHP',
          address: '123 Main St, City',
          paymentMethod: 'gcash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    Alert.alert('Success', `${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart first');
      return;
    }

    try {
      const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        userId: 'user-1', // Replace with actual user ID
        merchantId: cart[0].product.merchantId,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: getCartTotal(),
        currency: 'PHP',
        address: '123 Main St, City', // Get from user profile
        paymentMethod: 'gcash',
      };

      // await ordersAPI.create(order);
      setCart([]);
      setActiveTab('orders');
      Alert.alert('Success', 'Order placed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const renderBrowseContent = () => (
    <View style={styles.content}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search medicines, vitamins..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, { backgroundColor: cat.color }]}
            onPress={() => console.log('Filter by', cat.id)}
          >
            <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
            <Text style={styles.categoryChipText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Available Products</Text>
      {products.map(product => (
        <TouchableOpacity
          key={product.id}
          style={styles.productCard}
          onPress={() => setSelectedProduct(product)}
        >
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              {product.description}
            </Text>
            <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
            <Text style={styles.productStock}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(product)}
            disabled={product.stock === 0}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCartContent = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Shopping Cart ({cart.length})</Text>
      
      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList}>
            {cart.map(item => (
              <View key={item.product.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    ₱{item.product.price.toFixed(2)} × {item.quantity}
                  </Text>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, -1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.product.id)}
                  >
                    <Text style={styles.removeButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.cartSummary}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>₱{getCartTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderOrdersContent = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>My Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.placeholder}>No orders yet</Text>
      ) : (
        orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.orderItems}>
              {order.items.length} item(s)
            </Text>
            <Text style={styles.orderTotal}>Total: ₱{order.totalAmount.toFixed(2)}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'accepted': return '#3498DB';
      case 'in_transit': return '#9B59B6';
      case 'delivered': return '#27AE60';
      case 'cancelled': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return renderBrowseContent();
      case 'cart':
        return renderCartContent();
      case 'orders':
        return renderOrdersContent();
      case 'prescription':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Upload Prescription</Text>
            <TouchableOpacity style={styles.uploadCard}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadCard}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        );
      case 'profile':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileEmail}>john.doe@example.com</Text>
              <Text style={styles.profilePhone}>+63 912 345 6789</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MediDelivery</Text>
        {cart.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        )}
      </View>
      <ScrollView style={styles.scrollView}>
        {renderContent()}
      </ScrollView>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        color="#96CEB4"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#96CEB4',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  cartBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  searchBar: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  categoryScroll: { marginBottom: 20 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipIcon: { fontSize: 18, marginRight: 5 },
  categoryChipText: { color: '#FFF', fontWeight: 'bold' },
  productCard: {
    backgroundColor: '#FFFFFF',
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
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#96CEB4', marginTop: 5 },
  productStock: { fontSize: 12, color: '#7F8C8D', marginTop: 5 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#96CEB4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  emptyCart: { alignItems: 'center', marginTop: 50 },
  emptyCartIcon: { fontSize: 60, marginBottom: 20 },
  emptyCartText: { fontSize: 16, color: '#7F8C8D', marginBottom: 20 },
  shopButton: {
    backgroundColor: '#96CEB4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cartList: { flex: 1, marginBottom: 20 },
  cartItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  cartItemPrice: { fontSize: 14, color: '#7F8C8D', marginTop: 5 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#96CEB4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  quantityText: { marginHorizontal: 15, fontSize: 16, fontWeight: 'bold' },
  removeButton: { marginLeft: 10 },
  removeButtonText: { fontSize: 20 },
  cartSummary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#96CEB4' },
  checkoutButton: {
    backgroundColor: '#96CEB4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  orderStatus: { fontSize: 14, fontWeight: 'bold' },
  orderItems: { fontSize: 14, color: '#7F8C8D', marginBottom: 5 },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#96CEB4', marginBottom: 5 },
  orderDate: { fontSize: 12, color: '#7F8C8D' },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  uploadIcon: { fontSize: 40, marginBottom: 10 },
  uploadText: { fontSize: 16, color: '#2C3E50' },
  placeholder: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginTop: 50 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10 },
  profileEmail: { fontSize: 16, color: '#7F8C8D', marginBottom: 5 },
  profilePhone: { fontSize: 16, color: '#7F8C8D' },
});
