import { apiClient } from './client.js';

export const getConversations = async () => {
  const response = await apiClient.get('/chat/conversations');
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
  return response.data;
};

export const createConversation = async (friendId) => {
  const response = await apiClient.post('/chat/conversations', { friendId });
  return response.data;
};

export const sendMessage = async (conversationId, text) => {
  const response = await apiClient.post('/chat/messages', {
    conversationId,
    text,
  });
  return response.data;
};

export const markAsRead = async (conversationId) => {
  const response = await apiClient.put(`/chat/conversations/${conversationId}/read`);
  return response.data;
};
