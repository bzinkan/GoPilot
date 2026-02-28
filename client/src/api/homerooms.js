import api from './client';

export const getHomerooms = (schoolId) => api.get(`/schools/${schoolId}/homerooms`);
export const createHomeroom = (schoolId, data) => api.post(`/schools/${schoolId}/homerooms`, data);
export const updateHomeroom = (id, data) => api.put(`/homerooms/${id}`, data);
export const deleteHomeroom = (id) => api.delete(`/homerooms/${id}`);
export const assignStudents = (homeroomId, studentIds) =>
  api.post(`/homerooms/${homeroomId}/assign`, { studentIds });
