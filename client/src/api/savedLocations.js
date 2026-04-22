import { apiClient } from './client.js';

export const getSavedLocations = async () => {
  const response = await apiClient.get('/saved-locations');
  return response.data;
};

export const getSavedLocation = async (id) => {
  const response = await apiClient.get(`/saved-locations/${id}`);
  return response.data;
};

export const createSavedLocation = async (data) => {
  const response = await apiClient.post('/saved-locations', data);
  return response.data;
};

export const updateSavedLocation = async (id, data) => {
  const response = await apiClient.put(`/saved-locations/${id}`, data);
  return response.data;
};

export const deleteSavedLocation = async (id) => {
  const response = await apiClient.delete(`/saved-locations/${id}`);
  return response.data;
};
