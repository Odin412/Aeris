import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Button } from 'react-native';
import { useAerisApi } from '../hooks/useAerisApi';

export function DashboardScreen() {
  const callApi = useAerisApi();
  const [health, setHealth] = useState<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);

  const refresh = async () => {
    const [healthState, notificationList, actions] = await Promise.all([
      callApi({ path: '/health' }),
      callApi({ path: '/notifications' }),
      callApi({ path: '/mobile/quick-actions' }),
    ]);
    setHealth(healthState);
    setNotifications(notificationList);
    setQuickActions(actions);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Aeris Command</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health</Text>
          <Text style={styles.mono}>{JSON.stringify(health, null, 2)}</Text>
          <Button title="Refresh" onPress={refresh} color="#d4af37" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <Text key={action.id} style={styles.listItem}>
              • {action.title} — {action.description}
            </Text>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          {notifications.map((item) => (
            <Text key={item.id} style={styles.listItem}>
              • {item.message}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090b' },
  container: { padding: 24, gap: 16 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '700' },
  card: { backgroundColor: '#18181b', borderRadius: 20, padding: 16, borderColor: '#d4af37', borderWidth: 1 },
  cardTitle: { color: '#d4af37', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  mono: { color: '#f8fafc', fontFamily: 'Courier', marginBottom: 8 },
  listItem: { color: '#f1f5f9', marginBottom: 4 },
});
