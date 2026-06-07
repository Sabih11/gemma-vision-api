import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator,
  ScrollView, Alert, Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { theme } from '../lib/theme';

export default function VisionScreen({ onSaved }) {
  const [image, setImage] = useState(null);
  const [question, setQuestion] = useState('Describe this image in detail.');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85,
    });
    if (!r.canceled && r.assets?.[0]) {
      setImage(r.assets[0]);
      setResult('');
    }
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera permission denied'); return; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!r.canceled && r.assets?.[0]) {
      setImage(r.assets[0]);
      setResult('');
    }
  };

  const submit = async () => {
    if (!image || !question.trim()) return;
    setBusy(true);
    setResult('');
    try {
      const form = new FormData();
      form.append('question', question);
      form.append('image', {
        uri: image.uri,
        name: image.fileName || 'photo.jpg',
        type: image.mimeType || 'image/jpeg',
      });
      const { data } = await api.post('/ask', form, {
        headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
      });
      setResult(data.result);
      onSaved && onSaved();
    } catch (e) {
      Alert.alert('Analysis failed', e?.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: result });
    } catch (e) {
      Alert.alert('Share failed', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.badge}><Ionicons name="image" size={12} color={theme.blue} /><Text style={styles.badgeText}>IMAGE</Text></View>
          <Text style={styles.modelText}>Gemma Vision</Text>
        </View>
        <Text style={styles.title}>Image Recognition</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={pick} style={styles.dropzone}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={28} color={theme.blue} />
              <Text style={styles.dropTitle}>Pick from library</Text>
              <Text style={styles.dropHint}>PNG · JPG · WEBP</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={takePhoto} style={styles.linkRow}>
          <Ionicons name="camera-outline" size={16} color={theme.text} />
          <Text style={styles.linkText}>or take a photo</Text>
        </TouchableOpacity>

        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask anything about this image…"
          placeholderTextColor={theme.textMuted}
          multiline
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={submit}
          disabled={!image || busy}
          style={[styles.primaryBtn, (!image || busy) && { opacity: 0.5 }]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={16} color="#fff" />}
          <Text style={styles.primaryBtnText}>{busy ? 'Analyzing…' : 'Analyze image'}</Text>
        </TouchableOpacity>

        {!!result && (
          <View style={styles.result}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>RESULT</Text>
              <TouchableOpacity onPress={share} style={styles.shareBtn}>
                <Ionicons name="share-social" size={14} color="#fff" />
                <Text style={styles.shareText}>Share</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, backgroundColor: theme.bg },
  card: { padding: 20, borderRadius: 24, backgroundColor: 'rgba(24,24,27,0.6)', borderWidth: 1, borderColor: theme.border, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1, borderRadius: 999 },
  badgeText: { color: theme.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  modelText: { color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: theme.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.5 },
  dropzone: {
    minHeight: 200, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8, backgroundColor: 'rgba(0,0,0,0.2)',
  },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  dropTitle: { color: theme.text, fontWeight: '600', fontSize: 14, marginTop: 6 },
  dropHint: { color: theme.textMuted, fontSize: 10, letterSpacing: 1.5 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  linkText: { color: theme.text, textDecorationLine: 'underline', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderColor: theme.border, borderWidth: 1, borderRadius: 16,
    padding: 14, color: theme.text, fontSize: 14, minHeight: 90, textAlignVertical: 'top',
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.blue, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  result: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.green,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  resultText: { color: theme.text, fontSize: 14, lineHeight: 22 },
});
