import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/lib/auth';
import LoginScreen from './src/screens/LoginScreen';
import VisionScreen from './src/screens/VisionScreen';
import TranscribeScreen from './src/screens/TranscribeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { theme } from './src/lib/theme';

const Tab = createBottomTabNavigator();

function Header() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logoBox}><Text style={styles.logoText}>O</Text></View>
        <Text style={styles.brandText}>OMNI<Text style={{ color: theme.blue }}>.</Text></Text>
      </View>
      <View style={styles.userRow}>
        {user?.picture && <Image source={{ uri: user.picture }} style={styles.avatar} />}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Logout', 'Sign out of Omni?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ])}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface, borderTopColor: theme.border, height: 70, paddingTop: 8, paddingBottom: 12,
        },
        tabBarActiveTintColor: theme.blue,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
        tabBarIcon: ({ color, size }) => {
          const name = route.name === 'Image' ? 'image' : route.name === 'Audio' ? 'mic' : 'time';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Image" component={VisionScreen} />
      <Tab.Screen name="Audio" component={TranscribeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.blue} size="large" />
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }
  if (!user) return <LoginScreen />;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header />
      <MainTabs />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={{
        dark: true,
        colors: {
          background: theme.bg,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          primary: theme.blue,
          notification: theme.rose,
        },
      }}>
        <StatusBar style="light" />
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: theme.textSubtle, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: theme.border, borderBottomWidth: 1, backgroundColor: theme.bg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.indigo, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  brandText: { color: theme.text, fontSize: 18, fontWeight: '700' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 999, borderWidth: 1, borderColor: theme.border },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface2, borderColor: theme.border, borderWidth: 1,
  },
});
