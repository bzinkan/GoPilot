import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, X, MessageSquare, ArrowRight,
  Phone, Mail, Users, School, AlertCircle, Edit, Save
} from 'lucide-react';
import * as superAdminApi from '../../api/superAdmin';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  converted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

export default function TrialRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesValue, setNotesValue] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getTrialRequests({ status: statusFilter !== 'all' ? statusFilter : undefined });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    await superAdminApi.updateTrialRequest(id, { status });
    loadRequests();
  };

  const handleSaveNotes = async (id) => {
    await superAdminApi.updateTrialRequest(id, { notes: notesValue });
    setEditingNotes(null);
    loadRequests();
  };

  const handleConvert = (request) => {
    const params = new URLSearchParams({
      name: request.school_name,
      email: request.contact_email,
      adminName: request.contact_name,
    });
    navigate(`/super-admin/schools/new?${params.toString()}`);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Requests</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600">{pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {['all', 'pending', 'contacted', 'converted', 'declined'].map((s) => (
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

      {/* Requests list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No trial requests found</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{request.school_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {request.contact_email}</p>
                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> {request.contact_name}</p>
                    {request.estimated_students && (
                      <p className="flex items-center gap-2"><School className="w-4 h-4 text-gray-400" /> ~{request.estimated_students} students</p>
                    )}
                    {request.domain && (
                      <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> {request.domain}</p>
                    )}
                  </div>
                  {request.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 inline mr-1 text-gray-400" />
                      {request.message}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-3">
                    {editingNotes === request.id ? (
                      <div className="flex items-center gap-2">
                        <input value={notesValue} onChange={(e) => setNotesValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Internal notes..." />
                        <button onClick={() => handleSaveNotes(request.id)} className="text-green-600"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingNotes(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNotes(request.id); setNotesValue(request.notes || ''); }}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        <Edit className="w-3 h-3" /> {request.notes || 'Add notes'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {request.status === 'pending' && (
                    <>
                      <button onClick={() => handleConvert(request)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                        <ArrowRight className="w-4 h-4" /> Convert
                      </button>
                      <button onClick={() => handleUpdateStatus(request.id, 'contacted')}
                        className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                        <Phone className="w-4 h-4" /> Contacted
                      </button>
                      <button onClick={() => handleUpdateStatus(request.id, 'declined')}
                        className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  {request.status === 'contacted' && (
                    <>
                      <button onClick={() => handleConvert(request)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                        <ArrowRight className="w-4 h-4" /> Convert
                      </button>
                      <button onClick={() => handleUpdateStatus(request.id, 'declined')}
                        className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  <p className="text-xs text-gray-400 text-right">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
