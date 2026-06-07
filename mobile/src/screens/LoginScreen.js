import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking2 from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { theme } from '../lib/theme';

WebBrowser.maybeCompleteAuthSession();

function parseSessionId(urlString) {
  if (!urlString) return null;
  const fragMatch = urlString.match(/[#&?]session_id=([^&]+)/);
  return fragMatch ? decodeURIComponent(fragMatch[1]) : null;
}

export default function LoginScreen() {
  const { exchangeSession } = useAuth();
  const [busy, setBusy] = useState(false);

  // Capture deep link if app was opened by an external URL with session_id
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const sid = parseSessionId(url);
      if (sid) handleSession(sid);
    });
    Linking.getInitialURL().then((url) => {
      const sid = parseSessionId(url);
      if (sid) handleSession(sid);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSession = async (sessionId) => {
    setBusy(true);
    try {
      await exchangeSession(sessionId);
    } catch (e) {
      Alert.alert('Sign-in failed', e?.response?.data?.detail || e.message || 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    setBusy(true);
    try {
      const redirectUrl = Linking2.createURL('auth-callback'); // omni://auth-callback
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        const sid = parseSessionId(result.url);
        if (sid) await handleSession(sid);
        else Alert.alert('Sign-in failed', 'Did not receive a session_id from the auth provider.');
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // user closed the browser
      }
    } catch (e) {
      Alert.alert('Sign-in error', e.message || 'Could not open auth browser');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.bg }}>
      <StatusBar style="light" />
      <View style={styles.headerRow}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>O</Text>
        </View>
        <Text style={styles.brandHint}>OMNI · v1.0</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 32 }}>
        <View style={styles.pill}>
          <Ionicons name="sparkles" size={12} color={theme.blue} />
          <Text style={styles.pillText}>Vision · Voice · Text</Text>
        </View>
        <Text style={styles.h1}>
          Sign in to{'\n'}
          <Text style={styles.h1Accent}>OMNI.</Text>
        </Text>
        <Text style={styles.lede}>
          See images, transcribe audio, ask anything — then share to WhatsApp in one tap.
        </Text>

        <View style={styles.featureRow}>
          <Feature icon="image-outline" label="Vision" />
          <Feature icon="mic-outline" label="Whisper" />
          <Feature icon="chatbubbles-outline" label="Chat" />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={busy}
          style={[styles.cta, busy && { opacity: 0.6 }]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.ctaText}>Continue with Google</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.smallNote}>Powered by Emergent Auth · 7-day sessions</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© Omni AI · {new Date().getFullYear()}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`${require('../lib/api').BACKEND_URL}/terms`)}>
          <Text style={[styles.footerText, { textDecorationLine: 'underline' }]}>Terms</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Feature({ icon, label }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={14} color={theme.blue} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, backgroundColor: theme.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: theme.indigo,
    alignItems: 'center', justifyContent: 'center', shadowColor: theme.blue, shadowOpacity: 0.5, shadowRadius: 12,
  },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  brandHint: { color: theme.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderColor: theme.border, borderWidth: 1, backgroundColor: theme.surface2,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  pillText: { color: theme.textSubtle, fontSize: 11, fontWeight: '600' },
  h1: { color: theme.text, fontSize: 44, fontWeight: '700', marginTop: 18, lineHeight: 50, letterSpacing: -1 },
  h1Accent: { color: theme.blue },
  lede: { color: theme.textSubtle, fontSize: 16, lineHeight: 24, marginTop: 16 },
  featureRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  feature: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: theme.surface2, borderColor: theme.border, borderWidth: 1, borderRadius: 14, justifyContent: 'center',
  },
  featureText: { color: theme.text, fontSize: 12, fontWeight: '600' },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 24, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5, flex: 1, marginLeft: 12 },
  smallNote: { color: theme.textMuted, fontSize: 11, marginTop: 16, letterSpacing: 1.5, textTransform: 'uppercase' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderTopColor: theme.border, borderTopWidth: 1, marginTop: 12,
  },
  footerText: { color: theme.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
});
