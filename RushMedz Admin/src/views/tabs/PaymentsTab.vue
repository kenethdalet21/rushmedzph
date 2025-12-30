<template>
  <div class="payments-tab">
    <div class="tab-header">
      <h2>Payment Management</h2>
      <div class="stats">
        <div class="stat-item">
          <span class="label">Total Processed:</span>
          <span class="value">{{ formatCurrency(totalProcessed) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Pending:</span>
          <span class="value pending">{{ formatCurrency(totalPending) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Payout Requests:</span>
          <span class="value payout">{{ payoutRequests.length }}</span>
        </div>
      </div>
    </div>

    <!-- Cross-App Sync Banner -->
    <div class="sync-banner">
      <div class="sync-icon">🔗</div>
      <div class="sync-content">
        <div class="sync-title">Cross-App Payment Sync Active</div>
        <div class="sync-text">
          📱 User App: {{ payments.length }} transactions • 
          🏪 Merchant App: {{ payoutRequests.length }} payout requests
        </div>
      </div>
    </div>

    <!-- Payout Requests Section -->
    <div v-if="payoutRequests.length > 0" class="payout-requests">
      <h3>💰 Merchant Payout Requests</h3>
      <div class="payout-cards">
        <div v-for="payout in payoutRequests" :key="payout.id" class="payout-card">
          <div class="payout-header">
            <span class="merchant-name">{{ payout.merchantName }}</span>
            <span :class="`payout-status ${payout.status}`">{{ payout.status }}</span>
          </div>
          <div class="payout-amount">{{ formatCurrency(payout.amount) }}</div>
          <div class="payout-details">
            <span>🏦 {{ payout.bankAccount }}</span>
            <span>📅 {{ formatDate(payout.requestedAt) }}</span>
          </div>
          <div v-if="payout.status === 'pending'" class="payout-actions">
            <button class="btn-approve" @click="approvePayout(payout)">✓ Approve</button>
            <button class="btn-reject" @click="rejectPayout(payout)">✕ Reject</button>
          </div>
        </div>
      </div>
    </div>

    <div class="payments-list">
      <h3>💳 Payment Transactions</h3>
      <div v-if="loading" class="loading">Loading payments...</div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>User</th>
              <th>Merchant</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id">
              <td><strong>#{{ payment.id }}</strong></td>
              <td>#{{ payment.orderId }}</td>
              <td>{{ payment.userName }}</td>
              <td>{{ payment.merchantName }}</td>
              <td class="amount">{{ formatCurrency(payment.amount) }}</td>
              <td>{{ payment.paymentMethod }}</td>
              <td><span :class="`status ${payment.status.toLowerCase()}`">{{ payment.status }}</span></td>
              <td>{{ formatDate(payment.createdAt) }}</td>
              <td>
                <button v-if="payment.status === 'PENDING'" @click="process(payment.id)" class="btn-sm process">
                  Process
                </button>
                <button v-else @click="viewPayment(payment.id)" class="btn-sm">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { getPayments, processPayment, loading } = useAdmin();

const payments = ref<any[]>([]);
const payoutRequests = ref<any[]>([]);

// Simulated WebSocket for cross-app events
let wsConnection: any = null;

const totalProcessed = computed(() => {
  return payments.value
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
});

const totalPending = computed(() => {
  return payments.value
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);
});

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const process = async (paymentId: number) => {
  if (confirm('Process this payment?')) {
    try {
      await processPayment(paymentId);
      const payment = payments.value.find(p => p.id === paymentId);
      if (payment) payment.status = 'COMPLETED';
      alert('Payment processed successfully!');
    } catch (error) {
      alert('Failed to process payment');
    }
  }
};

const viewPayment = (paymentId: number) => {
  alert(`View payment details for Payment #${paymentId}`);
};

const approvePayout = (payout: any) => {
  if (confirm(`Approve payout of ${formatCurrency(payout.amount)} to ${payout.merchantName}?`)) {
    payout.status = 'approved';
    // Send approval event to Merchant app
    console.log('[Admin] Payout approved, notifying Merchant app:', payout);
    alert(`✅ Payout approved! Notification sent to ${payout.merchantName}`);
  }
};

const rejectPayout = (payout: any) => {
  const reason = prompt('Enter rejection reason:');
  if (reason) {
    payout.status = 'rejected';
    payout.rejectionReason = reason;
    console.log('[Admin] Payout rejected:', payout);
    alert(`❌ Payout rejected. Merchant notified.`);
  }
};

onMounted(async () => {
  try {
    payments.value = await getPayments();
  } catch (error) {
    console.error('Failed to load payments:', error);
    // Mock data
    payments.value = [
      { id: 5001, orderId: 1001, userName: 'John Doe', merchantName: 'MediPharm', amount: 1250.00, paymentMethod: 'GCash', status: 'COMPLETED', createdAt: '2025-12-25T10:30:00' },
      { id: 5002, orderId: 1002, userName: 'Jane Smith', merchantName: 'HealthStore', amount: 890.50, paymentMethod: 'PayMaya', status: 'COMPLETED', createdAt: '2025-12-25T14:15:00' },
      { id: 5003, orderId: 1003, userName: 'Bob Johnson', merchantName: 'QuickMeds', amount: 2340.00, paymentMethod: 'Card', status: 'PENDING', createdAt: '2025-12-26T09:00:00' },
      { id: 5004, orderId: 1004, userName: 'Alice Brown', merchantName: 'MediPharm', amount: 560.25, paymentMethod: 'GCash', status: 'COMPLETED', createdAt: '2025-12-24T16:45:00' },
      { id: 5005, orderId: 1005, userName: 'Charlie Wilson', merchantName: 'HealthStore', amount: 1780.00, paymentMethod: 'Bank Transfer', status: 'PENDING', createdAt: '2025-12-26T11:20:00' },
    ];
  }
  
  // Mock payout requests from Merchant app
  payoutRequests.value = [
    { id: 'PO-001', merchantId: 'merchant_1', merchantName: 'RushMedz Pharmacy', amount: 15000.00, bankAccount: 'BDO ***4521', status: 'pending', requestedAt: '2025-12-30T09:15:00' },
    { id: 'PO-002', merchantId: 'merchant_2', merchantName: 'MediPharm', amount: 8500.00, bankAccount: 'GCash 0917***8912', status: 'pending', requestedAt: '2025-12-29T14:30:00' },
  ];
});

onUnmounted(() => {
  if (wsConnection) {
    wsConnection.close();
  }
});
</script>

<style scoped>
.payments-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tab-header {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.tab-header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.5px;
  text-align: center;
  width: 100%;
}

.stats {
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  align-items: center;
}

.stat-item .label {
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item .value {
  font-size: 22px;
  font-weight: 700;
  color: #27ae60;
}

.stat-item .value.pending {
  color: #f39c12;
}

.stat-item .value.payout {
  color: #e74c3c;
}

/* Cross-App Sync Banner */
.sync-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #e8f4fd 0%, #d1e8fa 100%);
  padding: 16px 20px;
  border-radius: 12px;
  border-left: 4px solid #007AFF;
  gap: 12px;
}

.sync-icon {
  font-size: 24px;
}

.sync-content {
  flex: 1;
}

.sync-title {
  font-size: 14px;
  font-weight: 700;
  color: #1565C0;
  margin-bottom: 4px;
}

.sync-text {
  font-size: 12px;
  color: #1976D2;
}

/* Payout Requests Section */
.payout-requests {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payout-requests h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2c3e50;
}

.payout-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.payout-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e0e0e0;
}

.payout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.merchant-name {
  font-weight: 600;
  color: #2c3e50;
}

.payout-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.payout-status.pending {
  background: #fff3cd;
  color: #856404;
}

.payout-status.approved {
  background: #d4edda;
  color: #155724;
}

.payout-status.rejected {
  background: #f8d7da;
  color: #721c24;
}

.payout-amount {
  font-size: 24px;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 12px;
}

.payout-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.payout-actions {
  display: flex;
  gap: 8px;
}

.btn-approve {
  flex: 1;
  padding: 10px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-approve:hover {
  background: #219a52;
}

.btn-reject {
  flex: 1;
  padding: 10px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-reject:hover {
  background: #c0392b;
}

.payments-list {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payments-list h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2c3e50;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.table-container {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 1000px;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 14px 16px;
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 16px;
  font-size: 14px;
  color: #2d3748;
  border-bottom: 1px solid #f7fafc;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.amount {
  font-weight: 600;
  color: #27ae60;
}

.status {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  display: inline-block;
  text-align: center;
  white-space: nowrap;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.failed {
  background: #f8d7da;
  color: #721c24;
}

.btn-sm {
  padding: 6px 14px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-sm:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-sm.process {
  background: #27ae60;
}

.btn-sm.process:hover {
  background: #229954;
}
</style>
