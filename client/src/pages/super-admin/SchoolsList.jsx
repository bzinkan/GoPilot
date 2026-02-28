import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School, Users, Plus, Search, MoreVertical, Eye, Pause, Play, Trash2,
  AlertCircle, CheckCircle2, Clock, UserCheck
} from 'lucide-react';
import * as superAdminApi from '../../api/superAdmin';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
};

export default function SchoolsList() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schoolsRes, statsRes] = await Promise.all([
        superAdminApi.getSchools({ search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }),
        superAdminApi.getStats(),
      ]);
      setSchools(schoolsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleSuspend = async (id) => {
    await superAdminApi.suspendSchool(id);
    setActionMenu(null);
    loadData();
  };

  const handleRestore = async (id) => {
    await superAdminApi.restoreSchool(id);
    setActionMenu(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school? This can be undone.')) return;
    await superAdminApi.deleteSchool(id);
    setActionMenu(null);
    loadData();
  };

  const handleImpersonate = async (id) => {
    try {
      const res = await superAdminApi.impersonateSchool(id);
      localStorage.setItem('superAdminToken', localStorage.getItem('token'));
      localStorage.setItem('token', res.data.token);
      window.location.href = '/home';
    } catch (err) {
      console.error('Impersonation failed:', err);
    }
  };

  const statCards = [
    { label: 'Total Schools', value: stats.total_schools || 0, icon: School, color: 'indigo' },
    { label: 'Active', value: stats.active_schools || 0, icon: CheckCircle2, color: 'green' },
    { label: 'Trial', value: stats.trial_schools || 0, icon: Clock, color: 'blue' },
    { label: 'Total Students', value: stats.total_students || 0, icon: Users, color: 'purple' },
    { label: 'Pending Requests', value: stats.pending_requests || 0, icon: AlertCircle, color: 'orange' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
        <button
          onClick={() => navigate('/super-admin/schools/new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Create School
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${card.color}-100`}>
                <card.icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </form>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'active', 'trial', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize ${
                statusFilter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Schools table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-500">School</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Admins</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Students</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Created</th>
              <th className="w-12 p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No schools found</td></tr>
            ) : (
              schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {school.name}
                    </button>
                    {school.billing_email && (
                      <p className="text-xs text-gray-400">{school.billing_email}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[school.status] || 'bg-gray-100 text-gray-800'}`}>
                      {school.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{school.admin_count}</td>
                  <td className="p-4 text-sm text-gray-600">{school.student_count}</td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === school.id ? null : school.id)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {actionMenu === school.id && (
                      <div className="absolute right-4 top-12 bg-white border rounded-lg shadow-lg py-1 z-10 w-48">
                        <button onClick={() => { navigate(`/super-admin/schools/${school.id}`); setActionMenu(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                        <button onClick={() => handleImpersonate(school.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          <UserCheck className="w-4 h-4" /> Impersonate Admin
                        </button>
                        {school.status === 'suspended' ? (
                          <button onClick={() => handleRestore(school.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-green-600">
                            <Play className="w-4 h-4" /> Restore
                          </button>
                        ) : (
                          <button onClick={() => handleSuspend(school.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-orange-600">
                            <Pause className="w-4 h-4" /> Suspend
                          </button>
                        )}
                        <button onClick={() => handleDelete(school.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-600">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
