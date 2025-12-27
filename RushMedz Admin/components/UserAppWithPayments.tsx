import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import type { 
  Product, 
  Order, 
  PaymentMethod, 
  PaymentTransaction,
} from '../types';
import { productsAPI, ordersAPI } from '../services/api';
import { eventBus } from '../services/eventBus';
import paymentAPI from '../services/payments';

interface CartItem extends Product {
  quantity: number;
}

export default function UserAppWithPayments() {
  const [activeTab, setActiveTab] = useState<'shop' | 'cart' | 'orders' | 'payments'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; createdAt: string }>>([]);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
    const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod>('cod');

  const categories = ['all', 'prescription', 'otc', 'supplements', 'personal_care', 'medical_devices'];
  const userId = 'user123'; // Replace with actual user ID from auth context

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

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadTransactions();
    // Subscribe to admin composed notifications
    const unsubscribe = eventBus.subscribe('notificationComposed', (payload: { title: string; message: string }) => {
      setNotifications(prev => [
        { id: Math.random().toString(36).slice(2), title: payload.title, message: payload.message, createdAt: new Date().toISOString() },
        ...prev,
      ].slice(0, 10));
    });

    const upsertProduct = (prod: Product) => {
      setProducts(prev => {
        const index = prev.findIndex(p => p.id === prod.id);
        if (index === -1) return [...prev, prod];
        const next = [...prev];
        next[index] = { ...next[index], ...prod };
        return next;
      });
      // Also reconcile cart with latest details
      setCart(prev => prev.map(item => item.id === prod.id ? { ...item, ...prod, quantity: item.quantity } : item));
    };

    const removeProduct = (productId: string) => {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setCart(prev => prev.filter(item => item.id !== productId));
    };

    const unsubProductAdded = eventBus.subscribe('productAdded', (payload) => {
      const normalized = { imageUrl: 'https://via.placeholder.com/150', ...payload.product } as Product;
      upsertProduct(normalized);
    });

    const unsubProductUpdated = eventBus.subscribe('productUpdated', (payload) => {
      const normalized = { imageUrl: 'https://via.placeholder.com/150', ...payload.product } as Product;
      upsertProduct(normalized);
    });

    const unsubProductDeleted = eventBus.subscribe('productDeleted', (payload) => {
      removeProduct(payload.productId);
    });
    return () => {
      unsubscribe?.();
      unsubProductAdded?.();
      unsubProductUpdated?.();
      unsubProductDeleted?.();
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      const withDefaults = data.map(p => ({ imageUrl: p.imageUrl || 'https://via.placeholder.com/150', ...p }));

      if (withDefaults.length === 0) {
        console.warn('Products API returned empty list; using fallback catalog for shop.');
        setProducts(fallbackProducts);
      } else {
        setProducts(withDefaults);
      }
    } catch (error) {
      console.warn('Failed to load products; using fallback catalog:', error);
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll({ userId });
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await paymentAPI.transactions.getAll({ userId });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    Alert.alert('Success', `${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first');
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setProcessingPayment(true);

      // Create order first
      const orderData = {
        userId,
        merchantId: cart[0].merchantId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: calculateTotal(),
        deliveryAddress: '123 Main St, City', // Get from user profile
        status: 'pending' as const,
        paymentMethod: selectedPaymentMethod,
        currency: 'PHP' as const, // Fixed to match the expected type
        address: '123 Main St, City',
      };

      const newOrder = await ordersAPI.create(orderData);
      setCurrentOrderId(newOrder.id);

      // Initiate payment
      const paymentData = {
        orderId: newOrder.id,
        userId,
        merchantId: newOrder.merchantId,
        amount: newOrder.totalAmount,
        currency: 'PHP',
        paymentMethod: selectedPaymentMethod,
        returnUrl: 'epharma://payment-success',
        metadata: {
          orderItems: cart.length,
          customerEmail: 'user@example.com', // Get from user profile
        },
      };

      const paymentResponse = await paymentAPI.processing.initiatePayment(paymentData);
    setCurrentPaymentAmount(paymentData.amount);
    setCurrentPaymentMethod(paymentData.paymentMethod);
  eventBus.publish('paymentInitiated', { transactionId: paymentResponse.transactionId, orderId: newOrder.id, amount: newOrder.totalAmount, method: selectedPaymentMethod });

      // Handle different payment methods
      if (selectedPaymentMethod === 'cod') {
        // COD doesn't need online payment
        await handlePaymentSuccess(paymentResponse.transactionId);
      } else if (paymentResponse.paymentUrl) {
        // For GCash, PayMaya, PayPal - open payment URL
        Alert.alert(
          'Complete Payment',
          `Please complete your payment. Transaction ID: ${paymentResponse.transactionId}`,
          [
            {
              text: 'Open Payment Page',
              onPress: () => {
                // In real app, open web browser or WebView
                console.log('Opening:', paymentResponse.paymentUrl);
                // Simulate payment completion after 2 seconds
                setTimeout(() => handlePaymentSuccess(paymentResponse.transactionId), 2000);
              },
            },
          ]
        );
      } else if (paymentResponse.qrCode) {
        // Show QR code for scanning
        Alert.alert('Scan QR Code', `Transaction: ${paymentResponse.transactionId}`);
      }
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process payment');
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      // Verify payment
      const verification = await paymentAPI.processing.verifyPayment(transactionId);
      
      if (verification.verified && verification.status === 'completed') {
           eventBus.publish('paymentCompleted', { transactionId, orderId: currentOrderId || '', amount: currentPaymentAmount, method: currentPaymentMethod });
        Alert.alert('Success', 'Payment completed successfully!');
        
        // Clear cart and refresh data
        setCart([]);
        await loadOrders();
        await loadTransactions();
        
        // Close modal
        setShowPaymentModal(false);
        setActiveTab('orders');
      } else {
        Alert.alert('Payment Pending', 'Your payment is being processed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setProcessingPayment(false);
      setCurrentOrderId(null);
    }
  };

  const requestRefund = async (transaction: PaymentTransaction) => {
    Alert.alert(
      'Request Refund',
      `Refund ${paymentAPI.utils.formatAmount(transaction.amount, transaction.currency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await paymentAPI.refunds.create({
                transactionId: transaction.id,
                orderId: transaction.orderId,
                amount: transaction.amount,
                reason: 'Customer requested refund',
                status: 'pending',
                processedBy: userId,
                currency: transaction.currency,
              });
              eventBus.publish('refundRequested', {
                transactionId: transaction.id,
                orderId: transaction.orderId,
                amount: transaction.amount,
                reason: 'Customer requested refund',
              });
              Alert.alert('Success', 'Refund request submitted');
              loadTransactions();
            } catch (error) {
              Alert.alert('Error', 'Failed to request refund');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false); // Added null check for description
    return matchesCategory && matchesSearch;
  });

  const paymentMethods: { method: PaymentMethod; name: string; icon: string; enabled: boolean }[] = [
    { method: 'gcash', name: 'GCash', icon: '💳', enabled: true },
    { method: 'paymaya', name: 'PayMaya', icon: '💰', enabled: true },
    { method: 'paypal', name: 'PayPal', icon: '🅿️', enabled: true },
    { method: 'card', name: 'Credit/Debit Card', icon: '💳', enabled: true },
    { method: 'cod', name: 'Cash on Delivery', icon: '💵', enabled: true },
  ];

  // Render Shop Tab
  const renderShopTab = () => (
    <ScrollView style={styles.container}>
      {/* Inline notifications banner */}
      {notifications.length > 0 && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeTitle}>Notifications</Text>
          {notifications.slice(0, 3).map(n => (
            <View key={n.id} style={styles.noticeItem}>
              <Text style={styles.noticeItemTitle}>{n.title}</Text>
              <Text style={styles.noticeItemMessage}>{n.message}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search medicines..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === cat && styles.categoryTextActive
            ]}>
              {cat.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={styles.loader} />
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.imageUrl || '' }} style={styles.productImage} />
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
              <Text style={styles.productStock}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Text>
              <TouchableOpacity
                style={[styles.addButton, product.stock === 0 && styles.addButtonDisabled]}
                onPress={() => addToCart(product)}
                disabled={product.stock === 0}
              >
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // Render Cart Tab
  const renderCartTab = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Shopping Cart ({cart.length} items)</Text>
      
      {cart.length === 0 ? (
        <Text style={styles.emptyText}>Your cart is empty</Text>
      ) : (
        <>
          {cart.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.imageUrl || '' }} style={styles.cartItemImage} />
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>₱{item.price.toFixed(2)}</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.cartSummary}>
            <Text style={styles.cartTotal}>Total: ₱{calculateTotal().toFixed(2)}</Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  // Render Orders Tab
  const renderOrdersTab = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>My Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders yet</Text>
      ) : (
        orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.orderAmount}>₱{order.totalAmount.toFixed(2)}</Text>
            <Text style={styles.orderPayment}>
              Payment: {order.paymentMethod?.toUpperCase() || 'N/A'}
            </Text>
            {order.paymentStatus && (
              <Text style={[styles.paymentStatus, { color: paymentAPI.utils.getStatusColor(order.paymentStatus) }]}>
                Payment: {order.paymentStatus.toUpperCase()}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  // Render Payments Tab
  const renderPaymentsTab = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet</Text>
      ) : (
        transactions.map(tx => (
          <View key={tx.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionIcon}>
                {paymentAPI.utils.getPaymentMethodIcon(tx.paymentMethod)}
              </Text>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionMethod}>
                  {tx.paymentMethod.toUpperCase()}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(tx.createdAt).toLocaleString()}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.transactionAmountText}>
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
            <Text style={styles.transactionId}>TX: {tx.gatewayTransactionId || tx.id.slice(0, 16)}</Text>
            {tx.refundedAmount && tx.refundedAmount > 0 && (
              <Text style={styles.refundInfo}>
                Refunded: {paymentAPI.utils.formatAmount(tx.refundedAmount || 0, tx.currency)}
              </Text>
            )}
            {tx.status === 'completed' && tx.refundedAmount === 0 && (
              <TouchableOpacity
                style={styles.refundButton}
                onPress={() => requestRefund(tx)}
              >
                <Text style={styles.refundButtonText}>Request Refund</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  // Payment Method Selection Modal
  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent
      animationType="slide"
      onRequestClose={() => !processingPayment && setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          
          <ScrollView style={styles.paymentMethodsList}>
            {paymentMethods.map(pm => (
              <TouchableOpacity
                key={pm.method}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === pm.method && styles.paymentMethodCardSelected,
                  !pm.enabled && styles.paymentMethodCardDisabled,
                ]}
                onPress={() => pm.enabled && setSelectedPaymentMethod(pm.method)}
                disabled={!pm.enabled || processingPayment}
              >
                <Text style={styles.paymentMethodIcon}>{pm.icon}</Text>
                <Text style={styles.paymentMethodName}>{pm.name}</Text>
                {!pm.enabled && <Text style={styles.disabledBadge}>Coming Soon</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.totalAmount}>
              Total: ₱{calculateTotal().toFixed(2)}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
                disabled={processingPayment}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, processingPayment && styles.confirmButtonDisabled]}
                onPress={processPayment}
                disabled={processingPayment || !selectedPaymentMethod}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
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

  return (
    <View style={styles.wrapper}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.tabActive]}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={[styles.tabText, activeTab === 'shop' && styles.tabTextActive]}>
            🛍️ Shop
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.tabActive]}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>
            🛒 Cart {cart.length > 0 && `(${cart.length})`}
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
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            💳 Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'shop' && renderShopTab()}
      {activeTab === 'cart' && renderCartTab()}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'payments' && renderPaymentsTab()}

      {/* Payment Modal */}
      {renderPaymentModal()}
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
    fontSize: 12,
    color: '#7F8C8D',
  },
  tabTextActive: {
    color: '#3498DB',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryChipActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  categoryText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#3498DB',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#3498DB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    marginLeft: 'auto',
  },
  removeButtonText: {
    color: '#E74C3C',
    fontSize: 12,
  },
  cartSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  checkoutButton: {
    backgroundColor: '#27AE60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
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
  paymentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMethod: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionId: {
    fontSize: 10,
    color: '#7F8C8D',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  refundInfo: {
    fontSize: 12,
    color: '#9B59B6',
    fontWeight: 'bold',
    marginTop: 4,
  },
  refundButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    alignItems: 'center',
  },
  refundButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7F8C8D',
    marginTop: 32,
    fontSize: 14,
  },
  loader: {
    marginTop: 32,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  paymentMethodsList: {
    maxHeight: 300,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodCardSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#3498DB',
  },
  paymentMethodCardDisabled: {
    opacity: 0.5,
  },
  paymentMethodIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  disabledBadge: {
    fontSize: 10,
    color: '#7F8C8D',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modalFooter: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 16,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
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
  confirmButton: {
    flex: 2,
    padding: 14,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noticeBanner: {
    backgroundColor: '#E8F4FD',
    borderColor: '#3498DB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498DB',
    marginBottom: 8,
  },
  noticeItem: {
    marginBottom: 6,
  },
  noticeItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  noticeItemMessage: {
    fontSize: 12,
    color: '#7F8C8D',
  },
});
