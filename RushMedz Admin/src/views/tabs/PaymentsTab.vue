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
      </div>
    </div>

    <div class="payments-list">
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
import { ref, computed, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { getPayments, processPayment, loading } = useAdmin();

const payments = ref<any[]>([]);

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

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.stat-item .value {
  font-size: 20px;
  font-weight: bold;
  color: #27ae60;
}

.stat-item .value.pending {
  color: #f39c12;
}

.payments-list {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
