import axios from 'axios';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../utils/secureStorage';

const API_BASE = 'http://localhost:3000/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getSecureItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getSecureItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });

        await setSecureItem('accessToken', data.accessToken);
        await setSecureItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch {
        await deleteSecureItem('accessToken');
        await deleteSecureItem('refreshToken');
      }
    }

    return Promise.reject(error);
  },
);

export default client;
