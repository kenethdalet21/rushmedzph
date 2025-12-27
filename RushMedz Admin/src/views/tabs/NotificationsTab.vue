<template>
  <div class="notifications-tab">
    <h2 class="page-title">📢 Push Notifications</h2>

    <!-- Compose Button -->
    <button @click="showCompose = !showCompose" class="compose-btn">
      {{ showCompose ? '❌ Cancel' : '✉️ Compose New Notification' }}
    </button>

    <!-- Compose Form -->
    <div v-if="showCompose" class="compose-card">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input
          v-model="newTitle"
          type="text"
          placeholder="Enter notification title"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Message</label>
        <textarea
          v-model="newMessage"
          placeholder="Enter notification message"
          class="form-textarea"
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Target Audience</label>
        <div class="target-buttons">
          <button
            v-for="target in targetOptions"
            :key="target.value"
            @click="newTarget = target.value"
            :class="['target-btn', { active: newTarget === target.value }]"
          >
            {{ target.icon }} {{ target.label }}
          </button>
        </div>
      </div>

      <button @click="sendNotification" class="send-btn">
        📤 Send Notification
      </button>
    </div>

    <!-- Notification History -->
    <div class="section">
      <h3 class="section-title">📜 Notification History</h3>
      
      <div class="notifications-list">
        <div v-for="notif in notifications" :key="notif.id" class="notification-card">
          <div class="notification-header">
            <h4 class="notification-title">{{ notif.title }}</h4>
            <span :class="['status-badge', notif.status]">
              {{ notif.status.toUpperCase() }}
            </span>
          </div>
          
          <p class="notification-message">{{ notif.message }}</p>
          
          <div class="notification-footer">
            <span class="notification-target">
              {{ getTargetIcon(notif.target) }} {{ notif.target.toUpperCase() }}
            </span>
            <span class="notification-date">
              🕐 {{ formatDate(notif.sentAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

interface Notification {
  id: number;
  title: string;
  message: string;
  target: 'all' | 'users' | 'merchants' | 'drivers';
  sentAt: string;
  status: 'sent' | 'scheduled';
}

const { sendPushNotification } = useAdmin();

const showCompose = ref(false);
const newTitle = ref('');
const newMessage = ref('');
const newTarget = ref<'all' | 'users' | 'merchants' | 'drivers'>('all');

const targetOptions = [
  { value: 'all' as const, label: 'All', icon: '🌐' },
  { value: 'users' as const, label: 'Users', icon: '👥' },
  { value: 'merchants' as const, label: 'Merchants', icon: '🏪' },
  { value: 'drivers' as const, label: 'Drivers', icon: '🚚' },
];

const notifications = ref<Notification[]>([
  {
    id: 1,
    title: '🎉 New Order Alert',
    message: 'You have a new order #1001 from John Smith',
    target: 'merchants',
    sentAt: '2025-12-26T10:30:00',
    status: 'sent'
  },
  {
    id: 2,
    title: '📦 Delivery Assignment',
    message: 'New delivery assigned: Order #1001',
    target: 'drivers',
    sentAt: '2025-12-26T10:32:00',
    status: 'sent'
  },
  {
    id: 3,
    title: '✅ Order Delivered',
    message: 'Your order #1004 has been delivered!',
    target: 'users',
    sentAt: '2025-12-26T09:45:00',
    status: 'sent'
  },
  {
    id: 4,
    title: '💰 Payout Processed',
    message: 'Your payout of ₱45,320.50 is ready',
    target: 'merchants',
    sentAt: '2025-12-26T09:30:00',
    status: 'sent'
  },
  {
    id: 5,
    title: '🏆 Weekly Promo',
    message: 'Get 20% off on all vitamins this week!',
    target: 'all',
    sentAt: '2025-12-25T08:00:00',
    status: 'sent'
  },
  {
    id: 6,
    title: '⏰ Reminder',
    message: 'Complete your profile to start delivering',
    target: 'drivers',
    sentAt: '2025-12-24T10:00:00',
    status: 'scheduled'
  },
]);

const getTargetIcon = (target: string) => {
  const icons: Record<string, string> = {
    all: '🌐',
    users: '👥',
    merchants: '🏪',
    drivers: '🚚'
  };
  return icons[target] || '📢';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const sendNotification = async () => {
  if (!newTitle.value || !newMessage.value) {
    alert('Please fill in title and message');
    return;
  }

  try {
    await sendPushNotification({
      title: newTitle.value,
      message: newMessage.value,
      target: newTarget.value
    });

    // Add to history
    notifications.value.unshift({
      id: Date.now(),
      title: newTitle.value,
      message: newMessage.value,
      target: newTarget.value,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });

    // Reset form
    newTitle.value = '';
    newMessage.value = '';
    newTarget.value = 'all';
    showCompose.value = false;

    alert(`Notification sent successfully to ${newTarget.value}!`);
  } catch (error) {
    console.error('Failed to send notification:', error);
    alert('Failed to send notification. Please try again.');
  }
};

onMounted(() => {
  // Load notifications from backend when available
});
</script>

<style scoped>
.notifications-tab {
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

.compose-btn {
  width: 100%;
  padding: 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;
}

.compose-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.compose-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.target-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.target-btn {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.target-btn:hover {
  border-color: #3498db;
}

.target-btn.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
  font-weight: 600;
}

.send-btn {
  width: 100%;
  padding: 14px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.section {
  margin-top: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 16px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.status-badge.sent {
  background: #d4edda;
  color: #155724;
}

.status-badge.scheduled {
  background: #fff3cd;
  color: #856404;
}

.notification-message {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #ecf0f1;
  font-size: 13px;
}

.notification-target {
  font-weight: 600;
  color: #3498db;
}

.notification-date {
  color: #95a5a6;
}
</style>
