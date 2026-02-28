import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload, Download, RefreshCw, Search, Plus, Edit, Trash2,
  Check, X, AlertTriangle, Users, Filter, ChevronDown,
  Link2, Unlink, FileSpreadsheet, Database, Clock, CheckCircle2,
  AlertCircle, Eye, UserPlus, Shield, Bus, Car, PersonStanding
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { getStudents, createStudent, updateStudent, deleteStudent, importCSV } from '../api/students';
import { getParentRequests, resolveParentRequest, getCustodyAlerts } from '../api/pickups';

// Utility Components (same as main app)
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  };
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' };
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, className = '' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className} disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>{children}</div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">{children}</div>
      </div>
    </div>
  );
};

// SIS Providers (mock - no real SIS APIs yet)
const sisProviders = [
  { id: 'google', name: 'Google Workspace', icon: '🔷', connected: true, lastSync: new Date(Date.now() - 1800000), features: ['SSO', 'Classroom', 'Directory'] },
  { id: 'powerschool', name: 'PowerSchool', icon: '🔵', connected: false, lastSync: null },
  { id: 'infinite_campus', name: 'Infinite Campus', icon: '🟢', connected: false, lastSync: null },
  { id: 'skyward', name: 'Skyward', icon: '🟡', connected: false, lastSync: null },
  { id: 'blackbaud', name: 'Blackbaud', icon: '🔴', connected: false, lastSync: null },
  { id: 'clever', name: 'Clever', icon: '🟣', connected: false, lastSync: null },
  { id: 'classlink', name: 'ClassLink', icon: '🟠', connected: false, lastSync: null },
];

