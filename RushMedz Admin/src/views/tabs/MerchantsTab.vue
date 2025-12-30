<template>
  <div class="merchants-tab">
    <div class="tab-header">
      <h2>Merchant Management</h2>
      <div class="filters">
        <select v-model="statusFilter">
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
    </div>

    <div class="merchants-list">
      <div v-if="loading" class="loading">Loading merchants...</div>
      <div v-else class="grid">
        <div v-for="merchant in filteredMerchants" :key="merchant.id" class="merchant-card">
          <div class="card-header">
            <div class="merchant-info">
              <h3>{{ merchant.businessName }}</h3>
              <p>Owner: {{ merchant.ownerName }}</p>
            </div>
            <span :class="`badge ${merchant.status.toLowerCase()}`">{{ merchant.status }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span>{{ merchant.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">📞 Phone:</span>
              <span>{{ merchant.phoneNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">📍 Location:</span>
              <span>{{ merchant.businessCity }}</span>
            </div>
            <div class="info-row">
              <span class="label">💰 Total Sales:</span>
              <span class="highlight">{{ formatCurrency(merchant.totalSales) }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button v-if="merchant.status === 'PENDING'" @click="approve(merchant.id)" class="btn-approve">
              Approve
            </button>
            <button v-if="merchant.status === 'ACTIVE'" @click="suspend(merchant.id)" class="btn-suspend">
              Suspend
            </button>
            <button @click="viewDetails(merchant.id)" class="btn-view">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { getMerchants, approveMerchant, suspendMerchant, loading } = useAdmin();

const merchants = ref<any[]>([]);
const statusFilter = ref('');

const filteredMerchants = computed(() => {
  if (!statusFilter.value) return merchants.value;
  return merchants.value.filter(m => m.status === statusFilter.value);
});

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const approve = async (merchantId: number) => {
  try {
    await approveMerchant(merchantId);
    const merchant = merchants.value.find(m => m.id === merchantId);
    if (merchant) merchant.status = 'ACTIVE';
    alert('Merchant approved successfully!');
  } catch (error) {
    alert('Failed to approve merchant');
  }
};

const suspend = async (merchantId: number) => {
  if (confirm('Are you sure you want to suspend this merchant?')) {
    try {
      await suspendMerchant(merchantId);
      const merchant = merchants.value.find(m => m.id === merchantId);
      if (merchant) merchant.status = 'SUSPENDED';
      alert('Merchant suspended successfully!');
    } catch (error) {
      alert('Failed to suspend merchant');
    }
  }
};

const viewDetails = (merchantId: number) => {
  alert(`View details for Merchant #${merchantId}`);
};

onMounted(async () => {
  try {
    merchants.value = await getMerchants();
  } catch (error) {
    console.error('Failed to load merchants:', error);
    // Mock data
    merchants.value = [
      { id: 1, businessName: 'MediPharm', ownerName: 'John Smith', email: 'john@medipharm.com', phoneNumber: '+63 912 345 6789', businessCity: 'Manila', totalSales: 125000.00, status: 'ACTIVE' },
      { id: 2, businessName: 'HealthStore', ownerName: 'Jane Doe', email: 'jane@healthstore.com', phoneNumber: '+63 923 456 7890', businessCity: 'Quezon City', totalSales: 98500.50, status: 'ACTIVE' },
      { id: 3, businessName: 'QuickMeds', ownerName: 'Bob Johnson', email: 'bob@quickmeds.com', phoneNumber: '+63 934 567 8901', businessCity: 'Makati', totalSales: 0, status: 'PENDING' },
      { id: 4, businessName: 'PharmaPlus', ownerName: 'Alice Brown', email: 'alice@pharmaplus.com', phoneNumber: '+63 945 678 9012', businessCity: 'Pasig', totalSales: 75200.25, status: 'ACTIVE' },
    ];
  }
});
</script>

<style scoped>
.merchants-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.filters select {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.merchants-list .grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.merchant-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.merchant-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: #e8ecef;
}

.card-header {
  padding: 24px;
  background: linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 12px;
  border-bottom: 1px solid #e8ecef;
}

.merchant-info {
  text-align: center;
  width: 100%;
}

.merchant-info h3 {
  margin: 0 0 6px 0;
  font-size: 19px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.3px;
  text-align: center;
}

.merchant-info p {
  margin: 0;
  font-size: 14px;
  color: #718096;
  font-weight: 500;
  text-align: center;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.badge.active {
  background: #d4edda;
  color: #155724;
}

.badge.pending {
  background: #fff3cd;
  color: #856404;
}

.badge.suspended {
  background: #f8d7da;
  color: #721c24;
}

.card-body {
  padding: 24px;
  text-align: center;
}

.info-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 1.5;
  gap: 4px;
  text-align: center;
}

.info-row .label {
  color: #718096;
  font-weight: 500;
  white-space: nowrap;
}

.info-row .highlight {
  font-weight: 700;
  color: #27ae60;
  font-size: 15px;
  white-space: nowrap;
}

.card-actions {
  padding: 18px 24px;
  background: linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #e8ecef;
}

.card-actions button {
  flex: 1;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
  text-align: center;
}

.btn-approve {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
}

.btn-approve:hover {
  background: linear-gradient(135deg, #229954 0%, #1e8449 100%);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
}

.btn-suspend {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.btn-suspend:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.btn-view {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.btn-view:hover {
  background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  font-weight: 500;
}
</style>
