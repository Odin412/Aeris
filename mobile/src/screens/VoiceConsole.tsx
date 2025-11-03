import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { useAerisApi } from '../hooks/useAerisApi';

export function VoiceConsoleScreen() {
  const callApi = useAerisApi();
  const [content, setContent] = useState('Followed up with Jamie about inspection.');

  const submit = async () => {
    try {
      await callApi({
        path: '/assistant/voice',
        method: 'POST',
        body: { channel: 'call', content },
      });
      Alert.alert('Voice note stored', 'TitanAI scheduled a follow-up task.');
      setContent('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Voice Console</Text>
        <Text style={styles.label}>Transcript</Text>
        <TextInput
          style={styles.input}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="Dictate your note"
          placeholderTextColor="#71717a"
        />
        <Button title="Send to TitanAI" onPress={submit} color="#d4af37" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090b' },
  container: { flex: 1, padding: 24, gap: 16 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '700' },
  label: { color: '#d4af37', fontWeight: '600' },
  input: {
    backgroundColor: '#18181b',
    color: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    minHeight: 180,
    textAlignVertical: 'top',
  },
});
