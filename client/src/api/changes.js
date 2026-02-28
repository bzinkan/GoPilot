import api from './client';

export const submitChange = (sessionId, data) => api.post(`/sessions/${sessionId}/changes`, data);
export const getChanges = (sessionId) => api.get(`/sessions/${sessionId}/changes`);
export const resolveChange = (id, data) => api.put(`/changes/${id}`, data);
