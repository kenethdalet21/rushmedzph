import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import walletService from '../../services/wallet';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import type { WalletTopUp } from '../../types';

export default function WalletTopUpsTab() {
  const [loading, setLoading] = useState(true);
  const [topUps, setTopUps] = useState<WalletTopUp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUnifiedAuth();
  const token = user?.token;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        if (!token) throw new Error('Admin token missing');
        const tus = await walletService.adminListTopUps(token);
        if (!cancelled) setTopUps(Array.isArray(tus) ? tus : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load top ups');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!token) throw new Error('Admin token missing');
      const tus = await walletService.adminListTopUps(token);
      setTopUps(Array.isArray(tus) ? tus : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const safeTopUps = Array.isArray(topUps) ? topUps : [];
  const totalAmount = safeTopUps.reduce((s, t) => s + (typeof t.amount === 'number' ? t.amount : 0), 0);
  const completed = safeTopUps.filter(t => t.status === 'completed').length;
  const processing = safeTopUps.filter(t => t.status === 'processing').length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Top Ups</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Top Ups</Text>
          <Text style={styles.summaryValue}>{topUps.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{completed}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Processing</Text>
          <Text style={styles.summaryValue}>{processing}</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>₱{totalAmount.toFixed(2)}</Text>
      </View>

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color="#FF6B6B" />
      ) : !error && (
        <ScrollView style={{ marginTop: 12 }}>
          {safeTopUps.length === 0 ? (
            <Text style={styles.placeholder}>No top ups recorded</Text>
          ) : (
            safeTopUps.map(tu => (
              <View key={tu.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemUser}>User: {tu.userId}</Text>
                  <Text style={styles.itemMeta}>
                    {(tu.type ? tu.type.toUpperCase() + ' • ' : '')}{tu.paymentMethod?.toUpperCase?.() || 'UNKNOWN'} • {tu.createdAt ? new Date(tu.createdAt).toLocaleString() : 'N/A'}
                  </Text>
                  {!!tu.adminNote && <Text style={styles.itemNote}>Note: {tu.adminNote}</Text>}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {tu.type === 'topup' && tu.status === 'completed' && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                          Alert.alert('Refund Top Up', `Refund ₱${tu.amount.toFixed(2)}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Confirm',
                              onPress: async () => {
                                try {
                                  if (!token) throw new Error('Admin token missing');
                                  await walletService.adminRefundTopUp(token, tu.id, 'Admin initiated refund');
                                  await refresh();
                                } catch (e: any) {
                                  Alert.alert('Refund Failed', e?.message || 'Please try again');
                                }
                              },
                            },
                          ]);
                        }}
                      >
                        <Text style={styles.actionBtnText}>Refund</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={async () => {
                        try {
                          if (!token) throw new Error('Admin token missing');
                          await walletService.adminAdjustBalance(token, tu.userId, 100, 'Admin +100');
                          await refresh();
                        } catch (e: any) {
                          Alert.alert('Adjust Failed', e?.message || 'Please try again');
                        }
                      }}
                    >
                      <Text style={styles.actionBtnText}>+₱100</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={async () => {
                        try {
                          if (!token) throw new Error('Admin token missing');
                          await walletService.adminAdjustBalance(token, tu.userId, -100, 'Admin -100');
                          await refresh();
                        } catch (e: any) {
                          Alert.alert('Adjust Failed', e?.message || 'Please try again');
                        }
                      }}
                    >
                      <Text style={styles.actionBtnText}>-₱100</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.itemStatus, { color: tu.status === 'completed' ? '#27AE60' : '#3498DB' }]}>{tu.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.itemAmount, { color: tu.amount >= 0 ? '#2C3E50' : '#E74C3C' }]}>₱{tu.amount.toFixed(2)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 8, elevation: 2 },
  summaryLabel: { fontSize: 12, color: '#7F8C8D' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  totalCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, elevation: 2, marginTop: 10 },
  totalLabel: { fontSize: 12, color: '#7F8C8D' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#FF6B6B' },
  placeholder: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginTop: 30 },
  item: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, elevation: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  itemUser: { fontSize: 12, color: '#2C3E50' },
  itemMeta: { fontSize: 11, color: '#7F8C8D' },
  itemStatus: { fontSize: 12, fontWeight: 'bold' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  itemNote: { fontSize: 11, color: '#7F8C8D' },
  actionBtn: { backgroundColor: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  errorBox: { backgroundColor: '#FFECEC', padding: 12, borderRadius: 8, marginTop: 12 },
  errorText: { color: '#C0392B', fontWeight: '600', marginBottom: 8 },
  retryBtn: { backgroundColor: '#C0392B', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
