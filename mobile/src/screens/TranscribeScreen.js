import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, Share,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { theme } from '../lib/theme';

export default function TranscribeScreen({ onSaved }) {
  const [recording, setRecording] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const start = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert('Microphone permission denied'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const r = new Audio.Recording();
      await r.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await r.startAsync();
      setRecording(r);
      setText('');
      setAudioUri(null);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      Alert.alert('Recording failed', e.message);
    }
  };

  const stop = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    } catch (e) {
      Alert.alert('Stop failed', e.message);
    }
  };

  const submit = async () => {
    if (!audioUri) return;
    setBusy(true);
    setText('');
    try {
      const form = new FormData();
      form.append('audio', {
        uri: audioUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      });
      const { data } = await api.post('/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
      });
      setText(data.text);
      onSaved && onSaved();
    } catch (e) {
      Alert.alert('Transcription failed', e?.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    try { await Share.share({ message: text }); }
    catch (e) { Alert.alert('Share failed', e.message); }
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.badge}><Ionicons name="musical-note" size={12} color={theme.rose} /><Text style={styles.badgeText}>AUDIO</Text></View>
          <Text style={styles.modelText}>Whisper-1</Text>
        </View>
        <Text style={styles.title}>Audio Transcribe</Text>

        <View style={styles.recordBox}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={recording ? stop : start}
            style={[styles.micBtn, recording && styles.micBtnRecording]}
          >
            <Ionicons name={recording ? 'stop' : 'mic'} size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.recordStatus}>
            {recording ? `RECORDING · ${mmss}` : 'TAP MIC TO RECORD'}
          </Text>
        </View>

        {audioUri && (
          <View style={styles.fileChip}>
            <Ionicons name="musical-notes" size={14} color={theme.rose} />
            <Text style={styles.fileChipText}>recording.m4a · ready</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={submit}
          disabled={!audioUri || busy || !!recording}
          style={[styles.primaryBtn, (!audioUri || busy || !!recording) && { opacity: 0.5 }]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="document-text" size={16} color="#fff" />}
          <Text style={styles.primaryBtnText}>{busy ? 'Transcribing…' : 'Transcribe'}</Text>
        </TouchableOpacity>

        {!!text && (
          <View style={styles.result}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>TRANSCRIPT</Text>
              <TouchableOpacity onPress={share} style={styles.shareBtn}>
                <Ionicons name="share-social" size={14} color="#fff" />
                <Text style={styles.shareText}>Share</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultText}>{text}</Text>
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
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)', borderWidth: 1, borderRadius: 999 },
  badgeText: { color: theme.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  modelText: { color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: theme.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.5 },
  recordBox: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  micBtn: {
    width: 90, height: 90, borderRadius: 999, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.rose, shadowOpacity: 0.5, shadowRadius: 18,
  },
  micBtnRecording: { backgroundColor: theme.red, shadowOpacity: 0.9, shadowRadius: 24 },
  recordStatus: { color: theme.textSubtle, fontSize: 11, letterSpacing: 2, fontWeight: '600' },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.4)', borderColor: theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  fileChipText: { color: theme.text, fontSize: 12, fontWeight: '500' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.rose, borderRadius: 16, paddingVertical: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  result: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.green, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  resultText: { color: theme.text, fontSize: 14, lineHeight: 22 },
});
