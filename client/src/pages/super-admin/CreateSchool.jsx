import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, School, UserPlus, CheckCircle2, Copy, AlertCircle } from 'lucide-react';
import * as superAdminApi from '../../api/superAdmin';

export default function CreateSchool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: searchParams.get('name') || '',
    address: '',
    phone: '',
    timezone: 'America/New_York',
    dismissalTime: '15:00',
    status: 'trial',
    maxStudents: 200,
    trialDays: 30,
    billingEmail: searchParams.get('email') || '',
    adminEmail: searchParams.get('email') || '',
    adminFirstName: searchParams.get('adminName')?.split(' ')[0] || '',
    adminLastName: searchParams.get('adminName')?.split(' ').slice(1).join(' ') || '',
    adminPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return setError('School name is required');
    setSubmitting(true);
    setError(null);

    try {
      const res = await superAdminApi.createSchool(form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create school');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    const text = `Email: ${form.adminEmail}\nPassword: ${result.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">School Created!</h2>
          <p className="text-gray-500 mb-6">{result.school.name} has been set up successfully.</p>

          {result.tempPassword && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">Admin Credentials</h3>
              <p className="text-sm text-gray-600">Email: <span className="font-mono font-medium">{form.adminEmail}</span></p>
              <p className="text-sm text-gray-600">Temp Password: <span className="font-mono font-medium">{result.tempPassword}</span></p>
              <button
                onClick={copyCredentials}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/super-admin/schools')}
              className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Back to Schools
            </button>
            <button
              onClick={() => navigate(`/super-admin/schools/${result.school.id}`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              View School
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/super-admin/schools')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Schools
      </button>

      <h1 className="text-2xl font-bold mb-6">Create School</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School Info */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" /> School Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-3 py-2 border rounded-lg" placeholder="Lincoln Elementary" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" placeholder="123 Main St" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select name="timezone" value={form.timezone} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="America/New_York">Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="trial">Trial</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input name="maxStudents" type="number" value={form.maxStudents} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            {form.status === 'trial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trial Days</label>
                <input name="trialDays" type="number" value={form.trialDays} onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
              <input name="billingEmail" type="email" value={form.billingEmail} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" placeholder="billing@school.edu" />
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> First Admin (Optional)
          </h2>
          <p className="text-sm text-gray-500 mb-4">Create the school's first admin account. A temporary password will be generated if not specified.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <input name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" placeholder="admin@school.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input name="adminFirstName" value={form.adminFirstName} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input name="adminLastName" value={form.adminLastName} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
              <input name="adminPassword" type="text" value={form.adminPassword} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" placeholder="Leave blank to auto-generate" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/super-admin/schools')}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-300">
            {submitting ? 'Creating...' : 'Create School'}
          </button>
        </div>
      </form>
    </div>
  );
}
