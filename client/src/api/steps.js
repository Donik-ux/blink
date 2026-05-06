import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

export const syncSteps = (count, date) =>
  api.post('/steps', { count, date }).then((r) => r.data);

export const getLeaderboard = () =>
  api.get('/steps/leaderboard').then((r) => r.data);
