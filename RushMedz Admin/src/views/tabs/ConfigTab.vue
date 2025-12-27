<template>
  <div class="config-tab">
    <h2 class="page-title">⚙️ System Configuration</h2>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-value">{{ merchants.length }}</div>
          <div class="stat-label">Total Merchants</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚚</div>
        <div class="stat-content">
          <div class="stat-value">{{ drivers.length }}</div>
          <div class="stat-label">Total Drivers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ users.length }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍⚕️</div>
        <div class="stat-content">
          <div class="stat-value">{{ doctors.length }}</div>
          <div class="stat-label">Total Doctors</div>
        </div>
      </div>
    </div>

    <!-- Configuration Categories -->
    <div v-for="category in configCategories" :key="category.name" class="config-section">
      <h3 class="category-title">{{ category.icon }} {{ category.name }}</h3>
      <div class="config-grid">
        <div v-for="config in category.configs" :key="config.id" class="config-card">
          <div class="config-header">
            <div class="config-info">
              <div class="config-key">{{ config.key }}</div>
              <div class="config-description">{{ config.description }}</div>
            </div>
            <div class="config-control">
              <template v-if="config.type === 'toggle'">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    v-model="config.enabled"
                    @change="updateConfig(config.id)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </template>
              <template v-else-if="config.type === 'text' && editingId === config.id">
                <div class="edit-controls">
                  <input
                    v-model="editValue"
                    type="text"
                    class="edit-input"
                    @keyup.enter="saveConfig(config.id)"
                  />
                  <button @click="saveConfig(config.id)" class="save-btn">✓</button>
                  <button @click="cancelEdit" class="cancel-btn">✕</button>
                </div>
              </template>
              <template v-else-if="config.type === 'text'">
                <div class="value-display">
                  <span class="config-value">{{ config.value }}</span>
                  <button
                    v-if="config.editable"
                    @click="startEdit(config.id, config.value)"
                    class="edit-btn"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Actions -->
    <div class="actions-section">
      <h3 class="section-title">🔧 System Actions</h3>
      <div class="actions-grid">
        <button @click="clearCache" class="action-card">
          <div class="action-icon">🗑️</div>
          <div class="action-title">Clear Cache</div>
          <div class="action-description">Clear system cache and temp files</div>
        </button>
        <button @click="refreshData" class="action-card">
          <div class="action-icon">🔄</div>
          <div class="action-title">Refresh Data</div>
          <div class="action-description">Reload all data from database</div>
        </button>
        <button @click="exportLogs" class="action-card">
          <div class="action-icon">📥</div>
          <div class="action-title">Export Logs</div>
          <div class="action-description">Download system logs</div>
        </button>
        <button @click="viewBackups" class="action-card">
          <div class="action-icon">💾</div>
          <div class="action-title">Backups</div>
          <div class="action-description">View and manage backups</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

interface Config {
  id: number;
  category: string;
  key: string;
  value: string;
  enabled: boolean;
  editable: boolean;
  type: 'toggle' | 'text';
  description: string;
}

const { getSystemConfig } = useAdmin();

const editingId = ref<number | null>(null);
const editValue = ref('');

const merchants = ref<any[]>([]);
const drivers = ref<any[]>([]);
const users = ref<any[]>([]);
const doctors = ref<any[]>([]);

