import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { 
  eventBus, 
  AppointmentRequestedPayload, 
  AppointmentStatusChangedPayload,
  AppointmentCompletedPayload,
  PrescriptionUploadedPayload,
} from '../../services/eventBus';
import { useMerchantAuth } from '../../contexts/MerchantAuthContext';

interface Notification {
  id: string;
  type: 'appointment' | 'prescription' | 'system' | 'earning' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  data?: any;
}

export default function DoctorNotificationsTab() {
  const { user } = useMerchantAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'appointments' | 'prescriptions'>('all');

  const currentDoctorId = (user as any)?.id || null;
  const currentDoctorName = user ? `Dr. ${(user as any).name || 'Doctor'}` : 'Doctor';

  // Add system notifications on mount
  useEffect(() => {
    const systemNotifications: Notification[] = [
      {
        id: 'sys-welcome',
        type: 'system',
        title: '👋 Welcome to Epharma Doctor Portal',
        message: 'You can now receive consultation requests and manage prescriptions from patients.',
        timestamp: new Date().toISOString(),
        read: false,
        actionable: false,
      },
      {
        id: 'sys-tip',
        type: 'reminder',
        title: '💡 Quick Tip',
        message: 'Keep your availability status updated to receive more consultation requests.',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: true,
        actionable: false,
      },
    ];
    setNotifications(systemNotifications);
  }, []);

  useEffect(() => {
    // Subscribe to new appointment requests
    const unsubAppointment = eventBus.subscribe('appointmentRequested', (payload: AppointmentRequestedPayload) => {
      const { appointment } = payload;
      if (currentDoctorId && appointment.doctorId === currentDoctorId) {
        const newNotification: Notification = {
          id: `notif-appt-${Date.now()}`,
          type: 'appointment',
          title: '📅 New Consultation Request',
          message: `${appointment.userName || 'A patient'} is requesting a consultation for ${appointment.concernLabel || appointment.concern}.`,
          timestamp: new Date().toISOString(),
          read: false,
          actionable: true,
          data: { appointmentId: appointment.id, userId: appointment.userId },
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    });

    // Subscribe to appointment completions
    const unsubCompleted = eventBus.subscribe('appointmentCompleted', (payload: AppointmentCompletedPayload) => {
      if (currentDoctorId && payload.doctorId === currentDoctorId) {
        const mins = Math.floor(payload.duration / 60);
        const newNotification: Notification = {
          id: `notif-complete-${Date.now()}`,
          type: 'earning',
          title: '✅ Consultation Completed',
          message: `Consultation ended after ${mins} minutes. Earnings have been added to your account.`,
          timestamp: new Date().toISOString(),
          read: false,
          actionable: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    });

    // Subscribe to new prescription uploads
    const unsubPrescription = eventBus.subscribe('prescriptionUploaded', (payload: PrescriptionUploadedPayload) => {
      const { prescription } = payload;
      if (currentDoctorId && prescription.doctorId === currentDoctorId && !prescription.isExternal) {
        const newNotification: Notification = {
          id: `notif-presc-${Date.now()}`,
          type: 'prescription',
          title: '📋 New Prescription for Review',
          message: `${prescription.userName || 'A patient'} has uploaded a prescription for your review.`,
          timestamp: new Date().toISOString(),
          read: false,
          actionable: true,
          data: { prescriptionId: prescription.id, userId: prescription.userId },
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    });

    return () => {
      unsubAppointment();
      unsubCompleted();
      unsubPrescription();
    };
  }, [currentDoctorId]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Alert.alert('Done', 'All notifications marked as read.');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllRead = () => {
    Alert.alert(
      'Clear Read Notifications',
      'Remove all read notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => setNotifications(prev => prev.filter(n => !n.read))
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.actionable) {
      if (notification.type === 'appointment') {
        Alert.alert(
          'Consultation Request',
          'Go to Appointments tab to view and manage this request.',
          [{ text: 'OK' }]
        );
      } else if (notification.type === 'prescription') {
        Alert.alert(
          'Prescription Review',
          'Go to Prescriptions tab to review this prescription.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'prescription': return '📋';
      case 'earning': return '💰';
      case 'reminder': return '💡';
      case 'system': return '📢';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return '#3498DB';
      case 'prescription': return '#9B59B6';
      case 'earning': return '#27AE60';
      case 'reminder': return '#F39C12';
      case 'system': return '#7F8C8D';
      default: return '#95A5A6';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    switch (filter) {
      case 'unread': return !n.read;
      case 'appointments': return n.type === 'appointment';
      case 'prescriptions': return n.type === 'prescription';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27AE60']} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🔔 Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'unread', 'appointments', 'prescriptions'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : 'New notifications will appear here when patients request consultations or upload prescriptions.'}
          </Text>
        </View>
      ) : (
        filteredNotifications.map(notification => (
          <TouchableOpacity 
            key={notification.id} 
            style={[
              styles.notificationCard,
              !notification.read && styles.notificationCardUnread,
            ]}
            onPress={() => handleNotificationPress(notification)}
            onLongPress={() => {
              Alert.alert(
                'Notification Options',
                '',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: notification.read ? 'Mark as Unread' : 'Mark as Read', 
                    onPress: () => setNotifications(prev => prev.map(n => 
                      n.id === notification.id ? { ...n, read: !n.read } : n
                    ))
                  },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notification.id) },
                ]
              );
            }}
          >
            <View style={[styles.iconContainer, { backgroundColor: getTypeColor(notification.type) + '20' }]}>
              <Text style={styles.iconText}>{getTypeIcon(notification.type)}</Text>
            </View>
            <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.notificationTitle, !notification.read && styles.notificationTitleUnread]}>
                  {notification.title}
                </Text>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.timestamp}>{formatTime(notification.timestamp)}</Text>
                {notification.actionable && (
                  <Text style={[styles.actionLabel, { color: getTypeColor(notification.type) }]}>
                    Tap to view →
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Clear Button */}
      {notifications.some(n => n.read) && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearAllRead}>
          <Text style={styles.clearBtnText}>🗑️ Clear Read Notifications</Text>
        </TouchableOpacity>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Long-press on a notification to see more options. Notifications sync in real-time when patients interact with the app.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#27AE60',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  markAllBtn: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllBtnText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#27AE60',
    fontWeight: '600',
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  notificationCardUnread: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 3,
    borderLeftColor: '#27AE60',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27AE60',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#95A5A6',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },

  clearBtn: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#E74C3C',
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#5DADE2',
    lineHeight: 18,
  },
});