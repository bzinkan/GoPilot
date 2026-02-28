import api from './client';

export const createSchool = (data) => api.post('/schools', data);
export const getSchool = (id) => api.get(`/schools/${id}`);
export const updateSchool = (id, data) => api.put(`/schools/${id}`, data);
export const inviteUser = (schoolId, data) => api.post(`/schools/${schoolId}/invite`, data);
export const getMembers = (schoolId) => api.get(`/schools/${schoolId}/members`);
export const getSchoolSettings = (schoolId) => api.get(`/schools/${schoolId}/settings`);
export const updateSchoolSettings = (schoolId, settings) => api.put(`/schools/${schoolId}/settings`, settings);
