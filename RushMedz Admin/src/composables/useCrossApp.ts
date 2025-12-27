/**
 * Cross-App Composable
 * Vue composition API hook for cross-app communication
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { APP_URLS, APP_INFO, type AppType } from '../config/appConfig';
import {
  doctorAppService,
  driverAppService,
  merchantAppService,
  userAppService,
  notificationService,
  appLinkHelper,
} from '../services/crossAppService';
import eventBridge, { type BridgeEvent, type EventType } from '../services/eventBridge';

export const useCrossApp = () => {
  const connectedApps = ref<Record<AppType, boolean>>({
    admin: true,
    doctor: false,
    driver: false,
    merchant: false,
    user: false,
  });

  const isEventBridgeConnected = ref(false);

  // Check app health on mount
  onMounted(async () => {
    const appTypes: AppType[] = ['doctor', 'driver', 'merchant', 'user'];
    
    for (const app of appTypes) {
      connectedApps.value[app] = await appLinkHelper.checkAppHealth(app);
    }

    isEventBridgeConnected.value = eventBridge.getConnectionStatus();
  });

  // Get app info
  const getAppInfo = (appType: AppType) => APP_INFO[appType];
  const getAppUrl = (appType: AppType) => APP_URLS[appType];

  // Navigate to external app
  const navigateToApp = (appType: AppType, path: string = '') => {
    const url = appLinkHelper.generateWebLink(appType, path);
    window.open(url, '_blank');
  };

  return {
    connectedApps,
    isEventBridgeConnected,
    getAppInfo,
    getAppUrl,
    navigateToApp,
    
    // Services
    doctorAppService,
    driverAppService,
    merchantAppService,
    userAppService,
    notificationService,
    appLinkHelper,
    
    // Event bridge
    eventBridge,
  };
};

/**
 * Hook for subscribing to cross-app events
 */
export const useCrossAppEvents = (eventType: EventType | '*', handler: (event: BridgeEvent) => void) => {
  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    unsubscribe = eventBridge.subscribe(eventType, handler);
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
};

/**
 * Hook for doctor management
 */
export const useDoctorManagement = () => {
  const doctors = ref<any[]>([]);
  const loading = ref(false);
  const stats = ref({ totalDoctors: 0, activeDoctors: 0, pendingApproval: 0, totalConsultations: 0 });

  const fetchDoctors = async () => {
    loading.value = true;
    try {
      doctors.value = await doctorAppService.getDoctors();
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    stats.value = await doctorAppService.getDoctorStats();
  };

  const approveDoctor = async (id: string | number) => {
    await doctorAppService.approveDoctor(id);
    await fetchDoctors();
    eventBridge.publish('doctor:status_changed', { doctorId: id, status: 'approved' }, 'doctor');
  };

  const suspendDoctor = async (id: string | number, reason: string) => {
    await doctorAppService.suspendDoctor(id, reason);
    await fetchDoctors();
    eventBridge.publish('doctor:status_changed', { doctorId: id, status: 'suspended', reason }, 'doctor');
  };

  onMounted(() => {
    fetchDoctors();
    fetchStats();
  });

  return { doctors, loading, stats, fetchDoctors, fetchStats, approveDoctor, suspendDoctor };
};

/**
 * Hook for driver management
 */
export const useDriverManagement = () => {
  const drivers = ref<any[]>([]);
  const onlineDrivers = ref<any[]>([]);
  const loading = ref(false);
  const stats = ref({ totalDrivers: 0, onlineDrivers: 0, activeDeliveries: 0, completedToday: 0 });

  const fetchDrivers = async () => {
    loading.value = true;
    try {
      drivers.value = await driverAppService.getDrivers();
      onlineDrivers.value = await driverAppService.getOnlineDrivers();
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    stats.value = await driverAppService.getDriverStats();
  };

  const suspendDriver = async (id: string | number, reason: string) => {
    await driverAppService.suspendDriver(id, reason);
    await fetchDrivers();
    eventBridge.publish('driver:status_changed', { driverId: id, status: 'suspended', reason }, 'driver');
  };

  const activateDriver = async (id: string | number) => {
    await driverAppService.activateDriver(id);
    await fetchDrivers();
    eventBridge.publish('driver:status_changed', { driverId: id, status: 'active' }, 'driver');
  };

  onMounted(() => {
    fetchDrivers();
    fetchStats();
  });

  // Subscribe to driver status events
  useCrossAppEvents('driver:status_changed', () => {
    fetchDrivers();
    fetchStats();
  });

  return { drivers, onlineDrivers, loading, stats, fetchDrivers, fetchStats, suspendDriver, activateDriver };
};

/**
 * Hook for merchant management
 */
export const useMerchantManagement = () => {
  const merchants = ref<any[]>([]);
  const loading = ref(false);
  const stats = ref({ totalMerchants: 0, activeMerchants: 0, totalProducts: 0, pendingApproval: 0 });

  const fetchMerchants = async () => {
    loading.value = true;
    try {
      merchants.value = await merchantAppService.getMerchants();
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    stats.value = await merchantAppService.getMerchantStats();
  };

  const approveMerchant = async (id: string | number) => {
    await merchantAppService.approveMerchant(id);
    await fetchMerchants();
    eventBridge.publish('merchant:status_changed', { merchantId: id, status: 'approved' }, 'merchant');
  };

  const suspendMerchant = async (id: string | number, reason: string) => {
    await merchantAppService.suspendMerchant(id, reason);
    await fetchMerchants();
    eventBridge.publish('merchant:status_changed', { merchantId: id, status: 'suspended', reason }, 'merchant');
  };

  onMounted(() => {
    fetchMerchants();
    fetchStats();
  });

  return { merchants, loading, stats, fetchMerchants, fetchStats, approveMerchant, suspendMerchant };
};

/**
 * Hook for user management
 */
export const useUserManagement = () => {
  const users = ref<any[]>([]);
  const loading = ref(false);
  const stats = ref({ totalUsers: 0, activeUsers: 0, newUsersToday: 0, totalOrders: 0 });

  const fetchUsers = async () => {
    loading.value = true;
    try {
      users.value = await userAppService.getUsers();
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    stats.value = await userAppService.getUserStats();
  };

  const suspendUser = async (id: string | number, reason: string) => {
    await userAppService.suspendUser(id, reason);
    await fetchUsers();
  };

  const activateUser = async (id: string | number) => {
    await userAppService.activateUser(id);
    await fetchUsers();
  };

  onMounted(() => {
    fetchUsers();
    fetchStats();
  });

  return { users, loading, stats, fetchUsers, fetchStats, suspendUser, activateUser };
};

export default useCrossApp;
