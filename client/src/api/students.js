import api from './client';

export const getStudents = (schoolId, params) => api.get(`/schools/${schoolId}/students`, { params });
export const createStudent = (schoolId, data) => api.post(`/schools/${schoolId}/students`, data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const importCSV = (schoolId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/schools/${schoolId}/students/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const bulkUpdateStudents = (schoolId, updates) =>
  api.put(`/schools/${schoolId}/students/bulk-update`, { updates });

// Family groups
export const getFamilyGroups = (schoolId) => api.get(`/schools/${schoolId}/family-groups`);
export const createFamilyGroup = (schoolId, data) => api.post(`/schools/${schoolId}/family-groups`, data);
export const updateFamilyGroup = (id, data) => api.put(`/family-groups/${id}`, data);
export const deleteFamilyGroup = (id) => api.delete(`/family-groups/${id}`);
export const addStudentsToGroup = (groupId, studentIds) => api.post(`/family-groups/${groupId}/students`, { studentIds });
export const removeStudentFromGroup = (groupId, studentId) => api.delete(`/family-groups/${groupId}/students/${studentId}`);
export const autoAssignFamilyGroups = (schoolId) => api.post(`/schools/${schoolId}/family-groups/auto-assign`);
export const sendToAppMode = (schoolId) => api.post(`/schools/${schoolId}/send-to-app-mode`);
export const getDismissalMode = (schoolId) => api.get(`/schools/${schoolId}/dismissal-mode`);
export const switchToNoAppMode = (schoolId) => api.post(`/schools/${schoolId}/switch-to-no-app-mode`);
