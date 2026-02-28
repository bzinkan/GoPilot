import api from './client';

export const register = (data) => api.post('/auth/register', data);
export const registerParent = (data) => api.post('/auth/register/parent', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/me', data);
export const getGoogleAuthUrl = () =>
  `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/auth/google`;
