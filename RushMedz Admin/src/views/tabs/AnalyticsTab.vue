<template>
  <div class="analytics-tab">
    <h2 class="page-title">📊 Sales Analytics</h2>

    <!-- Revenue Overview -->
    <div class="section">
      <h3 class="section-title">📈 Revenue Overview</h3>
      <div class="sales-grid">
        <div v-for="(item, index) in salesData" :key="index" class="sales-card">
          <h4 class="period-label">{{ item.period }}</h4>
          <div class="sales-row">
            <div class="sales-item">
              <div class="sales-value">{{ formatCurrency(item.revenue) }}</div>
              <div class="sales-label">Revenue</div>
            </div>
            <div class="sales-item">
              <div class="sales-value">{{ item.orders }}</div>
              <div class="sales-label">Orders</div>
            </div>
            <div class="sales-item">
              <div class="sales-value">{{ formatCurrency(item.avgOrderValue) }}</div>
              <div class="sales-label">Avg Order</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Products -->
    <div class="section">
      <h3 class="section-title">🏆 Top Products</h3>
      <div class="products-list">
        <div v-for="(item, index) in topProducts" :key="index" class="product-card">
          <div class="product-header">
            <span class="product-rank">#{{ index + 1 }}</span>
            <span class="product-name">{{ item.name }}</span>
          </div>
          <div class="product-stats">
            <span class="product-sales">{{ formatCurrency(item.sales) }} sales</span>
            <span class="product-units">{{ item.units }} units</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="section">
      <h3 class="section-title">💳 Payment Methods</h3>
      <div class="payment-card">
        <div v-for="method in paymentMethods" :key="method.name" class="payment-row">
          <span class="payment-method">{{ method.icon }} {{ method.name }}</span>
          <span class="payment-percent">{{ method.percent }}%</span>
          <div class="payment-bar">
            <div class="payment-fill" :style="{ width: method.percent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div class="section">
      <h3 class="section-title">📦 Category Breakdown</h3>
      <div class="category-grid">
        <div v-for="cat in categories" :key="cat.name" class="category-card">
          <div class="category-icon">{{ cat.icon }}</div>
          <div class="category-content">
            <div class="category-name">{{ cat.name }}</div>
            <div class="category-amount">{{ formatCurrency(cat.sales) }}</div>
            <div class="category-count">{{ cat.items }} items sold</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { getDashboardMetrics } = useAdmin();

const salesData = ref([
  { period: 'Today', revenue: 18450.50, orders: 83, avgOrderValue: 222.30 },
  { period: 'Yesterday', revenue: 21340.25, orders: 95, avgOrderValue: 224.64 },
  { period: 'This Week', revenue: 145250.50, orders: 642, avgOrderValue: 226.24 },
  { period: 'This Month', revenue: 580420.75, orders: 2547, avgOrderValue: 227.89 },
]);

const topProducts = ref([
  { name: '💊 Paracetamol 500mg', sales: 45230.00, units: 3420 },
  { name: '💊 Biogesic', sales: 38150.50, units: 2890 },
  { name: '💊 Vitamin C 1000mg', sales: 32670.25, units: 2456 },
  { name: '💊 Amoxicillin', sales: 28450.75, units: 1987 },
  { name: '💊 Loperamide', sales: 22340.30, units: 1654 },
]);

const paymentMethods = ref([
  { name: 'GCash', icon: '💳', percent: 45 },
  { name: 'PayMaya', icon: '💳', percent: 28 },
  { name: 'Cash on Delivery', icon: '💵', percent: 18 },
  { name: 'Credit Card', icon: '💳', percent: 9 },
]);

const categories = ref([
  { name: 'Pain Relief', icon: '💊', sales: 125340.50, items: 8420 },
  { name: 'Vitamins', icon: '🌟', sales: 98250.25, items: 6780 },
  { name: 'Antibiotics', icon: '💉', sales: 87450.75, items: 5234 },
  { name: 'First Aid', icon: '🩹', sales: 65230.00, items: 4890 },
]);

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

onMounted(async () => {
  try {
    const data = await getDashboardMetrics();
    if (data) {
      // Update with real data when available
      console.log('Analytics data loaded:', data);
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
});
</script>

<style scoped>
.analytics-tab {
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

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  letter-spacing: -0.3px;
  text-align: center;
}

.sales-grid {
  display: grid;
  gap: 16px;
}

.sales-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.period-label {
  font-size: 18px;
  font-weight: bold;
  color: #3498db;
  margin: 0 0 16px 0;
}

.sales-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.sales-item {
  text-align: center;
}

.sales-value {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.sales-label {
  font-size: 13px;
  color: #7f8c8d;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.product-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.product-rank {
  font-size: 22px;
  font-weight: bold;
  color: #f39c12;
  margin-right: 12px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.product-stats {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.product-sales {
  color: #27ae60;
  font-weight: 600;
}

.product-units {
  color: #7f8c8d;
}

.payment-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payment-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #ecf0f1;
}

.payment-row:last-child {
  border-bottom: none;
}

.payment-method {
  font-size: 15px;
  color: #2c3e50;
}

.payment-percent {
  font-size: 15px;
  font-weight: bold;
  color: #3498db;
}

.payment-bar {
  grid-column: 1 / -1;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.payment-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.category-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-icon {
  font-size: 48px;
}

.category-content {
  flex: 1;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.category-amount {
  font-size: 20px;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 4px;
}

.category-count {
  font-size: 12px;
  color: #7f8c8d;
}
</style>
