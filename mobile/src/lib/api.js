import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  'https://whispr-transcribe.preview.emergentagent.com';
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = 'omni_session_token';

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}
export async function setToken(token) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const api = axios.create({ baseURL: API });

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
