import { apiClient } from './client.js';

// GET /api/profile
export const getProfile = async () => {
  const response = await apiClient.get('/profile');
  return response.data;
};

// PUT /api/profile
export const updateProfile = async (data) => {
  const response = await apiClient.put('/profile', data);
  return response.data;
};
