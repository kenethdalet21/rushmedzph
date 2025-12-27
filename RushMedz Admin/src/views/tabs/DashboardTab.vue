<template>
  <div class="dashboard-tab">
    <!-- Connected Apps Panel -->
    <ConnectedAppsPanel />

    <div class="metrics-grid">
      <div class="metric-card clickable" @click="navigateTo('/dashboard/orders')">
        <div class="metric-icon">💰</div>
        <div class="metric-content">
          <h3>Total Revenue</h3>
          <p class="metric-value">{{ formatCurrency(metrics.totalRevenue) }}</p>
          <span class="metric-change positive">+12.5%</span>
        </div>
      </div>
      <div class="metric-card clickable" @click="navigateTo('/dashboard/orders')">
        <div class="metric-icon">📦</div>
        <div class="metric-content">
          <h3>Total Orders</h3>
          <p class="metric-value">{{ metrics.totalOrders }}</p>
          <span class="metric-change positive">+8.2%</span>
        </div>
      </div>
      <div class="metric-card clickable" @click="navigateTo('/dashboard/merchants')">
        <div class="metric-icon">🏪</div>
        <div class="metric-content">
          <h3>Active Merchants</h3>
          <p class="metric-value">{{ metrics.activeMerchants }}</p>
          <span class="metric-change neutral">0%</span>
        </div>
      </div>
      <div class="metric-card clickable" @click="navigateTo('/dashboard/drivers')">
        <div class="metric-icon">🚗</div>
        <div class="metric-content">
          <h3>Active Drivers</h3>
          <p class="metric-value">{{ metrics.activeDrivers }}</p>
          <span class="metric-change positive">+5.1%</span>
        </div>
      </div>
      <div class="metric-card clickable" @click="navigateTo('/dashboard/users')">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <h3>Total Users</h3>
          <p class="metric-value">{{ metrics.totalUsers }}</p>
          <span class="metric-change positive">+15.3%</span>
        </div>
      </div>
      <div class="metric-card clickable" @click="navigateTo('/dashboard/doctors')">
        <div class="metric-icon">👨‍⚕️</div>
        <div class="metric-content">
          <h3>Total Doctors</h3>
          <p class="metric-value">{{ metrics.totalDoctors }}</p>
          <span class="metric-change positive">+3.7%</span>
        </div>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-card">
        <h3>Recent Orders</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id" @click="navigateTo('/dashboard/orders')" class="clickable-row">
                <td>#{{ order.id }}</td>
                <td>{{ order.customerName }}</td>
                <td>{{ order.merchant }}</td>
                <td>{{ formatCurrency(order.totalAmount) }}</td>
                <td><span :class="`status ${order.status.toLowerCase()}`">{{ order.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '../../composables/useAdminStore';
import ConnectedAppsPanel from '../../components/ConnectedAppsPanel.vue';

const router = useRouter();
const store = useAdminStore();

// Computed values from store
const metrics = computed(() => store.metrics.value || {
  totalRevenue: 0,
  totalOrders: 0,
  activeMerchants: 0,
  activeDrivers: 0,
  totalUsers: 0,
  totalDoctors: 0,
});

const recentOrders = computed(() => 
  store.orders.value
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
);

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const navigateTo = (path: string) => {
  router.push(path);
};

onMounted(async () => {
  // Fetch real-time dashboard statistics from backend
  await store.fetchDashboardStats();
  // Refresh other data on mount
  await store.refreshOrders();
  await store.refreshMerchants();
  await store.refreshDrivers();
});
</script>

<style scoped>
.dashboard-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 8px;
}

.metric-card {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.metric-card.clickable {
  cursor: pointer;
}

.metric-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(52, 152, 219, 0.2);
  border: 2px solid #3498db;
}

.metric-icon {
  font-size: 52px;
  line-height: 1;
  text-align: center;
}

.metric-content {
  text-align: center;
  width: 100%;
}

.metric-content h3 {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.metric-value {
  margin: 0 0 8px 0;
  font-size: 34px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.1;
  letter-spacing: -0.5px;
  text-align: center;
}

.metric-change {
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.metric-change.positive {
  color: #27ae60;
}

.metric-change.negative {
  color: #e74c3c;
}

.metric-change.neutral {
  color: #95a5a6;
}

.charts-section {
  display: grid;
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  table-layout: auto;
  min-width: 800px;
}

thead {
  background: linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 100%);
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

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f8f9fa;
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
}

.status.delivered {
  background: #d4edda;
  color: #155724;
}

.status.in_transit {
  background: #d1ecf1;
  color: #0c5460;
}

.status.processing {
  background: #fff3cd;
  color: #856404;
}
</style>
