<template>
  <div class="connected-apps-panel">
    <div class="panel-header">
      <h3>🔗 Connected Apps</h3>
      <button class="refresh-btn" @click="refreshStatus" :disabled="isRefreshing">
        {{ isRefreshing ? '⏳' : '🔄' }}
      </button>
    </div>

    <div class="apps-grid">
      <div
        v-for="app in apps"
        :key="app.type"
        class="app-card"
        :class="{ online: app.isOnline, current: app.type === 'admin' }"
        @click="app.type !== 'admin' && openApp(app.type)"
      >
        <div class="app-icon">{{ app.icon }}</div>
        <div class="app-details">
          <span class="app-name">{{ app.name }}</span>
          <span class="app-status">
            <span class="status-dot" :class="{ online: app.isOnline }"></span>
            {{ app.type === 'admin' ? 'Current' : (app.isOnline ? 'Online' : 'Offline') }}
          </span>
        </div>
        <div class="app-stats" v-if="app.stats">
          <div class="stat-item">
            <span class="stat-value">{{ app.stats.count }}</span>
            <span class="stat-label">{{ app.stats.label }}</span>
          </div>
        </div>
        <button v-if="app.type !== 'admin'" class="open-btn" @click.stop="openApp(app.type)">
          Open →
        </button>
      </div>
    </div>

    <div class="connection-info">
      <div class="info-item">
        <span class="info-label">Event Bridge:</span>
        <span class="info-value" :class="{ connected: isEventBridgeConnected }">
          {{ isEventBridgeConnected ? '● Connected' : '○ Disconnected' }}
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">API Server:</span>
        <span class="info-value" :class="{ connected: isApiConnected }">
          {{ isApiConnected ? '● Online' : '○ Offline' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { APP_INFO, APP_URLS, type AppType } from '../config/appConfig';
import { appLinkHelper } from '../services/crossAppService';
import eventBridge from '../services/eventBridge';
import { useApi } from '../composables/useApi';

interface AppStatus {
  type: AppType;
  name: string;
  icon: string;
  isOnline: boolean;
  stats?: { count: number; label: string };
}

const apps = ref<AppStatus[]>([]);
const isRefreshing = ref(false);
const isEventBridgeConnected = ref(false);
const isApiConnected = ref(false);

const { api } = useApi();

const initializeApps = () => {
  const appTypes: AppType[] = ['admin', 'doctor', 'driver', 'merchant', 'user'];
  apps.value = appTypes.map((type) => ({
    type,
    name: APP_INFO[type].name,
    icon: APP_INFO[type].icon,
    isOnline: type === 'admin',
    stats: undefined,
  }));
};

const refreshStatus = async () => {
  isRefreshing.value = true;
  
  // Check API connection
  try {
    await api.get('/health');
    isApiConnected.value = true;
  } catch {
    isApiConnected.value = false;
  }
  
  // Check each app's health
  const appTypes: AppType[] = ['doctor', 'driver', 'merchant', 'user'];
  for (const appType of appTypes) {
    const isOnline = await appLinkHelper.checkAppHealth(appType);
    const app = apps.value.find((a) => a.type === appType);
    if (app) {
      app.isOnline = isOnline;
    }
  }
  
  // Check event bridge
  isEventBridgeConnected.value = eventBridge.getConnectionStatus();
  
  // Fetch stats for each app type
  try {
    const [doctorStats, driverStats, merchantStats, userStats] = await Promise.all([
      api.get('/api/doctors/count').catch(() => ({ data: { count: 0 } })),
      api.get('/api/drivers/count').catch(() => ({ data: { count: 0 } })),
      api.get('/api/merchants/count').catch(() => ({ data: { count: 0 } })),
      api.get('/api/users/count').catch(() => ({ data: { count: 0 } })),
    ]);
    
    updateAppStats('doctor', doctorStats.data?.count || 0, 'Doctors');
    updateAppStats('driver', driverStats.data?.count || 0, 'Drivers');
    updateAppStats('merchant', merchantStats.data?.count || 0, 'Merchants');
    updateAppStats('user', userStats.data?.count || 0, 'Users');
  } catch {
    // Stats fetching failed, ignore
  }
  
  isRefreshing.value = false;
};

const updateAppStats = (type: AppType, count: number, label: string) => {
  const app = apps.value.find((a) => a.type === type);
  if (app) {
    app.stats = { count, label };
  }
};

const openApp = (type: AppType) => {
  const url = APP_URLS[type];
  window.open(url, '_blank');
};

let refreshInterval: number;

onMounted(() => {
  initializeApps();
  refreshStatus();
  
  // Refresh every 30 seconds
  refreshInterval = window.setInterval(refreshStatus, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.connected-apps-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
}

.app-card:hover:not(.current) {
  border-color: #667eea;
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.app-card.current {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #2196f3;
  cursor: default;
}

.app-card.online:not(.current) {
  border-color: #10b981;
}

.app-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.app-details {
  text-align: center;
  margin-bottom: 8px;
}

.app-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.app-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #7f8c8d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.status-dot.online {
  background: #10b981;
}

.app-stats {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
  width: 100%;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-label {
  font-size: 11px;
  color: #95a5a6;
}

.open-btn {
  margin-top: 8px;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.open-btn:hover {
  transform: scale(1.05);
}

.connection-info {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #7f8c8d;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
}

.info-value.connected {
  color: #10b981;
}
</style>
