import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TabBar from './TabBar';
import MedicalLibraryTab from './MedicalLibraryTab';
import ClinicLocatorTab from './ClinicLocatorTab';
import ConsultationTab from './ConsultationTab';
import MedicarePhilHealthTab from './tabs/MedicarePhilHealthTab';
// import UserHamburgerMenu from './UserHamburgerMenu'; // TODO: Create this component
import { UserAuthProvider, useUserAuth } from '../contexts/UserAuthContext';
import { UserDataProvider } from '../contexts/UserDataContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import UserLogin from './UserLogin';
import UserSignup from './UserSignup';
import type { Product, Order, PaymentMethod, PaymentTransaction, WalletTopUp, PaymentStatus } from '../types';
import { productsAPI, ordersAPI } from '../services/api';
import paymentAPI from '../services/payments';
import walletService from '../services/wallet';
import { eventBus } from '../services/eventBus';
import { openGoogleMaps, calculateDistance, calculateETA } from '../services/maps';
import { fetchUserUsers } from './api/userApi';
import { login } from './api/authApi';
import { setToken } from './api/tokenStorage';

interface CartItem extends Product {
  quantity: number;
}

const tabs = [
  { id: 'browse', title: 'Browse', icon: '🔍' },
  { id: 'cart', title: 'Cart', icon: '🛒' },
  { id: 'prescription', title: 'Rx', icon: '📄' },
  { id: 'orders', title: 'Orders', icon: '📦' },
  { id: 'wallet', title: 'Wallet', icon: '🗃️' },
  { id: 'profile', title: 'Profile', icon: '👤' },
  { id: 'logout', title: 'Logout', icon: '🚪' },
];

const categories = [
  { id: 'all', name: 'All', icon: '🏪', color: '#3498DB' },
  { id: 'medicines', name: 'Medicines', icon: '💊', color: '#FF6B6B' },
  { id: 'vitamins', name: 'Vitamins', icon: '🔬', color: '#4ECDC4' },
  { id: 'supplies', name: 'Supplies', icon: '🩺', color: '#45B7D1' },
  { id: 'wellness', name: 'Wellness', icon: '🧘', color: '#96CEB4' },
];

