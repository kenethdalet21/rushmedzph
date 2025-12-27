<template>
  <div class="wallets-tab">
    <h2 class="page-title">💰 Wallet Top-ups</h2>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">📊</div>
        <div class="summary-content">
          <div class="summary-label">Total Top-ups</div>
          <div class="summary-value">{{ topUps.length }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">✅</div>
        <div class="summary-content">
          <div class="summary-label">Completed</div>
          <div class="summary-value">{{ completedCount }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⏳</div>
        <div class="summary-content">
          <div class="summary-label">Processing</div>
          <div class="summary-value">{{ processingCount }}</div>
        </div>
      </div>
      <div class="summary-card total">
        <div class="summary-icon">💵</div>
        <div class="summary-content">
          <div class="summary-label">Total Amount</div>
          <div class="summary-value large">{{ formatCurrency(totalAmount) }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="🔍 Search by user ID or payment method..."
        class="search-input"
      />
      <select v-model="statusFilter" class="status-filter">
        <option value="all">All Status</option>
        <option value="completed">Completed</option>
        <option value="processing">Processing</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <!-- Top-ups Table -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="topup in filteredTopUps" :key="topup.id">
            <td>#{{ topup.id }}</td>
            <td>{{ topup.userId }}</td>
            <td>
              <span class="type-badge" :class="topup.type">
                {{ topup.type.toUpperCase() }}
              </span>
            </td>
            <td class="amount">{{ formatCurrency(topup.amount) }}</td>
            <td>{{ topup.paymentMethod }}</td>
            <td>
              <span class="status" :class="topup.status">
                {{ topup.status }}
              </span>
            </td>
            <td>{{ formatDate(topup.createdAt) }}</td>
            <td>
              <button
                v-if="topup.status === 'processing'"
                @click="approveTopUp(topup.id)"
                class="action-btn approve"
              >
                ✅ Approve
              </button>
              <button
                v-if="topup.status === 'processing'"
                @click="rejectTopUp(topup.id)"
                class="action-btn reject"
              >
                ❌ Reject
              </button>
              <button @click="viewDetails(topup.id)" class="action-btn view">
                👁️ View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

interface WalletTopUp {
  id: number;
  userId: string;
  type: 'topup' | 'payout' | 'refund';
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  createdAt: string;
  adminNote?: string;
}

const { getWalletTopUps } = useAdmin();

const topUps = ref<WalletTopUp[]>([
  { id: 1001, userId: 'USR-8432', type: 'topup', amount: 500.00, paymentMethod: 'GCash', status: 'completed', createdAt: '2025-12-26T10:30:00' },
  { id: 1002, userId: 'USR-7621', type: 'topup', amount: 1000.00, paymentMethod: 'PayMaya', status: 'processing', createdAt: '2025-12-26T10:25:00' },
  { id: 1003, userId: 'USR-5492', type: 'payout', amount: 2340.00, paymentMethod: 'Bank Transfer', status: 'completed', createdAt: '2025-12-26T09:45:00' },
  { id: 1004, userId: 'USR-3218', type: 'topup', amount: 300.00, paymentMethod: 'GCash', status: 'processing', createdAt: '2025-12-26T09:30:00' },
  { id: 1005, userId: 'USR-9087', type: 'refund', amount: 450.50, paymentMethod: 'PayMaya', status: 'completed', createdAt: '2025-12-26T08:15:00' },
  { id: 1006, userId: 'USR-6754', type: 'topup', amount: 750.00, paymentMethod: 'Credit Card', status: 'pending', createdAt: '2025-12-26T08:00:00' },
  { id: 1007, userId: 'USR-4321', type: 'topup', amount: 200.00, paymentMethod: 'GCash', status: 'failed', createdAt: '2025-12-25T22:30:00' },
]);

const searchQuery = ref('');
const statusFilter = ref('all');

const completedCount = computed(() => 
  topUps.value.filter(t => t.status === 'completed').length
);

const processingCount = computed(() => 
  topUps.value.filter(t => t.status === 'processing').length
);

const totalAmount = computed(() => 
  topUps.value
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
);

const filteredTopUps = computed(() => {
  return topUps.value.filter(topup => {
    const matchesSearch = 
      topup.userId.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      topup.paymentMethod.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    const matchesStatus = 
      statusFilter.value === 'all' || topup.status === statusFilter.value;
    
    return matchesSearch && matchesStatus;
  });
});

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const approveTopUp = (id: number) => {
  const topup = topUps.value.find(t => t.id === id);
  if (topup) {
    topup.status = 'completed';
    alert(`Top-up #${id} approved successfully!`);
  }
};

const rejectTopUp = (id: number) => {
  const topup = topUps.value.find(t => t.id === id);
  if (topup) {
    topup.status = 'failed';
    alert(`Top-up #${id} rejected.`);
  }
};

const viewDetails = (id: number) => {
  const topup = topUps.value.find(t => t.id === id);
  if (topup) {
    alert(`Top-up Details:\nID: ${topup.id}\nUser: ${topup.userId}\nAmount: ${formatCurrency(topup.amount)}\nStatus: ${topup.status}`);
  }
};

onMounted(async () => {
  try {
    const data = await getWalletTopUps();
    if (data) {
      topUps.value = data;
    }
  } catch (error) {
    console.error('Failed to load wallet top-ups:', error);
  }
});
</script>

<style scoped>
.wallets-tab {
  padding: 24px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 32px;
  letter-spacing: -0.5px;
  text-align: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-icon {
  font-size: 40px;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.summary-card.total .summary-label {
  color: rgba(255, 255, 255, 0.9);
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.summary-value.large {
  font-size: 28px;
}

.summary-card.total .summary-value {
  color: white;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.status-filter {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
  min-width: 900px;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 14px 16px;
  text-align: center;
  font-weight: 700;
  color: #4a5568;
  font-size: 13px;
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
  white-space: nowrap;
}

.type-badge {
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: inline-block;
  white-space: nowrap;
}

.type-badge.topup {
  background: #d1f2eb;
  color: #0e6655;
}

.type-badge.payout {
  background: #ffeaa7;
  color: #d63031;
}

.type-badge.refund {
  background: #dfe6e9;
  color: #2d3436;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;  letter-spacing: 0.3px;
  display: inline-block;
  text-align: center;
  white-space: nowrap;}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.processing {
  background: #fff3cd;
  color: #856404;
}

.status.pending {
  background: #d1ecf1;
  color: #0c5460;
}

.status.failed {
  background: #f8d7da;
  color: #721c24;
}

.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn.approve {
  background: #27ae60;
  color: white;
}

.action-btn.approve:hover {
  background: #229954;
  transform: translateY(-1px);
}

.action-btn.reject {
  background: #e74c3c;
  color: white;
}

.action-btn.reject:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.action-btn.view {
  background: #3498db;
  color: white;
}

.action-btn.view:hover {
  background: #2980b9;
  transform: translateY(-1px);
}
</style>
