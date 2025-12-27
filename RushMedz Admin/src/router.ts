import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import Signup from './views/Signup.vue';
import DashboardLayout from './views/DashboardLayout.vue';
import DashboardTab from './views/tabs/DashboardTab.vue';
import OrdersTab from './views/tabs/OrdersTab.vue';
import MerchantsTab from './views/tabs/MerchantsTab.vue';
import DriversTab from './views/tabs/DriversTab.vue';
import DoctorsTab from './views/tabs/DoctorsTab.vue';
import UsersTab from './views/tabs/UsersTab.vue';
import PaymentsTab from './views/tabs/PaymentsTab.vue';
import AnalyticsTab from './views/tabs/AnalyticsTab.vue';
import WalletsTab from './views/tabs/WalletsTab.vue';
import NotificationsTab from './views/tabs/NotificationsTab.vue';
import ConfigTab from './views/tabs/ConfigTab.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/signup', component: Signup },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', component: DashboardTab },
        { path: 'orders', component: OrdersTab },
        { path: 'merchants', component: MerchantsTab },
        { path: 'drivers', component: DriversTab },
        { path: 'doctors', component: DoctorsTab },
        { path: 'users', component: UsersTab },
        { path: 'payments', component: PaymentsTab },
        { path: 'analytics', component: AnalyticsTab },
        { path: 'wallets', component: WalletsTab },
        { path: 'notifications', component: NotificationsTab },
        { path: 'config', component: ConfigTab },
      ],
    },
  ],
});

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/signup') && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
