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
import { eventBus, AppointmentRequestedPayload, AppointmentStatusChangedPayload, AppointmentCompletedPayload } from '../../services/eventBus';
import { useMerchantAuth } from '../../contexts/MerchantAuthContext';

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  doctorId: string;
  doctorName: string;
  concern: string;
  concernLabel?: string;
  requestedAt: string;
  startedAt?: string;
  endedAt?: string;
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'rejected';
  consultationType: 'chat' | 'video';
  duration?: number;
  summary?: string;
  doctorNotes?: string;
}

export default function DoctorAppointmentsTab() {
  const { user } = useMerchantAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  // Get current doctor's ID directly from user profile (doc1, doc2, etc.)
  const currentDoctorId = user?.id || null;
  const currentDoctorName = user?.name ? `Dr. ${user.name}` : 'Doctor';

  useEffect(() => {
    // Subscribe to appointment requested events
    const unsubRequested = eventBus.subscribe('appointmentRequested', (payload: AppointmentRequestedPayload) => {
      const { appointment } = payload;
      
      // Only add if this appointment is for the current doctor
      if (currentDoctorId && appointment.doctorId === currentDoctorId) {
        setAppointments(prev => {
          // Avoid duplicates
          if (prev.find(a => a.id === appointment.id)) return prev;
          return [{
            id: appointment.id,
            userId: appointment.userId,
            userName: appointment.userName || 'Anonymous',
            userEmail: appointment.userEmail,
            userPhone: appointment.userPhone,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName || '',
            concern: appointment.concern,
            concernLabel: appointment.concernLabel,
            requestedAt: appointment.requestedAt,
            status: appointment.status,
            consultationType: appointment.consultationType,
          }, ...prev];
        });
      }
    });

    // Subscribe to status changes
    const unsubStatus = eventBus.subscribe('appointmentStatusChanged', (payload: AppointmentStatusChangedPayload) => {
      if (currentDoctorId && payload.doctorId === currentDoctorId) {
        setAppointments(prev => prev.map(appt => {
          if (appt.id === payload.appointmentId) {
            return {
              ...appt,
              status: payload.status,
              startedAt: payload.startedAt || appt.startedAt,
              endedAt: payload.endedAt || appt.endedAt,
              doctorNotes: payload.doctorNotes || appt.doctorNotes,
            };
          }
          return appt;
        }));
      }
    });

    // Subscribe to completed events
    const unsubCompleted = eventBus.subscribe('appointmentCompleted', (payload: AppointmentCompletedPayload) => {
      if (currentDoctorId && payload.doctorId === currentDoctorId) {
        setAppointments(prev => prev.map(appt => {
          if (appt.id === payload.appointmentId) {
            return {
              ...appt,
              status: 'completed',
              duration: payload.duration,
              summary: payload.summary,
            };
          }
          return appt;
        }));
      }
    });

    return () => {
      unsubRequested();
      unsubStatus();
      unsubCompleted();
    };
  }, [currentDoctorId]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today, ${formatTime(dateString)}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${formatTime(dateString)}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'accepted': return '#3498DB';
      case 'active': return '#27AE60';
      case 'completed': return '#7F8C8D';
      case 'cancelled': return '#E74C3C';
      case 'rejected': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'active': return '🟢';
      case 'completed': return '✔️';
      case 'cancelled': return '❌';
      case 'rejected': return '🚫';
      default: return '❓';
    }
  };

  const getConcernIcon = (concern: string) => {
    const icons: { [key: string]: string } = {
      fever: '🤒',
      headache: '🤕',
      stomach: '🤢',
      skin: '🔴',
      cough: '😷',
      allergy: '🤧',
      pain: '💢',
      other: '❓',
    };
    return icons[concern] || '🏥';
  };

  const handleAcceptAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Accept Consultation',
      `Accept consultation request from ${appointment.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            eventBus.publish('appointmentStatusChanged', {
              appointmentId: appointment.id,
              userId: appointment.userId,
              doctorId: appointment.doctorId,
              status: 'accepted',
            });
            Alert.alert('Accepted', 'You have accepted the consultation request.');
          },
        },
      ]
    );
  };

  const handleRejectAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Reject Consultation',
      `Reject consultation request from ${appointment.userName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            eventBus.publish('appointmentStatusChanged', {
              appointmentId: appointment.id,
              userId: appointment.userId,
              doctorId: appointment.doctorId,
              status: 'rejected',
              doctorNotes: 'Request declined by doctor',
            });
          },
        },
      ]
    );
  };

  const filteredAppointments = appointments.filter(appt => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return appt.status === 'pending' || appt.status === 'accepted';
    if (activeFilter === 'active') return appt.status === 'active';
    if (activeFilter === 'completed') return appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'rejected';
    return true;
  });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const activeCount = appointments.filter(a => a.status === 'active').length;

  if (!currentDoctorId) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📅 Appointments</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Doctor Profile Not Found</Text>
          <Text style={styles.emptyText}>
            Unable to load appointments. Please ensure your doctor profile is properly configured.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27AE60']} />
      }
    >
      <Text style={styles.title}>📅 Appointments</Text>
      <Text style={styles.subtitle}>Manage consultation requests from patients</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF5E7' }]}>
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F8F5' }]}>
          <Text style={styles.summaryCount}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#EBF5FB' }]}>
          <Text style={styles.summaryCount}>{appointments.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'active', 'completed'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Appointments</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'all' 
              ? 'When patients request consultations, they will appear here.'
              : `No ${activeFilter} appointments at the moment.`}
          </Text>
        </View>
      ) : (
        filteredAppointments.map(appointment => (
          <View key={appointment.id} style={styles.appointmentCard}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.patientInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {appointment.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{appointment.userName}</Text>
                  {appointment.userEmail && (
                    <Text style={styles.patientContact}>{appointment.userEmail}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                <Text style={styles.statusIcon}>{getStatusIcon(appointment.status)}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Concern */}
            <View style={styles.concernRow}>
              <Text style={styles.concernIcon}>{getConcernIcon(appointment.concern)}</Text>
              <Text style={styles.concernText}>{appointment.concernLabel || appointment.concern}</Text>
              <Text style={styles.consultationType}>
                {appointment.consultationType === 'video' ? '📹 Video' : '💬 Chat'}
              </Text>
            </View>

            {/* Time Info */}
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Requested:</Text>
              <Text style={styles.timeValue}>{formatDate(appointment.requestedAt)}</Text>
            </View>
            {appointment.startedAt && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Started:</Text>
                <Text style={styles.timeValue}>{formatDate(appointment.startedAt)}</Text>
              </View>
            )}
            {appointment.duration !== undefined && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Duration:</Text>
                <Text style={styles.timeValue}>{formatDuration(appointment.duration)}</Text>
              </View>
            )}
            {appointment.summary && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Summary:</Text>
                <Text style={styles.summaryText}>{appointment.summary}</Text>
              </View>
            )}

            {/* Actions */}
            {appointment.status === 'pending' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => handleAcceptAppointment(appointment)}
                >
                  <Text style={styles.acceptBtnText}>✓ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleRejectAppointment(appointment)}
                >
                  <Text style={styles.rejectBtnText}>✕ Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Appointments sync automatically when patients initiate consultations in the User App. 
          You can accept or decline pending requests.
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
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#27AE60',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
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
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#27AE60',
    fontWeight: '600',
  },

  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  patientContact: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  concernRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  concernIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  concernText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  consultationType: {
    fontSize: 12,
    color: '#7F8C8D',
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  timeValue: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },

  summarySection: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#2C3E50',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptBtn: {
    backgroundColor: '#27AE60',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: '#FADBD8',
  },
  rejectBtnText: {
    color: '#E74C3C',
    fontWeight: '600',
    fontSize: 14,
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

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F8F5',
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
    fontSize: 13,
    color: '#1ABC9C',
    lineHeight: 18,
  },
});