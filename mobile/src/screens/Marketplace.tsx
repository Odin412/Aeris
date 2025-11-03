import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, Button, FlatList } from 'react-native';
import { useAerisApi } from '../hooks/useAerisApi';

export function MarketplaceScreen() {
  const callApi = useAerisApi();
  const [city, setCity] = useState('Austin');
  const [type, setType] = useState('buy');
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const properties = await callApi({ path: `/marketplace/search?city=${city}&type=${type}` });
    setResults(properties);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Marketplace</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#71717a" />
        <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Type" placeholderTextColor="#71717a" />
        <Button title="Search" onPress={search} color="#d4af37" />
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, marginTop: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.address}</Text>
              <Text style={styles.cardMeta}>{item.city}, {item.state} · ${item.price.toLocaleString()}</Text>
              <Text style={styles.cardMeta}>{item.beds} bd · {item.baths} ba · {item.sqft} sqft</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090b' },
  container: { flex: 1, padding: 24, gap: 12 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '700' },
  input: {
    backgroundColor: '#18181b',
    color: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 16, borderColor: '#d4af37', borderWidth: 1 },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '600' },
  cardMeta: { color: '#cbd5f5', marginTop: 4 },
});
