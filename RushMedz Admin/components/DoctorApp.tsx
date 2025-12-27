import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TabBar from './TabBar';
import { MerchantAuthProvider, useMerchantAuth } from '../contexts/MerchantAuthContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import DoctorLogin from './DoctorLogin';
import DoctorSignup from './DoctorSignup';
import DoctorDashboard from './tabs/DoctorDashboard';
import DoctorConsultationsTab from './tabs/DoctorConsultationsTab';
import DoctorPrescriptionsTab from './tabs/DoctorPrescriptionsTab';
import DoctorAppointmentsTab from './tabs/DoctorAppointmentsTab';
import DoctorEarningsTab from './tabs/DoctorEarningsTab';
import DoctorNotificationsTab from './tabs/DoctorNotificationsTab';
import { eventBus } from '../services/eventBus';

// Doctor App Context for shared state across tabs
interface DoctorAppContextType {
  metrics: DoctorMetrics;
  updateMetrics: (updates: Partial<DoctorMetrics>) => void;
  navigateToTab: (tab: string) => void;
  doctorId: string | null;
  doctorName: string;
}

interface DoctorMetrics {
  todayConsultations: number;
  pendingPrescriptions: number;
  upcomingAppointments: number;
  activeConsultations: number;
  todayEarnings: number;
  monthlyEarnings: number;
  totalPatients: number;
  completedToday: number;
  unreadNotifications: number;
}

const DoctorAppContext = createContext<DoctorAppContextType | null>(null);

export const useDoctorApp = () => {
  const context = useContext(DoctorAppContext);
  if (!context) {
    throw new Error('useDoctorApp must be used within DoctorApp');
  }
  return context;
};

const doctorTabs = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'consultations', title: 'Consultations', icon: '🩺' },
  { id: 'prescriptions', title: 'Prescriptions', icon: '📝' },
  { id: 'appointments', title: 'Appointments', icon: '📅' },
  { id: 'earnings', title: 'Earnings', icon: '💰' },
  { id: 'notifications', title: 'Notifications', icon: '🔔' },
  { id: 'logout', title: 'Logout', icon: '🚪' },
];

interface DoctorAppProps {
  onBackToRoleSelector?: () => void;
}

