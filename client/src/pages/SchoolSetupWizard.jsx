import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Check, X, Users, School, Bus, Car, PersonStanding,
  Plus, Trash2, Edit, ChevronRight, ChevronDown, Search,
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Mail, Download, RefreshCw, Settings, UserPlus, Clock, Save, Briefcase, Eye, EyeOff, Lock, Pencil, QrCode, Printer
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { createSchool, getSchool, updateSchool, getSchoolSettings, updateSchoolSettings } from '../api/schools';
import { getStudents, createStudent, updateStudent, deleteStudent, importCSV, bulkUpdateStudents, getFamilyGroups, createFamilyGroup, updateFamilyGroup, deleteFamilyGroup, addStudentsToGroup, removeStudentFromGroup, autoAssignFamilyGroups, sendToAppMode, getDismissalMode, switchToNoAppMode } from '../api/students';
import { getHomerooms, createHomeroom, deleteHomeroom, assignStudents } from '../api/homerooms';
import * as googleApi from '../api/google';
import * as staffApi from '../api/staff';
import { QRCodeSVG } from 'qrcode.react';

// Google Logo SVG
const GoogleLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Normalize snake_case API data to camelCase for frontend
const normalizeStudent = (s) => ({
  ...s,
  firstName: s.first_name || s.firstName || '',
  lastName: s.last_name || s.lastName || '',
  dismissalType: s.dismissal_type || s.dismissalType || 'car',
  busRoute: s.bus_route || s.busRoute || '',
  homeroom: s.homeroom_id || s.homeroom || null,
  externalId: s.external_id || s.externalId || '',
});

const GRADES = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
const PAGE_SIZE = 30;

const tabs = [
  { id: 'staff', label: 'Staff', icon: Briefcase },
  { id: 'roster', label: 'Student Roster', icon: Users },
  { id: 'homerooms', label: 'Create Homerooms', icon: School },
  { id: 'assign', label: 'Assign Students', icon: UserPlus },
  { id: 'bus-assignments', label: 'Bus Assignments', icon: Bus },
  { id: 'dismissal', label: 'Set Dismissal', icon: Car },
  { id: 'car-numbers', label: 'Car Numbers', icon: Car },
  { id: 'parents', label: 'Parents', icon: UserPlus },
  { id: 'review', label: 'Review & Launch', icon: CheckCircle2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function SchoolSetupWizard() {
  const navigate = useNavigate();
  const { currentSchool } = useSchool();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('staff');
  const [students, setStudents] = useState([]);
  const [homerooms, setHomerooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingIds, setSavingIds] = useState(new Set());

  const [googleConnected, setGoogleConnected] = useState(false);

  const [showCreateSchool, setShowCreateSchool] = useState(!currentSchool);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [creatingSchool, setCreatingSchool] = useState(false);

  const schoolId = currentSchool?.id;
  const schoolName = currentSchool?.name || '';

  // Fetch data on mount
  useEffect(() => {
    if (!schoolId) { setShowCreateSchool(true); return; }
    setShowCreateSchool(false);
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [studentsRes, homeroomsRes, staffRes] = await Promise.all([
          getStudents(schoolId),
          getHomerooms(schoolId),
          staffApi.getStaff(schoolId).catch(() => ({ data: [] })),
        ]);
        setStudents((studentsRes.data || []).map(normalizeStudent));
        setHomerooms(homeroomsRes.data || []);
        setStaff(staffRes.data || []);
        // Check Google Classroom connection status
        try {
          const gRes = await googleApi.getStatus(schoolId);
          setGoogleConnected(gRes.data.connected);
        } catch { /* ignore */ }
      } catch (err) {
        console.error('Failed to load school data:', err);
        setError('Failed to load school data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolId]);

  // Create school handler
  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    setCreatingSchool(true);
    setError(null);
    try {
      await createSchool({ name: newSchoolName.trim() });
      window.location.reload();
    } catch (err) {
      console.error('Failed to create school:', err);
      setError('Failed to create school. Please try again.');
      setCreatingSchool(false);
    }
  };

  // Student CRUD
  const handleAddStudent = async (data) => {
    setError(null);
    try {
      const res = await createStudent(schoolId, data);
      setStudents(prev => [...prev, normalizeStudent(res.data)]);
    } catch (err) {
      console.error('Failed to add student:', err);
      setError('Failed to add student.');
    }
  };

  const handleUpdateStudent = async (id, data) => {
    setError(null);
    setSavingIds(prev => new Set(prev).add(id));
    try {
      await updateStudent(id, data);
      const studentsRes = await getStudents(schoolId);
      setStudents((studentsRes.data || []).map(normalizeStudent));
    } catch (err) {
      console.error('Failed to update student:', err);
      setError('Failed to update student.');
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleDeleteStudent = async (id) => {
    setError(null);
    try {
      await deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete student:', err);
      setError('Failed to delete student.');
    }
  };

  const handleBulkDelete = async (ids) => {
    setError(null);
    try {
      await Promise.all(ids.map(id => deleteStudent(id)));
      setStudents(prev => prev.filter(s => !ids.includes(s.id)));
    } catch (err) {
      console.error('Failed to delete students:', err);
      setError('Failed to delete some students.');
    }
  };

  const refreshStudents = async () => {
    const studentsRes = await getStudents(schoolId);
    setStudents((studentsRes.data || []).map(normalizeStudent));
  };

  const handleImportCSV = async (file) => {
    setError(null);
    try {
      await importCSV(schoolId, file);
      await refreshStudents();
    } catch (err) {
      console.error('CSV import failed:', err);
      setError('Failed to import CSV. Please check the file format.');
    }
  };

  // Homeroom CRUD
  const handleAddHomeroom = async (name, teacher, grade, teacherIdVal) => {
    setError(null);
    try {
      const res = await createHomeroom(schoolId, { name, grade, teacherId: teacherIdVal || null });
      setHomerooms(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to create homeroom:', err);
      setError('Failed to create homeroom.');
    }
  };

  const handleRemoveHomeroom = async (id) => {
    setError(null);
    try {
      await deleteHomeroom(id);
      setHomerooms(prev => prev.filter(h => h.id !== id));
      setStudents(prev => prev.map(s => s.homeroom === id ? { ...s, homeroom: null } : s));
    } catch (err) {
      console.error('Failed to delete homeroom:', err);
      setError('Failed to delete homeroom.');
    }
  };

  // Assignment
  const handleAssignStudent = async (studentId, homeroomId) => {
    setError(null);
    try {
      if (homeroomId) {
        await assignStudents(homeroomId, [studentId]);
      } else {
        await updateStudent(studentId, { homeroom_id: null });
      }
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, homeroom: homeroomId } : s));
    } catch (err) {
      console.error('Failed to assign student:', err);
      setError('Failed to assign student.');
    }
  };

  // Dismissal
  const handleUpdateDismissal = async (studentId, field, value) => {
    setError(null);
    setSavingIds(prev => new Set(prev).add(studentId));
    const fieldMap = { dismissalType: 'dismissal_type', busRoute: 'bus_route' };
    const apiField = fieldMap[field] || field;
    try {
      const payload = { [apiField]: value };
      // Clear bus_route when changing away from bus
      if (field === 'dismissalType' && value !== 'bus') {
        payload.bus_route = null;
      }
      await updateStudent(studentId, payload);
      setStudents(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        const updated = { ...s, [field]: value };
        if (field === 'dismissalType' && value !== 'bus') updated.busRoute = '';
        return updated;
      }));
    } catch (err) {
      console.error('Failed to update dismissal:', err);
      setError('Failed to update dismissal.');
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(studentId); return n; });
    }
  };

  const handleBulkSetDismissal = async (type) => {
    setError(null);
    try {
      const updates = students.map(s => ({
        id: s.id,
        dismissal_type: type,
        bus_route: type === 'bus' ? (s.busRoute || null) : null,
      }));
      await bulkUpdateStudents(schoolId, updates);
      setStudents(prev => prev.map(s => ({
        ...s,
        dismissalType: type,
        busRoute: type === 'bus' ? s.busRoute : '',
      })));
    } catch (err) {
      console.error('Failed to bulk update:', err);
      setError('Failed to update some students.');
    }
  };

  // No school
  if (showCreateSchool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GoPilot</h1>
          <p className="text-gray-500 mb-6">Your school is pending approval. You will receive an email once your account has been approved.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading school data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">GoPilot Setup</h1>
              <p className="text-sm text-gray-500">{schoolName}</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {activeTab === 'staff' && (
          <StaffManager
            staff={staff}
            schoolId={schoolId}
            googleConnected={googleConnected}
            onAdd={async (data) => {
              const res = await staffApi.addStaff(schoolId, data);
              setStaff(prev => [...prev.filter(s => s.id !== res.data.id), res.data]);
            }}
            onRemove={async (userId) => {
              await staffApi.removeStaff(schoolId, userId);
              setStaff(prev => prev.filter(s => s.id !== userId));
            }}
            onUpdate={async (userId, data) => {
              await staffApi.updateStaff(schoolId, userId, data);
              const res = await staffApi.getStaff(schoolId);
              setStaff(res.data || []);
            }}
            onRefresh={async () => {
              const res = await staffApi.getStaff(schoolId);
              setStaff(res.data || []);
            }}
          />
        )}
        {activeTab === 'roster' && (
          <StudentRoster
            students={students}
            schoolId={schoolId}
            onImport={handleImportCSV}
            onRefresh={refreshStudents}
            onAdd={handleAddStudent}
            onUpdate={handleUpdateStudent}
            onDelete={handleDeleteStudent}
            onBulkDelete={handleBulkDelete}
            googleConnected={googleConnected}
          />
        )}
        {activeTab === 'homerooms' && (
          <HomeroomManager
            homerooms={homerooms}
            students={students}
            staff={staff}
            onAdd={handleAddHomeroom}
            onRemove={handleRemoveHomeroom}
          />
        )}
        {activeTab === 'assign' && (
          <AssignStudents
            students={students}
            homerooms={homerooms}
            onAssign={handleAssignStudent}
            schoolId={schoolId}
            googleConnected={googleConnected}
            setGoogleConnected={setGoogleConnected}
            onRefreshStudents={async () => {
              const res = await getStudents(schoolId);
              setStudents((res.data || []).map(normalizeStudent));
            }}
          />
        )}
        {activeTab === 'bus-assignments' && (
          <BusAssignments
            students={students}
            homerooms={homerooms}
            onUpdateStudents={async (updates) => {
              await bulkUpdateStudents(schoolId, updates);
              const res = await getStudents(schoolId);
              setStudents((res.data || []).map(normalizeStudent));
            }}
            onUpdateStudent={async (id, data) => {
              await updateStudent(id, data);
              setStudents(prev => prev.map(s => s.id === id ? { ...s, ...normalizeStudent({ ...s, ...data }) } : s));
            }}
          />
        )}
        {activeTab === 'dismissal' && (
          <DismissalConfig
            students={students}
            homerooms={homerooms}
            schoolId={schoolId}
            onUpdate={handleUpdateDismissal}
            onBulkSet={handleBulkSetDismissal}
          />
        )}
        {activeTab === 'review' && (
          <ReviewLaunch
            students={students}
            homerooms={homerooms}
            onLaunch={() => navigate('/dashboard')}
          />
        )}
        {activeTab === 'car-numbers' && (
          <CarNumbersTab schoolId={schoolId} students={students} />
        )}
        {activeTab === 'parents' && (
          <ParentsTab schoolId={schoolId} />
        )}
        {activeTab === 'settings' && (
          <SchoolSettingsTab schoolId={schoolId} />
        )}
      </main>
    </div>
  );
}

