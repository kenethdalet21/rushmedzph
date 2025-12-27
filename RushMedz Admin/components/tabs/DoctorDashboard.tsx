import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { eventBus } from '../../services/eventBus';
import { useMerchantAuth } from '../../contexts/MerchantAuthContext';

interface ActivityItem {
  id: string;
  type: 'appointment' | 'prescription' | 'consultation' | 'payment';
  text: string;
  time: string;
  timestamp: Date;
}

interface DoctorDashboardProps {
  doctor?: {
    fullName: string;
    specialization: string;
    verificationStatus?: string;
    organization?: string;
    organizationAddress?: string;
    email?: string;
    phone?: string;
  };
  onNavigate?: (screen: string) => void;
}

// Consultation fees by doctor ID
const CONSULTATION_FEES: { [key: string]: number } = {
  'doc1': 500, 'doc2': 600, 'doc3': 550, 'doc4': 450, 'doc5': 700
};

const DOCTOR_SPECIALIZATIONS: { [key: string]: string } = {
  'doc1': 'General Medicine',
  'doc2': 'Internal Medicine', 
  'doc3': 'Family Medicine',
  'doc4': 'General Practice',
  'doc5': 'Emergency Medicine',
};

export default function DoctorDashboard({ doctor, onNavigate }: DoctorDashboardProps) {
  const { user } = useMerchantAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  const doctorUser = user as any;
  const doctorId = doctorUser?.id || null;
  const doctorName = doctorUser?.name || 'Doctor';
  const consultationFee = doctorId ? CONSULTATION_FEES[doctorId] || 500 : 500;
  const specialization = doctorId ? DOCTOR_SPECIALIZATIONS[doctorId] || 'General Medicine' : 'General Medicine';

  // Real-time metrics from events
  const [metrics, setMetrics] = useState({
    todayConsultations: 0,
    pendingPrescriptions: 0,
    upcomingAppointments: 0,
    todayEarnings: 0,
    monthlyEarnings: 0,
    totalPatients: 0,
    completedToday: 0,
    unreadNotifications: 0,
  });

  // Doctor info
  const info = doctor || {
    fullName: `Dr. ${doctorName}`,
    specialization: specialization,
    verificationStatus: 'verified',
    organization: "Epharma Medical Network",
    organizationAddress: 'Metro Manila, Philippines',
    email: doctorUser?.email || 'doctor@epharma.com',
    phone: doctorUser?.phone || '+63 912 345 6789',
  };

  // Subscribe to events for real-time updates
  useEffect(() => {
    if (!doctorId) return;

    const addActivity = (type: ActivityItem['type'], text: string) => {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        type,
        text,
        time: 'Just now',
        timestamp: new Date(),
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
    };

    // Listen for new appointments
    const unsubAppointment = eventBus.subscribe('appointmentRequested', (payload) => {
      if (payload.appointment.doctorId === doctorId) {
        setMetrics(prev => ({
          ...prev,
          upcomingAppointments: prev.upcomingAppointments + 1,
          unreadNotifications: prev.unreadNotifications + 1,
        }));
        addActivity('appointment', `${payload.appointment.userName || 'New patient'} requested a consultation`);
      }
    });

    // Listen for appointment status changes
    const unsubAppointmentStatus = eventBus.subscribe('appointmentStatusChanged', (payload) => {
      if (payload.doctorId === doctorId) {
        if (payload.status === 'active') {
          setMetrics(prev => ({
            ...prev,
            todayConsultations: prev.todayConsultations + 1,
          }));
        } else if (payload.status === 'rejected' || payload.status === 'cancelled') {
          setMetrics(prev => ({
            ...prev,
            upcomingAppointments: Math.max(0, prev.upcomingAppointments - 1),
          }));
        }
      }
    });

    // Listen for completed consultations
    const unsubCompleted = eventBus.subscribe('appointmentCompleted', (payload) => {
      if (payload.doctorId === doctorId) {
        setMetrics(prev => ({
          ...prev,
          completedToday: prev.completedToday + 1,
          upcomingAppointments: Math.max(0, prev.upcomingAppointments - 1),
          todayEarnings: prev.todayEarnings + consultationFee,
          monthlyEarnings: prev.monthlyEarnings + consultationFee,
          totalPatients: prev.totalPatients + 1,
        }));
        addActivity('payment', `Consultation completed. Earned ₱${consultationFee}`);
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
        addActivity('prescription', `${payload.prescription.userName || 'Patient'} uploaded a prescription for review`);
      }
    });

    // Listen for prescription status changes
    const unsubPrescriptionStatus = eventBus.subscribe('prescriptionStatusChanged', (payload) => {
      if (payload.doctorId === doctorId) {
        const fee = payload.status === 'approved' ? 100 : 0;
        setMetrics(prev => ({
          ...prev,
          pendingPrescriptions: Math.max(0, prev.pendingPrescriptions - 1),
          todayEarnings: prev.todayEarnings + fee,
          monthlyEarnings: prev.monthlyEarnings + fee,
        }));
        if (payload.status === 'approved') {
          addActivity('prescription', 'Prescription approved. Earned ₱100');
        }
      }
    });

    return () => {
      unsubAppointment();
      unsubAppointmentStatus();
      unsubCompleted();
      unsubPrescription();
      unsubPrescriptionStatus();
    };
  }, [doctorId, consultationFee]);

  // Update activity times
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentActivity(prev => prev.map(activity => {
        const diffMs = Date.now() - activity.timestamp.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        let time = 'Just now';
        if (diffMins >= 60) {
          time = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
          time = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        }
        
        return { ...activity, time };
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Navigation handlers
  const handleNavigate = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      Alert.alert('Navigate', `Go to ${screen} section`);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'appointment': return '#27AE60';
      case 'prescription': return '#3498DB';
      case 'consultation': return '#F39C12';
      case 'payment': return '#9B59B6';
      default: return '#7F8C8D';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27AE60']} />
      }
    >
      {/* Highlight Cards Row */}
      <View style={styles.highlightRow}>
        <TouchableOpacity 
          style={[styles.highlightCard, { backgroundColor: '#27AE60' }]}
          onPress={() => handleNavigate('earnings')}
        >
          <Text style={styles.highlightIcon}>💰</Text>
          <Text style={styles.highlightValue}>₱{metrics.todayEarnings.toLocaleString()}</Text>
          <Text style={styles.highlightLabel}>Today's Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.highlightCard, { backgroundColor: '#3498DB' }]}
          onPress={() => handleNavigate('consultations')}
        >
          <Text style={styles.highlightIcon}>🩺</Text>
          <Text style={styles.highlightValue}>{metrics.todayConsultations}</Text>
          <Text style={styles.highlightLabel}>Today's Consultations</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Grid */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.metricsGrid}>
        <TouchableOpacity style={styles.metricCard} onPress={() => handleNavigate('prescriptions')}>
          <Text style={styles.metricIcon}>📝</Text>
          <Text style={styles.metricValue}>{metrics.pendingPrescriptions}</Text>
          <Text style={styles.metricLabel}>Pending Rx</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metricCard} onPress={() => handleNavigate('appointments')}>
          <Text style={styles.metricIcon}>📅</Text>
          <Text style={styles.metricValue}>{metrics.upcomingAppointments}</Text>
          <Text style={styles.metricLabel}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metricCard} onPress={() => handleNavigate('consultations')}>
          <Text style={styles.metricIcon}>✅</Text>
          <Text style={styles.metricValue}>{metrics.completedToday}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metricCard} onPress={() => handleNavigate('notifications')}>
          <Text style={styles.metricIcon}>🔔</Text>
          <Text style={styles.metricValue}>{metrics.unreadNotifications}</Text>
          <Text style={styles.metricLabel}>Notifications</Text>
        </TouchableOpacity>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>👥</Text>
          <Text style={styles.metricValue}>{metrics.totalPatients}</Text>
          <Text style={styles.metricLabel}>Total Patients</Text>
        </View>
        <TouchableOpacity style={styles.metricCard} onPress={() => handleNavigate('earnings')}>
          <Text style={styles.metricIcon}>📊</Text>
          <Text style={styles.metricValue}>₱{(metrics.monthlyEarnings / 1000).toFixed(0)}K</Text>
          <Text style={styles.metricLabel}>This Month</Text>
        </TouchableOpacity>
      </View>

      {/* Fee Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>💵 Your Consultation Rates</Text>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Chat/Video Consultation:</Text>
          <Text style={styles.feeValue}>₱{consultationFee}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Prescription Review:</Text>
          <Text style={styles.feeValue}>₱100</Text>
        </View>
      </View>

      {/* Organization Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>🏥 Organization</Text>
        <Text style={styles.infoCardText}>{info.organization}</Text>
        <Text style={styles.infoCardSubtext}>{info.organizationAddress}</Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigate('consultations')}>
          <Text style={styles.actionButtonIcon}>🩺</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Start Consultation</Text>
            <Text style={styles.actionButtonSubtitle}>Begin online consultation</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigate('prescriptions')}>
          <Text style={styles.actionButtonIcon}>📝</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Review Prescriptions</Text>
            <Text style={styles.actionButtonSubtitle}>{metrics.pendingPrescriptions} pending approval</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigate('appointments')}>
          <Text style={styles.actionButtonIcon}>📅</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>View Schedule</Text>
            <Text style={styles.actionButtonSubtitle}>{metrics.upcomingAppointments} upcoming appointments</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigate('earnings')}>
          <Text style={styles.actionButtonIcon}>💵</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Earnings Report</Text>
            <Text style={styles.actionButtonSubtitle}>View detailed earnings breakdown</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        {recentActivity.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityIcon}>📭</Text>
            <Text style={styles.emptyActivityText}>No recent activity</Text>
            <Text style={styles.emptyActivitySubtext}>Activities will appear here when patients interact with you</Text>
          </View>
        ) : (
          recentActivity.map(activity => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: getActivityColor(activity.type) }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Contact Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>📞 Contact Information</Text>
        <Text style={styles.infoCardText}>{info.email}</Text>
        <Text style={styles.infoCardSubtext}>{info.phone}</Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  highlightRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  highlightIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  highlightLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  metricLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
  },
  infoCardSubtext: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 24,
    color: '#BDC3C7',
    fontWeight: '300',
  },
  activityCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  activityTime: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyActivityIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  emptyActivitySubtext: {
    fontSize: 13,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  feeLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
  },
  bottomSpacer: {
    height: 20,
  },
});
