import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fintechService = {
  generateKeys: async (username, password) => {
    const response = await api.post('/generate-keys', { username, password });
    return response.data;
  },

  signTransaction: async (sender, password, receiver, amount, currency = 'USD') => {
    const response = await api.post('/sign-transaction', {
      sender,
      password,
      receiver,
      amount,
      currency,
    });
    return response.data;
  },

  verifyTransaction: async (payload, signature, hash, jwt_token = null) => {
    const body = { payload, signature, hash };
    if (jwt_token) body.jwt_token = jwt_token;
    const response = await api.post('/verify-transaction', body);
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await api.get('/audit-logs');
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
};

export default api;
