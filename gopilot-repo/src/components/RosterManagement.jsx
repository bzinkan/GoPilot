import React, { useState, useCallback } from 'react';
import { 
  Upload, Download, RefreshCw, Search, Plus, Edit, Trash2, 
  Check, X, AlertTriangle, Users, Filter, ChevronDown,
  Link2, Unlink, FileSpreadsheet, Database, Clock, CheckCircle2,
  AlertCircle, Eye, UserPlus, Shield, Bus, Car, PersonStanding
} from 'lucide-react';

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

// Mock Data
const mockStudents = [
  { id: 'STU001', firstName: 'Emma', lastName: 'Thompson', grade: 'K', teacher: 'Mrs. Johnson', dismissalType: 'car', busRoute: null, status: 'active', parents: [{ name: 'Sarah Thompson', phone: '555-0101', email: 'sarah@email.com', relationship: 'Mother' }], lastSync: new Date() },
  { id: 'STU002', firstName: 'Jake', lastName: 'Thompson', grade: '3', teacher: 'Mr. Roberts', dismissalType: 'car', busRoute: null, status: 'active', parents: [{ name: 'Sarah Thompson', phone: '555-0101', email: 'sarah@email.com', relationship: 'Mother' }], lastSync: new Date() },
  { id: 'STU003', firstName: 'Sophia', lastName: 'Martinez', grade: '2', teacher: 'Mrs. Davis', dismissalType: 'bus', busRoute: '42', status: 'active', parents: [{ name: 'Maria Martinez', phone: '555-0102', email: 'maria@email.com', relationship: 'Mother' }], lastSync: new Date() },
  { id: 'STU004', firstName: 'Aiden', lastName: 'Chen', grade: '4', teacher: 'Mr. Roberts', dismissalType: 'walker', busRoute: null, status: 'active', parents: [{ name: 'Wei Chen', phone: '555-0103', email: 'wei@email.com', relationship: 'Father' }], lastSync: new Date() },
  { id: 'STU005', firstName: 'Mia', lastName: 'Williams', grade: '1', teacher: 'Mrs. Johnson', dismissalType: 'car', busRoute: null, status: 'active', parents: [{ name: 'Michael Williams', phone: '555-0104', email: 'mike@email.com', relationship: 'Father' }], lastSync: new Date() },
];

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
  const [students, setStudents] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterDismissal, setFilterDismissal] = useState('all');
  const [activeTab, setActiveTab] = useState('roster');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSISModal, setShowSISModal] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState(null);
  const [importStep, setImportStep] = useState(1);
  const [importData, setImportData] = useState(null);
  const [sisConnections, setSisConnections] = useState(sisProviders);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName} ${student.id}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesDismissal = filterDismissal === 'all' || student.dismissalType === filterDismissal;
    return matchesSearch && matchesGrade && matchesDismissal;
  });

  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
  const dismissalTypes = ['car', 'bus', 'walker', 'afterschool'];

  // Handle CSV file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simulate parsing CSV
      const mockParsedData = {
        fileName: file.name,
        totalRows: 156,
        validRows: 152,
        errors: [
          { row: 23, error: 'Missing student_id' },
          { row: 45, error: 'Invalid grade value' },
          { row: 89, error: 'Duplicate student_id' },
          { row: 134, error: 'Invalid dismissal_type' },
        ],
        preview: [
          { student_id: 'STU201', first_name: 'Oliver', last_name: 'Brown', grade: 'K', teacher: 'Mrs. Johnson', dismissal_type: 'car' },
          { student_id: 'STU202', first_name: 'Ava', last_name: 'Davis', grade: '2', teacher: 'Mrs. Davis', dismissal_type: 'bus', bus_route: '15' },
          { student_id: 'STU203', first_name: 'Liam', last_name: 'Wilson', grade: '4', teacher: 'Mr. Roberts', dismissal_type: 'walker' },
        ],
        columnMapping: {
          student_id: 'student_id',
          first_name: 'first_name',
          last_name: 'last_name',
          grade: 'grade',
          teacher: 'teacher_homeroom',
          dismissal_type: 'dismissal_type',
          bus_route: 'bus_route',
        }
      };
      setImportData(mockParsedData);
      setImportStep(2);
    }
  };

  // Simulate SIS sync
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

            {/* Student Table */}
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
                          {student.parents.length > 0 ? (
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
                            <button className="p-1.5 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded">
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
          </div>
        )}

        {/* Parent Connections Tab */}
        {activeTab === 'parents' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Pending Parent Connections</h2>
                <Badge variant="yellow">3 pending</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { parent: 'Jennifer Brown', email: 'jen@email.com', student: 'Oliver Brown', requestedAt: '2 hours ago' },
                  { parent: 'David Lee', email: 'david@email.com', student: 'Lily Chen', requestedAt: '5 hours ago' },
                  { parent: 'Amanda Garcia', email: 'amanda@email.com', student: 'Noah Garcia', requestedAt: '1 day ago' },
                ].map((request, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">{request.parent}</p>
                      <p className="text-sm text-gray-500">{request.email}</p>
                      <p className="text-sm text-gray-500">Requesting access to: <strong>{request.student}</strong></p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{request.requestedAt}</span>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm"><X className="w-4 h-4" /></Button>
                        <Button variant="success" size="sm"><Check className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-4">Connected Parents</h2>
              <div className="space-y-2">
                {students.flatMap(s => s.parents.map(p => ({ ...p, student: s }))).map((parent, i) => (
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
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  Custody Alerts (1)
                </h3>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Jake Thompson</p>
                      <p className="text-sm text-red-600">Tom Thompson (Father) - NOT AUTHORIZED</p>
                      <p className="text-xs text-gray-500">Court order on file: Case #2024-1234</p>
                    </div>
                    <Button variant="secondary" size="sm">View Details</Button>
                  </div>
                </div>
              </div>

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
                      {student.parents.map((parent, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{parent.name}</span>
                          <Badge variant="green" size="sm">{parent.relationship}</Badge>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <CheckCircle2 className="w-4 h-4 text-gray-400" />
                        <span>Linda Morrison</span>
                        <Badge variant="default" size="sm">Grandmother</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Sync History Tab */}
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
        onClose={() => { setShowImportModal(false); setImportStep(1); setImportData(null); }} 
        title="Import Students from CSV"
        size="lg"
      >
        {importStep === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
            </div>
            
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
                  {importData.validRows} valid rows • {importData.errors.length} errors
                </p>
              </div>
            </div>

            {importData.errors.length > 0 && (
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

            <div>
              <h3 className="font-medium mb-2">Preview (first 3 rows)</h3>
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

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setImportStep(1)}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setImportStep(3)}>
                Import {importData.validRows} Students
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
            <Button variant="primary" onClick={() => { setShowImportModal(false); setImportStep(1); }}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* SIS Integration Modal */}
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
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="Emma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="Thompson" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="STU001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select className="w-full p-2 border rounded-lg">
                {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homeroom Teacher</label>
            <select className="w-full p-2 border rounded-lg">
              <option>Mrs. Johnson</option>
              <option>Mr. Roberts</option>
              <option>Mrs. Davis</option>
              <option>Mrs. Clark</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dismissal Type</label>
              <select className="w-full p-2 border rounded-lg">
                <option value="car">Car Rider</option>
                <option value="bus">Bus Rider</option>
                <option value="walker">Walker</option>
                <option value="afterschool">After School</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus Route (if applicable)</label>
              <input type="text" className="w-full p-2 border rounded-lg" placeholder="42" />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                <input type="text" className="w-full p-2 border rounded-lg" placeholder="Sarah Thompson" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select className="w-full p-2 border rounded-lg">
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
                <input type="tel" className="w-full p-2 border rounded-lg" placeholder="555-0101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full p-2 border rounded-lg" placeholder="sarah@email.com" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1">
              Add Student
            </Button>
          </div>
        </form>
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
                <p className="text-sm text-gray-500">Bus Route</p>
                <p className="font-medium">{showStudentDetail.busRoute || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Parents/Guardians</h3>
              <div className="space-y-2">
                {showStudentDetail.parents.map((parent, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{parent.name}</p>
                      <p className="text-sm text-gray-500">{parent.relationship} • {parent.phone}</p>
                      <p className="text-sm text-gray-500">{parent.email}</p>
                    </div>
                    <Badge variant="green" size="sm">Primary</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Student
              </Button>
              <Button variant="danger" className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
