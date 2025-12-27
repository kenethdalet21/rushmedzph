<template>
  <div class="drivers-tab">
    <div class="tab-header">
      <h2>Driver Management</h2>
      <div class="filters">
        <select v-model="statusFilter">
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="OFFLINE">Offline</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
    </div>

    <div class="drivers-list">
      <div v-if="loading" class="loading">Loading drivers...</div>
      <div v-else class="grid">
        <div v-for="driver in filteredDrivers" :key="driver.id" class="driver-card">
          <div class="card-header">
            <div class="driver-info">
              <h3>{{ driver.fullName }}</h3>
              <p>{{ driver.vehicleType }} - {{ driver.vehiclePlateNumber }}</p>
            </div>
            <span :class="`badge ${driver.status.toLowerCase()}`">{{ driver.status }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span>{{ driver.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">📞 Phone:</span>
              <span>{{ driver.phoneNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">🚗 Vehicle:</span>
              <span>{{ driver.vehicleModel }} ({{ driver.vehicleYear }})</span>
            </div>
            <div class="info-row">
              <span class="label">📦 Deliveries:</span>
              <span class="highlight">{{ driver.totalDeliveries }}</span>
            </div>
            <div class="info-row">
              <span class="label">⭐ Rating:</span>
              <span class="highlight">{{ driver.rating }}/5.0</span>
            </div>
          </div>
          <div class="card-actions">
            <button v-if="driver.status === 'PENDING'" @click="approve(driver.id)" class="btn-approve">
              Approve
            </button>
            <button v-if="driver.status === 'ACTIVE' || driver.status === 'AVAILABLE' || driver.status === 'BUSY' || driver.status === 'OFFLINE'" @click="suspend(driver.id)" class="btn-suspend">
              Suspend
            </button>
            <button v-if="driver.status === 'SUSPENDED'" @click="unsuspend(driver.id)" class="btn-approve">
              Unsuspend
            </button>
            <button @click="viewDetails(driver.id)" class="btn-view">
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

const { getDrivers, approveDriver, suspendDriver, loading } = useAdmin();

const drivers = ref<any[]>([]);
const statusFilter = ref('');

const filteredDrivers = computed(() => {
  if (!statusFilter.value) return drivers.value;
  return drivers.value.filter(d => d.status === statusFilter.value);
});

const approve = async (driverId: number) => {
  try {
    await approveDriver(driverId);
    const driver = drivers.value.find(d => d.id === driverId);
    if (driver) driver.status = 'AVAILABLE';
    alert('Driver approved successfully!');
  } catch (error) {
    alert('Failed to approve driver');
  }
};
const suspend = async (driverId: number) => {
  if (confirm('Are you sure you want to suspend this driver?')) {
    try {
      await suspendDriver(driverId);
      const driver = drivers.value.find(d => d.id === driverId);
      if (driver) driver.status = 'SUSPENDED';
      alert('Driver suspended successfully!');
    } catch (error) {
      alert('Failed to suspend driver');
    }
  }
};

const unsuspend = async (driverId: number) => {
  if (confirm('Are you sure you want to unsuspend this driver?')) {
    try {
      await approveDriver(driverId); // Reuse approve function to unsuspend
      const driver = drivers.value.find(d => d.id === driverId);
      if (driver) driver.status = 'ACTIVE';
      alert('Driver unsuspended successfully!');
    } catch (error) {
      alert('Failed to unsuspend driver');
    }
  }
};
const viewDetails = (driverId: number) => {
  alert(`View details for Driver #${driverId}`);
};

onMounted(async () => {
  try {
    drivers.value = await getDrivers();
  } catch (error) {
    console.error('Failed to load drivers:', error);
    // Mock data
    drivers.value = [
      { id: 1, fullName: 'Mike Driver', email: 'mike@rushmedz.com', phoneNumber: '+63 912 111 2222', vehicleType: 'Motorcycle', vehicleModel: 'Honda Wave', vehicleYear: 2020, vehiclePlateNumber: 'ABC 123', totalDeliveries: 234, rating: 4.8, status: 'AVAILABLE' },
      { id: 2, fullName: 'Sarah Wheels', email: 'sarah@rushmedz.com', phoneNumber: '+63 923 222 3333', vehicleType: 'Motorcycle', vehicleModel: 'Yamaha Mio', vehicleYear: 2021, vehiclePlateNumber: 'XYZ 789', totalDeliveries: 189, rating: 4.9, status: 'BUSY' },
      { id: 3, fullName: 'Tom Fast', email: 'tom@rushmedz.com', phoneNumber: '+63 934 333 4444', vehicleType: 'Car', vehicleModel: 'Toyota Vios', vehicleYear: 2019, vehiclePlateNumber: 'DEF 456', totalDeliveries: 0, rating: 0, status: 'PENDING' },
      { id: 4, fullName: 'Lisa Speed', email: 'lisa@rushmedz.com', phoneNumber: '+63 945 444 5555', vehicleType: 'Motorcycle', vehicleModel: 'Suzuki Raider', vehicleYear: 2022, vehiclePlateNumber: 'GHI 012', totalDeliveries: 156, rating: 4.7, status: 'OFFLINE' },
    ];
  }
});
</script>

<style scoped>
.drivers-tab {
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

.drivers-list .grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.driver-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.driver-card:hover {
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

.driver-info {
  text-align: center;
  width: 100%;
}

.driver-info h3 {
  margin: 0 0 6px 0;
  font-size: 19px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.3px;
  text-align: center;
}

.driver-info p {
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
}

.badge.available, .badge.active {
  background: #d4edda;
  color: #155724;
}

.badge.busy {
  background: #fff3cd;
  color: #856404;
}

.badge.offline, .badge.pending {
  background: #d6d8db;
  color: #383d41;
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
  font-weight: 600;
  color: #3498db;
  white-space: nowrap;
}

.card-actions {
  padding: 16px 20px;
  background: #f8f9fa;
  display: flex;
  gap: 8px;
}

.card-actions button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-approve {
  background: #27ae60;
  color: white;
}

.btn-approve:hover {
  background: #229954;
}

.btn-suspend {
  background: #e74c3c;
  color: white;
}

.btn-suspend:hover {
  background: #c0392b;
}

.btn-view {
  background: #3498db;
  color: white;
}

.btn-view:hover {
  background: #2980b9;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