function DoctorAppContent({ onBackToRoleSelector }: DoctorAppProps) {
  const { user, loading, signOut, signIn } = useMerchantAuth();
  const { switchRole } = useUnifiedAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'consultations' | 'prescriptions' | 'appointments' | 'earnings' | 'notifications' | 'logout'>('dashboard');
  
  // Shared metrics state
  const [metrics, setMetrics] = useState<DoctorMetrics>({
    todayConsultations: 0,
    pendingPrescriptions: 0,
    upcomingAppointments: 0,
    activeConsultations: 0,
    todayEarnings: 0,
    monthlyEarnings: 0,
    totalPatients: 0,
    completedToday: 0,
    unreadNotifications: 0,
  });

  const doctorUser = user as any;
  const doctorId = doctorUser?.id || null;
  const doctorName = doctorUser?.name ? `Dr. ${doctorUser.name}` : 'Doctor';

  // Subscribe to events to update metrics
  useEffect(() => {
    if (!doctorId) return;

    // Listen for new appointments
    const unsubAppointment = eventBus.subscribe('appointmentRequested', (payload) => {
      if (payload.appointment.doctorId === doctorId) {
        setMetrics(prev => ({
          ...prev,
          upcomingAppointments: prev.upcomingAppointments + 1,
          unreadNotifications: prev.unreadNotifications + 1,
        }));
      }
    });

    // Listen for appointment status changes
    const unsubAppointmentStatus = eventBus.subscribe('appointmentStatusChanged', (payload) => {
      if (payload.doctorId === doctorId) {
        if (payload.status === 'active') {
          setMetrics(prev => ({
            ...prev,
            activeConsultations: prev.activeConsultations + 1,
            todayConsultations: prev.todayConsultations + 1,
          }));
        }
      }
    });

    // Listen for completed consultations
    const unsubCompleted = eventBus.subscribe('appointmentCompleted', (payload) => {
      if (payload.doctorId === doctorId) {
        // Get consultation fee based on doctor
        const fees: { [key: string]: number } = {
          'doc1': 500, 'doc2': 600, 'doc3': 550, 'doc4': 450, 'doc5': 700
        };
        const fee = fees[doctorId] || 500;
        
        setMetrics(prev => ({
          ...prev,
          completedToday: prev.completedToday + 1,
          activeConsultations: Math.max(0, prev.activeConsultations - 1),
          todayEarnings: prev.todayEarnings + fee,
          monthlyEarnings: prev.monthlyEarnings + fee,
          totalPatients: prev.totalPatients + 1,
        }));
      }
    });

    // Listen for new prescriptions
    const unsubPrescription = eventBus.subscribe('prescriptionUploaded', (payload) => {
      if (payload.prescription.doctorId === doctorId && !payload.prescription.isExternal) {
        setMetrics(prev => ({
          ...prev,
          pendingPrescriptions: prev.pendingPrescriptions + 1,
          unreadNotifications: prev.unreadNotifications + 1,
        }));
      }
    });

    // Listen for prescription status changes
    const unsubPrescriptionStatus = eventBus.subscribe('prescriptionStatusChanged', (payload) => {
      if (payload.doctorId === doctorId) {
        setMetrics(prev => ({
          ...prev,
          pendingPrescriptions: Math.max(0, prev.pendingPrescriptions - 1),
          todayEarnings: payload.status === 'approved' ? prev.todayEarnings + 100 : prev.todayEarnings,
          monthlyEarnings: payload.status === 'approved' ? prev.monthlyEarnings + 100 : prev.monthlyEarnings,
        }));
      }
    });

    return () => {
      unsubAppointment();
      unsubAppointmentStatus();
      unsubCompleted();
      unsubPrescription();
      unsubPrescriptionStatus();
    };
  }, [doctorId]);

  const updateMetrics = (updates: Partial<DoctorMetrics>) => {
    setMetrics(prev => ({ ...prev, ...updates }));
  };

  const navigateToTab = (tab: string) => {
    if (['dashboard', 'consultations', 'prescriptions', 'appointments', 'earnings', 'notifications', 'logout'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  };

  const handleBackToRoleSelector = async () => {
    try {
      await switchRole();
    } catch (error) {
      console.error('Back to role selector failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleTabPress = (tabId: string) => {
    // Clear notification count when viewing notifications
    if (tabId === 'notifications') {
      setMetrics(prev => ({ ...prev, unreadNotifications: 0 }));
    }
    setActiveTab(tabId as typeof activeTab);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Not authenticated - show login/signup
  if (!user || (user as any).role !== 'doctor') {
    if (authScreen === 'signup') {
      return (
        <DoctorSignup 
          onSwitchToMerchantSignup={() => {}} // Not used in DoctorApp
          onBackToRoleSelector={handleBackToRoleSelector}
          onSwitchToLogin={() => setAuthScreen('login')}
        />
      );
    }
    
    return (
      <DoctorLogin 
        onSwitchToSignup={() => setAuthScreen('signup')} 
        onBackToRoleSelector={handleBackToRoleSelector}
        onLoginSuccess={(doctorData) => {
          signIn(doctorData.email, '', doctorData);
        }}
      />
    );
  }

  // Authenticated - show doctor dashboard
  const contextValue: DoctorAppContextType = {
    metrics,
    updateMetrics,
    navigateToTab,
    doctorId,
    doctorName,
  };

  const renderLogoutContent = () => (
    <View style={styles.logoutContainer}>
      <Text style={styles.logoutIcon}>🚪</Text>
      <Text style={styles.logoutTitle}>Logout</Text>
      <Text style={styles.logoutText}>Are you sure you want to logout from Doctor Portal?</Text>
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
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
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DoctorDashboard onNavigate={navigateToTab} />;
      case 'consultations':
        return <DoctorConsultationsTab />;
      case 'prescriptions':
        return <DoctorPrescriptionsTab />;
      case 'appointments':
        return <DoctorAppointmentsTab />;
      case 'earnings':
        return <DoctorEarningsTab />;
      case 'notifications':
        return <DoctorNotificationsTab />;
      case 'logout':
        return renderLogoutContent();
      default:
        return <DoctorDashboard onNavigate={navigateToTab} />;
    }
  };

  // Update tabs with notification badge
  const tabsWithBadges = doctorTabs.map(tab => {
    if (tab.id === 'notifications' && metrics.unreadNotifications > 0) {
      return { ...tab, badge: metrics.unreadNotifications };
    }
    if (tab.id === 'prescriptions' && metrics.pendingPrescriptions > 0) {
      return { ...tab, badge: metrics.pendingPrescriptions };
    }
    if (tab.id === 'appointments' && metrics.upcomingAppointments > 0) {
      return { ...tab, badge: metrics.upcomingAppointments };
    }
    return tab;
  });

  return (
    <DoctorAppContext.Provider value={contextValue}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor Portal</Text>
          <Text style={styles.headerSubtitle}>Welcome, {doctorName}</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>

        {/* Bottom Tab Bar */}
        <TabBar
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          color="#27AE60"
        />
      </View>
    </DoctorAppContext.Provider>
  );
}

export default function DoctorApp({ onBackToRoleSelector }: DoctorAppProps) {
  return (
    <MerchantAuthProvider>
      <DoctorAppContent onBackToRoleSelector={onBackToRoleSelector} />
    </MerchantAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    backgroundColor: '#27AE60',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  logoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
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
    fontSize: 16,
    fontWeight: '600',
  },
});
