<template>
  <div class="users-tab">
    <div class="tab-header">
      <h2>User Management</h2>
      <div class="filters">
        <input v-model="searchQuery" type="text" placeholder="Search users..." class="search-input" />
        <select v-model="statusFilter">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
    </div>

    <div class="users-list">
      <div v-if="loading" class="loading">Loading users...</div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td><strong>#{{ user.id }}</strong></td>
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phoneNumber }}</td>
              <td>{{ user.city }}</td>
              <td>{{ user.totalOrders }}</td>
              <td class="amount">{{ formatCurrency(user.totalSpent) }}</td>
              <td><span :class="`status ${user.status.toLowerCase()}`">{{ user.status }}</span></td>
              <td>
                <button @click="viewUser(user.id)" class="btn-sm">View</button>
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

const { getUsers, loading } = useAdmin();

const users = ref<any[]>([]);
const searchQuery = ref('');
const statusFilter = ref('');

const filteredUsers = computed(() => {
  let filtered = users.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(u => 
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phoneNumber.includes(query)
    );
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(u => u.status === statusFilter.value);
  }
  
  return filtered;
});

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const viewUser = (userId: number) => {
  alert(`View user details for User #${userId}`);
};

onMounted(async () => {
  try {
    users.value = await getUsers();
  } catch (error) {
    console.error('Failed to load users:', error);
    // Mock data
    users.value = [
      { id: 1001, fullName: 'John Doe', email: 'john.doe@email.com', phoneNumber: '+63 912 111 1111', city: 'Manila', totalOrders: 25, totalSpent: 34500.00, status: 'ACTIVE' },
      { id: 1002, fullName: 'Jane Smith', email: 'jane.smith@email.com', phoneNumber: '+63 923 222 2222', city: 'Quezon City', totalOrders: 18, totalSpent: 28900.00, status: 'ACTIVE' },
      { id: 1003, fullName: 'Bob Johnson', email: 'bob.j@email.com', phoneNumber: '+63 934 333 3333', city: 'Makati', totalOrders: 42, totalSpent: 67800.00, status: 'ACTIVE' },
      { id: 1004, fullName: 'Alice Brown', email: 'alice.b@email.com', phoneNumber: '+63 945 444 4444', city: 'Pasig', totalOrders: 12, totalSpent: 19200.00, status: 'ACTIVE' },
      { id: 1005, fullName: 'Charlie Wilson', email: 'charlie.w@email.com', phoneNumber: '+63 956 555 5555', city: 'Taguig', totalOrders: 8, totalSpent: 12300.00, status: 'INACTIVE' },
    ];
  }
});
</script>

<style scoped>
.users-tab {
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

.filters {
  display: flex;
  gap: 12px;
}

.search-input {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  min-width: 240px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.search-input::placeholder {
  color: #a0aec0;
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
}

.filters select:hover {
  border-color: #cbd5e0;
}

.filters select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.users-list {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 15px;
  color: #666;
}

.table-container {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  margin-top: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 1100px;
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
  padding: 14px 12px;
  font-size: 14px;
  color: #2d3748;
  border-bottom: 1px solid #f7fafc;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

td:first-child {
  font-weight: 600;
  color: #667eea;
}

td.amount {
  font-weight: 600;
  color: #27ae60;
  white-space: nowrap;
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

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.inactive {
  background: #d6d8db;
  color: #383d41;
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
</style>
