import { apiClient } from './client.js';

export const register = async (name, email, password, confirmPassword) => {
  const response = await apiClient.post('/auth/register', {
    name,
    email,
    password,
    confirmPassword,
  });
  return response.data;
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const refresh = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};
