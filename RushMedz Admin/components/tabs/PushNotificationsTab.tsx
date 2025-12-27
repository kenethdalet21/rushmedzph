import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { eventBus } from '../../services/eventBus';

interface Notification {
  id: number;
  title: string;
  message: string;
  target: 'all' | 'users' | 'merchants' | 'drivers';
  sentAt: string;
  status: 'sent' | 'scheduled';
}

export default function PushNotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTarget, setNewTarget] = useState<'all' | 'users' | 'merchants' | 'drivers'>('all');

  useEffect(() => {
    setTimeout(() => {
      setNotifications([
        { id: 1, title: '🎉 New Order Alert', message: 'You have a new order #1001 from John Smith', target: 'merchants', sentAt: '2025-11-29T10:30:00', status: 'sent' },
        { id: 2, title: '📦 Delivery Assignment', message: 'New delivery assigned: Order #1001', target: 'drivers', sentAt: '2025-11-29T10:32:00', status: 'sent' },
        { id: 3, title: '✅ Order Delivered', message: 'Your order #1004 has been delivered!', target: 'users', sentAt: '2025-11-29T09:45:00', status: 'sent' },
        { id: 4, title: '💰 Payout Processed', message: 'Your payout of ₱45,320.50 is ready', target: 'merchants', sentAt: '2025-11-29T09:30:00', status: 'sent' },
        { id: 5, title: '🏆 Weekly Promo', message: 'Get 20% off on all vitamins this week!', target: 'all', sentAt: '2025-11-28T08:00:00', status: 'sent' },
        { id: 6, title: '⏰ Reminder', message: 'Complete your profile to start delivering', target: 'drivers', sentAt: '2025-11-27T10:00:00', status: 'scheduled' },
      ]);
      setLoading(false);
    }, 720);
  }, []);

  const sendTestNotification = async () => {
    if (!newTitle || !newMessage) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }
    Alert.alert('Success', `Notification sent to ${newTarget}!`);
    eventBus.publish('notificationComposed', { title: newTitle, message: newMessage, target: newTarget });
    setShowCompose(false);
    setNewTitle('');
    setNewMessage('');
  };

  if (loading) {
    return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

    const getTargetIcon = (target: string) => {
      switch (target) {
        case 'all': return '🌐';
        case 'users': return '👥';
        case 'merchants': return '🏪';
        case 'drivers': return '🚚';
        default: return '📢';
      }
    };

  return (
      <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notifications</Text>
      
        <TouchableOpacity 
          style={styles.composeButton}
          onPress={() => setShowCompose(!showCompose)}
        >
          <Text style={styles.composeButtonText}>
            {showCompose ? '❌ Cancel' : '✉️ Compose New Notification'}
          </Text>
        </TouchableOpacity>

        {showCompose && (
          <View style={styles.composeCard}>
            <Text style={styles.composeLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter notification title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
          
            <Text style={styles.composeLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter notification message"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={4}
            />
          
            <Text style={styles.composeLabel}>Target Audience</Text>
            <View style={styles.targetRow}>
              {(['all', 'users', 'merchants', 'drivers'] as const).map((target) => (
                <TouchableOpacity
                  key={target}
                  style={[styles.targetButton, newTarget === target && styles.targetButtonActive]}
                  onPress={() => setNewTarget(target)}
                >
                  <Text style={[styles.targetButtonText, newTarget === target && styles.targetButtonTextActive]}>
                    {getTargetIcon(target)} {target}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.sendButton} onPress={sendTestNotification}>
              <Text style={styles.sendButtonText}>📤 Send Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>📜 Notification History</Text>
        {notifications.map((item) => (
          <View key={item.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'sent' ? '#2ECC71' : '#F39C12' }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <View style={styles.notificationFooter}>
              <Text style={styles.notificationTarget}>{getTargetIcon(item.target)} {item.target.toUpperCase()}</Text>
              <Text style={styles.notificationDate}>🕐 {new Date(item.sentAt).toLocaleString()}</Text>
          </View>
          </View>
        ))}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  composeButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  composeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  composeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  composeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  targetButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  targetButtonActive: {
    backgroundColor: '#3498DB',
  },
  targetButtonText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  targetButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  notificationTarget: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498DB',
  },
  notificationDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
});