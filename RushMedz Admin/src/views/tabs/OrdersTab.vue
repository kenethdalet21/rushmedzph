<template>
  <div class="orders-tab">
    <div class="tab-header">
      <h2>Order Management</h2>
      <div class="filters">
        <select v-model="statusFilter">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    <div class="orders-list">
      <div v-if="loading" class="loading">Loading orders...</div>
      <div v-else-if="filteredOrders.length === 0" class="empty">No orders found</div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Merchant</th>
              <th>Driver</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td><strong>#{{ order.id }}</strong></td>
              <td>{{ order.customerName }}</td>
              <td>{{ order.merchantName }}</td>
              <td>{{ order.driverName || 'Not assigned' }}</td>
              <td>{{ order.itemCount }}</td>
              <td>{{ formatCurrency(order.totalAmount) }}</td>
              <td><span :class="`status ${order.status.toLowerCase()}`">{{ order.status }}</span></td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>
                <button @click="viewOrder(order.id)" class="btn-sm">View</button>
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

const { getOrders, loading } = useAdmin();

const orders = ref<any[]>([]);
const statusFilter = ref('');

const filteredOrders = computed(() => {
  if (!statusFilter.value) return orders.value;
  return orders.value.filter(order => order.status === statusFilter.value);
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

const viewOrder = (orderId: number) => {
  alert(`View order details for Order #${orderId}`);
};

onMounted(async () => {
  try {
    orders.value = await getOrders();
  } catch (error) {
    console.error('Failed to load orders:', error);
    // Mock data
    orders.value = [
      { id: 1001, customerName: 'John Doe', merchantName: 'MediPharm', driverName: 'Mike Driver', itemCount: 3, totalAmount: 1250.00, status: 'DELIVERED', createdAt: '2025-12-25T10:30:00' },
      { id: 1002, customerName: 'Jane Smith', merchantName: 'HealthStore', driverName: 'Sarah Wheels', itemCount: 2, totalAmount: 890.50, status: 'IN_TRANSIT', createdAt: '2025-12-25T14:15:00' },
      { id: 1003, customerName: 'Bob Johnson', merchantName: 'QuickMeds', driverName: null, itemCount: 5, totalAmount: 2340.00, status: 'PREPARING', createdAt: '2025-12-26T09:00:00' },
      { id: 1004, customerName: 'Alice Brown', merchantName: 'MediPharm', driverName: 'Mike Driver', itemCount: 1, totalAmount: 560.25, status: 'DELIVERED', createdAt: '2025-12-24T16:45:00' },
      { id: 1005, customerName: 'Charlie Wilson', merchantName: 'HealthStore', driverName: null, itemCount: 4, totalAmount: 1780.00, status: 'PENDING', createdAt: '2025-12-26T11:20:00' },
    ];
  }
});
</script>

<style scoped>
.orders-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
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

.filters {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.filters select {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.filters select:hover {
  border-color: #cbd5e0;
}

.filters select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.orders-list {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.table-container {
  overflow-x: auto;
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

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status.pending, .status.confirmed {
  background: #fff3cd;
  color: #856404;
}

.status.preparing, .status.in_transit {
  background: #d1ecf1;
  color: #0c5460;
}

.status.delivered {
  background: #d4edda;
  color: #155724;
}

.status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.btn-sm {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-sm:hover {
  background: #2980b9;
}
</style>
