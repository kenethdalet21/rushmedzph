<template>
  <div class="app-switcher">
    <button class="switcher-trigger" @click="isOpen = !isOpen" :class="{ active: isOpen }">
      <span class="trigger-icon">🔗</span>
      <span class="trigger-text">Connected Apps</span>
      <span class="trigger-arrow">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <transition name="dropdown">
      <div v-if="isOpen" class="app-dropdown">
        <div class="dropdown-header">
          <h4>RushMedz Ecosystem</h4>
          <span class="status-indicator" :class="{ connected: isEventBridgeConnected }">
            {{ isEventBridgeConnected ? '● Connected' : '○ Disconnected' }}
          </span>
        </div>

        <div class="app-list">
          <div
            v-for="app in connectedAppsInfo"
            :key="app.type"
            class="app-item"
            :class="{ current: app.type === 'admin' }"
            @click="app.type !== 'admin' && navigateToApp(app.type)"
          >
            <span class="app-icon">{{ app.icon }}</span>
            <div class="app-info">
              <span class="app-name">{{ app.name }}</span>
              <span class="app-desc">{{ app.description }}</span>
            </div>
            <span class="app-status" :class="{ online: connectedApps[app.type] }">
              {{ app.type === 'admin' ? 'Current' : connectedApps[app.type] ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>

        <div class="dropdown-footer">
          <button class="refresh-btn" @click="refreshConnections">
            🔄 Refresh Connections
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { APP_INFO, APP_URLS, type AppType } from '../config/appConfig';
import { appLinkHelper } from '../services/crossAppService';
import eventBridge from '../services/eventBridge';

const isOpen = ref(false);
const isEventBridgeConnected = ref(false);

const connectedApps = ref<Record<AppType, boolean>>({
  admin: true,
  doctor: false,
  driver: false,
  merchant: false,
  user: false,
});

const connectedAppsInfo = computed(() => {
  const appTypes: AppType[] = ['admin', 'doctor', 'driver', 'merchant', 'user'];
  return appTypes.map((type) => ({
    type,
    ...APP_INFO[type],
  }));
});

const navigateToApp = (appType: AppType) => {
  const url = appLinkHelper.generateWebLink(appType, '');
  window.open(url, '_blank');
};

const refreshConnections = async () => {
  const appTypes: AppType[] = ['doctor', 'driver', 'merchant', 'user'];
  
  for (const app of appTypes) {
    connectedApps.value[app] = await appLinkHelper.checkAppHealth(app);
  }
  
  isEventBridgeConnected.value = eventBridge.getConnectionStatus();
};

onMounted(() => {
  refreshConnections();
  
  // Refresh every 30 seconds
  setInterval(refreshConnections, 30000);
});
</script>

<style scoped>
.app-switcher {
  position: relative;
}

.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.switcher-trigger:hover,
.switcher-trigger.active {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.trigger-icon {
  font-size: 16px;
}

.trigger-arrow {
  font-size: 10px;
  margin-left: 4px;
}

.app-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.status-indicator {
  font-size: 12px;
  color: #dc3545;
  font-weight: 500;
}

.status-indicator.connected {
  color: #28a745;
}

.app-list {
  padding: 8px;
}

.app-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-item:hover:not(.current) {
  background: #f8f9fa;
}

.app-item.current {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  cursor: default;
}

.app-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.app-item.current .app-icon {
  background: white;
}

.app-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.app-desc {
  font-size: 11px;
  color: #7f8c8d;
  margin-top: 2px;
}

.app-status {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  background: #fee2e2;
  color: #dc3545;
}

.app-status.online {
  background: #d1fae5;
  color: #059669;
}

.dropdown-footer {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.refresh-btn {
  width: 100%;
  padding: 10px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #495057;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: #e9ecef;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
