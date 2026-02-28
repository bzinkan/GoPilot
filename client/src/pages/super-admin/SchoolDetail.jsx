import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, School, Users, UserPlus, Play, Pause, Trash2,
  UserCheck, Copy, AlertCircle, CheckCircle2, Edit, Save, X
} from 'lucide-react';
import * as superAdminApi from '../../api/superAdmin';

export default function SchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', firstName: '', lastName: '' });
  const [adminResult, setAdminResult] = useState(null);
  const [error, setError] = useState(null);

  const loadSchool = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getSchool(id);
      setSchool(res.data);
      setEditForm({
        name: res.data.name,
        address: res.data.address || '',
        phone: res.data.phone || '',
        timezone: res.data.timezone || 'America/New_York',
        status: res.data.status || 'active',
        maxStudents: res.data.max_students || '',
        billingEmail: res.data.billing_email || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchool(); }, [id]);

  const handleSave = async () => {
    try {
      await superAdminApi.updateSchool(id, editForm);
      setEditing(false);
      loadSchool();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await superAdminApi.addSchoolAdmin(id, adminForm);
      setAdminResult(res.data);
      setShowAddAdmin(false);
      setAdminForm({ email: '', firstName: '', lastName: '' });
      loadSchool();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add admin');
    }
  };

  const handleImpersonate = async () => {
    try {
      const res = await superAdminApi.impersonateSchool(id);
      localStorage.setItem('superAdminToken', localStorage.getItem('token'));
      localStorage.setItem('token', res.data.token);
      window.location.href = '/home';
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspend = async () => {
    await superAdminApi.suspendSchool(id);
    loadSchool();
  };

  const handleRestore = async () => {
    await superAdminApi.restoreSchool(id);
    loadSchool();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this school?')) return;
    await superAdminApi.deleteSchool(id);
    navigate('/super-admin/schools');
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>;
  if (!school) return <div className="p-6 text-center text-gray-400">School not found</div>;

  const statusColors = { active: 'bg-green-100 text-green-800', trial: 'bg-blue-100 text-blue-800', suspended: 'bg-red-100 text-red-800' };
  const admins = (school.members || []).filter(m => m.role === 'admin');
  const staff = (school.members || []).filter(m => m.role !== 'admin');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/super-admin/schools')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Schools
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {adminResult?.tempPassword && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold text-green-800 mb-1">Admin added!</p>
          <p className="text-sm text-green-700">Email: {adminResult.admin.email}</p>
          <p className="text-sm text-green-700">Temp Password: <span className="font-mono">{adminResult.tempPassword}</span></p>
          <button onClick={() => { navigator.clipboard.writeText(`Email: ${adminResult.admin.email}\nPassword: ${adminResult.tempPassword}`); }}
            className="mt-2 flex items-center gap-1 text-sm text-green-700 hover:text-green-900">
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{school.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[school.status] || 'bg-gray-100'}`}>
              {school.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">{school.address || 'No address'} | {school.timezone}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImpersonate}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <UserCheck className="w-4 h-4" /> Impersonate
          </button>
          {school.status === 'suspended' ? (
            <button onClick={handleRestore} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <Play className="w-4 h-4" /> Restore
            </button>
          ) : (
            <button onClick={handleSuspend} className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
              <Pause className="w-4 h-4" /> Suspend
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold">{school.student_count}</p>
          <p className="text-sm text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold">{school.homeroom_count}</p>
          <p className="text-sm text-gray-500">Homerooms</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold">{school.members?.length || 0}</p>
          <p className="text-sm text-gray-500">Members</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* School Info */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><School className="w-5 h-5 text-indigo-600" /> School Info</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} className="text-sm text-green-600 flex items-center gap-1"><Save className="w-4 h-4" /> Save</button>
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded text-sm">
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Max Students</label>
                <input type="number" value={editForm.maxStudents} onChange={(e) => setEditForm({...editForm, maxStudents: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Billing Email</label>
                <input value={editForm.billingEmail} onChange={(e) => setEditForm({...editForm, billingEmail: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Max Students</span><span>{school.max_students || 'Unlimited'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Billing Email</span><span>{school.billing_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Timezone</span><span>{school.timezone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Dismissal Time</span><span>{school.dismissal_time}</span></div>
              {school.trial_ends_at && (
                <div className="flex justify-between"><span className="text-gray-500">Trial Ends</span><span>{new Date(school.trial_ends_at).toLocaleDateString()}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(school.created_at).toLocaleDateString()}</span></div>
            </div>
          )}
        </div>

        {/* Admins */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Admins</h2>
            <button onClick={() => setShowAddAdmin(!showAddAdmin)}
              className="text-sm text-indigo-600 flex items-center gap-1">
              <UserPlus className="w-4 h-4" /> Add Admin
            </button>
          </div>

          {showAddAdmin && (
            <form onSubmit={handleAddAdmin} className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <input placeholder="Email *" value={adminForm.email} onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                className="w-full px-3 py-1.5 border rounded text-sm" required />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="First Name" value={adminForm.firstName} onChange={(e) => setAdminForm({...adminForm, firstName: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded text-sm" />
                <input placeholder="Last Name" value={adminForm.lastName} onChange={(e) => setAdminForm({...adminForm, lastName: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
              <button type="submit" className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                Add Admin
              </button>
            </form>
          )}

          <div className="space-y-2">
            {admins.length === 0 ? (
              <p className="text-sm text-gray-400">No admins assigned</p>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{admin.first_name} {admin.last_name}</p>
                    <p className="text-xs text-gray-400">{admin.email}</p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">admin</span>
                </div>
              ))
            )}
          </div>

          {staff.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">Other Members</h3>
              <div className="space-y-2">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{member.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
