import api from './client';

export const getStaff = (schoolId) => api.get(`/schools/${schoolId}/staff`);
export const addStaff = (schoolId, data) => api.post(`/schools/${schoolId}/staff`, data);
export const updateStaff = (schoolId, userId, data) => api.put(`/schools/${schoolId}/staff/${userId}`, data);
export const removeStaff = (schoolId, userId) => api.delete(`/schools/${schoolId}/staff/${userId}`);
