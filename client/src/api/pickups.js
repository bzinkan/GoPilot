import api from './client';

export const getPickups = (studentId) => api.get(`/students/${studentId}/pickups`);
export const addPickup = (studentId, data) => api.post(`/students/${studentId}/pickups`, data);
export const updatePickup = (id, data) => api.put(`/pickups/${id}`, data);
export const deletePickup = (id) => api.delete(`/pickups/${id}`);
export const getCustodyAlerts = (schoolId) => api.get(`/schools/${schoolId}/custody-alerts`);
export const createCustodyAlert = (studentId, data) => api.post(`/students/${studentId}/custody-alerts`, data);

export const getChildren = () => api.get('/me/children');
export const linkChild = (data) => api.post('/me/children/link', data);
export const getParentRequests = (schoolId) => api.get(`/schools/${schoolId}/parent-requests`);
export const resolveParentRequest = (id, data) => api.put(`/parent-requests/${id}`, data);
