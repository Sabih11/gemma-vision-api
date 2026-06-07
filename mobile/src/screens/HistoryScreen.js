import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { theme } from '../lib/theme';

const ICON = { image: 'image', transcribe: 'musical-note', audio: 'musical-note', chat: 'chatbubble' };
const COLOR = { image: theme.blue, transcribe: theme.rose, audio: theme.rose, chat: theme.text };

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/history');
      setItems(data || []);
    } catch (e) { /* ignore */ }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) { Alert.alert('Delete failed', e.message); }
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
      data={items}
      keyExtractor={(it) => it.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.text} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="documents-outline" size={28} color={theme.textMuted} />
          <Text style={styles.emptyText}>No history yet · pull to refresh</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconChip, { backgroundColor: `${COLOR[item.kind]}22`, borderColor: `${COLOR[item.kind]}55` }]}>
              <Ionicons name={ICON[item.kind] || 'sparkles'} size={12} color={COLOR[item.kind] || theme.text} />
            </View>
            <Text style={styles.kind}>{item.kind?.toUpperCase()}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => remove(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <Text numberOfLines={1} style={styles.prompt}>{item.prompt}</Text>
          <Text numberOfLines={3} style={styles.response}>{item.response}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => Share.share({ message: `${item.prompt}\n\n— ${item.response}` })}
              style={styles.shareBtn}
            >
              <Ionicons name="share-social" size={12} color="#fff" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 10, padding: 36 },
  emptyText: { color: theme.textMuted, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  card: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(24,24,27,0.6)', borderWidth: 1, borderColor: theme.border, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconChip: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kind: { color: theme.textSubtle, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  dot: { color: theme.textMuted, fontSize: 10 },
  time: { color: theme.textMuted, fontSize: 10, letterSpacing: 1 },
  iconBtn: { padding: 4 },
  prompt: { color: theme.text, fontSize: 13, fontWeight: '700' },
  response: { color: theme.textSubtle, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.green, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
