import api from './client';

export const getAuthUrl = (schoolId) => api.get('/google/auth-url', { params: { schoolId } });
export const getStatus = (schoolId) => api.get('/google/status', { params: { schoolId } });
export const getCourses = (schoolId) => api.get('/google/courses', { params: { schoolId } });
export const syncCourses = (schoolId, courses) => api.post('/google/sync', { schoolId, courses });
export const disconnect = (schoolId) => api.delete('/google/disconnect', { params: { schoolId } });
export const getOrgUnits = (schoolId) => api.get('/google/workspace/orgunits', { params: { schoolId } });
export const getWorkspaceUsers = (schoolId, orgUnitPath) => api.get('/google/workspace/users', { params: { schoolId, orgUnitPath } });
export const importWorkspaceUsers = (schoolId, users) => api.post('/google/workspace/import', { schoolId, users });
export const importWorkspaceOrgUnits = (schoolId, orgunits) => api.post('/google/workspace/import-orgunits', { schoolId, orgunits });
export const importWorkspaceStaff = (schoolId, users, role) => api.post('/google/workspace/import-staff', { schoolId, users, role });