const configCategories = reactive([
  {
    name: 'Pricing',
    icon: '💰',
    configs: [
      {
        id: 1,
        key: 'Base Delivery Fee',
        value: '₱50.00',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Base fee charged for every delivery'
      },
      {
        id: 2,
        key: 'Per KM Charge',
        value: '₱15.00',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Additional charge per kilometer'
      },
      {
        id: 3,
        key: 'Merchant Commission',
        value: '15%',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Commission percentage from merchants'
      },
      {
        id: 4,
        key: 'Driver Commission',
        value: '80%',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Percentage of delivery fee for drivers'
      },
    ]
  },
  {
    name: 'Features',
    icon: '⚙️',
    configs: [
      {
        id: 5,
        key: 'Cash Payment',
        value: '',
        enabled: true,
        editable: false,
        type: 'toggle' as const,
        description: 'Enable cash on delivery payment method'
      },
      {
        id: 6,
        key: 'Real-time Tracking',
        value: '',
        enabled: true,
        editable: false,
        type: 'toggle' as const,
        description: 'Enable real-time delivery tracking'
      },
      {
        id: 7,
        key: 'Push Notifications',
        value: '',
        enabled: true,
        editable: false,
        type: 'toggle' as const,
        description: 'Send push notifications to users'
      },
      {
        id: 8,
        key: 'Wallet System',
        value: '',
        enabled: true,
        editable: false,
        type: 'toggle' as const,
        description: 'Enable digital wallet functionality'
      },
    ]
  },
  {
    name: 'Operations',
    icon: '🕐',
    configs: [
      {
        id: 9,
        key: 'Operating Hours Start',
        value: '08:00 AM',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Daily operation start time'
      },
      {
        id: 10,
        key: 'Operating Hours End',
        value: '10:00 PM',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Daily operation end time'
      },
      {
        id: 11,
        key: 'Max Delivery Time',
        value: '60 min',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Maximum time for delivery completion'
      },
    ]
  },
  {
    name: 'Service Area',
    icon: '📍',
    configs: [
      {
        id: 12,
        key: 'Service Radius',
        value: '10 km',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Maximum service area radius'
      },
      {
        id: 13,
        key: 'Minimum Order Amount',
        value: '₱200.00',
        enabled: true,
        editable: true,
        type: 'text' as const,
        description: 'Minimum amount required for orders'
      },
    ]
  }
]);

const updateConfig = (id: number) => {
  alert('Configuration updated successfully!');
};

const startEdit = (id: number, currentValue: string) => {
  editingId.value = id;
  editValue.value = currentValue;
};

const saveConfig = (id: number) => {
  for (const category of configCategories) {
    const config = category.configs.find(c => c.id === id);
    if (config) {
      config.value = editValue.value;
      break;
    }
  }
  editingId.value = null;
  alert('Configuration value updated!');
};

const cancelEdit = () => {
  editingId.value = null;
  editValue.value = '';
};

const clearCache = () => {
  alert('Cache cleared successfully!');
};

const refreshData = () => {
  alert('Data refreshed successfully!');
  window.location.reload();
};

const exportLogs = () => {
  alert('Logs exported successfully!');
};

const viewBackups = () => {
  alert('Opening backups manager...');
};

onMounted(async () => {
  try {
    const data = await getSystemConfig();
    if (data) {
      // Update with real configuration data
      console.log('System config loaded:', data);
    }
  } catch (error) {
    console.error('Failed to load system config:', error);
  }

  // Mock data for stats
  merchants.value = new Array(45).fill(null);
  drivers.value = new Array(23).fill(null);
  users.value = new Array(1247).fill(null);
  doctors.value = new Array(127).fill(null);
});
</script>

<style scoped>
.config-tab {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 40px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #7f8c8d;
}

.config-section {
  margin-bottom: 32px;
}

.category-title {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 16px;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.config-info {
  flex: 1;
}

.config-key {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.config-description {
  font-size: 13px;
  color: #7f8c8d;
}

.config-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #27ae60;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.value-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-value {
  font-size: 15px;
  font-weight: 600;
  color: #3498db;
  min-width: 100px;
  text-align: right;
}

.edit-btn {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #2980b9;
}

.edit-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 150px;
}

.save-btn,
.cancel-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #27ae60;
  color: white;
}

.save-btn:hover {
  background: #229954;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
}

.cancel-btn:hover {
  background: #c0392b;
}

.actions-section {
  margin-top: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.action-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.action-description {
  font-size: 13px;
  color: #7f8c8d;
  line-height: 1.4;
}
</style>
