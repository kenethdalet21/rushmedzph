import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Status = 'up' | 'down' | 'loading' | 'unknown';

export default function BackendStatusIndicator() {
  const [status, setStatus] = useState<Status>('loading');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const healthUrl = base ? `${base}/actuator/health` : '';

  const ping = async () => {
    if (!healthUrl) {
      setStatus('unknown');
      return;
    }
    setStatus((prev) => (prev === 'unknown' ? 'loading' : prev));
    const started = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeout);
      const elapsed = Date.now() - started;
      setLatencyMs(elapsed);
      if (res.ok) {
        setStatus('up');
      } else {
        setStatus('down');
      }
    } catch (e) {
      setStatus('down');
    }
  };

  useEffect(() => {
    ping();
    timerRef.current = setInterval(ping, 15000); // 15s poll
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const color =
    status === 'up'
      ? '#2ECC71'
      : status === 'down'
      ? '#E74C3C'
      : status === 'loading'
      ? '#F1C40F'
      : '#95A5A6';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>
        {status === 'up' && 'API Up'}
        {status === 'down' && 'API Down'}
        {status === 'loading' && 'API...'}
        {status === 'unknown' && 'API ?'}
        {latencyMs !== null && status === 'up' && ` ${latencyMs}ms`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