// Main Roster Management Component
export default function RosterManagement() {
  const { currentSchool } = useSchool();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterDismissal, setFilterDismissal] = useState('all');
  const [activeTab, setActiveTab] = useState('roster');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSISModal, setShowSISModal] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [importStep, setImportStep] = useState(1);
  const [importData, setImportData] = useState(null);
  const [importUploading, setImportUploading] = useState(false);
  const [importError, setImportError] = useState(null);
  const [sisConnections, setSisConnections] = useState(sisProviders);
  const [saving, setSaving] = useState(false);

  // Parent requests state
  const [parentRequests, setParentRequests] = useState([]);
  const [parentRequestsLoading, setParentRequestsLoading] = useState(false);
  const [parentRequestsError, setParentRequestsError] = useState(null);

  // Custody alerts state
  const [custodyAlerts, setCustodyAlerts] = useState([]);
  const [custodyAlertsLoading, setCustodyAlertsLoading] = useState(false);
  const [custodyAlertsError, setCustodyAlertsError] = useState(null);

  // Add student form state
  const [addForm, setAddForm] = useState({
    firstName: '', lastName: '', studentId: '', grade: 'K',
    teacher: 'Mrs. Johnson', dismissalType: 'car', busRoute: '',
    parentName: '', parentRelationship: 'Mother', parentPhone: '', parentEmail: '',
  });

  // Edit student form state
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', grade: '', teacher: '',
    dismissalType: 'car', busRoute: '',
  });

  // Fetch students on mount and when school changes
  const fetchStudents = useCallback(async () => {
    if (!currentSchool?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getStudents(currentSchool.id);
      setStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [currentSchool?.id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch parent requests when tab is active
  const fetchParentRequests = useCallback(async () => {
    if (!currentSchool?.id) return;
    setParentRequestsLoading(true);
    setParentRequestsError(null);
    try {
      const response = await getParentRequests(currentSchool.id);
      setParentRequests(response.data);
    } catch (err) {
      setParentRequestsError(err.response?.data?.message || 'Failed to load parent requests');
    } finally {
      setParentRequestsLoading(false);
    }
  }, [currentSchool?.id]);

  useEffect(() => {
    if (activeTab === 'parents') {
      fetchParentRequests();
    }
  }, [activeTab, fetchParentRequests]);

  // Fetch custody alerts when tab is active
  const fetchCustodyAlerts = useCallback(async () => {
    if (!currentSchool?.id) return;
    setCustodyAlertsLoading(true);
    setCustodyAlertsError(null);
    try {
      const response = await getCustodyAlerts(currentSchool.id);
      setCustodyAlerts(response.data);
    } catch (err) {
      setCustodyAlertsError(err.response?.data?.message || 'Failed to load custody alerts');
    } finally {
      setCustodyAlertsLoading(false);
    }
  }, [currentSchool?.id]);

  useEffect(() => {
    if (activeTab === 'authorized') {
      fetchCustodyAlerts();
    }
  }, [activeTab, fetchCustodyAlerts]);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName} ${student.id}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesDismissal = filterDismissal === 'all' || student.dismissalType === filterDismissal;
    return matchesSearch && matchesGrade && matchesDismissal;
  });

  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
  const dismissalTypes = ['car', 'bus', 'walker', 'afterschool'];

  // Handle CSV file upload via real API
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentSchool?.id) return;

    setImportUploading(true);
    setImportError(null);
    try {
      const response = await importCSV(currentSchool.id, file);
      setImportData(response.data);
      setImportStep(2);
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to upload CSV file');
    } finally {
      setImportUploading(false);
    }
  };

  // Confirm CSV import (step 2 -> 3)
  const handleConfirmImport = async () => {
    setSaving(true);
    try {
      // The import was already processed server-side; refresh the student list
      await fetchStudents();
      setImportStep(3);
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to finalize import');
    } finally {
      setSaving(false);
    }
  };

  // Handle add student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!currentSchool?.id) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        studentId: addForm.studentId,
        grade: addForm.grade,
        teacher: addForm.teacher,
        dismissalType: addForm.dismissalType,
        busRoute: addForm.busRoute || null,
        parent: {
          name: addForm.parentName,
          relationship: addForm.parentRelationship,
          phone: addForm.parentPhone,
          email: addForm.parentEmail,
        },
      };
      await createStudent(currentSchool.id, payload);
      await fetchStudents();
      setShowAddModal(false);
      setAddForm({
        firstName: '', lastName: '', studentId: '', grade: 'K',
        teacher: 'Mrs. Johnson', dismissalType: 'car', busRoute: '',
        parentName: '', parentRelationship: 'Mother', parentPhone: '', parentEmail: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit student
  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSaving(true);
    setError(null);
    try {
      await updateStudent(showEditModal.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        grade: editForm.grade,
        teacher: editForm.teacher,
        dismissalType: editForm.dismissalType,
        busRoute: editForm.busRoute || null,
      });
      await fetchStudents();
      setShowEditModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal with pre-filled data
  const openEditModal = (student) => {
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      teacher: student.teacher,
      dismissalType: student.dismissalType,
      busRoute: student.busRoute || '',
    });
    setShowEditModal(student);
  };

  // Handle delete student
  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to remove ${student.firstName} ${student.lastName}?`)) return;
    setSaving(true);
    setError(null);
    try {
      await deleteStudent(student.id);
      await fetchStudents();
      setShowStudentDetail(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setSaving(false);
    }
  };

  // Handle approve/reject parent request
  const handleResolveRequest = async (requestId, status) => {
    try {
      await resolveParentRequest(requestId, { status });
      await fetchParentRequests();
      // Refresh students too since parent links may have changed
      await fetchStudents();
    } catch (err) {
      setParentRequestsError(err.response?.data?.message || 'Failed to resolve request');
    }
  };

  // Simulate SIS sync (mock - no real SIS APIs yet)
  const handleSISSync = (providerId) => {
    setSisConnections(prev => prev.map(sis =>
      sis.id === providerId ? { ...sis, syncing: true } : sis
    ));

    setTimeout(() => {
      setSisConnections(prev => prev.map(sis =>
        sis.id === providerId ? { ...sis, syncing: false, lastSync: new Date() } : sis
      ));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Roster Management</h1>
            <p className="text-sm text-gray-500">{students.length} students enrolled</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setShowSISModal(true)}>
              <Database className="w-4 h-4 mr-2" />
              SIS Integration
            </Button>
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t">
          <div className="flex gap-6">
            {[
              { id: 'roster', label: 'Student Roster', icon: Users },
              { id: 'parents', label: 'Parent Connections', icon: Link2 },
              { id: 'authorized', label: 'Authorized Pickups', icon: Shield },
              { id: 'sync', label: 'Sync History', icon: RefreshCw },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Global error banner */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="p-6">
        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">All Grades</option>
                  {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <select
                  value={filterDismissal}
                  onChange={(e) => setFilterDismissal(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">All Dismissal Types</option>
                  <option value="car">Car Rider</option>
                  <option value="bus">Bus Rider</option>
                  <option value="walker">Walker</option>
                  <option value="afterschool">After School</option>
                </select>
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>

            {/* Loading state */}
            {loading && (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                  <p className="text-gray-500">Loading students...</p>
                </div>
              </Card>
            )}

            {/* Student Table */}
            {!loading && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Student</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Grade</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Teacher</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Dismissal</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Parent Link</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                              <span className="font-medium">{student.firstName} {student.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{student.id}</td>
                          <td className="px-4 py-3">
                            <Badge variant="blue" size="sm">{student.grade}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{student.teacher}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {student.dismissalType === 'car' && <Car className="w-4 h-4 text-blue-500" />}
                              {student.dismissalType === 'bus' && <Bus className="w-4 h-4 text-yellow-500" />}
                              {student.dismissalType === 'walker' && <PersonStanding className="w-4 h-4 text-green-500" />}
                              <span className="text-sm capitalize">{student.dismissalType}</span>
                              {student.busRoute && <Badge variant="yellow" size="sm">#{student.busRoute}</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {student.parents && student.parents.length > 0 ? (
                              <Badge variant="green" size="sm">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {student.parents.length} linked
                              </Badge>
                            ) : (
                              <Badge variant="yellow" size="sm">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No parent
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowStudentDetail(student)}
                                className="p-1.5 hover:bg-gray-100 rounded"
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => openEditModal(student)}
                                className="p-1.5 hover:bg-gray-100 rounded"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student)}
                                className="p-1.5 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Parent Connections Tab */}
        {activeTab === 'parents' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Pending Parent Connections</h2>
                <Badge variant="yellow">
                  {parentRequestsLoading ? '...' : `${parentRequests.filter(r => r.status === 'pending').length} pending`}
                </Badge>
              </div>

              {parentRequestsLoading && (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="ml-2 text-gray-500">Loading requests...</span>
                </div>
              )}

              {parentRequestsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-3">
                  {parentRequestsError}
                </div>
              )}

              {!parentRequestsLoading && !parentRequestsError && (
                <div className="space-y-3">
                  {parentRequests.filter(r => r.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-sm py-4 text-center">No pending parent connection requests.</p>
                  )}
                  {parentRequests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">{request.parentName || request.parent}</p>
                        <p className="text-sm text-gray-500">{request.parentEmail || request.email}</p>
                        <p className="text-sm text-gray-500">Requesting access to: <strong>{request.studentName || request.student}</strong></p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">{request.requestedAt}</span>
                        <div className="flex gap-2">
                          <Button variant="danger" size="sm" onClick={() => handleResolveRequest(request.id, 'rejected')}>
                            <X className="w-4 h-4" />
                          </Button>
                          <Button variant="success" size="sm" onClick={() => handleResolveRequest(request.id, 'approved')}>
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-4">Connected Parents</h2>
              <div className="space-y-2">
                {students.flatMap(s => (s.parents || []).map(p => ({ ...p, student: s }))).map((parent, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{parent.name}</p>
                        <p className="text-sm text-gray-500">{parent.email} • {parent.relationship}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="blue" size="sm">{parent.student.firstName} {parent.student.lastName}</Badge>
                      <Button variant="ghost" size="sm"><Unlink className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Authorized Pickups Tab */}
        {activeTab === 'authorized' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Authorized Pickup Management</h2>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export List
                </Button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Manage who is authorized to pick up each student. Parents can add authorized pickups via the app, but they require school approval.
              </p>

              {/* Custody Alerts */}
              {custodyAlertsLoading && (
                <div className="flex items-center justify-center py-4 mb-4">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="ml-2 text-gray-500">Loading custody alerts...</span>
                </div>
              )}

              {custodyAlertsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  {custodyAlertsError}
                </div>
              )}

              {!custodyAlertsLoading && !custodyAlertsError && custodyAlerts.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5" />
                    Custody Alerts ({custodyAlerts.length})
                  </h3>
                  {custodyAlerts.map((alert, i) => (
                    <div key={alert.id || i} className="bg-white rounded-lg p-3 mb-2 last:mb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{alert.studentName}</p>
                          <p className="text-sm text-red-600">{alert.restrictedPerson} - NOT AUTHORIZED</p>
                          {alert.notes && <p className="text-xs text-gray-500">{alert.notes}</p>}
                        </div>
                        <Button variant="secondary" size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Authorized Pickups by Student */}
              <div className="space-y-4">
                {students.slice(0, 3).map(student => (
                  <div key={student.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-500">Grade {student.grade}</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Pickup
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(student.parents || []).map((parent, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{parent.name}</span>
                          <Badge variant="green" size="sm">{parent.relationship}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Sync History Tab (mock - no real SIS APIs yet) */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">SIS Sync Status</h2>
              {sisConnections.filter(s => s.connected).map(sis => (
                <div key={sis.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sis.icon}</span>
                    <div>
                      <p className="font-medium">{sis.name}</p>
                      <p className="text-sm text-green-600">Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Last synced</p>
                      <p className="text-sm font-medium">
                        {sis.lastSync ? sis.lastSync.toLocaleTimeString() : 'Never'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSISSync(sis.id)}
                      disabled={sis.syncing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${sis.syncing ? 'animate-spin' : ''}`} />
                      {sis.syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>
                </div>
              ))}
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-4">Recent Sync History</h2>
              <div className="space-y-3">
                {[
                  { time: '10:30 AM', type: 'Auto Sync', source: 'Blackbaud', added: 3, updated: 12, removed: 0, status: 'success' },
                  { time: '6:30 AM', type: 'Auto Sync', source: 'Blackbaud', added: 0, updated: 5, removed: 0, status: 'success' },
                  { time: 'Yesterday 10:30 PM', type: 'Manual Sync', source: 'Blackbaud', added: 15, updated: 45, removed: 2, status: 'success' },
                  { time: 'Yesterday 3:15 PM', type: 'CSV Import', source: 'roster_update.csv', added: 8, updated: 0, removed: 0, status: 'partial', errors: 2 },
                ].map((sync, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        sync.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {sync.status === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{sync.type}</p>
                        <p className="text-sm text-gray-500">{sync.source} • {sync.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <span className="text-green-600">+{sync.added}</span>
                        {' / '}
                        <span className="text-blue-600">~{sync.updated}</span>
                        {' / '}
                        <span className="text-red-600">-{sync.removed}</span>
                        {sync.errors && <span className="text-yellow-600"> ({sync.errors} errors)</span>}
                      </div>
                      <Button variant="ghost" size="sm">Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* CSV Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportStep(1); setImportData(null); setImportError(null); }}
        title="Import Students from CSV"
        size="lg"
      >
        {importStep === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {importUploading ? (
                <>
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="font-medium">Uploading and processing file...</p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-2">Drop your CSV file here or click to browse</p>
                  <p className="text-sm text-gray-500 mb-4">Supports .csv and .xlsx files</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="primary" className="cursor-pointer" onClick={() => document.getElementById('file-upload').click()}>
                      Select File
                    </Button>
                  </label>
                </>
              )}
            </div>

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {importError}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Required Columns</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <code>student_id</code>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <code>first_name</code>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <code>last_name</code>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <code>grade</code>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <code>teacher_homeroom</code>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <code>dismissal_type</code>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-3">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {importStep === 2 && importData && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium">{importData.fileName}</p>
                <p className="text-sm text-gray-500">
                  {importData.validRows} valid rows • {importData.errors?.length || 0} errors
                </p>
              </div>
            </div>

            {importData.errors && importData.errors.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">Validation Errors</h3>
                <div className="space-y-1 text-sm">
                  {importData.errors.map((error, i) => (
                    <p key={i} className="text-yellow-700">
                      Row {error.row}: {error.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {importData.preview && (
              <div>
                <h3 className="font-medium mb-2">Preview (first {importData.preview.length} rows)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Grade</th>
                        <th className="px-3 py-2 text-left">Teacher</th>
                        <th className="px-3 py-2 text-left">Dismissal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importData.preview.map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{row.student_id}</td>
                          <td className="px-3 py-2">{row.first_name} {row.last_name}</td>
                          <td className="px-3 py-2">{row.grade}</td>
                          <td className="px-3 py-2">{row.teacher}</td>
                          <td className="px-3 py-2">{row.dismissal_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {importError}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setImportStep(1); setImportData(null); setImportError(null); }}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleConfirmImport} disabled={saving}>
                {saving ? 'Importing...' : `Import ${importData.validRows} Students`}
              </Button>
            </div>
          </div>
        )}

        {importStep === 3 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <p className="text-gray-500 mb-6">
              Successfully imported {importData?.validRows} students.
            </p>
            <Button variant="primary" onClick={() => { setShowImportModal(false); setImportStep(1); setImportData(null); }}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* SIS Integration Modal (mock - no real SIS APIs yet) */}
      <Modal isOpen={showSISModal} onClose={() => setShowSISModal(false)} title="SIS Integration" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your Student Information System to automatically sync student rosters,
            parent contacts, and class assignments.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {sisConnections.map(sis => (
              <div
                key={sis.id}
                className={`p-4 border-2 rounded-lg ${
                  sis.connected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sis.icon}</span>
                    <span className="font-medium">{sis.name}</span>
                  </div>
                  {sis.connected && <Badge variant="green" size="sm">Connected</Badge>}
                </div>
                {sis.connected ? (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      Last sync: {sis.lastSync?.toLocaleTimeString()}
                    </span>
                    <Button variant="secondary" size="sm">Configure</Button>
                  </div>
                ) : (
                  <Button variant="primary" size="sm" className="w-full mt-2">
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Auto-Sync Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Daily automatic sync</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Sync parent contacts</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Sync bus routes</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Student">
        <form className="space-y-4" onSubmit={handleAddStudent}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="Emma"
                value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="Thompson"
                value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="STU001"
                value={addForm.studentId} onChange={e => setAddForm(f => ({ ...f, studentId: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select className="w-full p-2 border rounded-lg"
                value={addForm.grade} onChange={e => setAddForm(f => ({ ...f, grade: e.target.value }))}>
                {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homeroom Teacher</label>
            <select className="w-full p-2 border rounded-lg"
              value={addForm.teacher} onChange={e => setAddForm(f => ({ ...f, teacher: e.target.value }))}>
              <option>Mrs. Johnson</option>
              <option>Mr. Roberts</option>
              <option>Mrs. Davis</option>
              <option>Mrs. Clark</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dismissal Type</label>
              <select className="w-full p-2 border rounded-lg"
                value={addForm.dismissalType} onChange={e => setAddForm(f => ({ ...f, dismissalType: e.target.value }))}>
                <option value="car">Car Rider</option>
                <option value="bus">Bus Rider</option>
                <option value="walker">Walker</option>
                <option value="afterschool">After School</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus # (if applicable)</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="42"
                value={addForm.busRoute} onChange={e => setAddForm(f => ({ ...f, busRoute: e.target.value }))} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                <input type="text" className="w-full p-2 border rounded-lg" placeholder="Sarah Thompson"
                  value={addForm.parentName} onChange={e => setAddForm(f => ({ ...f, parentName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select className="w-full p-2 border rounded-lg"
                  value={addForm.parentRelationship} onChange={e => setAddForm(f => ({ ...f, parentRelationship: e.target.value }))}>
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Guardian</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" className="w-full p-2 border rounded-lg" placeholder="555-0101"
                  value={addForm.parentPhone} onChange={e => setAddForm(f => ({ ...f, parentPhone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full p-2 border rounded-lg" placeholder="sarah@email.com"
                  value={addForm.parentEmail} onChange={e => setAddForm(f => ({ ...f, parentEmail: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} title="Edit Student">
        {showEditModal && (
          <form className="space-y-4" onSubmit={handleEditStudent}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select className="w-full p-2 border rounded-lg"
                  value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))}>
                  {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Homeroom Teacher</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={editForm.teacher} onChange={e => setEditForm(f => ({ ...f, teacher: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dismissal Type</label>
                <select className="w-full p-2 border rounded-lg"
                  value={editForm.dismissalType} onChange={e => setEditForm(f => ({ ...f, dismissalType: e.target.value }))}>
                  <option value="car">Car Rider</option>
                  <option value="bus">Bus Rider</option>
                  <option value="walker">Walker</option>
                  <option value="afterschool">After School</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bus #</label>
                <input type="text" className="w-full p-2 border rounded-lg"
                  value={editForm.busRoute} onChange={e => setEditForm(f => ({ ...f, busRoute: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={!!showStudentDetail}
        onClose={() => setShowStudentDetail(null)}
        title="Student Details"
        size="lg"
      >
        {showStudentDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-bold">
                {showStudentDetail.firstName[0]}{showStudentDetail.lastName[0]}
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {showStudentDetail.firstName} {showStudentDetail.lastName}
                </h3>
                <p className="text-gray-500">ID: {showStudentDetail.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium">{showStudentDetail.grade}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Teacher</p>
                <p className="font-medium">{showStudentDetail.teacher}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Dismissal Type</p>
                <p className="font-medium capitalize">{showStudentDetail.dismissalType}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Bus #</p>
                <p className="font-medium">{showStudentDetail.busRoute || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Parents/Guardians</h3>
              <div className="space-y-2">
                {(showStudentDetail.parents || []).map((parent, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{parent.name}</p>
                      <p className="text-sm text-gray-500">{parent.relationship} • {parent.phone}</p>
                      <p className="text-sm text-gray-500">{parent.email}</p>
                    </div>
                    <Badge variant="green" size="sm">Primary</Badge>
                  </div>
                ))}
                {(!showStudentDetail.parents || showStudentDetail.parents.length === 0) && (
                  <p className="text-sm text-gray-500">No linked parents.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowStudentDetail(null); openEditModal(showStudentDetail); }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Student
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDeleteStudent(showStudentDetail)} disabled={saving}>
                <Trash2 className="w-4 h-4 mr-2" />
                {saving ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
