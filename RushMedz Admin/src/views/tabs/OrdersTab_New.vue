<template>
  <div class="orders-tab">
    <h2 class="page-title">📦 Order Management</h2>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">{{ store.orders.value.filter(o => o.status === 'pending').length }}</div>
        <div class="summary-label">⏳ Pending</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ store.orders.value.filter(o => o.status === 'processing').length }}</div>
        <div class="summary-label">⚙️ Processing</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ store.orders.value.filter(o => o.status === 'delivering').length }}</div>
        <div class="summary-label">🚚 Delivering</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ store.orders.value.filter(o => o.status === 'completed').length }}</div>
        <div class="summary-label">✅ Completed</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="🔍 Search orders by customer, items, or ID..."
        class="search-input"
      />
      <select v-model="statusFilter" class="status-filter">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="delivering">Delivering</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Orders Table -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Merchant</th>
            <th>Driver</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td class="order-id">#{{ order.id }}</td>
            <td>{{ order.customerName }}</td>
            <td>{{ order.items }}</td>
            <td>{{ order.merchant }}</td>
            <td>{{ order.driver }}</td>
            <td class="amount">{{ formatCurrency(order.totalAmount) }}</td>
            <td>
              <span class="status" :class="order.status">
                {{ order.status }}
              </span>
            </td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <button
                v-if="order.status === 'pending'"
                @click="assignDriver(order.id)"
                class="action-btn assign"
              >
                🚗 Assign Driver
              </button>
              <button
                v-if="order.status === 'processing'"
                @click="updateStatus(order.id, 'delivering')"
                class="action-btn deliver"
              >
                📦 Mark Delivering
              </button>
              <button
                v-if="order.status === 'delivering'"
                @click="updateStatus(order.id, 'completed')"
                class="action-btn complete"
              >
                ✅ Complete
              </button>
              <button
                v-if="order.status !== 'completed' && order.status !== 'cancelled'"
                @click="cancelOrder(order.id)"
                class="action-btn cancel"
              >
                ❌ Cancel
              </button>
              <button @click="viewOrder(order.id)" class="action-btn view">
                👁️ View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Driver Assignment Modal -->
    <div v-if="showDriverModal" class="modal-overlay" @click="showDriverModal = false">
      <div class="modal-content" @click.stop>
        <h3>Assign Driver to Order #{{ selectedOrderId }}</h3>
        <div class="drivers-list">
          <div
            v-for="driver in store.drivers.value.filter(d => d.status === 'online')"
            :key="driver.id"
            @click="selectDriver(driver.id)"
            class="driver-item"
          >
            <div class="driver-info">
              <div class="driver-name">{{ driver.name }}</div>
              <div class="driver-details">
                {{ driver.vehicleType }} • {{ driver.currentLocation }} • ⭐ {{ driver.rating }}
              </div>
            </div>
            <button class="assign-btn">Select</button>
          </div>
        </div>
        <button @click="showDriverModal = false" class="close-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../composables/useAdminStore';

const store = useAdminStore();

const statusFilter = ref('all');
const searchQuery = ref('');
const showDriverModal = ref(false);
const selectedOrderId = ref<number | null>(null);

const filteredOrders = computed(() => {
  return store.orders.value.filter(order => {
    const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value;
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.items.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.id.toString().includes(searchQuery.value);
    
    return matchesStatus && matchesSearch;
  });
});

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const viewOrder = (id: number) => {
  const order = store.orders.value.find(o => o.id === id);
  if (order) {
    alert(`Order #${id}\nCustomer: ${order.customerName}\nItems: ${order.items}\nAmount: ${formatCurrency(order.totalAmount)}\nStatus: ${order.status}\nAddress: ${order.address}`);
  }
};

const assignDriver = (orderId: number) => {
  selectedOrderId.value = orderId;
  showDriverModal.value = true;
};

const selectDriver = async (driverId: number) => {
  if (selectedOrderId.value) {
    try {
      await store.assignDriverToOrder(selectedOrderId.value, driverId);
      showDriverModal.value = false;
      selectedOrderId.value = null;
      alert('Driver assigned successfully! Order status updated to processing.');
    } catch (error) {
      alert('Failed to assign driver');
    }
  }
};

const updateStatus = async (orderId: number, newStatus: string) => {
  try {
    await store.updateOrderStatus(orderId, newStatus as any);
    alert(`Order status updated to ${newStatus}!`);
  } catch (error) {
    alert('Failed to update order status');
  }
};

const cancelOrder = async (orderId: number) => {
  if (confirm('Are you sure you want to cancel this order?')) {
    try {
      await store.cancelOrder(orderId);
      alert('Order cancelled successfully!');
    } catch (error) {
      alert('Failed to cancel order');
    }
  }
};

onMounted(async () => {
  await store.refreshOrders();
});
</script>

<style scoped>
.orders-tab {
  padding: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.summary-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  color: #7f8c8d;
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
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 16px 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
}

.order-id {
  font-weight: 600;
  color: #3498db;
}

.amount {
  font-weight: 600;
  color: #27ae60;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.status.pending {
  background: #ffeaa7;
  color: #d63031;
}

.status.processing {
  background: #fff3cd;
  color: #856404;
}

.status.delivering {
  background: #d1ecf1;
  color: #0c5460;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 6px;
  transition: all 0.2s;
}

.action-btn.assign {
  background: #3498db;
  color: white;
}

.action-btn.deliver {
  background: #f39c12;
  color: white;
}

.action-btn.complete {
  background: #27ae60;
  color: white;
}

.action-btn.cancel {
  background: #e74c3c;
  color: white;
}

.action-btn.view {
  background: #95a5a6;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #2c3e50;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.driver-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.driver-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.driver-info {
  flex: 1;
}

.driver-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.driver-details {
  font-size: 13px;
  color: #7f8c8d;
}

.assign-btn {
  padding: 8px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.assign-btn:hover {
  background: #2980b9;
}

.close-btn {
  width: 100%;
  padding: 12px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #7f8c8d;
}
</style>
