import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TabBar from './TabBar';
import { MerchantAuthProvider, useMerchantAuth } from '../contexts/MerchantAuthContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import MerchantLogin from './MerchantLogin';
import MerchantSignup from './MerchantSignup';
import { productsAPI, ordersAPI, payoutsAPI } from '../services/api';
import paymentAPI from '../services/payments';
import { eventBus } from '../services/eventBus';
import { fetchMerchantUsers } from './api/merchantApi';
import { login } from './api/authApi';
import { setToken } from './api/tokenStorage';
import type { Product, Order, PaymentTransaction, Payout } from '../types';

const tabs = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'products', title: 'Products', icon: '💊' },
  { id: 'orders', title: 'Orders', icon: '📋' },
  { id: 'inventory', title: 'Inventory', icon: '📦' },
  { id: 'payments', title: 'Payments', icon: '💳' },
  { id: 'payouts', title: 'Payouts', icon: '💸' },
  { id: 'logout', title: 'Logout', icon: '🚪' },
];

interface DashboardStats {
  todaySales: number;
  pendingOrders: number;
  lowStockItems: number;
  totalProducts: number;
}

function MerchantAppContent() {
  const { user, loading, signOut, signIn } = useMerchantAuth();
  const { switchRole, switchingRoles } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const categoryOptions = ['Medicines', 'Vitamins', 'Supplements', 'Personal Care', 'Medical Devices', 'Wellness', 'Baby Care', 'Others'];
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [balance, setBalance] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    currency: 'PHP',
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    requiresPrescription: false,
  });
  const [editProduct, setEditProduct] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    requiresPrescription: false,
  });
  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'gcash' | 'paymaya'>('bank_transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [merchantUsers, setMerchantUsers] = useState([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // New state for enhanced features
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustAmount, setStockAdjustAmount] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'critical' | 'out'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Safe currency formatter to avoid crashes when values are undefined or non-numeric
  const formatCurrency = (value: number | string | undefined | null) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  };

  const merchantId = user?.id || 'merchant-1';

  async function loadData() {
    setDataLoading(true);
    try {
      const [fetchedProducts, fetchedOrders, fetchedTransactions, fetchedPayouts] = await Promise.all([
        productsAPI.getAll(merchantId),
        ordersAPI.getAll({ merchantId }),
        paymentAPI.transactions.getAll?.({ merchantId }) ?? Promise.resolve([]),
        payoutsAPI.getAll(merchantId),
      ]);

      const productsWithDefaults = fetchedProducts.map(p => ({
        imageUrl: p.imageUrl || 'https://via.placeholder.com/150',
        ...p,
      }));

      setProducts(productsWithDefaults);
      setOrders(fetchedOrders);
      setTransactions(fetchedTransactions as PaymentTransaction[]);
      setPayouts(fetchedPayouts || []);

      const pendingCount = fetchedOrders.filter(o => o.status === 'pending').length;
      const lowStockCount = productsWithDefaults.filter(p => p.stock < 10).length;
      const completedOrders = fetchedOrders.filter(o => o.status !== 'cancelled');
      const todaySales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        todaySales,
        pendingOrders: pendingCount,
        lowStockItems: lowStockCount,
        totalProducts: productsWithDefaults.length,
      });

      setBalance({
        availableBalance: todaySales * 0.8,
        pendingBalance: todaySales * 0.2,
        totalEarnings: todaySales,
        currency: 'PHP',
      });
    } catch (error) {
      console.warn('Failed to load data from API, using fallback data:', error);

      const fallbackProducts: Product[] = [
        {
          id: 'fallback-1',
          merchantId,
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
          merchantId,
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
        {
          id: 'fallback-3',
          merchantId,
          name: 'Ibuprofen 200mg',
          description: 'Anti-inflammatory pain reliever',
          price: 8.99,
          currency: 'PHP',
          stock: 200,
          category: 'medicines',
          requiresPrescription: false,
          imageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fallback-4',
          merchantId,
          name: 'Vitamin D3 1000IU',
          description: 'Bone and immune health',
          price: 15.99,
          currency: 'PHP',
          stock: 100,
          category: 'vitamins',
          requiresPrescription: false,
          imageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fallback-5',
          merchantId,
          name: 'Alcohol 70%',
          description: 'Disinfectant solution',
          price: 3.50,
          currency: 'PHP',
          stock: 300,
          category: 'supplies',
          requiresPrescription: false,
          imageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fallback-6',
          merchantId,
          name: 'Thermometer',
          description: 'Digital body thermometer',
          price: 24.99,
          currency: 'PHP',
          stock: 50,
          category: 'supplies',
          requiresPrescription: false,
          imageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fallback-7',
          merchantId,
          name: 'Amoxicillin 500mg',
          description: 'Antibiotic for bacterial infections',
          price: 18.50,
          currency: 'PHP',
          stock: 60,
          category: 'medicines',
          requiresPrescription: true,
          imageUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const fallbackOrders: Order[] = [
        {
          id: 'fallback-order-1',
          userId: 'user-1',
          merchantId,
          items: [{ productId: 'fallback-1', quantity: 2, price: 5.99 }],
          status: 'pending',
          totalAmount: 11.98,
          currency: 'PHP',
          address: '123 Main St',
          paymentMethod: 'gcash',
          paymentStatus: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setProducts(fallbackProducts);
      setOrders(fallbackOrders);
      setTransactions([]);
      setPayouts([]);

      setStats({
        todaySales: 11.98,
        pendingOrders: 1,
        lowStockItems: fallbackProducts.filter(p => p.stock < 10).length,
        totalProducts: fallbackProducts.length,
      });

      setBalance({
        availableBalance: 11.98 * 0.8,
        pendingBalance: 11.98 * 0.2,
        totalEarnings: 11.98,
        currency: 'PHP',
      });
    } finally {
      setDataLoading(false);
    }
  }

  // Reload data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      console.log('MerchantApp: user changed, reloading data for merchantId:', user.id);
      loadData();
    } else {
      // Clear state when user logs out
      setProducts([]);
      setOrders([]);
      setTransactions([]);
      setPayouts([]);
      setStats({
        todaySales: 0,
        pendingOrders: 0,
        lowStockItems: 0,
        totalProducts: 0,
      });
      setBalance({
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        currency: 'PHP',
      });
    }
  }, [user?.id]);

  // Hooks must be called unconditionally in the same order.
  // Place effects before any early returns to avoid hook count mismatch.
  useEffect(() => {
    const upsertProduct = (prod: Product) => {
      setProducts(prev => {
        const idx = prev.findIndex(p => p.id === prod.id);
        const next = idx === -1
          ? [...prev, prod]
          : (() => {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...prod };
              return copy;
            })();
        setStats(prevStats => ({
          ...prevStats,
          totalProducts: next.length,
          lowStockItems: next.filter(p => p.stock < 10).length,
        }));
        return next;
      });
    };

    const removeProduct = (productId: string) => {
      setProducts(prev => {
        const next = prev.filter(p => p.id !== productId);
        setStats(prevStats => ({
          ...prevStats,
          totalProducts: next.length,
          lowStockItems: next.filter(p => p.stock < 10).length,
        }));
        return next;
      });
    };

    const unsubscribeProductAdded = eventBus.subscribe('productAdded', (payload) => {
      if (payload.product.merchantId === merchantId) {
        const normalized = { imageUrl: payload.product.imageUrl || 'https://via.placeholder.com/150', ...payload.product } as Product;
        upsertProduct(normalized);
      }
    });

    const unsubscribeProductUpdated = eventBus.subscribe('productUpdated', (payload) => {
      if (payload.product.merchantId === merchantId) {
        const normalized = { imageUrl: payload.product.imageUrl || 'https://via.placeholder.com/150', ...payload.product } as Product;
        upsertProduct(normalized);
      }
    });

    const unsubscribeProductDeleted = eventBus.subscribe('productDeleted', (payload) => {
      removeProduct(payload.productId);
    });
    
    // Subscribe to order events from UserApp
    const unsubscribeOrderPlaced = eventBus.subscribe('orderPlaced', (payload) => {
      if (payload.order.merchantId === merchantId) {
        setOrders(prev => [payload.order, ...prev]);
        setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders + 1 }));
      }
    });
    
    // Subscribe to order delivery completed from DriverApp
    const unsubscribeOrderDelivered = eventBus.subscribe('orderDelivered', (payload) => {
      setOrders(prev => prev.map(o => 
        o.id === payload.orderId 
          ? { ...o, status: 'delivered', updatedAt: new Date().toISOString() }
          : o
      ));
    });
    
    return () => {
      unsubscribeProductAdded();
      unsubscribeProductUpdated();
      unsubscribeProductDeleted();
      unsubscribeOrderPlaced();
      unsubscribeOrderDelivered();
    };
  }, [merchantId]);

  useEffect(() => {
    async function doLoginAndFetch() {
      try {
        const token = await login('merchant1', 'password'); // Replace with real credentials
        await setToken(token);
        const users = await fetchMerchantUsers();
        setMerchantUsers(users);
      } catch (e) {
        setLoginError('Login or fetch failed');
      }
    }
    doLoginAndFetch();
  }, []);

  // Handler for back to role selector - defined before conditionals to preserve hook order
  const handleBackToRoleSelector = async () => {
    try {
      await switchRole();
    } catch (error) {
      console.error('Back to role selector failed:', error);
    }
  };

  // If switching roles, don't render anything
  if (switchingRoles) {
    console.log('MerchantApp: switchingRoles is true, returning null');
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    // Merchant signup
    if (authScreen === 'signup') {
      return <MerchantSignup 
        onSwitchToLogin={() => setAuthScreen('login')} 
        onBackToRoleSelector={handleBackToRoleSelector} 
      />;
    }
    
    // Merchant login
    return <MerchantLogin 
      onSwitchToSignup={() => setAuthScreen('signup')} 
      onBackToRoleSelector={handleBackToRoleSelector} 
    />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const priceValue = parseFloat(newProduct.price);
    const stockValue = parseInt(newProduct.stock, 10);

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Enter a valid price greater than 0');
      return;
    }

    if (!Number.isFinite(stockValue) || stockValue < 0) {
      Alert.alert('Error', 'Enter a valid stock quantity (0 or more)');
      return;
    }

    if (savingProduct) return;
    setSavingProduct(true);

    const payload = {
      merchantId,
      merchantName: user.businessName,
      merchantEmail: user.email,
      name: newProduct.name,
      description: newProduct.description,
      price: priceValue,
      currency: 'PHP' as const,
      stock: stockValue,
      category: newProduct.category || 'Others',
      requiresPrescription: newProduct.requiresPrescription,
      imageUrl: 'https://via.placeholder.com/150',
    };

    const addProductToState = (product: Product) => {
      console.log('MerchantApp: adding product to state and publishing event', product.id, product.name);
      setProducts(prev => [...prev, product]);
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts + 1,
        lowStockItems: prev.lowStockItems + (product.stock < 10 ? 1 : 0),
      }));
      console.log('MerchantApp: publishing productAdded event for', product.id);
      try {
        eventBus.publish('productAdded', { product });
        console.log('MerchantApp: productAdded event published successfully');
      } catch (e) {
        console.error('MerchantApp: ERROR publishing productAdded event:', e);
      }
    };

    try {
      console.log('MerchantApp: calling productsAPI.create with payload:', payload);
      const created = await productsAPI.create(payload);
      console.log('MerchantApp: productsAPI.create response:', created);

      const productToAdd: Product = (!created || Array.isArray(created) || !(created as any).id)
        ? {
            id: `product-${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : {
            ...created,
            createdAt: (created as any).createdAt || new Date().toISOString(),
            updatedAt: (created as any).updatedAt || new Date().toISOString(),
          };

      if (!created || Array.isArray(created) || !(created as any).id) {
        console.warn('Products API returned an unexpected payload; using local product for UI.');
      }

      console.log('MerchantApp: calling addProductToState with:', productToAdd);
      addProductToState(productToAdd);

      setShowAddProduct(false);
      setShowAddCategoryDropdown(false);
      setNewProduct({ name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      console.error('MerchantApp: Add product failed:', error);
      const fallback: Product = {
        id: `product-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('MerchantApp: calling addProductToState with fallback:', fallback);
      addProductToState(fallback);
      setShowAddProduct(false);
      setShowAddCategoryDropdown(false);
      setNewProduct({ name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
      Alert.alert('Saved locally', 'Product will sync when online.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const updated = await productsAPI.update(productId, { stock: newStock });
      setProducts(prev => prev.map(p => (p.id === productId ? updated : p)));
      eventBus.publish('productUpdated', { product: updated });
      Alert.alert('Success', 'Stock updated');
    } catch (error) {
      console.warn('Failed to update stock via API, applying local change:', error);
      const updatedProducts = products.map(p =>
        p.id === productId
          ? { ...p, stock: newStock, updatedAt: new Date().toISOString() }
          : p
      );
      setProducts(updatedProducts);
      const updated = updatedProducts.find(p => p.id === productId);
      if (updated) {
        eventBus.publish('productUpdated', { product: updated });
      }
      Alert.alert('Stock updated locally', 'Will sync when online.');
    }
  };

  const openEditProduct = (product: Product) => {
    setEditProduct({
      id: product.id,
      name: product.name,
      description: product.description || '',
      // Guard against undefined price/stock to avoid runtime toString errors
      price: product.price != null ? product.price.toString() : '',
      stock: product.stock != null ? product.stock.toString() : '',
      category: product.category || '',
      requiresPrescription: product.requiresPrescription || false,
    });
    setShowEditProduct(true);
  };

  const handleEditProductSave = async () => {
    if (!editProduct.name || !editProduct.price || !editProduct.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const payload: Partial<Product> = {
      name: editProduct.name,
      description: editProduct.description,
      price: parseFloat(editProduct.price),
      stock: parseInt(editProduct.stock),
      category: editProduct.category,
      requiresPrescription: editProduct.requiresPrescription,
    };

    try {
      const updated = await productsAPI.update(editProduct.id, payload);

      setProducts(prev => prev.map(p => (p.id === editProduct.id ? updated : p)));
      eventBus.publish('productUpdated', { product: updated });

      setShowEditProduct(false);
      setShowEditCategoryDropdown(false);
      setEditProduct({ id: '', name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
      Alert.alert('Success', 'Product updated successfully');
    } catch (error) {
      console.warn('Update product failed; applying local change:', error);
      const updatedProducts = products.map(p =>
        p.id === editProduct.id
          ? {
              ...p,
              ...payload,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setProducts(updatedProducts);
      const updated = updatedProducts.find(p => p.id === editProduct.id);
      if (updated) {
        eventBus.publish('productUpdated', { product: updated });
      }
      setShowEditProduct(false);
      setShowEditCategoryDropdown(false);
      setEditProduct({ id: '', name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
      Alert.alert('Saved locally', 'Changes will sync when online.');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await ordersAPI.updateStatus(orderId, status);
      const updatedOrders = orders.map(o => (o.id === orderId ? updated : o));
      setOrders(updatedOrders);
      
      eventBus.publish('orderStatusChanged', { orderId, status });
      if (status === 'picked_up') {
        eventBus.publish('orderReadyForPickup', { orderId });
      }
      
      Alert.alert('Success', `Order ${status}`);
      const pendingCount = updatedOrders.filter(o => o.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingOrders: pendingCount }));
    } catch (error) {
      console.warn('Failed to update order via API; applying local change:', error);
      const updatedOrders = orders.map(o =>
        o.id === orderId
          ? { ...o, status, updatedAt: new Date().toISOString() }
          : o
      );
      setOrders(updatedOrders);
      eventBus.publish('orderStatusChanged', { orderId, status });
      if (status === 'picked_up') {
        eventBus.publish('orderReadyForPickup', { orderId });
      }
      const pendingCount = updatedOrders.filter(o => o.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingOrders: pendingCount }));
      Alert.alert('Status updated locally', 'Will sync when online.');
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
      
      // Create payout request via API
      const payoutData = {
        merchantId,
        amount,
        currency: 'PHP',
        payoutMethod,
        accountDetails: {
          account: accountDetails,
          method: payoutMethod,
        },
      };
      
      const newPayout = await payoutsAPI.create(payoutData);
      
      // If API call succeeds, update local state
      if (newPayout && newPayout.id) {
        // Add to payouts list
        setPayouts([newPayout, ...payouts]);
        
        // Update balances - move from available to pending
        setBalance(prev => ({
          ...prev,
          availableBalance: prev.availableBalance - amount,
          pendingBalance: prev.pendingBalance + amount,
        }));
        
        Alert.alert('Success', 'Payout request submitted successfully');
        setShowPayoutModal(false);
        setPayoutAmount('');
        setAccountDetails('');
        
        // Switch to payouts tab to show the new request
        setActiveTab('payouts');
      } else {
        // Fallback to local state if API returns empty (dev mode)
        const localPayout: Payout = {
          id: `payout-${Date.now()}`,
          merchantId,
          amount,
          currency: 'PHP',
          status: 'pending',
          payoutMethod,
          accountDetails: {
            account: accountDetails,
            method: payoutMethod,
          },
          transactionIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setPayouts([localPayout, ...payouts]);
        setBalance(prev => ({
          ...prev,
          availableBalance: prev.availableBalance - amount,
          pendingBalance: prev.pendingBalance + amount,
        }));
        
        Alert.alert('Success', 'Payout request submitted successfully (Local Mode)');
        setShowPayoutModal(false);
        setPayoutAmount('');
        setAccountDetails('');
        setActiveTab('payouts');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editProduct.id || deletingProduct) return;

    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingProduct(true);
          try {
            await productsAPI.delete(editProduct.id);
            setProducts(prev => prev.filter(p => p.id !== editProduct.id));
            eventBus.publish('productDeleted', { productId: editProduct.id });
            setShowEditProduct(false);
            setShowEditCategoryDropdown(false);
            setEditProduct({ id: '', name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
            Alert.alert('Deleted', 'Product removed successfully');
          } catch (error) {
            console.warn('Delete product failed; removing locally:', error);
            setProducts(prev => prev.filter(p => p.id !== editProduct.id));
            eventBus.publish('productDeleted', { productId: editProduct.id });
            setShowEditProduct(false);
            setShowEditCategoryDropdown(false);
            setEditProduct({ id: '', name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
            Alert.alert('Removed locally', 'Product will sync deletion when online.');
          } finally {
            setDeletingProduct(false);
          }
        },
      },
    ]);
  };

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

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₱{formatCurrency(balance.availableBalance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceDetail}>
            <Text style={styles.balanceDetailLabel}>Pending</Text>
            <Text style={styles.balanceDetailValue}>₱{formatCurrency(balance.pendingBalance)}</Text>
          </View>
          <View style={styles.balanceDetail}>
            <Text style={styles.balanceDetailLabel}>Total Earnings</Text>
            <Text style={styles.balanceDetailValue}>₱{formatCurrency(balance.totalEarnings)}</Text>
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

      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#96CEB4' }]}>
          <Text style={styles.statValue}>₱{formatCurrency(stats.todaySales)}</Text>
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
      {orders.slice(0, 3).map((order, index) => (
        <View key={order.id || `order-${index}`} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>#{order.id.slice(0, 8)}</Text>
            <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
            <Text style={styles.orderAmount}>₱{formatCurrency(order.totalAmount)}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderProducts = () => {
    const lowStockProducts = products.filter(p => p.stock < 10);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    return (
      <>
        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.productHeader}>
            <View>
              <Text style={styles.sectionTitle}>Products ({products.length})</Text>
              {lowStockProducts.length > 0 && (
                <Text style={styles.warningText}>
                  {lowStockProducts.length} low stock • {outOfStockProducts.length} out of stock
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddProduct(true)}
            >
              <Text style={styles.addButtonText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>

          {dataLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ECDC4" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateTitle}>No Products Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first product to start selling on the platform
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddProduct(true)}
              >
                <Text style={styles.emptyStateButtonText}>+ Add Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            products.map((product, index) => (
              <TouchableOpacity
                key={product.id || `product-${index}`}
                style={[
                  styles.productCard,
                  product.stock === 0 && styles.productCardOutOfStock,
                ]}
                onPress={() => openEditProduct(product)}
                activeOpacity={0.7}
              >
                <View style={styles.productInfo}>
                  <View style={styles.productNameRow}>
                    <Text style={[
                      styles.productName,
                      product.stock === 0 && styles.productNameOutOfStock,
                    ]}>
                      {product.name}
                    </Text>
                    <View style={styles.productBadges}>
                      {product.requiresPrescription && (
                        <View style={styles.rxBadge}>
                          <Text style={styles.rxBadgeText}>Rx</Text>
                        </View>
                      )}
                      {product.stock === 0 && (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockBadgeText}>Out</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {product.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                  )}
                  
                  <View style={styles.productDetailsRow}>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPriceLabel}>Price</Text>
                      <Text style={styles.productPrice}>₱{formatCurrency(product.price)}</Text>
                    </View>
                    
                    <View style={styles.productStockContainer}>
                      <Text style={styles.productStockLabel}>Stock</Text>
                      <Text style={[
                        styles.productStock,
                        product.stock === 0 && styles.productStockOut,
                        product.stock > 0 && product.stock < 10 && styles.productStockLow,
                      ]}>
                        {product.stock}
                        {product.stock === 0 && ' 🚫'}
                        {product.stock > 0 && product.stock < 10 && ' ⚠️'}
                      </Text>
                    </View>
                    
                    {product.category && (
                      <View style={styles.productCategoryContainer}>
                        <Text style={styles.productCategoryLabel}>Category</Text>
                        <Text style={styles.productCategory}>{product.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditProduct(product)}
                  >
                    <Text style={styles.actionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

      <Modal visible={showAddProduct} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              setShowAddProduct(false);
            }}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>➕ Add New Product</Text>
                
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Paracetamol 500mg"
                  value={newProduct.name}
                  onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                  autoFocus
                />
                
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Brief description of the product"
                  value={newProduct.description}
                  onChangeText={text => setNewProduct({ ...newProduct, description: text })}
                  multiline
                  numberOfLines={3}
                />
                
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Price (₱) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      value={newProduct.price}
                      onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Stock Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={newProduct.stock}
                      onChangeText={text => setNewProduct({ ...newProduct, stock: text })}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScrollContainer}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {categoryOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterChip,
                        styles.categoryChip,
                        newProduct.category === option && styles.filterChipActive,
                      ]}
                      onPress={() => setNewProduct({ ...newProduct, category: option })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        newProduct.category === option && styles.filterChipTextActive,
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setNewProduct({ ...newProduct, requiresPrescription: !newProduct.requiresPrescription })}
                >
                  <View style={[styles.checkbox, newProduct.requiresPrescription && styles.checkboxChecked]}>
                    {newProduct.requiresPrescription && <Text style={styles.checkboxIcon}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Requires Prescription (Rx)</Text>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddProduct(false);
                      setNewProduct({ name: '', description: '', price: '', stock: '', category: '', requiresPrescription: false });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, savingProduct && styles.buttonDisabled]}
                    onPress={handleAddProduct}
                    disabled={savingProduct}
                  >
                    <Text style={styles.saveButtonText}>
                      {savingProduct ? '⏳ Saving...' : '✓ Add Product'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditProduct} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              setShowEditProduct(false);
            }}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>✏️ Edit Product</Text>
                
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Paracetamol 500mg"
                  value={editProduct.name}
                  onChangeText={text => setEditProduct({ ...editProduct, name: text })}
                />
                
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Brief description of the product"
                  value={editProduct.description}
                  onChangeText={text => setEditProduct({ ...editProduct, description: text })}
                  multiline
                  numberOfLines={3}
                />
                
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Price (₱) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      value={editProduct.price}
                      onChangeText={text => setEditProduct({ ...editProduct, price: text })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Stock Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={editProduct.stock}
                      onChangeText={text => setEditProduct({ ...editProduct, stock: text })}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScrollContainer}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {categoryOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterChip,
                        styles.categoryChip,
                        editProduct.category === option && styles.filterChipActive,
                      ]}
                      onPress={() => setEditProduct({ ...editProduct, category: option })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        editProduct.category === option && styles.filterChipTextActive,
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setEditProduct({ ...editProduct, requiresPrescription: !editProduct.requiresPrescription })}
                >
                  <View style={[styles.checkbox, editProduct.requiresPrescription && styles.checkboxChecked]}>
                    {editProduct.requiresPrescription && <Text style={styles.checkboxIcon}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Requires Prescription (Rx)</Text>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowEditProduct(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, savingProduct && styles.buttonDisabled]}
                    onPress={handleEditProductSave}
                    disabled={savingProduct}
                  >
                    <Text style={styles.saveButtonText}>
                      {savingProduct ? '⏳ Saving...' : '✓ Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal visible={showStockModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowStockModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📊 Adjust Stock</Text>
                  <TouchableOpacity onPress={() => setShowStockModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {stockAdjustProduct && (
                  <>
                    <View style={styles.stockAdjustProductInfo}>
                      <Text style={styles.stockAdjustProductName}>{stockAdjustProduct.name}</Text>
                      <Text style={styles.stockAdjustCurrentStock}>
                        Current Stock: <Text style={styles.stockAdjustStockNumber}>{stockAdjustProduct.stock}</Text> units
                      </Text>
                    </View>

                    <View style={styles.stockAdjustSection}>
                      <Text style={styles.modalLabel}>New Stock Amount</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={stockAdjustAmount}
                        onChangeText={setStockAdjustAmount}
                        placeholder="Enter new stock amount"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.stockAdjustQuickActions}>
                      <Text style={styles.stockAdjustQuickTitle}>Quick Adjustments</Text>
                      <View style={styles.stockAdjustQuickButtons}>
                        <TouchableOpacity 
                          style={styles.stockAdjustQuickButton}
                          onPress={() => setStockAdjustAmount((stockAdjustProduct.stock + 10).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>+10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.stockAdjustQuickButton}
                          onPress={() => setStockAdjustAmount((stockAdjustProduct.stock + 25).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>+25</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.stockAdjustQuickButton}
                          onPress={() => setStockAdjustAmount((stockAdjustProduct.stock + 50).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>+50</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.stockAdjustQuickButton}
                          onPress={() => setStockAdjustAmount((stockAdjustProduct.stock + 100).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>+100</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.stockAdjustQuickButtons}>
                        <TouchableOpacity 
                          style={[styles.stockAdjustQuickButton, styles.stockAdjustQuickButtonDecrease]}
                          onPress={() => setStockAdjustAmount(Math.max(0, stockAdjustProduct.stock - 10).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.stockAdjustQuickButton, styles.stockAdjustQuickButtonDecrease]}
                          onPress={() => setStockAdjustAmount(Math.max(0, stockAdjustProduct.stock - 25).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>-25</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.stockAdjustQuickButton, styles.stockAdjustQuickButtonDecrease]}
                          onPress={() => setStockAdjustAmount(Math.max(0, stockAdjustProduct.stock - 50).toString())}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>-50</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.stockAdjustQuickButton, styles.stockAdjustQuickButtonReset]}
                          onPress={() => setStockAdjustAmount('0')}
                        >
                          <Text style={styles.stockAdjustQuickButtonText}>Set 0</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]} 
                        onPress={() => setShowStockModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.saveButton]}
                        onPress={() => {
                          const newStock = parseInt(stockAdjustAmount);
                          if (isNaN(newStock) || newStock < 0) {
                            Alert.alert('Invalid Input', 'Please enter a valid stock amount (0 or greater)');
                            return;
                          }
                          handleUpdateStock(stockAdjustProduct.id, newStock);
                          setShowStockModal(false);
                          setStockAdjustProduct(null);
                          setStockAdjustAmount('');
                        }}
                      >
                        <Text style={styles.saveButtonText}>✓ Update Stock</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      </>
    );
  };

  const renderOrders = () => {
    const filteredOrders = orderFilter === 'all' 
      ? orders 
      : orders.filter(o => o.status === orderFilter);
    
    const sortedOrders = [...filteredOrders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Orders Management</Text>
        <Text style={styles.sectionCount}>({filteredOrders.length})</Text>
      </View>
      
      {/* Order Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              orderFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setOrderFilter(filter as typeof orderFilter)}
          >
            <Text style={[
              styles.filterChipText,
              orderFilter === filter && styles.filterChipTextActive,
            ]}>
              {filter.replace('_', ' ').toUpperCase()}
              {filter !== 'all' && ` (${orders.filter(o => o.status === filter).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📦</Text>
          <Text style={styles.emptyStateTitle}>No {orderFilter !== 'all' ? orderFilter : ''} Orders</Text>
          <Text style={styles.emptyStateText}>
            {orderFilter === 'all' 
              ? 'Orders from users will appear here'
              : `No orders with status "${orderFilter}" found`
            }
          </Text>
        </View>
      ) : (
      sortedOrders.map((order, index) => (
        <TouchableOpacity 
          key={order.id || `order-detail-${index}`} 
          style={styles.orderDetailCard}
          onPress={() => {
            setSelectedOrder(order);
            setShowOrderDetailsModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString()}</Text>
            </View>
            <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.orderStatusBadgeText}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderInfoSection}>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Items:</Text>
              <Text style={styles.orderInfoValue}>{order.items.length} item(s)</Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Total:</Text>
              <Text style={[styles.orderInfoValue, styles.orderTotalAmount]}>₱{formatCurrency(order.totalAmount)}</Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Payment:</Text>
              <Text style={styles.orderInfoValue}>{order.paymentMethod.toUpperCase()}</Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Address:</Text>
              <Text style={styles.orderInfoValue} numberOfLines={1}>{order.address}</Text>
            </View>
          </View>
          
          {order.status === 'pending' && (
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={[styles.orderActionButton, { backgroundColor: '#27AE60' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleOrderStatusUpdate(order.id, 'accepted');
                }}
              >
                <Text style={styles.orderActionButtonText}>✓ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderActionButton, { backgroundColor: '#E74C3C' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleOrderStatusUpdate(order.id, 'cancelled');
                }}
              >
                <Text style={styles.orderActionButtonText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {order.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.orderActionButton, { backgroundColor: '#3498DB', width: '100%' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleOrderStatusUpdate(order.id, 'picked_up');
              }}
            >
              <Text style={styles.orderActionButtonText}>📦 Mark as Picked Up</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.orderTapHint}>Tap for details →</Text>
        </TouchableOpacity>
      ))
      )}
    </ScrollView>
    );
  };

  const renderInventory = () => {
    const getFilteredProducts = () => {
      switch (inventoryFilter) {
        case 'low':
          return products.filter(p => p.stock > 0 && p.stock < 20);
        case 'critical':
          return products.filter(p => p.stock > 0 && p.stock < 10);
        case 'out':
          return products.filter(p => p.stock === 0);
        default:
          return products;
      }
    };

    const filteredProducts = getFilteredProducts();
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 20).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    return (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Inventory Management</Text>
        <Text style={styles.sectionCount}>({filteredProducts.length})</Text>
      </View>

      {/* Inventory Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <View style={styles.inventoryAlertCard}>
          {lowStockCount > 0 && (
            <Text style={styles.inventoryAlertText}>⚠️ {lowStockCount} items low on stock</Text>
          )}
          {outOfStockCount > 0 && (
            <Text style={styles.inventoryAlertTextCritical}>🚫 {outOfStockCount} items out of stock</Text>
          )}
        </View>
      )}
      
      {/* Inventory Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All Products' },
          { key: 'low', label: 'Low Stock' },
          { key: 'critical', label: 'Critical' },
          { key: 'out', label: 'Out of Stock' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              inventoryFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setInventoryFilter(filter.key as typeof inventoryFilter)}
          >
            <Text style={[
              styles.filterChipText,
              inventoryFilter === filter.key && styles.filterChipTextActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>No Products Found</Text>
          <Text style={styles.emptyStateText}>
            {inventoryFilter === 'all' 
              ? 'Add products to manage your inventory'
              : `No products match the "${inventoryFilter}" filter`
            }
          </Text>
        </View>
      ) : (
      filteredProducts.map((product, index) => (
          <View key={product.id || `inventory-${index}`} style={[
            styles.inventoryCard,
            product.stock === 0 && styles.inventoryCardOutOfStock,
          ]}>
            <View style={styles.inventoryCardHeader}>
              <View style={styles.inventoryCardInfo}>
                <Text style={styles.inventoryName}>{product.name}</Text>
                {product.category && (
                  <Text style={styles.inventoryCategory}>{product.category}</Text>
                )}
              </View>
              <View style={styles.inventoryStockBadge}>
                <Text
                  style={[
                    styles.inventoryStock,
                    product.stock === 0 && styles.inventoryStockOut,
                    product.stock > 0 && product.stock < 10 && styles.inventoryStockCritical,
                    product.stock >= 10 && product.stock < 20 && styles.inventoryStockLow,
                  ]}
                >
                  {product.stock === 0 ? '🚫 OUT' : `${product.stock} units`}
                  {product.stock > 0 && product.stock < 10 && ' ⚠️'}
                </Text>
              </View>
            </View>
            
            <View style={styles.inventoryPriceRow}>
              <Text style={styles.inventoryPrice}>₱{formatCurrency(product.price)}</Text>
              <Text style={styles.inventoryValue}>
                Value: ₱{formatCurrency((product.price || 0) * (product.stock || 0))}
              </Text>
            </View>

            <View style={styles.inventoryActions}>
              <TouchableOpacity
                style={[styles.inventoryButton, styles.inventoryButtonAdjust]}
                onPress={() => {
                  setStockAdjustProduct(product);
                  setStockAdjustAmount('');
                  setShowStockModal(true);
                }}
              >
                <Text style={styles.inventoryButtonText}>📊 Adjust Stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inventoryButton, styles.inventoryButtonRestock]}
                onPress={() => handleUpdateStock(product.id, product.stock + 50)}
              >
                <Text style={styles.inventoryButtonText}>+ Quick Restock (50)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
    );
  };

  const renderPayments = () => {
    const getFilteredTransactions = () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      switch (paymentFilter) {
        case 'today':
          return orders.filter(o => new Date(o.createdAt) >= startOfDay);
        case 'week':
          return orders.filter(o => new Date(o.createdAt) >= startOfWeek);
        case 'month':
          return orders.filter(o => new Date(o.createdAt) >= startOfMonth);
        default:
          return orders;
      }
    };

    const filteredTransactions = getFilteredTransactions();
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      if (sortBy === 'amount') {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const totalRevenue = filteredTransactions.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const completedOrders = filteredTransactions.filter(o => o.status === 'delivered');
    const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Transactions</Text>
        <Text style={styles.sectionCount}>({sortedTransactions.length})</Text>
      </View>
      
      <View style={styles.paymentSummaryCard}>
        <Text style={styles.paymentSummaryTitle}>💰 Financial Overview</Text>
        <View style={styles.paymentSummaryGrid}>
          <View style={styles.paymentSummaryItem}>
            <Text style={styles.paymentSummaryLabel}>Total Revenue</Text>
            <Text style={styles.paymentSummaryAmount}>₱{formatCurrency(balance.totalEarnings)}</Text>
          </View>
          <View style={styles.paymentSummaryItem}>
            <Text style={styles.paymentSummaryLabel}>Available</Text>
            <Text style={[styles.paymentSummaryAmount, styles.paymentAmountGreen]}>₱{formatCurrency(balance.availableBalance)}</Text>
          </View>
          <View style={styles.paymentSummaryItem}>
            <Text style={styles.paymentSummaryLabel}>Pending</Text>
            <Text style={[styles.paymentSummaryAmount, styles.paymentAmountOrange]}>₱{formatCurrency(balance.pendingBalance)}</Text>
          </View>
          <View style={styles.paymentSummaryItem}>
            <Text style={styles.paymentSummaryLabel}>Period Total</Text>
            <Text style={styles.paymentSummaryAmount}>₱{formatCurrency(totalRevenue)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Filter */}
      <View style={styles.paymentFiltersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'today', 'week', 'month'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                paymentFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setPaymentFilter(filter as typeof paymentFilter)}
            >
              <Text style={[
                styles.filterChipText,
                paymentFilter === filter && styles.filterChipTextActive,
              ]}>
                {filter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
        >
          <Text style={styles.sortButtonText}>
            {sortBy === 'date' ? '📅 Date' : '💵 Amount'}
          </Text>
        </TouchableOpacity>
      </View>

      {sortedTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💳</Text>
          <Text style={styles.emptyStateTitle}>No Transactions</Text>
          <Text style={styles.emptyStateText}>
            Payment transactions will appear here when customers place orders
          </Text>
        </View>
      ) : (
      sortedTransactions.map((order, index) => (
        <View key={order.id || `transaction-${index}`} style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <View>
              <Text style={styles.transactionId}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={styles.transactionCustomer}>Customer #{order.userId.slice(0, 8)}</Text>
            </View>
            <View style={styles.transactionAmountContainer}>
              <Text style={styles.transactionAmount}>₱{formatCurrency(order.totalAmount)}</Text>
              <View style={[styles.transactionStatusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.transactionStatusText}>{order.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          <View style={styles.transactionDetails}>
            <View style={styles.transactionDetailRow}>
              <Text style={styles.transactionLabel}>Payment Method:</Text>
              <Text style={styles.transactionMethod}>{order.paymentMethod.toUpperCase()}</Text>
            </View>
            <View style={styles.transactionDetailRow}>
              <Text style={styles.transactionLabel}>Date:</Text>
              <Text style={styles.transactionDate}>{new Date(order.createdAt).toLocaleString()}</Text>
            </View>
            <View style={styles.transactionDetailRow}>
              <Text style={styles.transactionLabel}>Items:</Text>
              <Text style={styles.transactionItems}>{order.items?.length || 0} item(s)</Text>
            </View>
          </View>
        </View>
      ))
      )}
    </ScrollView>
    );
  };

  const renderPayouts = () => (
    <>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Payouts</Text>
        
        <View style={styles.payoutBalanceCard}>
          <Text style={styles.payoutBalanceTitle}>Available for Payout</Text>
          <Text style={styles.payoutBalanceAmount}>₱{formatCurrency(balance.availableBalance)}</Text>
          <TouchableOpacity
            style={[
              styles.requestPayoutButton,
              balance.availableBalance <= 0 && styles.requestPayoutButtonDisabled
            ]}
            onPress={() => {
              if (balance.availableBalance <= 0) {
                Alert.alert(
                  'No Balance Available',
                  'You need to have completed orders with available earnings to request a payout.\n\nTip: Complete some orders first to build up your available balance.',
                  [{ text: 'OK' }]
                );
              } else {
                setShowPayoutModal(true);
              }
            }}
          >
            <Text style={[
              styles.requestPayoutButtonText,
              balance.availableBalance <= 0 && styles.requestPayoutButtonTextDisabled
            ]}>
              Request New Payout
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Payout History</Text>
        {payouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No payout requests yet</Text>
          </View>
        ) : (
          payouts.map((payout, index) => (
            <View key={payout.id || `payout-${index}`} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <View>
                  <Text style={styles.payoutAmount}>₱{formatCurrency(payout.amount)}</Text>
                  <Text style={styles.payoutMethod}>{payout.payoutMethod.toUpperCase()}</Text>
                </View>
                <Text style={[styles.payoutStatus, { color: getStatusColor(payout.status) }]}>
                  {payout.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.payoutDate}>
                Requested: {new Date(payout.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showPayoutModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowPayoutModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>💸 Request Payout</Text>
                
                <View style={styles.modalBalance}>
                  <Text style={styles.modalBalanceLabel}>Available Balance</Text>
                  <Text style={styles.modalBalanceAmount}>₱{formatCurrency(balance.availableBalance)}</Text>
                </View>

                <Text style={styles.inputLabel}>Payout Amount *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount (e.g., 5000)"
                  keyboardType="numeric"
                  value={payoutAmount}
                  onChangeText={setPayoutAmount}
                  editable={!processingPayout}
                />

                <Text style={styles.inputLabel}>Payout Method</Text>
                <View style={styles.payoutMethodOptions}>
                  {['bank_transfer', 'gcash', 'paymaya'].map(method => (
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
                        {method === 'bank_transfer' ? '🏦 Bank' : method === 'gcash' ? '💳 GCash' : '💰 PayMaya'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>
                  {payoutMethod === 'bank_transfer' ? 'Bank Account Number *' : 'Mobile Number *'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`${payoutMethod === 'bank_transfer' ? 'Enter account number' : 'Enter mobile number (e.g., 09171234567)'}`}
                  value={accountDetails}
                  onChangeText={setAccountDetails}
                  editable={!processingPayout}
                  keyboardType={payoutMethod === 'bank_transfer' ? 'number-pad' : 'phone-pad'}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowPayoutModal(false)}
                    disabled={processingPayout}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={requestPayout}
                    disabled={processingPayout}
                  >
                    {processingPayout ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Submit Request</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderLogoutContent = () => (
    <View style={styles.content}>
      <View style={styles.logoutContainer}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutTitle}>Logout</Text>
        <Text style={styles.logoutText}>Are you sure you want to logout?</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }}
        >
          <Text style={styles.logoutButtonText}>Confirm Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProducts();
      case 'orders':
        return renderOrders();
      case 'inventory':
        return renderInventory();
      case 'payments':
        return renderPayments();
      case 'payouts':
        return renderPayouts();
      case 'logout':
        return renderLogoutContent();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Merchant Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user.businessName || 'Merchant'} 🏪</Text>
          </View>
        </View>
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

export default function MerchantApp() {
  return (
    <MerchantAuthProvider>
      <MerchantAppContent />
    </MerchantAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#7F8C8D' },
  header: { backgroundColor: '#4ECDC4', padding: 20, paddingTop: 50 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFFFFF', marginTop: 4, opacity: 0.9 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  
  // Balance & Stats
  balanceCard: { backgroundColor: '#3498DB', borderRadius: 12, padding: 20, marginBottom: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  balanceDetail: { flex: 1 },
  balanceDetailLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  balanceDetailValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  payoutButton: { backgroundColor: '#fff', padding: 14, borderRadius: 8, alignItems: 'center' },
  payoutButtonText: { color: '#3498DB', fontWeight: 'bold', fontSize: 14 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { width: '48%', padding: 20, borderRadius: 10, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  statLabel: { fontSize: 14, color: '#FFF' },
  statsCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 3 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  
  // Orders
  orderCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  orderStatus: { fontSize: 14, fontWeight: 'bold' },
  orderAmount: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', marginBottom: 5 },
  orderDate: { fontSize: 12, color: '#7F8C8D' },
  orderDetailCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  orderInfo: { fontSize: 14, color: '#2C3E50', marginBottom: 5 },
  orderActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  orderActionButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5 },
  orderActionButtonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  
  // Products
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  productCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  productInfo: { flex: 1 },
  productNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', flex: 1 },
  rxTag: { backgroundColor: '#FFF3CD', color: '#856404', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  productDescription: { fontSize: 14, color: '#7F8C8D', marginTop: 5 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', marginTop: 5 },
  productStock: { fontSize: 14, color: '#27AE60', marginTop: 5 },
  productStockLow: { color: '#E74C3C', fontWeight: 'bold' },
  productActions: { justifyContent: 'center' },
  actionButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  actionButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  // Inventory
  inventoryCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  inventoryCardOutOfStock: { opacity: 0.6, borderWidth: 1, borderColor: '#E74C3C' },
  inventoryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  inventoryCardInfo: { flex: 1 },
  inventoryName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  inventoryCategory: { fontSize: 12, color: '#7F8C8D', marginBottom: 8 },
  inventoryStockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#ECF0F1' },
  inventoryStock: { fontSize: 14, fontWeight: 'bold', color: '#27AE60' },
  inventoryStockLow: { color: '#F39C12' },
  inventoryStockCritical: { color: '#E74C3C' },
  inventoryStockOut: { color: '#E74C3C' },
  inventoryPriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  inventoryPrice: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  inventoryValue: { fontSize: 14, color: '#7F8C8D' },
  inventoryActions: { flexDirection: 'row', gap: 8 },
  inventoryButton: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  inventoryButtonAdjust: { backgroundColor: '#3498DB' },
  inventoryButtonRestock: { backgroundColor: '#27AE60' },
  inventoryButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  inventoryAlertCard: { backgroundColor: '#FFF3CD', borderRadius: 8, padding: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#F39C12' },
  inventoryAlertText: { fontSize: 13, color: '#856404', marginBottom: 4 },
  inventoryAlertTextCritical: { fontSize: 13, color: '#721C24', fontWeight: 'bold' },
  restockButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  restockButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  // Enhanced Order Styles
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionCount: { fontSize: 16, color: '#7F8C8D', marginLeft: 8 },
  filterContainer: { marginBottom: 15 },
  filterChip: { backgroundColor: '#ECF0F1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterChipActive: { backgroundColor: '#4ECDC4' },
  filterChipText: { fontSize: 13, color: '#7F8C8D', fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },
  
  // Category Scroller
  categoryScrollContainer: { marginBottom: 16 },
  categoryScrollContent: { paddingVertical: 8 },
  categoryChip: { marginRight: 10, marginBottom: 0 },
  
  orderStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  orderStatusBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  orderInfoSection: { marginTop: 12, marginBottom: 12 },
  orderInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderInfoLabel: { fontSize: 14, color: '#7F8C8D' },
  orderInfoValue: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  orderTotalAmount: { color: '#27AE60', fontWeight: 'bold', fontSize: 16 },
  orderTapHint: { fontSize: 12, color: '#3498DB', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  
  // Payment Tab Enhancements
  paymentSummaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  paymentSummaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16, textAlign: 'center' },
  paymentSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  paymentSummaryItem: { width: '48%', marginBottom: 12, alignItems: 'flex-start' },
  paymentSummaryLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 6, textAlign: 'left' },
  paymentSummaryAmount: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', textAlign: 'left' },
  paymentAmountGreen: { color: '#27AE60' },
  paymentAmountOrange: { color: '#F39C12' },
  paymentFiltersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 },
  sortButton: { backgroundColor: '#ECF0F1', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, minWidth: 90, alignItems: 'center' },
  sortButtonText: { fontSize: 13, color: '#2C3E50', fontWeight: '600', textAlign: 'center' },
  transactionAmountContainer: { alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 120 },
  transactionStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginTop: 6, alignSelf: 'flex-end' },
  transactionStatusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  transactionCustomer: { fontSize: 12, color: '#7F8C8D', marginTop: 3 },
  transactionDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8ECF0' },
  transactionDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  transactionLabel: { fontSize: 13, color: '#7F8C8D', flex: 1 },
  transactionItems: { fontSize: 13, color: '#2C3E50', fontWeight: '500', textAlign: 'right' },
  
  // Transactions
  transactionCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  transactionId: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', color: '#27AE60', textAlign: 'right' },
  transactionMethod: { fontSize: 13, color: '#2C3E50', fontWeight: '500', textAlign: 'right' },
  transactionDate: { fontSize: 12, color: '#2C3E50', fontWeight: '500', textAlign: 'right' },
  
  // Payouts
  payoutBalanceCard: { backgroundColor: '#27AE60', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  payoutBalanceTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  payoutBalanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  requestPayoutButton: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  requestPayoutButtonDisabled: { opacity: 0.5 },
  requestPayoutButtonText: { color: '#27AE60', fontWeight: 'bold', fontSize: 14 },
  requestPayoutButtonTextDisabled: { color: '#95A5A6' },
  payoutCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  payoutAmount: { fontSize: 18, fontWeight: 'bold', color: '#27AE60', marginBottom: 4 },
  payoutMethod: { fontSize: 12, color: '#7F8C8D' },
  payoutStatus: { fontSize: 12, fontWeight: 'bold' },
  payoutDate: { fontSize: 12, color: '#7F8C8D', marginBottom: 4 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '90%', maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', flex: 1 },
  modalClose: { fontSize: 28, color: '#7F8C8D', fontWeight: 'bold', paddingLeft: 10 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 6, marginTop: 12 },
  modalInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BDC3C7', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14, color: '#2C3E50' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalBalance: { backgroundColor: '#E8F4FD', padding: 16, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  modalBalanceLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 4 },
  modalBalanceAmount: { fontSize: 24, fontWeight: 'bold', color: '#3498DB' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BDC3C7', padding: 12, borderRadius: 8, marginBottom: 2, fontSize: 14, color: '#2C3E50' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  inputHalf: { flex: 1 },
  selectInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BDC3C7', padding: 12, borderRadius: 8, marginBottom: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectInputText: { fontSize: 14, color: '#2C3E50' },
  selectPlaceholder: { color: '#95A5A6' },
  dropdownArrow: { fontSize: 12, color: '#7F8C8D', marginLeft: 8 },
  dropdownMenu: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#BDC3C7', marginTop: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, maxHeight: 200 },
  dropdownOption: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
  dropdownOptionLast: { borderBottomWidth: 0 },
  dropdownOptionText: { fontSize: 14, color: '#2C3E50' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 6, marginTop: 12 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#BDC3C7',
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  checkboxIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#34495E',
    fontWeight: '500',
  },
  payoutMethodOptions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  payoutMethodOption: { flex: 1, padding: 12, backgroundColor: '#f8f8f8', borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  payoutMethodOptionSelected: { backgroundColor: '#E8F4FD', borderColor: '#3498DB' },
  payoutMethodOptionText: { fontSize: 12, color: '#7F8C8D', fontWeight: 'bold' },
  payoutMethodOptionTextSelected: { color: '#3498DB' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  cancelButton: {
    backgroundColor: '#ECF0F1',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: { backgroundColor: '#4ECDC4' },
  saveButtonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
  buttonDisabled: { backgroundColor: '#BDC3C7', elevation: 0 },
  deleteButton: { backgroundColor: '#E74C3C', marginTop: 8 },
  deleteButtonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  
  // Order Details Modal
  orderDetailsModal: { maxHeight: '90%' },
  orderDetailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
  orderDetailsId: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  orderDetailsSection: { marginBottom: 20 },
  orderDetailsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  orderDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingVertical: 4 },
  orderDetailsLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '500', flex: 1 },
  orderDetailsValue: { fontSize: 14, color: '#2C3E50', flex: 2, textAlign: 'right' },
  orderDetailsTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#2C3E50' },
  orderDetailsTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  orderDetailsTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },
  orderItemCard: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
  orderItemQuantity: { fontSize: 13, color: '#7F8C8D' },
  orderItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#4ECDC4' },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyStateIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateTitle: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  emptyStateText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginBottom: 24 },
  emptyStateButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  emptyStateButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center' },
  
  // Product Improvements
  warningText: { fontSize: 12, color: '#E67E22', marginTop: 4 },
  productCardOutOfStock: { opacity: 0.6, borderLeftWidth: 4, borderLeftColor: '#E74C3C' },
  productNameOutOfStock: { color: '#95A5A6', textDecorationLine: 'line-through' },
  productBadges: { flexDirection: 'row', gap: 6 },
  rxBadge: { backgroundColor: '#9B59B6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  rxBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  outOfStockBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  outOfStockBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  productDetailsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
  productPriceContainer: { flex: 1 },
  productPriceLabel: { fontSize: 11, color: '#7F8C8D', marginBottom: 2 },
  productStockContainer: { flex: 1 },
  productStockLabel: { fontSize: 11, color: '#7F8C8D', marginBottom: 2 },
  productStockOut: { color: '#E74C3C', fontWeight: 'bold' },
  productCategoryContainer: { flex: 1 },
  productCategoryLabel: { fontSize: 11, color: '#7F8C8D', marginBottom: 2 },
  productCategory: { fontSize: 13, color: '#3498DB', fontWeight: '600' },
  
  // Logout
  logoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  logoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginToggle: {
    marginTop: 20,
  },
  loginToggleText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: 'bold',
  },
  
  // Stock Adjustment Modal Styles
  stockAdjustProductInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  stockAdjustProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  stockAdjustCurrentStock: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  stockAdjustStockNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  stockAdjustSection: {
    marginBottom: 20,
  },
  stockAdjustQuickActions: {
    marginBottom: 20,
  },
  stockAdjustQuickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  stockAdjustQuickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockAdjustQuickButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stockAdjustQuickButtonDecrease: {
    backgroundColor: '#E74C3C',
  },
  stockAdjustQuickButtonReset: {
    backgroundColor: '#95A5A6',
  },
  stockAdjustQuickButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});