import api from './client';

// Public
export const submitTrialRequest = (data) => api.post('/super-admin/trial-requests', data);

// Protected (super admin)
export const getStats = () => api.get('/super-admin/stats');
export const getSchools = (params) => api.get('/super-admin/schools', { params });
export const createSchool = (data) => api.post('/super-admin/schools', data);
export const getSchool = (id) => api.get(`/super-admin/schools/${id}`);
export const updateSchool = (id, data) => api.put(`/super-admin/schools/${id}`, data);
export const suspendSchool = (id) => api.post(`/super-admin/schools/${id}/suspend`);
export const restoreSchool = (id) => api.post(`/super-admin/schools/${id}/restore`);
export const deleteSchool = (id) => api.delete(`/super-admin/schools/${id}`);
export const addSchoolAdmin = (id, data) => api.post(`/super-admin/schools/${id}/admins`, data);
export const impersonateSchool = (id) => api.post(`/super-admin/schools/${id}/impersonate`);
export const getTrialRequests = (params) => api.get('/super-admin/trial-requests', { params });
export const updateTrialRequest = (id, data) => api.put(`/super-admin/trial-requests/${id}`, data);
export const convertTrialRequest = (id, data) => api.post(`/super-admin/trial-requests/${id}/convert`, data);