function UserAppContent() {
  const { user, loading, signOut } = useUserAuth();
  const { switchRole, switchingRoles } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [showMenu, setShowMenu] = useState(false);
  
  // Shopping state
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [walletTopUps, setWalletTopUps] = useState<WalletTopUp[]>([]);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [topUpMethod, setTopUpMethod] = useState<Exclude<PaymentMethod, 'wallet'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderETA, setOrderETA] = useState<number | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [orderDistance, setOrderDistance] = useState<number | null>(null);

  // User API state
  const [userUsers, setUserUsers] = useState([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Quick access actions surfaced in the hamburger menu
  const showFeatureInfo = (title: string, body: string) => {
    Alert.alert(title, body, [{ text: 'OK' }], { cancelable: true });
  };

  // Hamburger menu navigation handlers
  const handleLocateClinic = () => setActiveTab('locate');
  const handleSearchSpecialist = () => setActiveTab('locate');
  const handleConnectCoverage = () => setActiveTab('medicare');
  const handleOnlineConsult = () => setActiveTab('consult');
  const handleMedicalLibrary = () => setActiveTab('library');

  // Local fallback catalog for when the API is offline or returns an empty list
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
      merchantName: 'Mercury Drug',
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
      merchantName: 'Mercury Drug',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-3',
      merchantId: 'merchant-2',
      name: 'Ibuprofen 200mg',
      description: 'Anti-inflammatory pain reliever',
      price: 8.99,
      currency: 'PHP',
      stock: 200,
      category: 'medicines',
      requiresPrescription: false,
      imageUrl: 'https://via.placeholder.com/150',
      merchantName: 'Watsons',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-4',
      merchantId: 'merchant-2',
      name: 'Vitamin D3 1000IU',
      description: 'Bone and immune health',
      price: 15.99,
      currency: 'PHP',
      stock: 100,
      category: 'vitamins',
      requiresPrescription: false,
      imageUrl: 'https://via.placeholder.com/150',
      merchantName: 'Watsons',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-5',
      merchantId: 'merchant-3',
      name: 'Alcohol 70%',
      description: 'Disinfectant solution',
      price: 3.50,
      currency: 'PHP',
      stock: 300,
      category: 'supplies',
      requiresPrescription: false,
      imageUrl: 'https://via.placeholder.com/150',
      merchantName: 'SouthStar Drug',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-6',
      merchantId: 'merchant-3',
      name: 'Thermometer',
      description: 'Digital body thermometer',
      price: 24.99,
      currency: 'PHP',
      stock: 50,
      category: 'supplies',
      requiresPrescription: false,
      imageUrl: 'https://via.placeholder.com/150',
      merchantName: 'SouthStar Drug',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-7',
      merchantId: 'merchant-1',
      name: 'Amoxicillin 500mg',
      description: 'Antibiotic for bacterial infections',
      price: 18.50,
      currency: 'PHP',
      stock: 60,
      category: 'medicines',
      requiresPrescription: true,
      imageUrl: 'https://via.placeholder.com/150',
      merchantName: 'Mercury Drug',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Prescription state
  interface Prescription {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    doctorId: string;
    doctorName?: string;
    imageUri: string;
    uploadedAt: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'stored';
    isExternal: boolean; // true if from external doctor (not in app)
  }
  
  // Available doctors for prescription submission (in-app doctors)
  const availableDoctors = [
    { id: 'doc1', name: 'Dr. Maria Santos', specialization: 'General Medicine', isExternal: false },
    { id: 'doc2', name: 'Dr. Jose Reyes', specialization: 'Internal Medicine', isExternal: false },
    { id: 'doc3', name: 'Dr. Ana Cruz', specialization: 'Family Medicine', isExternal: false },
    { id: 'doc4', name: 'Dr. Miguel Torres', specialization: 'General Practice', isExternal: false },
    { id: 'doc5', name: 'Dr. Patricia Lim', specialization: 'Emergency Medicine', isExternal: false },
    { id: 'external', name: 'Other / External Doctor', specialization: 'Not registered in app', isExternal: true },
  ];
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [selectedDoctorForPrescription, setSelectedDoctorForPrescription] = useState<typeof availableDoctors[0] | null>(null);
  const [showDoctorSelectModal, setShowDoctorSelectModal] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [externalDoctorName, setExternalDoctorName] = useState('');

  // Load products always (even when logged out) so Browse tab works anonymously; load the rest only when authenticated
  useEffect(() => {
    loadProducts();
    if (user) {
      loadOrders();
      loadTransactions();
      loadWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Subscribe to product/order events regardless of user/role state
  useEffect(() => {
    // Subscribe to product updates from MerchantApp
    const upsertProduct = (prod: Product) => {
      console.log('UserApp: upserting product', prod.id, prod.name);
      setProducts(prev => {
        const index = prev.findIndex(p => p.id === prod.id);
        if (index === -1) {
          console.log('UserApp: adding new product', prod.id);
          return [...prev, prod];
        }
        console.log('UserApp: updating existing product', prod.id);
        const next = [...prev];
        next[index] = { ...next[index], ...prod };
        return next;
      });
    };

    const removeProduct = (productId: string) => {
      console.log('UserApp: removing product', productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setCart(prev => prev.filter(item => item.id !== productId));
    };

    const unsubProductAdded = eventBus.subscribe('productAdded', (payload: any) => {
      console.log('UserApp: received productAdded event', payload.product.id);
      const productWithDefaults = {
        imageUrl: 'https://via.placeholder.com/150',
        ...payload.product,
      } as Product;
      upsertProduct(productWithDefaults);
    });
    
    const unsubProductUpdated = eventBus.subscribe('productUpdated', (payload: any) => {
      console.log('UserApp: received productUpdated event', payload.product.id);
      const updated = { imageUrl: 'https://via.placeholder.com/150', ...payload.product } as Product;
      upsertProduct(updated);
      setCart(prev => prev.map(item =>
        item.id === updated.id
          ? { ...item, ...updated, imageUrl: updated.imageUrl || item.imageUrl || 'https://via.placeholder.com/150', quantity: item.quantity }
          : item
      ));
    });

    const unsubProductDeleted = eventBus.subscribe('productDeleted', (payload: any) => {
      console.log('UserApp: received productDeleted event', payload.productId);
      removeProduct(payload.productId);
    });
    
    // Subscribe to order status changes
    const unsubOrderStatus = eventBus.subscribe('orderStatusChanged', (payload: any) => {
      setOrders(prev => prev.map(o => 
        o.id === payload.orderId 
          ? { ...o, status: payload.status as any, updatedAt: new Date().toISOString() }
          : o
      ));
    });
    
    const unsubOrderDelivered = eventBus.subscribe('orderDelivered', (payload: any) => {
      setOrders(prev => prev.map(o => 
        o.id === payload.orderId 
          ? { ...o, status: 'delivered', updatedAt: new Date().toISOString() }
          : o
      ));
    });
    
    return () => {
      unsubProductAdded?.();
      unsubProductUpdated?.();
      unsubOrderStatus?.();
      unsubOrderDelivered?.();
      unsubProductDeleted?.();
    };
  }, []);

  const loadProducts = async () => {
    try {
      setDataLoading(true);
      console.log('UserApp: loadProducts starting');
      const fetched = await productsAPI.getAll();
      console.log('UserApp: fetched products from API:', fetched.length);
      const withDefaults = fetched.map(p => ({
        imageUrl: p.imageUrl || 'https://via.placeholder.com/150',
        ...p,
      }));

      console.log('UserApp: setting fetched products:', withDefaults.length);
      setProducts(withDefaults.length > 0 ? withDefaults : fallbackProducts);
    } catch (error) {
      console.warn('UserApp: Failed to load products from API:', error);
      console.log('UserApp: using fallback products');
      setProducts(fallbackProducts);
    } finally {
      setDataLoading(false);
    }
  };

  // Providers and specialists (mocked from merchant products for now)
  const providerProducts = products.filter(p => p.category?.toLowerCase().includes('clinic') || p.category?.toLowerCase().includes('doctor'));
  const specialistProducts = products.filter(p => p.category?.toLowerCase().includes('specialist') || p.name.toLowerCase().includes('doctor'));

  const loadOrders = async () => {
    try {
      const fetched = await ordersAPI.getAll();
      setOrders(fetched || []);
    } catch (error) {
      console.warn('Failed to load orders:', error);
      setOrders([]);
    }
  };

  const loadTransactions = async () => {
    try {
      const fetched = await paymentAPI.transactions.getAll();
      setTransactions(fetched || []);
    } catch (error) {
      console.warn('Failed to load transactions:', error);
      setTransactions([]);
    }
  };

  const loadWallet = async () => {
    if (!user) return;
    
    try {
      setWalletLoading(true);
      const b = await walletService.getBalance(user.id);
      setWalletBalance(b.balance);
      const tus = await walletService.listTopUps(user.id);
      setWalletTopUps(tus);
    } catch (e: any) {
      // Gracefully handle offline/API unavailable - initialize with default values
      console.warn('Wallet API unavailable, using local state:', e?.message || e);
      setWalletBalance(0);
      setWalletTopUps([]);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const amt = Number(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!topUpMethod) {
      Alert.alert('Payment Method', 'Please select a payment method');
      return;
    }

    try {
      setWalletLoading(true);
      // Try real API top-up first
      await walletService.topUp(user.id, amt, topUpMethod);
      const b = await walletService.getBalance(user.id);
      setWalletBalance(b.balance);
      const tus = await walletService.listTopUps(user.id);
      setWalletTopUps(tus);
      setTopUpAmount('');
      setTopUpMethod(null);
      Alert.alert('Top Up Successful', `Added ₱${amt.toFixed(2)} to wallet`);
    } catch (e: any) {
      // Fallback for offline / API failure: record locally so UX still works
      console.warn('Top up failed; applying offline fallback:', e?.message || e);
      const fallback: WalletTopUp = {
        id: `local-${Date.now()}`,
        userId: user.id,
        amount: amt,
        paymentMethod: topUpMethod,
        currency: 'PHP',
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWalletBalance(prev => prev + amt);
      setWalletTopUps(prev => [fallback, ...prev]);
      setTopUpAmount('');
      setTopUpMethod(null);
      Alert.alert('Top Up Recorded', 'Saved locally. Sync when online.');
    } finally {
      setWalletLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    Alert.alert('Success', `${product.name} added to cart`);

    // If this product needs a prescription and none uploaded yet, prompt upload and route to Rx tab
    if (product.requiresPrescription && prescriptions.length === 0) {
      Alert.alert(
        'Prescription Required',
        'This product needs a prescription. Please upload it to continue.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Upload Now', onPress: () => setActiveTab('prescription') },
        ]
      );
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        if (newQuantity > 0) {
          return { ...item, quantity: newQuantity };
        } else {
          return null; // Mark for removal
        }
      }
      return item;
    }).filter((item): item is CartItem => item !== null && item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart first');
      return;
    }
    
    // Check if any item requires prescription
    const requiresPrescriptionItems = cart.filter(item => item.requiresPrescription);
    
    // STRICT: If ANY item requires prescription, MUST have uploaded prescriptions
    if (requiresPrescriptionItems.length > 0) {
      if (!prescriptions || prescriptions.length === 0) {
        Alert.alert(
          'Prescription Required',
          `${requiresPrescriptionItems.length} item(s) in your cart (${requiresPrescriptionItems.map(i => i.name).join(', ')}) require a valid prescription. Please upload your prescription first.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upload Prescription',
              onPress: () => setActiveTab('prescription'),
            },
          ]
        );
        return;
      }
    }
    
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    const total = getCartTotal();

    try {
      setProcessingPayment(true);

      if (selectedPaymentMethod === 'wallet') {
        try {
          const updated = await walletService.deduct(user!.id, total);
          setWalletBalance(updated.balance);
        } catch (err: any) {
          Alert.alert('Wallet Insufficient', 'Not enough wallet balance');
          return;
        }
      } else {
        // Simulate gateway payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const orderPayload: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { paymentStatus?: PaymentStatus } = {
        userId: user!.id,
        merchantId: cart[0]?.merchantId || 'merchant-1',
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name || 'Unknown Product',
        })),
        totalAmount: total,
        currency: 'PHP',
        address: '123 User Street, City',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'completed',
      };

      let savedOrder: Order;
      try {
        savedOrder = await ordersAPI.create(orderPayload);
      } catch (err) {
        console.warn('Order create failed; using local fallback:', err);
        savedOrder = {
          id: `order-${Date.now()}`,
          ...orderPayload,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setOrders(prev => [savedOrder, ...prev]);
      eventBus.publish('orderPlaced', { order: savedOrder });

      Alert.alert('Success', 'Order placed successfully!');
      setCart([]);
      setShowPaymentModal(false);
      setSelectedPaymentMethod(null);
      setActiveTab('orders');
    } catch (error) {
      Alert.alert('Error', 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const requestRefund = async (transaction: PaymentTransaction) => {
    Alert.alert(
      'Request Refund',
      `Refund ₱${transaction.amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              Alert.alert('Success', 'Refund request submitted');
              // loadTransactions();
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
                         (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (p.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesCategory && matchesSearch;
  });

  const paymentMethods: { method: PaymentMethod; name: string; icon: string }[] = [
    { method: 'wallet', name: `Wallet (₱${walletBalance.toFixed(2)})`, icon: '🗃️' },
    { method: 'gcash', name: 'GCash', icon: '💳' },
    { method: 'paymaya', name: 'PayMaya', icon: '💰' },
    { method: 'paypal', name: 'PayPal', icon: '🅿️' },
    { method: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { method: 'cod', name: 'Cash on Delivery', icon: '💵' },
  ];

  // Login and fetch user data example
  useEffect(() => {
    async function doLoginAndFetch() {
      try {
        const token = await login('user1', 'password'); // Replace with real credentials
        await setToken(token);
        const users = await fetchUserUsers();
        setUserUsers(users);
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
    console.log('UserApp: switchingRoles is true, returning null');
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96CEB4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    if (authScreen === 'signup') {
      return <UserSignup onSwitchToLogin={() => setAuthScreen('login')} onBackToRoleSelector={handleBackToRoleSelector} />;
    }
    return <UserLogin onSwitchToSignup={() => setAuthScreen('signup')} onBackToRoleSelector={handleBackToRoleSelector} />;
  }

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Store the image and show doctor selection modal
        setPendingImageUri(result.assets[0].uri);
        setShowDoctorSelectModal(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Store the image and show doctor selection modal
        setPendingImageUri(result.assets[0].uri);
        setShowDoctorSelectModal(true);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleConfirmPrescriptionUpload = () => {
    if (!pendingImageUri || !selectedDoctorForPrescription) {
      Alert.alert('Error', 'Please select a doctor option for this prescription.');
      return;
    }

    const isExternal = selectedDoctorForPrescription.isExternal;
    
    // For external doctors, require a name if provided
    const doctorName = isExternal 
      ? (externalDoctorName.trim() || 'External Doctor')
      : selectedDoctorForPrescription.name;

    setUploadingPrescription(true);
    
    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      userId: user!.id,
      userName: user!.name,
      userEmail: user!.email,
      doctorId: isExternal ? 'external' : selectedDoctorForPrescription.id,
      doctorName: doctorName,
      imageUri: pendingImageUri,
      uploadedAt: new Date().toISOString(),
      status: isExternal ? 'stored' : 'pending', // External prescriptions are just stored
      isExternal: isExternal,
    };
    
    setPrescriptions(prev => [newPrescription, ...prev]);
    
    // Only publish event for in-app doctors
    if (!isExternal) {
      eventBus.publish('prescriptionUploaded', { prescription: { ...newPrescription, isExternal: false } });
      Alert.alert('Success', `Prescription sent to ${doctorName} for review!`);
    } else {
      Alert.alert('Success', 'Prescription saved to your records. This prescription is from an external doctor and will be stored for your reference.');
    }
    
    // Reset state
    setShowDoctorSelectModal(false);
    setPendingImageUri(null);
    setSelectedDoctorForPrescription(null);
    setExternalDoctorName('');
    setUploadingPrescription(false);
  };

  const handleDeletePrescription = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
            // Only notify in-app doctors about deletion (not external)
            if (prescription && !prescription.isExternal) {
              eventBus.publish('prescriptionDeleted', { 
                prescriptionId, 
                userId: prescription.userId,
                doctorId: prescription.doctorId 
              });
            }
            Alert.alert('Success', 'Prescription deleted');
          },
        },
      ]
    );
  };

  // Subscribe to prescription status changes from doctors - only for this user
  useEffect(() => {
    const unsubStatusChanged = eventBus.subscribe('prescriptionStatusChanged', (payload) => {
      // Only update if this is for the current user
      if (payload.userId !== user?.id) return;
      
      setPrescriptions(prev => prev.map(p => 
        p.id === payload.prescriptionId 
          ? { ...p, status: payload.status }
          : p
      ));
      if (payload.status === 'approved') {
        Alert.alert('Prescription Approved', `Your prescription has been approved by ${payload.doctorName || 'the doctor'}!`);
      } else if (payload.status === 'rejected') {
        Alert.alert('Prescription Rejected', payload.doctorNotes || 'Your prescription was not approved. Please upload a clearer image or contact your doctor.');
      }
    });
    return () => unsubStatusChanged();
  }, [user?.id]);

  const renderBrowseContent = () => (
    <ScrollView style={styles.content}>
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
            style={[
              styles.categoryChip,
              { backgroundColor: cat.color },
              selectedCategory === cat.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
            <Text style={styles.categoryChipText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>Available Products</Text>
        <Text style={styles.productCount}>{filteredProducts.length}</Text>
      </View>

      {dataLoading ? (
        <ActivityIndicator size="large" color="#96CEB4" style={styles.loader} />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or category</Text>
        </View>
      ) : (
        <View style={styles.productsList}>
          {filteredProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productCardContent}>
                <View style={styles.productHeader}>
                  <View style={styles.productTitleRow}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    {product.requiresPrescription && (
                      <View style={styles.rxBadge}>
                        <Text style={styles.rxBadgeText}>Rx</Text>
                      </View>
                    )}
                  </View>
                  {product.stock < 10 && product.stock > 0 && (
                    <Text style={styles.lowStockWarning}>⚠️ Low Stock</Text>
                  )}
                </View>

                <Text style={styles.merchantName}>
                  {product.merchantName || 'Unknown Merchant'}
                </Text>

                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.description}
                </Text>

                <View style={styles.productFooter}>
                  <View style={styles.priceAndStock}>
                    <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
                    <Text style={[
                      styles.productStock,
                      product.stock === 0 && styles.productStockOut,
                      product.stock < 10 && product.stock > 0 && styles.productStockLow
                    ]}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, product.stock === 0 && styles.addButtonDisabled]}
                    onPress={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
              <View key={item.id} style={styles.cartItem}>
                <Image source={{ uri: item.imageUrl || '' }} style={styles.cartItemImage} />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  {item.requiresPrescription && (
                    <View style={styles.prescriptionBadge}>
                      <Text style={styles.prescriptionBadgeText}>📄 Prescription Required</Text>
                    </View>
                  )}
                  <Text style={styles.cartItemPrice}>
                    ₱{item.price.toFixed(2)} × {item.quantity}
                  </Text>
                </View>
                <View style={styles.cartItemActions}>
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

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    
    // Simulate driver location and calculate ETA
    if (['in_transit', 'in-transit', 'assigned'].includes(order.status)) {
      // Mock driver location (in real app, would come from backend/socket)
      const driverLoc = {
        lat: 14.5994 + Math.random() * 0.02,
        lng: 120.9842 + Math.random() * 0.02,
      };
      setDriverLocation(driverLoc);
      
      // Calculate distance using Haversine
      const userLoc = { latitude: 14.6091, longitude: 120.9824 }; // Demo location
      const driverCoord = { latitude: driverLoc.lat, longitude: driverLoc.lng };
      const distance = calculateDistance(driverCoord, userLoc);
      setOrderDistance(distance);
      
      // Calculate ETA - returns minutes as number
      const eta = Math.round(distance * 3); // Rough estimate: 3 min per km
      setOrderETA(eta);
    }
  };

  const renderOrderDetailsModal = () => (
    <Modal
      visible={showOrderDetails}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOrderDetails(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '95%' }]}>
          <View style={styles.modalHeaderClose}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {selectedOrder && (
              <>
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Order ID</Text>
                  <Text style={styles.orderDetailValue}>#{selectedOrder.id ? String(selectedOrder.id).slice(0, 12) : 'N/A'}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedOrder.status) }]}>
                      {selectedOrder.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {['in_transit', 'in-transit', 'assigned'].includes(selectedOrder.status) && (
                  <>
                    <View style={styles.orderDetailSection}>
                      <Text style={styles.orderDetailLabel}>📍 Distance</Text>
                      <Text style={styles.orderDetailValue}>
                        {orderDistance ? `${orderDistance.toFixed(1)} km` : 'Loading...'}
                      </Text>
                    </View>

                    <View style={styles.orderDetailSection}>
                      <Text style={styles.orderDetailLabel}>⏱️ ETA</Text>
                      <Text style={styles.orderDetailValue}>
                        {orderETA ? `${orderETA} mins` : 'Calculating...'}
                      </Text>
                    </View>

                    {driverLocation && (
                      <View style={styles.orderDetailSection}>
                        <Text style={styles.orderDetailLabel}>🚗 Driver Location</Text>
                        <Text style={styles.orderDetailValue}>
                          {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Items ({selectedOrder.items.length})</Text>
                  {selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>×{item.quantity}</Text>
                      <Text style={styles.itemName}>{item.name || item.productId}</Text>
                      <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Delivery Address</Text>
                  <Text style={styles.orderDetailValue}>{selectedOrder.address}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Total Amount</Text>
                  <Text style={styles.orderDetailAmount}>₱{selectedOrder.totalAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Payment Method</Text>
                  <Text style={styles.orderDetailValue}>{selectedOrder.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Order Date</Text>
                  <Text style={styles.orderDetailValue}>
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </Text>
                </View>

                {/* Action buttons */}
                {['in_transit', 'in-transit', 'assigned'].includes(selectedOrder.status) && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
                      onPress={() => {
                        // Use sample coordinates for demo; in production, use actual delivery address
                        openGoogleMaps(14.6091, 120.9824, selectedOrder.address);
                      }}
                    >
                      <Text style={styles.actionButtonText}>🗺️ Navigate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#27AE60' }]}
                      onPress={() => {
                        const message = `Hi! I'm tracking my order. My address is ${selectedOrder.address}`;
                        Linking.openURL(`sms:+6391234567890?body=${encodeURIComponent(message)}`);
                      }}
                    >
                      <Text style={styles.actionButtonText}>💬 Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                      onPress={() => {
                        Linking.openURL('tel:+6391234567890');
                      }}
                    >
                      <Text style={styles.actionButtonText}>📞 Call</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderOrdersContent = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>My Orders</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Start shopping to create your first order</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {orders.map(order => {
            if (!order || !order.id) {
              console.warn('Invalid order in map:', order);
              return null;
            }
            const isActiveOrder = ['pending', 'confirmed', 'processing', 'ready', 'assigned', 'in_transit', 'in-transit'].includes(order.status);
            
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, isActiveOrder && styles.orderCardActive]}
                onPress={() => handleOrderPress(order)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderId}>Order #{String(order.id).slice(0, 8)}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.orderStatus, { color: getStatusColor(order.status), backgroundColor: getStatusColor(order.status) + '20' }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.orderContent}>
                  <Text style={styles.orderItems}>
                    📦 {order.items.length} item(s)
                  </Text>
                  <Text style={styles.orderAddress}>
                    📍 {order.address}
                  </Text>
                  <Text style={styles.orderTotal}>
                    ₱{order.totalAmount.toFixed(2)}
                  </Text>
                </View>

                {isActiveOrder && (
                  <View style={styles.orderFooter}>
                    <Text style={styles.trackingText}>Tap to track delivery →</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {renderOrderDetailsModal()}
    </View>
  );

  const renderPaymentsContent = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      {transactions.length === 0 ? (
        <Text style={styles.placeholder}>No transactions yet</Text>
      ) : (
        <>
          {transactions.map(tx => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionMethod}>{tx.paymentMethod.toUpperCase()}</Text>
                <Text style={styles.transactionAmount}>₱{tx.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.transactionDate}>
                {new Date(tx.createdAt).toLocaleString()}
              </Text>
              <Text style={[styles.transactionStatus, { color: getStatusColor(tx.status) }]}>
                {tx.status.toUpperCase()}
              </Text>
              {tx.status === 'completed' && (
                <TouchableOpacity
                  style={styles.refundButton}
                  onPress={() => requestRefund(tx)}
                >
                  <Text style={styles.refundButtonText}>Request Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderWalletContent = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>My Wallet</Text>
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available Balance</Text>
        {walletLoading ? (
          <ActivityIndicator color="#96CEB4" />
        ) : (
          <Text style={styles.walletAmount}>₱{walletBalance.toFixed(2)}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Top Up</Text>
      <View style={styles.topupBox}>
        <Text style={styles.inputLabel}>Amount (PHP)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="e.g. 500"
          keyboardType="numeric"
          value={topUpAmount}
          onChangeText={setTopUpAmount}
        />
        <View style={styles.quickRow}>
          {[100,200,500,1000].map(a => (
            <TouchableOpacity key={a} style={styles.quickBtn} onPress={() => setTopUpAmount(String(a))}>
              <Text style={styles.quickBtnText}>₱{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Payment Method</Text>
        <View>
          {(['gcash','paymaya','paypal','card','cod'] as Exclude<PaymentMethod,'wallet'>[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.pmOption, topUpMethod===m && styles.pmOptionSelected]}
              onPress={() => setTopUpMethod(m)}
            >
              <Text style={styles.pmIcon}>{m==='gcash'?'💳':m==='paymaya'?'💰':m==='paypal'?'🅿️':m==='card'?'💳':'💵'}</Text>
              <Text style={styles.pmText}>{m.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.topupBtn, (!topUpAmount || !topUpMethod) && styles.topupBtnDisabled]}
          disabled={!topUpAmount || !topUpMethod || walletLoading}
          onPress={handleTopUp}
        >
          <Text style={styles.topupBtnText}>Top Up Wallet</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Top Ups</Text>
      {walletTopUps.length === 0 ? (
        <Text style={styles.placeholder}>No top ups yet</Text>
      ) : (
        walletTopUps.map(tu => (
          <View key={tu.id} style={styles.topupItem}>
            <View style={{flex:1}}>
              <Text style={styles.topupMethod}>{tu.paymentMethod.toUpperCase()} • {new Date(tu.createdAt).toLocaleString()}</Text>
              <Text style={[styles.topupStatus, { color: getStatusColor(tu.status) }]}>{tu.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.topupAmount}>₱{tu.amount.toFixed(2)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderPrescriptionContent = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Upload Prescription</Text>
      
      <View style={styles.uploadButtonsContainer}>
        <TouchableOpacity 
          style={[styles.uploadCard, uploadingPrescription && styles.uploadCardDisabled]} 
          onPress={handleTakePhoto}
          disabled={uploadingPrescription}
        >
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.uploadCard, uploadingPrescription && styles.uploadCardDisabled]} 
          onPress={handleChooseFromGallery}
          disabled={uploadingPrescription}
        >
          <Text style={styles.uploadIcon}>🖼️</Text>
          <Text style={styles.uploadText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      {uploadingPrescription && (
        <View style={styles.uploadingIndicator}>
          <ActivityIndicator size="small" color="#4ECDC4" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>My Prescriptions ({prescriptions.length})</Text>
      
      {prescriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No prescriptions uploaded yet</Text>
          <Text style={styles.emptySubtext}>Upload your prescription to order medicines</Text>
        </View>
      ) : (
        prescriptions.map(prescription => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'approved': return '#27AE60';
              case 'rejected': return '#E74C3C';
              case 'pending': return '#F39C12';
              case 'stored': return '#3498DB';
              default: return '#95A5A6';
            }
          };
          const getStatusIcon = (status: string) => {
            switch (status) {
              case 'approved': return '✅';
              case 'rejected': return '❌';
              case 'pending': return '⏳';
              case 'stored': return '📁';
              default: return '📋';
            }
          };
          const getStatusLabel = (status: string, isExternal: boolean) => {
            if (isExternal && status === 'stored') return 'Stored';
            return status.charAt(0).toUpperCase() + status.slice(1);
          };
          return (
            <View key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionHeader}>
                <View style={[
                  styles.prescriptionStatusBadge, 
                  { backgroundColor: getStatusColor(prescription.status) + '20' }
                ]}>
                  <Text style={styles.prescriptionStatusIcon}>{getStatusIcon(prescription.status)}</Text>
                  <Text style={[styles.prescriptionStatusText, { color: getStatusColor(prescription.status) }]}>
                    {getStatusLabel(prescription.status, prescription.isExternal)}
                  </Text>
                </View>
                {prescription.isExternal && (
                  <View style={styles.externalBadge}>
                    <Text style={styles.externalBadgeText}>External</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deletePrescriptionButton}
                  onPress={() => handleDeletePrescription(prescription.id)}
                >
                  <Text style={styles.deletePrescriptionText}>🗑️</Text>
                </TouchableOpacity>
              </View>
              {/* Doctor info */}
              <View style={styles.prescriptionDoctorInfo}>
                <Text style={styles.prescriptionDoctorIcon}>{prescription.isExternal ? '🏥' : '👨‍⚕️'}</Text>
                <Text style={styles.prescriptionDoctorName}>
                  {prescription.isExternal ? 'From: ' : 'Sent to: '}{prescription.doctorName || 'Unknown Doctor'}
                </Text>
              </View>
              <Image 
                source={{ uri: prescription.imageUri }} 
                style={styles.prescriptionImage}
                resizeMode="cover"
              />
              <View style={styles.prescriptionInfo}>
                <Text style={styles.prescriptionDate}>
                  Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.prescriptionTime}>
                  {new Date(prescription.uploadedAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {/* Doctor Selection Modal */}
      <Modal
        visible={showDoctorSelectModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDoctorSelectModal(false);
          setPendingImageUri(null);
          setSelectedDoctorForPrescription(null);
        }}
      >
        <View style={styles.doctorSelectOverlay}>
          <View style={styles.doctorSelectContent}>
            <Text style={styles.doctorSelectTitle}>Select Doctor</Text>
            <Text style={styles.doctorSelectSubtitle}>
              Choose the doctor to send your prescription to for review
            </Text>
            
            {pendingImageUri && (
              <Image 
                source={{ uri: pendingImageUri }} 
                style={styles.pendingPrescriptionPreview}
                resizeMode="cover"
              />
            )}

            <Text style={styles.doctorSelectSectionTitle}>In-App Doctors (for review)</Text>
            
            <ScrollView style={styles.doctorList}>
              {availableDoctors.filter(d => !d.isExternal).map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[
                    styles.doctorSelectItem,
                    selectedDoctorForPrescription?.id === doctor.id && styles.doctorSelectItemActive
                  ]}
                  onPress={() => {
                    setSelectedDoctorForPrescription(doctor);
                    setExternalDoctorName('');
                  }}
                >
                  <Text style={styles.doctorSelectIcon}>👨‍⚕️</Text>
                  <View style={styles.doctorSelectInfo}>
                    <Text style={[
                      styles.doctorSelectName,
                      selectedDoctorForPrescription?.id === doctor.id && styles.doctorSelectNameActive
                    ]}>
                      {doctor.name}
                    </Text>
                    <Text style={styles.doctorSelectSpec}>{doctor.specialization}</Text>
                  </View>
                  {selectedDoctorForPrescription?.id === doctor.id && (
                    <Text style={styles.doctorSelectCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* External Doctor Option */}
              <Text style={styles.doctorSelectSectionTitle}>External Prescription</Text>
              
              {availableDoctors.filter(d => d.isExternal).map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[
                    styles.doctorSelectItem,
                    styles.doctorSelectItemExternal,
                    selectedDoctorForPrescription?.id === doctor.id && styles.doctorSelectItemActive
                  ]}
                  onPress={() => setSelectedDoctorForPrescription(doctor)}
                >
                  <Text style={styles.doctorSelectIcon}>🏥</Text>
                  <View style={styles.doctorSelectInfo}>
                    <Text style={[
                      styles.doctorSelectName,
                      selectedDoctorForPrescription?.id === doctor.id && styles.doctorSelectNameActive
                    ]}>
                      {doctor.name}
                    </Text>
                    <Text style={styles.doctorSelectSpec}>{doctor.specialization}</Text>
                  </View>
                  {selectedDoctorForPrescription?.id === doctor.id && (
                    <Text style={styles.doctorSelectCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* External doctor name input */}
              {selectedDoctorForPrescription?.isExternal && (
                <View style={styles.externalDoctorInput}>
                  <Text style={styles.externalDoctorLabel}>Doctor's Name (optional):</Text>
                  <TextInput
                    style={styles.externalDoctorTextInput}
                    placeholder="Enter the doctor's name..."
                    value={externalDoctorName}
                    onChangeText={setExternalDoctorName}
                  />
                </View>
              )}
            </ScrollView>
            
            <View style={styles.doctorSelectButtons}>
              <TouchableOpacity 
                style={styles.doctorSelectCancelBtn}
                onPress={() => {
                  setShowDoctorSelectModal(false);
                  setPendingImageUri(null);
                  setSelectedDoctorForPrescription(null);
                  setExternalDoctorName('');
                }}
              >
                <Text style={styles.doctorSelectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.doctorSelectConfirmBtn,
                  !selectedDoctorForPrescription && styles.doctorSelectConfirmBtnDisabled
                ]}
                onPress={handleConfirmPrescriptionUpload}
                disabled={!selectedDoctorForPrescription}
              >
                <Text style={styles.doctorSelectConfirmText}>
                  {uploadingPrescription ? 'Processing...' : (selectedDoctorForPrescription?.isExternal ? 'Save Prescription' : 'Send to Doctor')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  const renderProfileContent = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profilePhone}>{user.phone || ''}</Text>
        <Text style={styles.profileEmail}>{user.email || ''}</Text>
      </View>
    </View>
  );

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
                ]}
                onPress={() => setSelectedPaymentMethod(pm.method)}
                disabled={processingPayment}
              >
                <Text style={styles.paymentMethodIcon}>{pm.icon}</Text>
                <Text style={styles.paymentMethodName}>{pm.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.modalTotalAmount}>
              Total: ₱{getCartTotal().toFixed(2)}
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
    switch (status) {
      case 'pending': return '#F39C12';
      case 'accepted': return '#3498DB';
      case 'in_transit': return '#9B59B6';
      case 'delivered': return '#27AE60';
      case 'cancelled': return '#E74C3C';
      case 'completed': return '#27AE60';
      default: return '#7F8C8D';
    }
  };

  const getTabColor = (tabId: string) => {
    switch (tabId) {
      case 'browse': return '#3498DB';
      case 'cart': return '#E74C3C';
      case 'prescription': return '#9B59B6';
      case 'orders': return '#F39C12';
      case 'wallet': return '#27AE60';
      case 'payments': return '#16A085';
      case 'medicare': return '#8E44AD';
      case 'library': return '#2980B9';
      case 'profile': return '#D35400';
      case 'logout': return '#C0392B';
      default: return '#7F8C8D';
    }
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
          onPress={() => setActiveTab('browse')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Use only component-based renderers for these tabs
  const renderMedicareContent = () => <MedicarePhilHealthTab />;
  const renderMedicalLibraryContent = () => <MedicalLibraryTab />;
  const renderLocateContent = () => <ClinicLocatorTab />;
  const renderConsultContent = () => <ConsultationTab />;

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return renderBrowseContent();
      case 'cart':
        return renderCartContent();
      case 'orders':
        return renderOrdersContent();
      case 'wallet':
        return renderWalletContent();
      case 'payments':
        return renderPaymentsContent();
      case 'prescription':
        return renderPrescriptionContent();
      case 'medicare':
        return renderMedicareContent();
      case 'library':
        return renderMedicalLibraryContent();
      case 'locate':
        return renderLocateContent();
      case 'consult':
        return renderConsultContent();
      case 'profile':
        return renderProfileContent();
      case 'logout':
        return renderLogoutContent();
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setShowMenu(!showMenu)}
          style={styles.hamburgerButton}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Pharmacy</Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => {
            setActiveTab('orders');
            setShowMenu(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="View your orders"
          accessibilityHint="Opens your orders list"
        >
          <View style={styles.cartBadgeContainer}>
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
            <Text style={styles.cartIcon}>🛒</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu */}
      {showMenu && (
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setActiveTab('medicare');
              setShowMenu(false);
            }}
          >
            <Text style={styles.menuItemIcon}>🏥</Text>
            <Text style={styles.menuItemText}>Medicare/PhilHealth</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setActiveTab('library');
              setShowMenu(false);
            }}
          >
            <Text style={styles.menuItemIcon}>📚</Text>
            <Text style={styles.menuItemText}>Medical Library</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setActiveTab('locate');
              setShowMenu(false);
            }}
          >
            <Text style={styles.menuItemIcon}>🏨</Text>
            <Text style={styles.menuItemText}>Locate a Doctor/Clinic</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setActiveTab('consult');
              setShowMenu(false);
            }}
          >
            <Text style={styles.menuItemIcon}>💬</Text>
            <Text style={styles.menuItemText}>Online Medical Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setActiveTab('payments');
              setShowMenu(false);
            }}
          >
            <Text style={styles.menuItemIcon}>💳</Text>
            <Text style={styles.menuItemText}>Transactions</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
      <TabBar 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabPress={(tabId) => {
          setActiveTab(tabId);
          setShowMenu(false);
        }} 
        color={getTabColor(activeTab)}
      />
    </View>
  );
}

const UserApp = () => (
  <UserAuthProvider>
    <UserDataProvider>
      <UserAppContent />
    </UserDataProvider>
  </UserAuthProvider>
);

export default UserApp;

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3498DB',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  hamburgerButton: { 
    padding: 8,
    paddingRight: 12
  },
  hamburgerIcon: { 
    fontSize: 24, 
    color: '#fff',
    fontWeight: 'bold'
  },
  headerTitle: { 
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  headerRight: { 
    padding: 8
  },
  cartBadgeContainer: { 
    position: 'relative'
  },
  cartIcon: { 
    fontSize: 20
  },
  cartBadge: { 
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center'
  },
  cartBadgeText: { 
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  menu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  menuItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  menuItemIcon: { 
    fontSize: 20,
    marginRight: 12,
    width: 24
  },
  menuItemText: { 
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  menuDivider: { 
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4
  },
  scrollView: { flex: 1 },
  content: { flex: 1, padding: 16, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  productCount: { fontSize: 14, color: '#888', fontWeight: '600' },
  productsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  placeholder: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 24 },
  categoryButton: { padding: 10, borderRadius: 8, marginRight: 8, backgroundColor: '#F0F0F0' },
  categoryButtonActive: { borderWidth: 2, borderColor: '#3498DB', backgroundColor: '#E3F2FD' },
  categoryIcon: { fontSize: 22, marginBottom: 2 },
  categoryText: { fontSize: 14 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 },
  productsList: { marginBottom: 16 },
  productCard: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  productCardContent: { padding: 12 },
  productHeader: { marginBottom: 8 },
  productTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  productName: { fontWeight: 'bold', fontSize: 16, flex: 1, color: '#1a1a1a' },
  rxBadge: { 
    backgroundColor: '#FFF3CD', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4,
    marginLeft: 8
  },
  rxBadgeText: { color: '#856404', fontWeight: 'bold', fontSize: 11 },
  lowStockWarning: { color: '#E74C3C', fontSize: 12, fontWeight: '600', marginTop: 4 },
  merchantName: { color: '#666', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  productDescription: { color: '#888', fontSize: 13, marginBottom: 10, lineHeight: 18 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceAndStock: { flex: 1 },
  productPrice: { color: '#27AE60', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  productDesc: { color: '#666', fontSize: 14, marginBottom: 4 },
  productStock: { color: '#666', fontSize: 12, fontWeight: '500' },
  productStockLow: { color: '#E67E22', fontWeight: 'bold' },
  productStockOut: { color: '#E74C3C', fontWeight: 'bold' },
  addToCartBtn: { backgroundColor: '#3498DB', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center', marginTop: 8 },
  addToCartText: { color: '#fff', fontWeight: 'bold' },
  addButton: { 
    backgroundColor: '#3498DB', 
    borderRadius: 6, 
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40
  },
  addButtonDisabled: { backgroundColor: '#BDC3C7' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  loader: { marginTop: 40 },
  categoryScroll: { marginBottom: 16 },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, marginRight: 8, backgroundColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' },
  categoryChipActive: { borderWidth: 2, borderColor: '#3498DB', backgroundColor: '#E3F2FD' },
  categoryChipIcon: { fontSize: 18, marginRight: 4 },
  categoryChipText: { fontSize: 14 },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  productInfo: { flex: 1 },
  productNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  rxTag: { color: '#E74C3C', fontWeight: 'bold', marginLeft: 6 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  availabilityBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  availableProduct: { backgroundColor: '#E3FCEC', color: '#27AE60' },
  unavailableProduct: { backgroundColor: '#FDEDEC', color: '#E74C3C' },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  emptySubtext: { color: '#888', fontSize: 14 },
  emptyCart: { alignItems: 'center', marginTop: 40 },
  emptyCartIcon: { fontSize: 40, marginBottom: 8 },
  emptyCartText: { fontSize: 18, color: '#888', marginBottom: 8 },
  shopButton: { backgroundColor: '#3498DB', borderRadius: 6, padding: 10, marginTop: 12 },
  shopButtonText: { color: '#fff', fontWeight: 'bold' },
  cartList: { marginTop: 12 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, padding: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  cartItemImage: { width: 48, height: 48, borderRadius: 8, marginRight: 10 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontWeight: 'bold', fontSize: 15 },
  prescriptionBadge: { backgroundColor: '#FDEDEC', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  prescriptionBadgeText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 12 },
  cartItemPrice: { color: '#27AE60', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  quantityButton: { backgroundColor: '#F0F0F0', borderRadius: 4, padding: 4, marginHorizontal: 2 },
  quantityButtonText: { fontSize: 18, fontWeight: 'bold' },
  quantityText: { fontSize: 16, marginHorizontal: 4 },
  removeButton: { backgroundColor: '#E74C3C', borderRadius: 4, padding: 4, marginLeft: 4 },
  removeButtonText: { color: '#fff', fontWeight: 'bold' },
  cartSummary: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },
  checkoutButton: { backgroundColor: '#27AE60', borderRadius: 6, padding: 12, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#888', fontSize: 16 },
  searchBar: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  orderCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#F0F0F0' },
  orderCardActive: { borderLeftColor: '#3498DB' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderHeaderLeft: { flex: 1 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  orderDate: { color: '#888', fontSize: 12, marginTop: 2 },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold', fontSize: 12 },
  orderContent: { marginBottom: 8 },
  orderItems: { color: '#666', marginBottom: 4 },
  orderAddress: { color: '#666', marginBottom: 4 },
  orderTotal: { fontWeight: 'bold', color: '#27AE60', fontSize: 14 },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  trackingText: { color: '#3498DB', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 16 },
  modalHeaderClose: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  closeButton: { fontSize: 24, color: '#888' },
  modalBody: { paddingHorizontal: 16 },
  paymentMethodsList: { marginBottom: 16 },
  paymentMethodCard: { backgroundColor: '#F0F0F0', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  paymentMethodCardSelected: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#3498DB' },
  paymentMethodIcon: { fontSize: 24, marginRight: 12 },
  paymentMethodName: { fontWeight: 'bold', flex: 1 },
  modalFooter: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 },
  modalTotalAmount: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 8 },
  confirmButton: { flex: 1, backgroundColor: '#27AE60', borderRadius: 6, padding: 12, alignItems: 'center' },
  confirmButtonDisabled: { backgroundColor: '#B0BEC5' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
  orderDetailSection: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  orderDetailLabel: { fontWeight: 'bold', color: '#666', marginBottom: 4, fontSize: 12 },
  orderDetailValue: { fontSize: 16, color: '#333' },
  orderDetailAmount: { fontSize: 20, fontWeight: 'bold', color: '#27AE60' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusBadgeText: { fontWeight: 'bold', fontSize: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemQty: { fontWeight: 'bold', color: '#666', marginRight: 8 },
  itemName: { flex: 1, color: '#333' },
  itemPrice: { color: '#27AE60', fontWeight: 'bold' },
  actionButtonsContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, borderRadius: 6, padding: 12, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  walletCard: { backgroundColor: '#F0F0F0', borderRadius: 10, padding: 16, marginBottom: 12 },
  walletLabel: { color: '#888', fontSize: 14, marginBottom: 4 },
  walletAmount: { fontSize: 32, fontWeight: 'bold', color: '#27AE60' },
  topupBox: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, marginBottom: 12 },
  inputLabel: { fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  amountInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: { flex: 1, backgroundColor: '#3498DB', borderRadius: 6, padding: 8, alignItems: 'center' },
  quickBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  pmOption: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  pmOptionSelected: { borderColor: '#3498DB', borderWidth: 2, backgroundColor: '#E3F2FD' },
  pmIcon: { fontSize: 20, marginRight: 10 },
  pmText: { fontWeight: 'bold', flex: 1 },
  topupBtn: { backgroundColor: '#27AE60', borderRadius: 6, padding: 12, alignItems: 'center', marginTop: 12 },
  topupBtnDisabled: { backgroundColor: '#B0BEC5' },
  topupBtnText: { color: '#fff', fontWeight: 'bold' },
  topupItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  topupMethod: { fontWeight: 'bold', fontSize: 14 },
  topupStatus: { fontSize: 12, marginTop: 2 },
  topupAmount: { fontWeight: 'bold', fontSize: 16, color: '#27AE60' },
  uploadButtonsContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  uploadCard: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 10, padding: 16, alignItems: 'center' },
  uploadCardDisabled: { backgroundColor: '#ddd', opacity: 0.6 },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  uploadingIndicator: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 12 },
  uploadingText: { marginLeft: 8, color: '#888' },
  prescriptionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  prescriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  prescriptionStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  prescriptionStatusIcon: { fontSize: 12, marginRight: 4 },
  prescriptionStatusText: { fontSize: 12, fontWeight: '600' },
  prescriptionImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 10 },
  prescriptionInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prescriptionDate: { fontWeight: '600', fontSize: 13, color: '#2C3E50' },
  prescriptionTime: { color: '#95A5A6', fontSize: 12 },
  deletePrescriptionButton: { padding: 6 },
  deletePrescriptionText: { fontSize: 18 },
  profileCard: { backgroundColor: '#F0F0F0', borderRadius: 10, padding: 16 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  profileEmail: { color: '#666', fontSize: 14, marginBottom: 4 },
  profilePhone: { color: '#666', fontSize: 14 },
  transactionCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3498DB' },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  transactionMethod: { fontWeight: 'bold', fontSize: 14 },
  transactionAmount: { fontWeight: 'bold', color: '#27AE60', fontSize: 14 },
  transactionDate: { color: '#888', fontSize: 12, marginBottom: 4 },
  transactionStatus: { fontWeight: 'bold', fontSize: 12 },
  refundButton: { backgroundColor: '#E74C3C', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginTop: 8 },
  refundButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
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
  cancelButton: {
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Doctor info in prescription card
  prescriptionDoctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  prescriptionDoctorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  prescriptionDoctorName: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  // Doctor Selection Modal
  doctorSelectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  doctorSelectContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  doctorSelectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  doctorSelectSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingPrescriptionPreview: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
  },
  doctorList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  doctorSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  doctorSelectItemActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#27AE60',
  },
  doctorSelectIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  doctorSelectInfo: {
    flex: 1,
  },
  doctorSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  doctorSelectNameActive: {
    color: '#27AE60',
  },
  doctorSelectSpec: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  doctorSelectCheck: {
    fontSize: 20,
    color: '#27AE60',
    fontWeight: 'bold',
  },
  doctorSelectButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  doctorSelectCancelBtn: {
    flex: 1,
    backgroundColor: '#ECF0F1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doctorSelectCancelText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  doctorSelectConfirmBtn: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doctorSelectConfirmBtnDisabled: {
    backgroundColor: '#B0BEC5',
  },
  doctorSelectConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doctorSelectSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 12,
    marginBottom: 8,
  },
  doctorSelectItemExternal: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
  },
  externalDoctorInput: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
  },
  externalDoctorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  externalDoctorTextInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  externalBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  externalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F57C00',
  },
});