// ─── STAFF MANAGER TAB ──────────────────────────────────────────────

function StaffManager({ staff, schoolId, googleConnected, onAdd, onRemove, onUpdate, onRefresh }) {
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', firstName: '', lastName: '', role: 'teacher', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Workspace import state
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [wsOrgUnits, setWsOrgUnits] = useState([]);
  const [wsUsers, setWsUsers] = useState([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsSelectedOU, setWsSelectedOU] = useState(null);
  const [wsSelectedUsers, setWsSelectedUsers] = useState(new Set());
  const [wsImporting, setWsImporting] = useState(false);
  const [wsStep, setWsStep] = useState('orgunits');
  const [wsRole, setWsRole] = useState('teacher');

  const teachers = staff.filter(s => s.role === 'teacher');
  const officeStaff = staff.filter(s => s.role === 'office_staff');

  const filtered = roleFilter === 'All' ? staff
    : roleFilter === 'teacher' ? teachers
    : officeStaff;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.email || !addForm.firstName || !addForm.lastName) return;
    setAdding(true);
    setAddError(null);
    try {
      await onAdd(addForm);
      setAddForm({ email: '', firstName: '', lastName: '', role: 'teacher', password: '' });
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add staff');
    }
    setAdding(false);
  };

  const startEdit = (s) => {
    setEditingId(`${s.id}-${s.role}`);
    setEditData({ firstName: s.first_name, lastName: s.last_name, role: s.role });
    setEditPassword('');
    setShowEditPassword(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); setEditPassword(''); };

  const saveEdit = async (s) => {
    setSaving(true);
    try {
      await onUpdate(s.id, { ...editData, password: editPassword || undefined });
      setEditingId(null);
      setEditData({});
      setEditPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
    setSaving(false);
  };

  const openWorkspaceImport = async () => {
    setShowWorkspaceModal(true);
    setWsStep('orgunits');
    setWsLoading(true);
    try {
      const res = await googleApi.getOrgUnits(schoolId);
      setWsOrgUnits(res.data);
    } catch (err) {
      console.error(err);
      setWsOrgUnits([]);
    }
    setWsLoading(false);
  };

  const handleDrillIn = async (ou) => {
    setWsSelectedOU(ou);
    setWsStep('users');
    setWsLoading(true);
    try {
      const path = ou ? ou.orgUnitPath : '/';
      const res = await googleApi.getWorkspaceUsers(schoolId, path);
      const active = res.data.filter(u => !u.suspended);
      setWsUsers(active);
      setWsSelectedUsers(new Set(active.map(u => u.email)));
    } catch (err) { console.error(err); setWsUsers([]); }
    setWsLoading(false);
  };

  const handleWorkspaceImport = async () => {
    setWsImporting(true);
    try {
      const usersToImport = wsUsers
        .filter(u => wsSelectedUsers.has(u.email))
        .map(u => ({ email: u.email, firstName: u.firstName, lastName: u.lastName }));
      const res = await googleApi.importWorkspaceStaff(schoolId, usersToImport, wsRole);
      alert(`Imported ${res.data.imported} new, updated ${res.data.updated} existing.`);
      setShowWorkspaceModal(false);
      setWsUsers([]);
      setWsSelectedUsers(new Set());
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to import staff.');
    }
    setWsImporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-500 text-sm">Add teachers and office staff. They can log in with Google or email/password.</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
        {googleConnected ? (
          <button
            onClick={openWorkspaceImport}
            className="flex items-center gap-2 px-4 py-2 border border-green-200 bg-green-50 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
          >
            <GoogleLogo className="w-4 h-4" />
            Import from Google Workspace
          </button>
        ) : (
          <button
            onClick={async () => {
              try {
                const res = await googleApi.getAuthUrl(schoolId);
                window.location.href = res.data.url;
              } catch (err) { console.error(err); }
            }}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <GoogleLogo className="w-4 h-4" />
            Connect Google
          </button>
        )}
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Add Staff Member</h3>
          {addError && <p className="text-red-600 text-sm mb-2">{addError}</p>}
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="email" placeholder="Email *" required
                value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder="First Name *" required
                value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder="Last Name *" required
                value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="teacher">Teacher</option>
                <option value="office_staff">Office Staff</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (optional — for email login)"
                  value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm w-full pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Leave blank if teacher will use Google sign-in</p>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={adding}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[['All', staff.length], ['teacher', teachers.length], ['office_staff', officeStaff.length]].map(([r, count]) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${roleFilter === r ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {r === 'All' ? 'All' : r === 'teacher' ? 'Teachers' : 'Office Staff'} ({count})
          </button>
        ))}
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-xs uppercase">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Homeroom</th>
              <th className="p-3">Login</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No staff added yet. Click "Add Staff" to get started.</td></tr>
            ) : filtered.map(s => {
              const isEditing = editingId === `${s.id}-${s.role}`;
              return isEditing ? (
              <tr key={`${s.id}-${s.role}`} className="bg-blue-50">
                <td className="p-3">
                  <div className="flex gap-1">
                    <input type="text" value={editData.firstName} onChange={e => setEditData(d => ({ ...d, firstName: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-24" placeholder="First" />
                    <input type="text" value={editData.lastName} onChange={e => setEditData(d => ({ ...d, lastName: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-24" placeholder="Last" />
                  </div>
                </td>
                <td className="p-3 text-gray-500 text-sm">{s.email}</td>
                <td className="p-3">
                  <select value={editData.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                    className="border rounded px-2 py-1 text-sm">
                    <option value="teacher">Teacher</option>
                    <option value="office_staff">Office Staff</option>
                  </select>
                </td>
                <td className="p-3" colSpan={2}>
                  <div className="relative">
                    <input type={showEditPassword ? 'text' : 'password'} value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="New password (optional)"
                      className="border rounded px-2 py-1 text-sm w-full pr-8" />
                    <button type="button" onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => saveEdit(s)} disabled={saving}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              ) : (
              <tr key={`${s.id}-${s.role}`} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                      {(s.first_name || '?')[0]}{(s.last_name || '?')[0]}
                    </div>
                    <span className="font-medium">{s.first_name} {s.last_name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-500">{s.email}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {s.role === 'teacher' ? 'Teacher' : 'Office Staff'}
                  </span>
                </td>
                <td className="p-3 text-gray-500">
                  {s.homeroom_name ? `${s.homeroom_name} (Gr ${s.homeroom_grade})` : '—'}
                </td>
                <td className="p-3">
                  <span className="text-xs text-gray-400">Google / Password</span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => startEdit(s)} className="text-gray-400 hover:text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onRemove(s.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Workspace Import Modal for Staff */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <GoogleLogo className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Import Staff from Google Workspace</h3>
              </div>
              <button onClick={() => { setShowWorkspaceModal(false); setWsUsers([]); setWsOrgUnits([]); setWsSelectedUsers(new Set()); }}
                className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {wsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading...</span>
                </div>
              ) : wsStep === 'orgunits' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Select an org unit to import staff from.</p>
                  <div className="border rounded-lg divide-y">
                    {wsOrgUnits.map(ou => (
                      <button
                        key={ou.orgUnitPath}
                        onClick={() => handleDrillIn(ou)}
                        className="w-full text-left p-3 hover:bg-blue-50 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm font-medium">{ou.name}</span>
                          <p className="text-xs text-gray-500">{ou.orgUnitPath}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                    <button
                      onClick={() => handleDrillIn(null)}
                      className="w-full text-left p-3 hover:bg-blue-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-sm font-medium">/ (All Users)</span>
                        <p className="text-xs text-gray-500">Browse all domain users</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => { setWsStep('orgunits'); setWsUsers([]); setWsSelectedUsers(new Set()); }}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3">
                    <ArrowLeft className="w-4 h-4" /> Back to org units
                  </button>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600">
                      {wsSelectedOU ? `Users in ${wsSelectedOU.name}` : 'All domain users'} — {wsUsers.length} found, {wsSelectedUsers.size} selected
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Import as:</label>
                      <select value={wsRole} onChange={e => setWsRole(e.target.value)} className="border rounded px-2 py-1 text-sm">
                        <option value="teacher">Teacher</option>
                        <option value="office_staff">Office Staff</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2 px-3">
                    <input type="checkbox"
                      checked={wsSelectedUsers.size === wsUsers.length && wsUsers.length > 0}
                      onChange={e => {
                        if (e.target.checked) setWsSelectedUsers(new Set(wsUsers.map(u => u.email)));
                        else setWsSelectedUsers(new Set());
                      }}
                    />
                    <span className="text-xs text-gray-500 font-medium">Select all</span>
                  </div>
                  <div className="border rounded-lg divide-y max-h-[40vh] overflow-auto">
                    {wsUsers.map(u => (
                      <label key={u.email} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox"
                          checked={wsSelectedUsers.has(u.email)}
                          onChange={e => {
                            const next = new Set(wsSelectedUsers);
                            if (e.target.checked) next.add(u.email); else next.delete(u.email);
                            setWsSelectedUsers(next);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </label>
                    ))}
                    {wsUsers.length === 0 && (
                      <p className="text-sm text-gray-500 py-8 text-center">No users found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {wsStep === 'users' && wsUsers.length > 0 && (
              <div className="border-t p-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">{wsSelectedUsers.size} selected</p>
                <button
                  disabled={wsSelectedUsers.size === 0 || wsImporting}
                  onClick={handleWorkspaceImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {wsImporting ? 'Importing...' : `Import ${wsSelectedUsers.size} as ${wsRole === 'teacher' ? 'Teachers' : 'Office Staff'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STUDENT ROSTER TAB ──────────────────────────────────────────────

function StudentRoster({ students, schoolId, onImport, onRefresh, onAdd, onUpdate, onDelete, onBulkDelete, googleConnected }) {
  const { currentSchool } = useSchool();
  const [gradeFilter, setGradeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [bulkGrade, setBulkGrade] = useState('');
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [wsOrgUnits, setWsOrgUnits] = useState([]);
  const [wsUsers, setWsUsers] = useState([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsSelectedOU, setWsSelectedOU] = useState(null);
  const [wsSelectedUsers, setWsSelectedUsers] = useState(new Set());
  const [wsGradeMap, setWsGradeMap] = useState({}); // { orgUnitPath: grade } or { _default: grade }
  const [wsCheckedOUs, setWsCheckedOUs] = useState(new Set()); // checked org unit paths for bulk import
  const [wsImporting, setWsImporting] = useState(false);
  const [wsStep, setWsStep] = useState('orgunits'); // 'orgunits' | 'users'
  const [showQrPrint, setShowQrPrint] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState({});
  const fileInputRef = useRef(null);

  // Load school settings for QR toggle
  useEffect(() => {
    if (!schoolId) return;
    getSchoolSettings(schoolId).then(r => setSchoolSettings(r.data || {})).catch(() => {});
  }, [schoolId]);

  // Get unique grades from students
  const studentGrades = [...new Set(students.map(s => s.grade || 'Unknown'))].sort((a, b) => {
    const order = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', 'Unknown'];
    return order.indexOf(String(a)) - order.indexOf(String(b));
  });

  // Filter students
  const filtered = students.filter(s => {
    const matchGrade = gradeFilter === 'All' || String(s.grade) === gradeFilter;
    const matchSearch = !searchTerm ||
      `${s.firstName} ${s.lastName} ${s.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGrade && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [gradeFilter, searchTerm]);

  // Grade counts
  const gradeCounts = {};
  students.forEach(s => {
    const g = String(s.grade || 'Unknown');
    gradeCounts[g] = (gradeCounts[g] || 0) + 1;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    await onImport(file);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csv = 'First Name,Last Name,Grade,Email,Dismissal Type,Bus #,Student ID\nJane,Doe,3,jane@school.edu,car,,\nJohn,Smith,4,john@school.edu,bus,12,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gopilot_student_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map(s => s.id)));
    }
  };

  const startEdit = (student) => {
    setEditingId(student.id);
    setEditData({
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email || '',
      grade: student.grade || '',
      dismissal_type: student.dismissalType || 'car',
      bus_route: student.busRoute || '',
    });
  };

  const saveEdit = async () => {
    await onUpdate(editingId, editData);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Import Bar */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isImporting ? 'Importing...' : 'Upload CSV'}
        </button>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Download Template
        </button>
        {schoolSettings.enableQrCodes && (
          <button onClick={() => setShowQrPrint(true)} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
            <QrCode className="w-4 h-4" />
            Print QR Codes
          </button>
        )}
        {googleConnected ? (
          <button
            onClick={async () => {
              setShowWorkspaceModal(true);
              setWsStep('orgunits');
              setWsLoading(true);
              try {
                const res = await googleApi.getOrgUnits(schoolId);
                setWsOrgUnits(res.data);
              } catch (err) {
                console.error('Failed to load org units:', err);
                setWsOrgUnits([]);
              }
              setWsLoading(false);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-green-200 bg-green-50 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
          >
            <GoogleLogo className="w-4 h-4" />
            Import from Google Workspace
          </button>
        ) : (
          <button
            onClick={async () => {
              try {
                const res = await googleApi.getAuthUrl(schoolId);
                window.location.href = res.data.url;
              } catch (err) { console.error(err); }
            }}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <GoogleLogo className="w-4 h-4" />
            Connect Google
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <AddStudentForm
          onAdd={onAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Grade Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setGradeFilter('All')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${gradeFilter === 'All' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All ({students.length})
          </button>
          {studentGrades.map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${gradeFilter === g ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {g === 'Unknown' ? 'No Grade' : `Gr ${g}`} ({gradeCounts[g] || 0})
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <select value={bulkGrade} onChange={e => setBulkGrade(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm">
              <option value="">Assign grade...</option>
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <button
              disabled={!bulkGrade}
              onClick={async () => {
                await Promise.all([...selectedIds].map(id => onUpdate(id, { grade: bulkGrade })));
                setSelectedIds(new Set());
                setBulkGrade('');
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              Assign Grade
            </button>
          </div>
          <button
            onClick={() => { onBulkDelete([...selectedIds]); setSelectedIds(new Set()); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" /> Delete Selected
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700">
            Clear Selection
          </button>
        </div>
      )}

      {/* Student Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selectedIds.size === paged.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left p-3 font-medium text-gray-600">Name</th>
              <th className="text-left p-3 font-medium text-gray-600">Email</th>
              <th className="text-left p-3 font-medium text-gray-600">Grade</th>
              <th className="text-left p-3 font-medium text-gray-600">Dismissal</th>
              <th className="text-right p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No students found</p>
                  <p className="text-sm">Import students via CSV or add them manually</p>
                </td>
              </tr>
            ) : (
              paged.map(student => (
                editingId === student.id ? (
                  <tr key={student.id} className="bg-yellow-50">
                    <td className="p-3"></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <input value={editData.first_name} onChange={e => setEditData(d => ({ ...d, first_name: e.target.value }))}
                          className="border rounded px-2 py-1 w-24" placeholder="First" />
                        <input value={editData.last_name} onChange={e => setEditData(d => ({ ...d, last_name: e.target.value }))}
                          className="border rounded px-2 py-1 w-24" placeholder="Last" />
                      </div>
                    </td>
                    <td className="p-3">
                      <input value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                        className="border rounded px-2 py-1 w-full" placeholder="Email" />
                    </td>
                    <td className="p-3">
                      <select value={editData.grade} onChange={e => setEditData(d => ({ ...d, grade: e.target.value }))}
                        className="border rounded px-2 py-1">
                        <option value="">--</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <select value={editData.dismissal_type} onChange={e => setEditData(d => ({ ...d, dismissal_type: e.target.value }))}
                        className="border rounded px-2 py-1">
                        <option value="car">Car</option>
                        <option value="bus">Bus</option>
                        <option value="walker">Walker</option>
                        <option value="afterschool">After School</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-800 mr-2"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                          {(student.firstName || '?')[0]}{(student.lastName || '?')[0]}
                        </div>
                        <span className="font-medium">{student.firstName} {student.lastName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500">{student.email || '—'}</td>
                    <td className="p-3">{student.grade || '—'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {student.dismissalType || 'car'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => startEdit(student)} className="text-gray-400 hover:text-indigo-600 mr-2">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(student.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-white">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded text-sm ${page === p ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-white'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-white">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Google Workspace Import Modal */}
      {showWorkspaceModal && (
        <WorkspaceImportModal
          schoolId={schoolId}
          wsOrgUnits={wsOrgUnits}
          wsUsers={wsUsers}
          wsLoading={wsLoading}
          wsSelectedOU={wsSelectedOU}
          wsSelectedUsers={wsSelectedUsers}
          wsGradeMap={wsGradeMap}
          wsCheckedOUs={wsCheckedOUs}
          wsImporting={wsImporting}
          wsStep={wsStep}
          setWsOrgUnits={setWsOrgUnits}
          setWsUsers={setWsUsers}
          setWsLoading={setWsLoading}
          setWsSelectedOU={setWsSelectedOU}
          setWsSelectedUsers={setWsSelectedUsers}
          setWsGradeMap={setWsGradeMap}
          setWsCheckedOUs={setWsCheckedOUs}
          setWsImporting={setWsImporting}
          setWsStep={setWsStep}
          onClose={() => {
            setShowWorkspaceModal(false);
            setWsUsers([]);
            setWsOrgUnits([]);
            setWsSelectedUsers(new Set());
            setWsCheckedOUs(new Set());
            setWsGradeMap({});
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* QR Code Print Modal */}
      {showQrPrint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b print:hidden">
              <h3 className="text-lg font-bold">QR Codes — Student Linking</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button onClick={() => setShowQrPrint(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3">
              {(selectedIds.size > 0 ? students.filter(s => selectedIds.has(s.id)) : students).map(student => (
                <div key={student.id} className="border rounded-lg p-4 text-center break-inside-avoid">
                  <QRCodeSVG
                    value={`${window.location.origin}/link?school=${currentSchool?.slug || ''}&code=${student.student_code}`}
                    size={120}
                    className="mx-auto mb-2"
                  />
                  <p className="font-bold text-sm">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-gray-500">
                    {student.grade ? `Grade ${student.grade}` : ''}{student.grade && student.homeroom_name ? ' • ' : ''}{student.homeroom_name || ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{student.student_code}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GRADE AUTO-DETECTION ────────────────────────────────────────────

function detectGradeFromName(name) {
  if (!name) return '';
  const n = name.toLowerCase().trim();
  if (/pre[\s-]?k|pre[\s-]?kindergarten/i.test(n)) return 'Pre-K';
  if (/^kindergarten$|^kinder$/i.test(n) || /\bkindergarten\b|\bkinder\b/i.test(n)) return 'K';
  const gradeMatch = n.match(/(?:grade|gr\.?)\s*(\d+)/i);
  if (gradeMatch) return gradeMatch[1];
  const ordinalMatch = n.match(/(\d+)(?:st|nd|rd|th)\s*(?:grade)?/i);
  if (ordinalMatch) return ordinalMatch[1];
  const numOnly = n.match(/^(\d+)$/);
  if (numOnly && parseInt(numOnly[1]) <= 12) return numOnly[1];
  return '';
}

// ─── WORKSPACE IMPORT MODAL ─────────────────────────────────────────

function WorkspaceImportModal({
  schoolId, wsOrgUnits, wsUsers, wsLoading, wsSelectedOU, wsSelectedUsers,
  wsGradeMap, wsCheckedOUs, wsImporting, wsStep,
  setWsOrgUnits, setWsUsers, setWsLoading, setWsSelectedOU, setWsSelectedUsers,
  setWsGradeMap, setWsCheckedOUs, setWsImporting, setWsStep,
  onClose, onRefresh,
}) {
  // Auto-detect grades when org units load
  useEffect(() => {
    if (wsOrgUnits.length > 0 && Object.keys(wsGradeMap).length === 0) {
      const autoMap = {};
      wsOrgUnits.forEach(ou => {
        const detected = detectGradeFromName(ou.name);
        if (detected) autoMap[ou.orgUnitPath] = detected;
      });
      setWsGradeMap(autoMap);
    }
  }, [wsOrgUnits]);

  const handleBulkImport = async () => {
    const selected = [...wsCheckedOUs].map(path => ({
      orgUnitPath: path,
      grade: wsGradeMap[path] || null,
    }));
    if (selected.length === 0) return;

    setWsImporting(true);
    try {
      const res = await googleApi.importWorkspaceOrgUnits(schoolId, selected);
      const details = res.data.details || [];
      const summary = details.map(d => `${d.orgUnitPath}: ${d.imported} new, ${d.updated} updated`).join('\n');
      alert(`Imported ${res.data.imported} new students, updated ${res.data.updated} existing.\n\n${summary}`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to import. Make sure your Google account has admin access.');
    }
    setWsImporting(false);
  };

  const handleDrillIn = async (ou) => {
    setWsSelectedOU(ou);
    setWsStep('users');
    setWsLoading(true);
    try {
      const path = ou ? ou.orgUnitPath : '/';
      const res = await googleApi.getWorkspaceUsers(schoolId, path);
      const active = res.data.filter(u => !u.suspended);
      setWsUsers(active);
      setWsSelectedUsers(new Set(active.map(u => u.email)));
    } catch (err) { console.error(err); setWsUsers([]); }
    setWsLoading(false);
  };

  const handleSingleImport = async () => {
    setWsImporting(true);
    try {
      const usersToImport = wsUsers
        .filter(u => wsSelectedUsers.has(u.email))
        .map(u => ({
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          grade: wsGradeMap['_default'] || null,
          orgUnitPath: u.orgUnitPath,
        }));
      const res = await googleApi.importWorkspaceUsers(schoolId, usersToImport);
      alert(`Imported ${res.data.imported} new students, updated ${res.data.updated} existing.`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to import. Make sure your Google account has admin access.');
    }
    setWsImporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <GoogleLogo className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Import from Google Workspace</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {wsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : wsStep === 'orgunits' ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Select org units to import, or click the arrow to pick individual users. Grades are auto-detected from names.
              </p>
              <div className="border rounded-lg divide-y">
                {wsOrgUnits.map(ou => (
                  <div key={ou.orgUnitPath} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={wsCheckedOUs.has(ou.orgUnitPath)}
                      onChange={e => {
                        const next = new Set(wsCheckedOUs);
                        if (e.target.checked) next.add(ou.orgUnitPath); else next.delete(ou.orgUnitPath);
                        setWsCheckedOUs(next);
                      }}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ou.name}</p>
                      <p className="text-xs text-gray-500">{ou.orgUnitPath}</p>
                    </div>
                    <select
                      value={wsGradeMap[ou.orgUnitPath] || ''}
                      onChange={e => setWsGradeMap(prev => ({ ...prev, [ou.orgUnitPath]: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-24"
                    >
                      <option value="">No grade</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button
                      onClick={() => handleDrillIn(ou)}
                      className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"
                      title="View individual users"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {wsOrgUnits.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">No organizational units found.</p>
                    <button
                      onClick={() => handleDrillIn(null)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Browse all domain users instead
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => { setWsStep('orgunits'); setWsUsers([]); setWsSelectedUsers(new Set()); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3">
                <ArrowLeft className="w-4 h-4" /> Back to org units
              </button>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  {wsSelectedOU ? `Users in ${wsSelectedOU.name}` : 'All domain users'} — {wsUsers.length} found, {wsSelectedUsers.size} selected
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Assign grade:</label>
                  <select
                    value={wsGradeMap['_default'] || ''}
                    onChange={e => setWsGradeMap(prev => ({ ...prev, _default: e.target.value }))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="">No grade</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 px-3">
                <input type="checkbox"
                  checked={wsSelectedUsers.size === wsUsers.length && wsUsers.length > 0}
                  onChange={e => {
                    if (e.target.checked) setWsSelectedUsers(new Set(wsUsers.map(u => u.email)));
                    else setWsSelectedUsers(new Set());
                  }}
                />
                <span className="text-xs text-gray-500 font-medium">Select all</span>
              </div>
              <div className="border rounded-lg divide-y max-h-[40vh] overflow-auto">
                {wsUsers.map(u => (
                  <label key={u.email} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox"
                      checked={wsSelectedUsers.has(u.email)}
                      onChange={e => {
                        const next = new Set(wsSelectedUsers);
                        if (e.target.checked) next.add(u.email); else next.delete(u.email);
                        setWsSelectedUsers(next);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{u.orgUnitPath}</span>
                  </label>
                ))}
                {wsUsers.length === 0 && (
                  <p className="text-sm text-gray-500 py-8 text-center">No users found in this org unit.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {wsStep === 'orgunits' && wsCheckedOUs.size > 0 && (
          <div className="border-t p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">{wsCheckedOUs.size} org unit{wsCheckedOUs.size !== 1 ? 's' : ''} selected</p>
            <button
              disabled={wsImporting}
              onClick={handleBulkImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {wsImporting ? 'Importing...' : `Import All from ${wsCheckedOUs.size} Org Unit${wsCheckedOUs.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {wsStep === 'users' && wsUsers.length > 0 && (
          <div className="border-t p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">{wsSelectedUsers.size} user{wsSelectedUsers.size !== 1 ? 's' : ''} selected</p>
            <button
              disabled={wsSelectedUsers.size === 0 || wsImporting}
              onClick={handleSingleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {wsImporting ? 'Importing...' : `Import ${wsSelectedUsers.size} Students`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADD STUDENT FORM ────────────────────────────────────────────────

function AddStudentForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', grade: '', dismissal_type: 'car', bus_route: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    await onAdd(form);
    setForm({ first_name: '', last_name: '', email: '', grade: '', dismissal_type: 'car', bus_route: '' });
    onClose();
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
          <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm w-36" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
          <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm w-36" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm w-48" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
          <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">--</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Dismissal</label>
          <select value={form.dismissal_type} onChange={e => setForm(f => ({ ...f, dismissal_type: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="car">Car</option>
            <option value="bus">Bus</option>
            <option value="walker">Walker</option>
            <option value="afterschool">After School</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          Add
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </form>
    </div>
  );
}

// ─── HOMEROOM MANAGER TAB ────────────────────────────────────────────

function HomeroomManager({ homerooms, students, staff, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [grade, setGrade] = useState('K');

  const teachers = (staff || []).filter(s => s.role === 'teacher');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = teacherId
      ? teachers.find(t => t.id === Number(teacherId))?.first_name + ' ' + teachers.find(t => t.id === Number(teacherId))?.last_name
      : teacherName.trim();
    if (!name) return;
    onAdd(`${name} - Grade ${grade}`, name, grade, teacherId ? Number(teacherId) : null);
    setTeacherId('');
    setTeacherName('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Create Homerooms</h2>
          <p className="text-gray-500 text-sm">Add homeroom classes. Students will be assigned in the next tab.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Homeroom
        </button>
      </div>

      {/* Quick Add */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm text-gray-600 mb-3">Quick add by grade:</p>
        <div className="flex flex-wrap gap-2">
          {GRADES.map(g => (
            <button key={g} onClick={() => { setGrade(g); setShowForm(true); }}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
              <Plus className="w-3 h-3 inline mr-1" /> Grade {g}
            </button>
          ))}
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              {teachers.length > 0 ? (
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" autoFocus>
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</option>
                  ))}
                </select>
              ) : (
                <div>
                  <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Teacher name" className="w-full px-3 py-2 border rounded-lg" autoFocus />
                  <p className="text-xs text-amber-600 mt-1">No teachers in Staff tab yet. Add staff first for best results.</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-3 py-2 border rounded-lg">
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Add
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Homeroom Cards */}
      {homerooms.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homerooms.map(hr => {
            const count = students.filter(s => s.homeroom === hr.id).length;
            return (
              <div key={hr.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">{hr.teacher || hr.name}</p>
                    <p className="text-sm text-gray-500">Grade {hr.grade} · {count} student{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => onRemove(hr.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-12 text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No homerooms created yet</p>
          <p className="text-sm text-gray-400">Click a grade button above to add your first homeroom</p>
        </div>
      )}
    </div>
  );
}

// ─── ASSIGN STUDENTS TAB ─────────────────────────────────────────────

function AssignStudents({ students, homerooms, onAssign, schoolId, googleConnected, setGoogleConnected, onRefreshStudents }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHomeroom, setExpandedHomeroom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [courseMapping, setCourseMapping] = useState({});
  const [courseGrades, setCourseGrades] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [gradeFilter, setGradeFilter] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkHomeroom, setBulkHomeroom] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const allUnassigned = students.filter(s => !s.homeroom);
  const grades = [...new Set(allUnassigned.map(s => s.grade).filter(Boolean))].sort((a, b) => {
    if (a === 'K') return -1;
    if (b === 'K') return 1;
    return parseInt(a) - parseInt(b);
  });
  const unassigned = allUnassigned.filter(s =>
    (!gradeFilter || s.grade === gradeFilter) &&
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGradeFilter = (grade) => {
    setGradeFilter(grade);
    setSelectedStudents(new Set());
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === unassigned.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(unassigned.map(s => s.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkHomeroom || selectedStudents.size === 0) return;
    setBulkAssigning(true);
    try {
      for (const studentId of selectedStudents) {
        await onAssign(studentId, parseInt(bulkHomeroom));
      }
      setSelectedStudents(new Set());
      setBulkHomeroom('');
    } catch (err) {
      console.error('Bulk assign failed:', err);
    }
    setBulkAssigning(false);
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await googleApi.getAuthUrl(schoolId);
      window.location.href = res.data.url;
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  };

  const handleLoadCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await googleApi.getCourses(schoolId);
      setCourses(res.data);
      setShowCourses(true);
    } catch (err) {
      console.error('Failed to load courses:', err);
      if (err.response?.status === 401) {
        setGoogleConnected(false);
      }
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSync = async () => {
    const selected = Object.entries(courseMapping)
      .filter(([_, homeroomId]) => homeroomId)
      .map(([courseId, homeroomId]) => ({ courseId, homeroomId: parseInt(homeroomId), grade: courseGrades[courseId] || null }));

    if (selected.length === 0) return;

    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await googleApi.syncCourses(schoolId, selected);
      setSyncResult(res.data);
      await onRefreshStudents();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await googleApi.disconnect(schoolId);
      setGoogleConnected(false);
      setCourses([]);
      setShowCourses(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assign Students to Homerooms</h2>
          <p className="text-gray-500 text-sm">Use the dropdown to assign each student, or sync from Google Classroom.</p>
        </div>
      </div>

      {/* Google Classroom Sync */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GoogleLogo className="w-6 h-6" />
            <div>
              <p className="font-medium">Google Classroom Sync</p>
              <p className="text-sm text-gray-500">
                {googleConnected
                  ? 'Connected — pull students from your Google Classroom courses'
                  : 'Connect your Google account to import students from Classroom'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <>
                <button onClick={handleLoadCourses} disabled={loadingCourses}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-300">
                  {loadingCourses ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {loadingCourses ? 'Loading...' : 'Load Courses'}
                </button>
                <button onClick={handleDisconnect}
                  className="px-3 py-2 border rounded-lg text-sm text-red-600 hover:bg-red-50">
                  Disconnect
                </button>
              </>
            ) : (
              <button onClick={handleConnectGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                <GoogleLogo className="w-4 h-4" />
                Connect Google Classroom
              </button>
            )}
          </div>
        </div>

        {/* Course List */}
        {showCourses && courses.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Map Google Classroom courses to homerooms:
            </p>
            <div className="space-y-2">
              {courses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium">{course.name}</p>
                    {course.section && <p className="text-xs text-gray-500">{course.section}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={courseGrades[course.id] || ''}
                      onChange={e => setCourseGrades(prev => ({ ...prev, [course.id]: e.target.value }))}
                      className="text-sm border rounded-lg px-2 py-1.5"
                    >
                      <option value="">Grade</option>
                      {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                        <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>
                      ))}
                    </select>
                    <select
                      value={courseMapping[course.id] || ''}
                      onChange={e => setCourseMapping(prev => ({ ...prev, [course.id]: e.target.value }))}
                      className="text-sm border rounded-lg px-2 py-1.5"
                    >
                      <option value="">Skip (don't sync)</option>
                      {homerooms.map(hr => (
                        <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button onClick={handleSync} disabled={syncing || !Object.values(courseMapping).some(v => v)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed">
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {syncing ? 'Syncing...' : 'Sync Selected Courses'}
              </button>
              <button onClick={() => setShowCourses(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Hide
              </button>
            </div>
          </div>
        )}

        {showCourses && courses.length === 0 && !loadingCourses && (
          <div className="mt-4 border-t pt-4 text-center text-sm text-gray-500">
            No active courses found. Make sure you're signed in with a teacher account.
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="mt-4 border-t pt-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                Sync complete — {syncResult.totalImported} new student{syncResult.totalImported !== 1 ? 's' : ''} imported
              </p>
              <div className="mt-2 space-y-1">
                {syncResult.results.map((r, i) => (
                  <p key={i} className="text-xs text-green-700">
                    {r.courseName}: {r.studentsFound} found, {r.studentsImported} new
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Unassigned */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b space-y-3">
            <h3 className="font-semibold">Unassigned ({allUnassigned.length})</h3>
            {/* Grade Tabs */}
            {grades.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => handleGradeFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !gradeFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({allUnassigned.length})
                </button>
                {grades.map(g => {
                  const count = allUnassigned.filter(s => s.grade === g).length;
                  return (
                    <button key={g} onClick={() => handleGradeFilter(g)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        gradeFilter === g ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {g === 'K' ? 'K' : `Gr ${g}`} ({count})
                    </button>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          {/* Bulk Assign Bar */}
          {selectedStudents.size > 0 && (
            <div className="px-4 py-3 bg-indigo-50 border-b flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-indigo-700">{selectedStudents.size} selected</span>
              <select value={bulkHomeroom} onChange={(e) => setBulkHomeroom(e.target.value)}
                className="text-sm border rounded-lg px-2 py-1.5 flex-1 min-w-0">
                <option value="">Assign to...</option>
                {homerooms
                  .filter(hr => !gradeFilter || hr.grade === gradeFilter)
                  .map(hr => (
                    <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
                  ))}
                {gradeFilter && homerooms.filter(hr => hr.grade !== gradeFilter).length > 0 && (
                  <optgroup label="Other grades">
                    {homerooms.filter(hr => hr.grade !== gradeFilter).map(hr => (
                      <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button onClick={handleBulkAssign} disabled={!bulkHomeroom || bulkAssigning}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-300 whitespace-nowrap">
                {bulkAssigning ? 'Assigning...' : `Assign ${selectedStudents.size}`}
              </button>
            </div>
          )}

          <div className="p-4 max-h-96 overflow-y-auto">
            {unassigned.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">
                  {allUnassigned.length === 0 ? 'All students assigned!' : 'No students match this filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Select All */}
                <label className="flex items-center gap-2 p-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 rounded-lg">
                  <input type="checkbox"
                    checked={selectedStudents.size === unassigned.length && unassigned.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  Select all ({unassigned.length})
                </label>
                {unassigned.map(student => (
                  <div key={student.id} className={`flex items-center justify-between p-2 rounded-lg ${
                    selectedStudents.has(student.id) ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                        {(student.firstName || '?')[0]}{(student.lastName || '?')[0]}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{student.firstName} {student.lastName}</span>
                        {student.grade && <span className="text-xs text-gray-400 ml-2">Gr {student.grade}</span>}
                      </div>
                    </div>
                    <select onChange={(e) => onAssign(student.id, parseInt(e.target.value))} defaultValue=""
                      className="text-sm border rounded px-2 py-1">
                      <option value="" disabled>Assign to...</option>
                      {homerooms.map(hr => (
                        <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Homerooms */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Homerooms</h3>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {homerooms.map(hr => {
              const hStudents = students.filter(s => s.homeroom === hr.id);
              const expanded = expandedHomeroom === hr.id;
              return (
                <div key={hr.id}>
                  <button onClick={() => setExpandedHomeroom(expanded ? null : hr.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <School className="w-5 h-5 text-indigo-600" />
                      <div className="text-left">
                        <p className="font-medium">{hr.teacher || hr.name}</p>
                        <p className="text-sm text-gray-500">Grade {hr.grade}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {hStudents.length}
                      </span>
                      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        {hStudents.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-2">No students assigned</p>
                        ) : (
                          hStudents.map(s => (
                            <div key={s.id} className="flex items-center justify-between text-sm">
                              <span>{s.firstName} {s.lastName}</span>
                              <button onClick={() => onAssign(s.id, null)} className="text-red-500 hover:text-red-700">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BUS ASSIGNMENTS TAB ─────────────────────────────────────────────

function BusAssignments({ students, homerooms, onUpdateStudents, onUpdateStudent }) {
  const [subTab, setSubTab] = useState('csv');
  const [toast, setToast] = useState(null);

  // CSV Upload state
  const [csvPreview, setCsvPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Assign by Bus state
  const [busNumber, setBusNumber] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [busFilter, setBusFilter] = useState('all');
  const [busSearch, setBusSearch] = useState('');

  // Individual Edit state
  const [editFilter, setEditFilter] = useState('all');
  const [editSearch, setEditSearch] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Bus summary data
  const busStudents = students.filter(s => s.dismissalType === 'bus' && s.busRoute);
  const busGroups = {};
  busStudents.forEach(s => {
    if (!busGroups[s.busRoute]) busGroups[s.busRoute] = [];
    busGroups[s.busRoute].push(s);
  });
  const busList = Object.keys(busGroups).sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  // Fuzzy name match helper
  const fuzzyMatch = (csvName, studentName) => {
    const a = (csvName || '').toLowerCase().trim();
    const b = (studentName || '').toLowerCase().trim();
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    if (b.startsWith(a) || a.startsWith(b)) return 0.8;
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / Math.max(a.length, b.length);
  };

  const findStudentMatch = (firstName, lastName) => {
    let bestMatch = null;
    let bestScore = 0;
    for (const s of students) {
      const fnScore = fuzzyMatch(firstName, s.firstName);
      const lnScore = fuzzyMatch(lastName, s.lastName);
      const score = (fnScore + lnScore) / 2;
      if (score > bestScore && score >= 0.7) {
        bestScore = score;
        bestMatch = s;
      }
    }
    return bestMatch ? { student: bestMatch, score: bestScore } : null;
  };

  // CSV parsing
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const fnIdx = headers.findIndex(h => h.includes('first'));
    const lnIdx = headers.findIndex(h => h.includes('last'));
    const busIdx = headers.findIndex(h => h.includes('bus'));
    if (fnIdx === -1 || lnIdx === -1 || busIdx === -1) return [];

    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = line.split(',').map(c => c.trim());
      const firstName = cols[fnIdx] || '';
      const lastName = cols[lnIdx] || '';
      const bus = cols[busIdx] || '';
      const match = findStudentMatch(firstName, lastName);
      return { firstName, lastName, bus, match };
    });
  };

  const handleCSVFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleCSVFile(file);
    }
  };

  const downloadTemplate = () => {
    const csv = 'Student First Name,Student Last Name,Bus Number\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bus_assignments_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSVMatches = async () => {
    if (!csvPreview) return;
    const matched = csvPreview.filter(r => r.match && r.bus);
    const updates = matched.map(r => ({
      id: r.match.student.id,
      dismissal_type: 'bus',
      bus_route: r.bus,
    }));
    if (updates.length === 0) return;
    await onUpdateStudents(updates);
    showToast(`Imported bus assignments for ${updates.length} students`);
    setCsvPreview(null);
  };

  // Assign by Bus handlers
  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assignableStudents = students.filter(s => {
    if (busFilter !== 'all' && s.homeroom !== parseInt(busFilter)) return false;
    if (busSearch) {
      const q = busSearch.toLowerCase();
      if (!(`${s.firstName} ${s.lastName}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const assignSelectedToBus = async () => {
    if (!busNumber.trim() || selectedStudents.size === 0) return;
    const updates = [...selectedStudents].map(id => ({
      id,
      dismissal_type: 'bus',
      bus_route: busNumber.trim(),
    }));
    await onUpdateStudents(updates);
    showToast(`Assigned ${updates.length} students to Bus #${busNumber.trim()}`);
    setSelectedStudents(new Set());
  };

  const toggleAll = () => {
    if (selectedStudents.size === assignableStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(assignableStudents.map(s => s.id)));
    }
  };

  // Individual Edit handlers
  const editFiltered = students.filter(s => {
    if (editFilter !== 'all' && s.homeroom !== parseInt(editFilter)) return false;
    if (editSearch) {
      const q = editSearch.toLowerCase();
      if (!(`${s.firstName} ${s.lastName}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const handleInlineUpdate = async (studentId, field, value) => {
    const fieldMap = { dismissalType: 'dismissal_type', busRoute: 'bus_route' };
    const apiField = fieldMap[field] || field;
    const payload = { [apiField]: value };
    if (field === 'dismissalType' && value !== 'bus') {
      payload.bus_route = null;
    }
    await onUpdateStudent(studentId, payload);
  };

  const subTabs = [
    { id: 'csv', label: 'CSV Upload', icon: Upload },
    { id: 'assign', label: 'Assign by Bus', icon: Bus },
    { id: 'individual', label: 'Individual Edit', icon: Pencil },
  ];

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900">Bus Assignments</h2>
        <p className="text-gray-500 text-sm">Assign students to buses before setting other dismissal types.</p>
      </div>

      {/* Bus Summary Cards */}
      {busList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {busList.map(busNum => (
            <div key={busNum} className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <Bus className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800">#{busNum}</span>
              <span className="text-sm text-yellow-600">{busGroups[busNum].length} riders</span>
            </div>
          ))}
          <div className="bg-gray-50 border rounded-lg px-4 py-2 text-sm text-gray-600">
            {busStudents.length} total bus riders
          </div>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="bg-white rounded-xl border">
        <div className="flex border-b">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                  subTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* ── CSV Upload Sub-tab ── */}
          {subTab === 'csv' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                  <Download className="w-4 h-4" /> Download Template
                </button>
                <span className="text-sm text-gray-500">Upload a CSV with student names and bus numbers</span>
              </div>

              {!csvPreview ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                    dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-gray-400 mt-1">Columns: Student First Name, Student Last Name, Bus Number</p>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                    onChange={(e) => handleCSVFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      Preview: {csvPreview.filter(r => r.match).length} matched, {csvPreview.filter(r => !r.match).length} unmatched
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setCsvPreview(null)}
                        className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                        Cancel
                      </button>
                      <button onClick={importCSVMatches}
                        disabled={csvPreview.filter(r => r.match && r.bus).length === 0}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                        Import {csvPreview.filter(r => r.match && r.bus).length} Students
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">CSV Name</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Bus #</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {csvPreview.map((row, i) => (
                          <tr key={i} className={row.match ? 'bg-green-50' : 'bg-yellow-50'}>
                            <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                            <td className="px-3 py-2">{row.bus}</td>
                            <td className="px-3 py-2">
                              {row.match ? (
                                <span className="flex items-center gap-1 text-green-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {row.match.student.firstName} {row.match.student.lastName}
                                  {row.match.score < 1 && <span className="text-xs text-green-500 ml-1">({Math.round(row.match.score * 100)}%)</span>}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-yellow-700">
                                  <AlertCircle className="w-3.5 h-3.5" /> No match
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Assign by Bus Sub-tab ── */}
          {subTab === 'assign' && (
            <div className="flex gap-4">
              {/* Left: student selection */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Bus #:</label>
                    <input type="text" value={busNumber} onChange={(e) => setBusNumber(e.target.value)}
                      placeholder="e.g. 42" className="border rounded-lg px-3 py-1.5 text-sm w-24" />
                  </div>
                  <select value={busFilter} onChange={(e) => setBusFilter(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm">
                    <option value="all">All homerooms</option>
                    {homerooms.map(hr => (
                      <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                    <input type="text" value={busSearch} onChange={(e) => setBusSearch(e.target.value)}
                      placeholder="Search students..." className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={assignableStudents.length > 0 && selectedStudents.size === assignableStudents.length}
                      onChange={toggleAll} className="rounded" />
                    Select All ({assignableStudents.length})
                  </label>
                  {selectedStudents.size > 0 && busNumber.trim() && (
                    <button onClick={assignSelectedToBus}
                      className="ml-auto px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      Assign {selectedStudents.size} to Bus #{busNumber.trim()}
                    </button>
                  )}
                </div>

                <div className="border rounded-lg max-h-80 overflow-y-auto divide-y">
                  {assignableStudents.map(s => {
                    const hr = homerooms.find(h => h.id === s.homeroom);
                    return (
                      <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={selectedStudents.has(s.id)}
                          onChange={() => toggleStudent(s.id)} className="rounded" />
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{s.firstName} {s.lastName}</span>
                          {hr && <span className="text-xs text-gray-400 ml-2">{hr.teacher || hr.name}</span>}
                        </div>
                        {s.dismissalType === 'bus' && s.busRoute && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Bus #{s.busRoute}</span>
                        )}
                      </label>
                    );
                  })}
                  {assignableStudents.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-400">No students found</div>
                  )}
                </div>
              </div>

              {/* Right: current bus assignments sidebar */}
              <div className="w-64 shrink-0">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Buses</h4>
                <div className="border rounded-lg max-h-96 overflow-y-auto divide-y">
                  {busList.length === 0 && (
                    <div className="p-3 text-center text-sm text-gray-400">No bus assignments yet</div>
                  )}
                  {busList.map(busNum => (
                    <details key={busNum} className="group">
                      <summary className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Bus className="w-3.5 h-3.5 text-yellow-600" /> Bus #{busNum}
                        </span>
                        <span className="text-xs text-gray-500">{busGroups[busNum].length}</span>
                      </summary>
                      <div className="px-3 pb-2">
                        {busGroups[busNum].map(s => (
                          <div key={s.id} className="text-xs text-gray-600 py-0.5 pl-6">
                            {s.firstName} {s.lastName}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Individual Edit Sub-tab ── */}
          {subTab === 'individual' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select value={editFilter} onChange={(e) => setEditFilter(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm">
                  <option value="all">All homerooms</option>
                  {homerooms.map(hr => (
                    <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                  <input type="text" value={editSearch} onChange={(e) => setEditSearch(e.target.value)}
                    placeholder="Search students..." className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm" />
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-2.5">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase">
                    <div className="col-span-4">Student</div>
                    <div className="col-span-3">Homeroom</div>
                    <div className="col-span-3">Dismissal Type</div>
                    <div className="col-span-2">Bus #</div>
                  </div>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {editFiltered.map(student => {
                    const hr = homerooms.find(h => h.id === student.homeroom);
                    return (
                      <div key={student.id} className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center">
                        <div className="col-span-4 flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                            {(student.firstName || '?')[0]}{(student.lastName || '?')[0]}
                          </div>
                          <span className="text-sm font-medium">{student.firstName} {student.lastName}</span>
                        </div>
                        <div className="col-span-3 text-sm text-gray-500">
                          {hr ? hr.teacher || hr.name : <span className="text-yellow-600 text-xs">Unassigned</span>}
                        </div>
                        <div className="col-span-3">
                          <select value={student.dismissalType}
                            onChange={(e) => handleInlineUpdate(student.id, 'dismissalType', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm">
                            <option value="car">Car</option>
                            <option value="bus">Bus</option>
                            <option value="walker">Walker</option>
                            <option value="afterschool">After School</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          {student.dismissalType === 'bus' ? (
                            <input type="text" value={student.busRoute || ''}
                              onChange={(e) => handleInlineUpdate(student.id, 'busRoute', e.target.value)}
                              onBlur={(e) => handleInlineUpdate(student.id, 'busRoute', e.target.value)}
                              placeholder="Bus #" className="w-full border rounded px-2 py-1 text-sm" />
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {editFiltered.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-400">No students found</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DISMISSAL CONFIG TAB ────────────────────────────────────────────

function DismissalConfig({ students, homerooms, schoolId, onUpdate, onBulkSet }) {
  const [filterHomeroom, setFilterHomeroom] = useState('all');
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const dismissalTypes = [
    { id: 'car', label: 'Car', icon: Car, color: 'blue' },
    { id: 'bus', label: 'Bus', icon: Bus, color: 'yellow' },
    { id: 'walker', label: 'Walker', icon: PersonStanding, color: 'green' },
    { id: 'afterschool', label: 'After School', icon: Clock, color: 'purple' },
  ];

  const filtered = students.filter(s =>
    filterHomeroom === 'all' || s.homeroom === parseInt(filterHomeroom)
  );

  const busStudentCount = students.filter(s => s.dismissalType === 'bus' && s.busRoute).length;

  const handleSaveHomeroom = async () => {
    if (filterHomeroom === 'all' || saving) return;
    setSaving(true);
    try {
      const homeroomStudents = students.filter(s => s.homeroom === parseInt(filterHomeroom));
      const updates = homeroomStudents.map(s => ({
        id: s.id,
        dismissal_type: s.dismissalType,
        bus_route: s.dismissalType === 'bus' ? (s.busRoute || null) : null,
      }));
      await bulkUpdateStudents(schoolId, updates);
      showToast(`Saved ${updates.length} students`);
    } catch (err) {
      console.error('Failed to save homeroom:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900">Set Dismissal Types</h2>
        <p className="text-gray-500 text-sm">Choose how each student goes home.</p>
      </div>

      {/* Bus students info banner */}
      {busStudentCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <Bus className="w-4 h-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            {busStudentCount} student{busStudentCount !== 1 ? 's' : ''} already assigned to buses from the Bus Assignments step.
          </p>
        </div>
      )}

      {/* Bulk + Filter + Save */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select value={filterHomeroom} onChange={(e) => setFilterHomeroom(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All homerooms</option>
            {homerooms.map(hr => (
              <option key={hr.id} value={hr.id}>{hr.teacher || hr.name} (Gr {hr.grade})</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {filterHomeroom !== 'all' && (
            <button onClick={handleSaveHomeroom} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Homeroom'}
            </button>
          )}
          <button onClick={() => setShowBulkOptions(!showBulkOptions)}
            className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
            {showBulkOptions ? 'Hide Bulk' : 'Set All'}
          </button>
        </div>
      </div>

      {showBulkOptions && (
        <div className="flex flex-wrap gap-2">
          {dismissalTypes.map(type => {
            const Icon = type.icon;
            return (
              <button key={type.id} onClick={() => onBulkSet(type.id)}
                className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                <Icon className="w-4 h-4" /> Set all to {type.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Student list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Homeroom</div>
            <div className="col-span-3">Dismissal Type</div>
            <div className="col-span-2">Bus #</div>
          </div>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {filtered.map(student => {
            const hr = homerooms.find(h => h.id === student.homeroom);
            return (
              <div key={student.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                <div className="col-span-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                    {(student.firstName || '?')[0]}{(student.lastName || '?')[0]}
                  </div>
                  <span className="text-sm font-medium">{student.firstName} {student.lastName}</span>
                </div>
                <div className="col-span-3 text-sm text-gray-500">
                  {hr ? hr.teacher || hr.name : <span className="text-yellow-600">Unassigned</span>}
                </div>
                <div className="col-span-3">
                  <select value={student.dismissalType}
                    onChange={(e) => onUpdate(student.id, 'dismissalType', e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm">
                    {dismissalTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {student.dismissalType === 'bus' ? (
                    <input type="text" value={student.busRoute || ''}
                      onChange={(e) => onUpdate(student.id, 'busRoute', e.target.value)}
                      placeholder="Bus #" className="w-full border rounded px-2 py-1 text-sm" />
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {dismissalTypes.map(type => {
          const Icon = type.icon;
          const count = students.filter(s => s.dismissalType === type.id).length;
          const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
          return (
            <div key={type.id} className="bg-white rounded-xl border p-4 text-center">
              <Icon className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-500">{type.label}</p>
              <p className="text-xs text-gray-400">{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCHOOL SETTINGS TAB ─────────────────────────────────────────────

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Los_Angeles', label: 'Pacific' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
];

// ─── CAR NUMBERS TAB ──────────────────────────────────────────────
function CarNumbersTab({ schoolId, students }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [dismissalMode, setDismissalMode] = useState('no_app');
  const [showAppModeConfirm, setShowAppModeConfirm] = useState(false);
  const [sendingToApp, setSendingToApp] = useState(false);
  const [appModeGroups, setAppModeGroups] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingCarNumber, setEditingCarNumber] = useState('');

  const clientUrl = window.location.origin;

  const loadGroups = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [groupsRes, modeRes] = await Promise.all([
        getFamilyGroups(schoolId),
        getDismissalMode(schoolId),
      ]);
      setGroups(groupsRes.data);
      setDismissalMode(modeRes.data.mode);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // Students already assigned to a group
  const assignedStudentIds = new Set(groups.flatMap(g => (g.students || []).map(s => s.id)));
  const unassigned = students.filter(s => !assignedStudentIds.has(s.id));
  const filteredUnassigned = unassigned.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return `${s.firstName || s.first_name} ${s.lastName || s.last_name}`.toLowerCase().includes(term);
  });

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedStudents.size === filteredUnassigned.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredUnassigned.map(s => s.id)));
    }
  };

  const handleCreateGroup = async () => {
    if (selectedStudents.size === 0) return;
    setCreating(true);
    try {
      await createFamilyGroup(schoolId, {
        familyName: familyNameInput || null,
        studentIds: Array.from(selectedStudents),
      });
      setSelectedStudents(new Set());
      setFamilyNameInput('');
      setShowCreateDialog(false);
      await loadGroups();
    } catch (err) {
      console.error('Failed to create family group:', err?.response?.data || err);
      alert(err?.response?.data?.error || 'Failed to create family group');
    } finally { setCreating(false); }
  };

  const handleAddToGroup = async (groupId) => {
    if (selectedStudents.size === 0) return;
    try {
      await addStudentsToGroup(groupId, Array.from(selectedStudents));
      setSelectedStudents(new Set());
      await loadGroups();
    } catch { /* ignore */ }
  };

  const handleRemoveStudent = async (groupId, studentId) => {
    try {
      await removeStudentFromGroup(groupId, studentId);
      await loadGroups();
    } catch { /* ignore */ }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteFamilyGroup(groupId);
      await loadGroups();
    } catch { /* ignore */ }
  };

  const handleSaveCarNumber = async (groupId) => {
    if (!editingCarNumber.trim()) return;
    try {
      await updateFamilyGroup(groupId, { carNumber: editingCarNumber.trim() });
      setEditingGroupId(null);
      setEditingCarNumber('');
      await loadGroups();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update car number');
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      await autoAssignFamilyGroups(schoolId);
      await loadGroups();
    } catch { /* ignore */ }
    finally { setAutoAssigning(false); }
  };

  const handleSendToAppMode = async () => {
    setSendingToApp(true);
    try {
      const res = await sendToAppMode(schoolId);
      setDismissalMode('app');
      setAppModeGroups(res.data.groups);
      setShowAppModeConfirm(false);
    } catch { /* ignore */ }
    finally { setSendingToApp(false); }
  };

  const handleDownloadCSV = () => {
    const displayGroups = dismissalMode === 'app' ? (appModeGroups || groups) : groups;
    const rows = [['Family Group', 'Students', 'Car Number']];
    displayGroups.forEach(g => {
      const studentNames = (g.students || []).map(s => `${s.first_name} ${s.last_name}`).join('; ');
      rows.push([g.family_name || '', studentNames, g.car_number || '']);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-numbers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-12"><p className="text-gray-500">Loading car numbers...</p></div>;

  // App mode view: show QR codes for distribution
  if (dismissalMode === 'app') {
    const displayGroups = appModeGroups || groups;
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Car Numbers — App Mode</h2>
            <p className="text-sm text-gray-500">Distribute QR codes to families so they can register and link their children.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!window.confirm('Switch back to manual car number mode? Invite tokens will be preserved.')) return;
                try {
                  await switchToNoAppMode(schoolId);
                  setDismissalMode('no_app');
                } catch (err) {
                  alert('Failed to switch mode');
                }
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Switch to No-App Mode
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Download CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Printer className="w-4 h-4" /> Print All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGroups.map(group => {
            const inviteUrl = group.invite_token ? `${clientUrl}/register?invite=${group.invite_token}` : null;
            return (
              <div key={group.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-indigo-600">#{group.car_number}</span>
                    {group.family_name && <span className="text-sm text-gray-500">{group.family_name}</span>}
                  </div>
                  {group.claimed_by_user_id ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Claimed</span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Unclaimed</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(group.students || []).map(s => (
                    <span key={s.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {s.first_name} {s.last_name}
                    </span>
                  ))}
                </div>
                {inviteUrl && (
                  <div className="flex flex-col items-center border-t pt-3">
                    <QRCodeSVG value={inviteUrl} size={120} />
                    <p className="text-xs text-gray-400 mt-2 break-all text-center">{inviteUrl}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // No-app mode: two-panel grouping UI
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Car Numbers</h2>
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Download CSV
            </button>
          )}
          {unassigned.length > 0 && (
            <button
              onClick={handleAutoAssign}
              disabled={autoAssigning}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {autoAssigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Auto-Number Remaining ({unassigned.length})
            </button>
          )}
          <button
            onClick={() => setShowAppModeConfirm(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowRight className="w-4 h-4" /> Send to App Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Unassigned Students */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Unassigned Students ({unassigned.length})</h3>
              {filteredUnassigned.length > 0 && (
                <button onClick={selectAll} className="text-sm text-indigo-600 hover:text-indigo-700">
                  {selectedStudents.size === filteredUnassigned.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y">
            {filteredUnassigned.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p>{unassigned.length === 0 ? 'All students assigned!' : 'No matches'}</p>
              </div>
            ) : (
              filteredUnassigned.map(s => (
                <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.firstName || s.first_name} {s.lastName || s.last_name}</p>
                    <p className="text-xs text-gray-500">Grade {s.grade} {s.homeroom_name ? `· ${s.homeroom_name}` : ''}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${s.dismissalType === 'car' || s.dismissal_type === 'car' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.dismissalType || s.dismissal_type}
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedStudents.size > 0 && (
            <div className="p-3 border-t bg-gray-50 flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedStudents.size} selected</span>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="ml-auto px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Group
              </button>
              {groups.length > 0 && (
                <div className="relative group">
                  <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100">
                    Add to Group ▾
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10 hidden group-hover:block">
                    {groups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => handleAddToGroup(g.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        #{g.car_number} {g.family_name || ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Family Groups */}
        <div className="space-y-3">
          <h3 className="font-semibold">Family Groups ({groups.length})</h3>
          {groups.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              <Car className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No groups yet. Select students and create a group.</p>
            </div>
          ) : (
            <div className="max-h-[550px] overflow-y-auto space-y-3">
              {groups.map(g => (
                <div key={g.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {editingGroupId === g.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-bold text-indigo-600">#</span>
                          <input
                            type="text"
                            value={editingCarNumber}
                            onChange={e => setEditingCarNumber(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCarNumber(g.id);
                              if (e.key === 'Escape') { setEditingGroupId(null); setEditingCarNumber(''); }
                            }}
                            onBlur={() => handleSaveCarNumber(g.id)}
                            autoFocus
                            maxLength={5}
                            className="w-16 text-xl font-bold text-indigo-600 border-b-2 border-indigo-400 outline-none bg-transparent"
                          />
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-indigo-600">
                          #{g.car_number}
                        </span>
                      )}
                      {g.family_name && <span className="text-sm text-gray-500">{g.family_name}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingGroupId(g.id); setEditingCarNumber(g.car_number); }} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50">
                        Edit #
                      </button>
                      <button onClick={() => handleDeleteGroup(g.id)} className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-50">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(g.students || []).map(s => (
                      <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 pl-2 pr-1 py-1 rounded-full">
                        {s.first_name} {s.last_name}
                        <button
                          onClick={() => handleRemoveStudent(g.id, s.id)}
                          className="text-gray-400 hover:text-red-500 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {(!g.students || g.students.length === 0) && (
                      <span className="text-xs text-gray-400 italic">No students</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Create Family Group</h3>
            <p className="text-sm text-gray-500 mb-3">{selectedStudents.size} student(s) selected</p>
            <input
              type="text"
              placeholder="Family name (optional)"
              value={familyNameInput}
              onChange={(e) => setFamilyNameInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCreateDialog(false); setFamilyNameInput(''); }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creating}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to App Mode Confirmation */}
      {showAppModeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Switch to App Mode</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will generate invite QR codes for every family group. Parents can scan these to register and automatically link to their children with the same car number.
            </p>
            <p className="text-sm text-amber-600 mb-4 font-medium">
              {unassigned.length > 0 ? `⚠ ${unassigned.length} student(s) are not in a family group yet. They won't get a QR code.` : 'All students are assigned to groups.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAppModeConfirm(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToAppMode}
                disabled={sendingToApp}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {sendingToApp ? 'Switching...' : 'Switch to App Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PARENTS TAB ──────────────────────────────────────────────
function ParentsTab({ schoolId }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        const res = await import('../api/client').then(m => m.default.get(`/schools/${schoolId}/parents`));
        if (!cancelled) setParents(res.data);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [schoolId]);

  const filtered = parents.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(term)
      || p.email?.toLowerCase().includes(term)
      || p.car_number?.includes(term);
  });

  if (loading) return <div className="text-center py-12"><p className="text-gray-500">Loading parents...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Parents ({parents.length})</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search parents or car #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>{searchTerm ? 'No parents match your search' : 'No parents have joined this school yet'}</p>
          {!searchTerm && (
            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
              Parents will appear here after they download the app, create an account, and link to their children using a student code.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Parent</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Phone</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Car #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Children</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(parent => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{parent.first_name} {parent.last_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{parent.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{parent.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {parent.car_number ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700">
                        #{parent.car_number}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {parent.children ? parent.children.map(c =>
                      <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 mr-1 mb-1">
                        {c.first_name} {c.last_name} (Gr {c.grade})
                      </span>
                    ) : <span className="text-gray-400">No linked children</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SchoolSettingsTab({ schoolId }) {
  const [name, setName] = useState('');
  const [dismissalTime, setDismissalTime] = useState('15:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [changeRequestWarning, setChangeRequestWarning] = useState('');
  const [enableQrCodes, setEnableQrCodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      getSchool(schoolId),
      getSchoolSettings(schoolId).catch(() => ({ data: {} })),
    ]).then(([schoolRes, settingsRes]) => {
      const school = schoolRes.data;
      setName(school.name || '');
      setDismissalTime(school.dismissal_time || '15:00');
      setTimezone(school.timezone || 'America/New_York');
      setChangeRequestWarning(settingsRes.data?.changeRequestWarning || '');
      setEnableQrCodes(settingsRes.data?.enableQrCodes || false);
    }).finally(() => setLoading(false));
  }, [schoolId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSchool(schoolId, { name, dismissalTime, timezone });
      // Save settings separately (changeRequestWarning goes in settings JSON)
      const currentSettings = await getSchoolSettings(schoolId).then(r => r.data).catch(() => ({}));
      await updateSchoolSettings(schoolId, { ...currentSettings, changeRequestWarning: changeRequestWarning.trim() || undefined, enableQrCodes });
      window.location.reload();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-bold text-gray-900 mb-6">School Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dismissal Start Time</label>
          <p className="text-xs text-gray-500 mb-2">Dismissal will automatically start at this time each school day.</p>
          <input
            type="time"
            value={dismissalTime}
            onChange={e => setDismissalTime(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School Timezone</label>
          <p className="text-xs text-gray-500 mb-2">Auto-detected at registration. Change only if your school is in a different timezone.</p>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Change Request Warning (Optional)</label>
          <p className="text-xs text-gray-500 mb-2">If set, parents will see this message when submitting a change request. Leave blank for no warning.</p>
          <textarea
            value={changeRequestWarning}
            onChange={e => setChangeRequestWarning(e.target.value)}
            placeholder="e.g. Changes submitted after 2:30 PM require office approval."
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Enable QR Codes</p>
            <p className="text-xs text-gray-500">Allow printing QR codes for students so parents can scan to link their account.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnableQrCodes(!enableQrCodes)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableQrCodes ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableQrCodes ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW & LAUNCH TAB ─────────────────────────────────────────────

function ReviewLaunch({ students, homerooms, onLaunch }) {
  const dismissalTypes = [
    { id: 'car', label: 'Car Riders', icon: Car },
    { id: 'bus', label: 'Bus Riders', icon: Bus },
    { id: 'walker', label: 'Walkers', icon: PersonStanding },
    { id: 'afterschool', label: 'After School', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review & Launch</h2>
        <p className="text-gray-500 text-sm">Review your setup and launch GoPilot.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Students
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">{students.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Assigned</span><span className="font-semibold">{students.filter(s => s.homeroom).length}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Unassigned</span>
              <span className={`font-semibold ${students.filter(s => !s.homeroom).length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {students.filter(s => !s.homeroom).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" /> Homerooms
          </h3>
          <div className="space-y-2">
            {homerooms.map(hr => (
              <div key={hr.id} className="flex justify-between text-sm">
                <span>{hr.teacher || hr.name} - Grade {hr.grade}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {students.filter(s => s.homeroom === hr.id).length} students
                </span>
              </div>
            ))}
            {homerooms.length === 0 && <p className="text-sm text-gray-400">No homerooms created</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-600" /> Dismissal Breakdown
          </h3>
          <div className="space-y-3">
            {dismissalTypes.map(type => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><Icon className="w-4 h-4" /> {type.label}</span>
                  <span className="font-semibold">{students.filter(s => s.dismissalType === type.id).length}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Next Steps
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /><span>Send parent invitation emails</span></div>
            <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /><span>Train staff on the dismissal dashboard</span></div>
            <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /><span>Run a test dismissal</span></div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-indigo-900">Ready to Launch!</h3>
          <p className="text-sm text-indigo-700">Your school is configured and ready to start using GoPilot.</p>
        </div>
        <button onClick={onLaunch} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          <CheckCircle2 className="w-5 h-5" /> Launch GoPilot
        </button>
      </div>
    </div>
  );
}
