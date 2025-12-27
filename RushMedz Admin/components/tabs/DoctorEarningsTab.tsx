import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { eventBus, AppointmentCompletedPayload, PrescriptionStatusChangedPayload } from '../../services/eventBus';
import { useMerchantAuth } from '../../contexts/MerchantAuthContext';

interface EarningRecord {
  id: string;
  type: 'consultation' | 'prescription' | 'video_call';
  patientName: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'paid';
  description: string;
}

interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalPending: number;
  totalPaid: number;
}

// Consultation fees based on doctor specialization
const CONSULTATION_FEES: { [doctorId: string]: number } = {
  'doc1': 500,  // Dr. Maria Santos - General Medicine
  'doc2': 600,  // Dr. Jose Reyes - Internal Medicine
  'doc3': 550,  // Dr. Ana Cruz - Family Medicine
  'doc4': 450,  // Dr. Miguel Torres - General Practice
  'doc5': 700,  // Dr. Patricia Lim - Emergency Medicine
};

const PRESCRIPTION_REVIEW_FEE = 100;

export default function DoctorEarningsTab() {
  const { user } = useMerchantAuth();
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const currentDoctorId = (user as any)?.id || null;
  const consultationFee = currentDoctorId ? CONSULTATION_FEES[currentDoctorId] || 500 : 500;

  useEffect(() => {
    // Subscribe to completed consultations
    const unsubCompleted = eventBus.subscribe('appointmentCompleted', (payload: AppointmentCompletedPayload) => {
      if (currentDoctorId && payload.doctorId === currentDoctorId) {
        const newEarning: EarningRecord = {
          id: `earn-${Date.now()}`,
          type: 'consultation',
          patientName: 'Patient',
          amount: consultationFee,
          date: new Date().toISOString(),
          status: 'pending',
          description: payload.summary || 'Consultation completed',
        };
        setEarnings(prev => [newEarning, ...prev]);
      }
    });

    // Subscribe to prescription approvals (earn fee for reviewing)
    const unsubPrescription = eventBus.subscribe('prescriptionStatusChanged', (payload: PrescriptionStatusChangedPayload) => {
      if (currentDoctorId && payload.doctorId === currentDoctorId && payload.status === 'approved') {
        const newEarning: EarningRecord = {
          id: `earn-presc-${Date.now()}`,
          type: 'prescription',
          patientName: 'Patient',
          amount: PRESCRIPTION_REVIEW_FEE,
          date: new Date().toISOString(),
          status: 'pending',
          description: 'Prescription review & approval',
        };
        setEarnings(prev => [newEarning, ...prev]);
      }
    });

    return () => {
      unsubCompleted();
      unsubPrescription();
    };
  }, [currentDoctorId, consultationFee]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculateSummary = (): EarningsSummary => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let today = 0, thisWeek = 0, thisMonth = 0, totalPending = 0, totalPaid = 0;

    earnings.forEach(e => {
      const date = new Date(e.date);
      if (date >= todayStart) today += e.amount;
      if (date >= weekStart) thisWeek += e.amount;
      if (date >= monthStart) thisMonth += e.amount;
      if (e.status === 'pending') totalPending += e.amount;
      if (e.status === 'paid') totalPaid += e.amount;
    });

    return { today, thisWeek, thisMonth, totalPending, totalPaid };
  };

  const getFilteredEarnings = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return earnings.filter(e => {
      const date = new Date(e.date);
      switch (selectedPeriod) {
        case 'today': return date >= todayStart;
        case 'week': return date >= weekStart;
        case 'month': return date >= monthStart;
        default: return true;
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return '💬';
      case 'prescription': return '📋';
      case 'video_call': return '📹';
      default: return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#27AE60';
      case 'pending': return '#F39C12';
      case 'paid': return '#3498DB';
      default: return '#7F8C8D';
    }
  };

  const summary = calculateSummary();
  const filteredEarnings = getFilteredEarnings();

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27AE60']} />
      }
    >
      <Text style={styles.title}>💰 Earnings</Text>
      <Text style={styles.subtitle}>Track your consultation income</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.mainSummaryCard}>
          <Text style={styles.mainSummaryLabel}>This Month</Text>
          <Text style={styles.mainSummaryAmount}>₱{summary.thisMonth.toLocaleString()}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.subSummaryRow}>
            <View style={styles.subSummaryItem}>
              <Text style={styles.subSummaryLabel}>Today</Text>
              <Text style={styles.subSummaryValue}>₱{summary.today.toLocaleString()}</Text>
            </View>
            <View style={styles.subSummaryItem}>
              <Text style={styles.subSummaryLabel}>This Week</Text>
              <Text style={styles.subSummaryValue}>₱{summary.thisWeek.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusCardsRow}>
          <View style={[styles.statusCard, { backgroundColor: '#FEF5E7' }]}>
            <Text style={styles.statusCardIcon}>⏳</Text>
            <Text style={styles.statusCardAmount}>₱{summary.totalPending.toLocaleString()}</Text>
            <Text style={styles.statusCardLabel}>Pending</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#EBF5FB' }]}>
            <Text style={styles.statusCardIcon}>✅</Text>
            <Text style={styles.statusCardAmount}>₱{summary.totalPaid.toLocaleString()}</Text>
            <Text style={styles.statusCardLabel}>Paid Out</Text>
          </View>
        </View>
      </View>

      {/* Fee Info */}
      <View style={styles.feeInfoCard}>
        <Text style={styles.feeInfoTitle}>Your Rates</Text>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>💬 Consultation Fee:</Text>
          <Text style={styles.feeValue}>₱{consultationFee}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>📋 Prescription Review:</Text>
          <Text style={styles.feeValue}>₱{PRESCRIPTION_REVIEW_FEE}</Text>
        </View>
      </View>

      {/* Period Filter */}
      <View style={styles.filterRow}>
        {(['today', 'week', 'month', 'all'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[styles.filterTab, selectedPeriod === period && styles.filterTabActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.filterText, selectedPeriod === period && styles.filterTextActive]}>
              {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings List */}
      <Text style={styles.sectionTitle}>Transaction History</Text>
      
      {filteredEarnings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Earnings Yet</Text>
          <Text style={styles.emptyText}>
            Complete consultations and approve prescriptions to start earning. Your transactions will appear here.
          </Text>
        </View>
      ) : (
        filteredEarnings.map(earning => (
          <View key={earning.id} style={styles.earningCard}>
            <View style={styles.earningIcon}>
              <Text style={styles.earningIconText}>{getTypeIcon(earning.type)}</Text>
            </View>
            <View style={styles.earningInfo}>
              <Text style={styles.earningType}>
                {earning.type === 'consultation' ? 'Consultation' : 
                 earning.type === 'prescription' ? 'Prescription Review' : 'Video Call'}
              </Text>
              <Text style={styles.earningDesc}>{earning.description}</Text>
              <Text style={styles.earningDate}>{formatDate(earning.date)}</Text>
            </View>
            <View style={styles.earningRight}>
              <Text style={styles.earningAmount}>+₱{earning.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(earning.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(earning.status) }]}>
                  {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Payout Info */}
      <View style={styles.payoutCard}>
        <Text style={styles.payoutIcon}>🏦</Text>
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutTitle}>Automatic Payouts</Text>
          <Text style={styles.payoutText}>
            Earnings are automatically transferred to your registered bank account every Monday.
          </Text>
        </View>
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

  summaryContainer: {
    marginBottom: 16,
  },
  mainSummaryCard: {
    backgroundColor: '#27AE60',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  mainSummaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  mainSummaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
  subSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  subSummaryItem: {
    alignItems: 'center',
  },
  subSummaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  subSummaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },

  statusCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusCardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusCardLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },

  feeInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
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
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#27AE60',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },

  earningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  earningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningIconText: {
    fontSize: 20,
  },
  earningInfo: {
    flex: 1,
  },
  earningType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  earningDesc: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  earningDate: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 4,
  },
  earningRight: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
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

  payoutCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  payoutIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  payoutText: {
    fontSize: 12,
    color: '#5DADE2',
    marginTop: 4,
    lineHeight: 18,
  },
});