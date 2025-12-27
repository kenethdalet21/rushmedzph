<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>RushMedz Admin</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item">
          <span class="icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/dashboard/orders" class="nav-item">
          <span class="icon">📦</span>
          <span>Orders</span>
        </router-link>
        <router-link to="/dashboard/merchants" class="nav-item">
          <span class="icon">🏪</span>
          <span>Merchants</span>
        </router-link>
        <router-link to="/dashboard/drivers" class="nav-item">
          <span class="icon">🚗</span>
          <span>Drivers</span>
        </router-link>
        <router-link to="/dashboard/doctors" class="nav-item">
          <span class="icon">⚕️</span>
          <span>Doctors</span>
        </router-link>
        <router-link to="/dashboard/users" class="nav-item">
          <span class="icon">👥</span>
          <span>Users</span>
        </router-link>
        <router-link to="/dashboard/payments" class="nav-item">
          <span class="icon">💳</span>
          <span>Payments</span>
        </router-link>
        <router-link to="/dashboard/analytics" class="nav-item">
          <span class="icon">📈</span>
          <span>Analytics</span>
        </router-link>
        <router-link to="/dashboard/wallets" class="nav-item">
          <span class="icon">💰</span>
          <span>Wallet Top-ups</span>
        </router-link>
        <router-link to="/dashboard/notifications" class="nav-item">
          <span class="icon">🔔</span>
          <span>Notifications</span>
        </router-link>
        <router-link to="/dashboard/config" class="nav-item">
          <span class="icon">⚙️</span>
          <span>System Config</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button @click="showLogoutConfirmation" class="logout-btn">
          <span class="icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
    <div class="main-content">
      <header class="top-bar">
        <h1>{{ pageTitle }}</h1>
        <div class="user-info">
          <AppSwitcher />
          <span class="admin-badge">Admin</span>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="isLogoutModalVisible" class="modal-overlay" @click="cancelLogout">
      <div class="modal-content" @click.stop>
        <div class="modal-icon">🚪</div>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to log out?</p>
        <div class="modal-buttons">
          <button @click="cancelLogout" class="btn-cancel">Cancel</button>
          <button @click="proceedLogout" class="btn-proceed">Proceed</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useApi';
import AppSwitcher from '../components/AppSwitcher.vue';

const router = useRouter();
const route = useRoute();
const { logout } = useAuth();

const isLogoutModalVisible = ref(false);

const pageTitle = computed(() => {
  const path = route.path;
  if (path.includes('/orders')) return 'Order Management';
  if (path.includes('/merchants')) return 'Merchant Management';
  if (path.includes('/drivers')) return 'Driver Management';
  if (path.includes('/doctors')) return 'Doctor Management';
  if (path.includes('/users')) return 'User Management';
  if (path.includes('/payments')) return 'Payment Management';
  if (path.includes('/analytics')) return 'Sales Analytics';
  if (path.includes('/wallets')) return 'Wallet Top-ups';
  if (path.includes('/notifications')) return 'Push Notifications';
  if (path.includes('/config')) return 'System Configuration';
  return 'Dashboard';
});

const showLogoutConfirmation = () => {
  isLogoutModalVisible.value = true;
};

const cancelLogout = () => {
  isLogoutModalVisible.value = false;
};

const proceedLogout = () => {
  isLogoutModalVisible.value = false;
  logout();
  router.push('/login');
};
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 28px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  margin: 2px 12px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  transform: translateX(4px);
}

.nav-item.router-link-active,
.nav-item.router-link-exact-active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
  font-weight: 600;
}

/* Dashboard link should only highlight on exact match */
.nav-item[href="/dashboard"].router-link-active:not(.router-link-exact-active) {
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  box-shadow: none;
  font-weight: 500;
}

.nav-item .icon {
  margin-right: 14px;
  font-size: 22px;
  min-width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logout-btn .icon {
  margin-right: 12px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 36px;
  background: white;
  border-bottom: 1px solid #e8ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.top-bar h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.5px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-badge {
  padding: 6px 14px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 36px;
  background: #f5f7fa;
  overflow-y: auto;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
}

/* Logout Confirmation Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  padding: 36px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 420px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.modal-content h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
}

.modal-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 28px;
  line-height: 1.5;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-buttons button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 150px;
}

.btn-cancel {
  background: #e8ecef;
  color: #2c3e50;
}

.btn-cancel:hover {
  background: #d1d8dd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-proceed {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.btn-proceed:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}
</style>
