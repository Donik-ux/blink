import { apiClient } from './client.js';

// GET /api/notifications
export const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

// PUT /api/notifications/read-all
export const markAllAsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};
