import React, { useState, useEffect, useCallback } from 'react';
import { 
  Car, Bus, PersonStanding, Clock, AlertTriangle, Check, X, Phone, 
  Users, Bell, Settings, BarChart3, QrCode, MessageSquare, Shield,
  ChevronRight, Search, Plus, Edit, Trash2, Eye, EyeOff, RefreshCw,
  MapPin, Timer, CheckCircle2, XCircle, AlertCircle, UserCheck,
  Home, LogOut, Menu, Calendar, FileText, HelpCircle, Zap
} from 'lucide-react';

// Mock Data
const initialStudents = [
  { id: 1, name: 'Emma Thompson', grade: 'K', teacher: 'Mrs. Johnson', dismissalType: 'car', status: 'in-class', photo: '👧', parentId: 1, siblingGroup: 'A' },
  { id: 2, name: 'Jake Thompson', grade: '3', teacher: 'Mr. Roberts', dismissalType: 'car', status: 'in-class', photo: '👦', parentId: 1, siblingGroup: 'A' },
  { id: 3, name: 'Sophia Martinez', grade: '2', teacher: 'Mrs. Davis', dismissalType: 'bus', busNumber: '42', status: 'in-class', photo: '👧' },
  { id: 4, name: 'Aiden Chen', grade: '4', teacher: 'Mr. Roberts', dismissalType: 'walker', status: 'in-class', photo: '👦' },
  { id: 5, name: 'Mia Williams', grade: '1', teacher: 'Mrs. Johnson', dismissalType: 'car', status: 'in-class', photo: '👧', parentId: 2 },
  { id: 6, name: 'Noah Davis', grade: '5', teacher: 'Mrs. Clark', dismissalType: 'bus', busNumber: '15', status: 'in-class', photo: '👦' },
  { id: 7, name: 'Lily Chen', grade: '2', teacher: 'Mrs. Davis', dismissalType: 'afterschool', program: 'Chess Club', status: 'in-class', photo: '👧' },
  { id: 8, name: 'Oliver Brown', grade: 'K', teacher: 'Mrs. Johnson', dismissalType: 'car', status: 'in-class', photo: '👦', parentId: 3 },
];

const initialParents = [
  { id: 1, name: 'Sarah Thompson', phone: '555-0101', email: 'sarah@email.com', students: [1, 2], photo: '👩' },
  { id: 2, name: 'Michael Williams', phone: '555-0102', email: 'mike@email.com', students: [5], photo: '👨' },
  { id: 3, name: 'Jennifer Brown', phone: '555-0103', email: 'jen@email.com', students: [8], photo: '👩' },
];

const initialAuthorizedPickups = [
  { id: 1, studentId: 1, name: 'Sarah Thompson', relationship: 'Mother', phone: '555-0101', photo: '👩', isParent: true },
  { id: 2, studentId: 1, name: 'Tom Thompson', relationship: 'Father', phone: '555-0104', photo: '👨', isParent: true },
  { id: 3, studentId: 1, name: 'Linda Morrison', relationship: 'Grandmother', phone: '555-0105', photo: '👵', isParent: false },
  { id: 4, studentId: 2, name: 'Sarah Thompson', relationship: 'Mother', phone: '555-0101', photo: '👩', isParent: true },
  { id: 5, studentId: 2, name: 'Tom Thompson', relationship: 'Father', phone: '555-0104', photo: '👨', isParent: true },
];

const initialCustodyAlerts = [
  { id: 1, studentId: 2, name: 'Tom Thompson', relationship: 'Father', reason: 'Court order - No contact', caseNumber: '2024-1234' }
];

const dismissalTypes = {
  car: { icon: Car, label: 'Car Rider', color: 'blue' },
  bus: { icon: Bus, label: 'Bus Rider', color: 'yellow' },
  walker: { icon: PersonStanding, label: 'Walker', color: 'green' },
  early: { icon: Clock, label: 'Early Pickup', color: 'purple' },
  afterschool: { icon: Users, label: 'After School', color: 'orange' }
};

// Utility Components
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
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
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
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className} disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">{children}</div>
      </div>
    </div>
  );
};

// Main App Component
export default function GoPilot() {
  const [currentRole, setCurrentRole] = useState('landing');
  const [students, setStudents] = useState(initialStudents);
  const [queue, setQueue] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dismissalActive, setDismissalActive] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(null);
  const [selectedParent, setSelectedParent] = useState(initialParents[0]);
  const [stats, setStats] = useState({ dismissed: 0, inQueue: 0, inTransit: 0, waiting: initialStudents.length });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update stats
  useEffect(() => {
    const dismissed = students.filter(s => s.status === 'picked-up').length;
    const inQueue = queue.length;
    const inTransit = students.filter(s => s.status === 'in-transit').length;
    const waiting = students.filter(s => s.status === 'in-class').length;
    setStats({ dismissed, inQueue, inTransit, waiting });
  }, [students, queue]);

  const addToQueue = (parentId, checkInMethod) => {
    const parent = initialParents.find(p => p.id === parentId);
    const studentIds = parent.students;
    const studentsToAdd = students.filter(s => studentIds.includes(s.id) && s.dismissalType === 'car' && s.status === 'in-class');
    
    if (studentsToAdd.length === 0) return;

    const queueEntry = {
      id: Date.now(),
      parentId,
      parentName: parent.name,
      parentPhoto: parent.photo,
      students: studentsToAdd,
      checkInMethod,
      checkInTime: new Date(),
      status: 'waiting',
      position: queue.length + 1,
      zone: studentsToAdd[0].grade <= '2' ? 'A' : 'B'
    };

    setQueue(prev => [...prev, queueEntry]);
    addNotification(`${parent.name} checked in via ${checkInMethod}`, 'info');
  };

  const callStudent = (queueEntryId) => {
    setQueue(prev => prev.map(entry => 
      entry.id === queueEntryId ? { ...entry, status: 'called', calledAt: new Date() } : entry
    ));
    const entry = queue.find(e => e.id === queueEntryId);
    if (entry) {
      entry.students.forEach(student => {
        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, status: 'called' } : s
        ));
      });
      addNotification(`Called: ${entry.students.map(s => s.name).join(', ')} to Zone ${entry.zone}`, 'success');
    }
  };

  const dismissStudent = (queueEntryId) => {
    const entry = queue.find(e => e.id === queueEntryId);
    if (entry) {
      entry.students.forEach(student => {
        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, status: 'in-transit', transitTime: new Date() } : s
        ));
      });
      setQueue(prev => prev.map(e => 
        e.id === queueEntryId ? { ...e, status: 'in-transit' } : e
      ));
    }
  };

  const completePickup = (queueEntryId) => {
    const entry = queue.find(e => e.id === queueEntryId);
    if (entry) {
      entry.students.forEach(student => {
        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, status: 'picked-up', pickedUpTime: new Date() } : s
        ));
      });
      setQueue(prev => prev.filter(e => e.id !== queueEntryId));
      addNotification(`Pickup complete: ${entry.students.map(s => s.name).join(', ')}`, 'success');
    }
  };

  const submitChangeRequest = (studentId, newType, reason, details = {}) => {
    const student = students.find(s => s.id === studentId);
    const request = {
      id: Date.now(),
      studentId,
      studentName: student.name,
      currentType: student.dismissalType,
      newType,
      reason,
      details,
      submittedAt: new Date(),
      status: 'pending'
    };
    setChangeRequests(prev => [...prev, request]);
    addNotification(`Change request submitted for ${student.name}`, 'info');
  };

  const handleChangeRequest = (requestId, approved) => {
    const request = changeRequests.find(r => r.id === requestId);
    if (approved && request) {
      setStudents(prev => prev.map(s => 
        s.id === request.studentId ? { ...s, dismissalType: request.newType, changed: true } : s
      ));
    }
    setChangeRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: approved ? 'approved' : 'denied' } : r
    ));
    addNotification(`Change request ${approved ? 'approved' : 'denied'} for ${request.studentName}`, approved ? 'success' : 'warning');
  };

  const addNotification = (message, type = 'info') => {
    const notification = { id: Date.now(), message, type, time: new Date() };
    setNotifications(prev => [notification, ...prev].slice(0, 20));
  };

  const releaseBus = (busNumber) => {
    const busStudents = students.filter(s => s.dismissalType === 'bus' && s.busNumber === busNumber && s.status === 'in-class');
    busStudents.forEach(student => {
      setStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, status: 'picked-up', pickedUpTime: new Date() } : s
      ));
    });
    addNotification(`Bus ${busNumber} released - ${busStudents.length} students`, 'success');
  };

  const releaseWalkers = () => {
    const walkers = students.filter(s => s.dismissalType === 'walker' && s.status === 'in-class');
    walkers.forEach(student => {
      setStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, status: 'picked-up', pickedUpTime: new Date() } : s
      ));
    });
    addNotification(`Walkers released - ${walkers.length} students`, 'success');
  };

  // Landing Page
  if (currentRole === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Car className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-5xl font-bold text-white">GoPilot</h1>
            </div>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              The modern school dismissal system that keeps students safe and parents informed
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {[
              { role: 'parent', icon: Users, title: 'Parent App', desc: 'Check in, manage pickups, request changes', color: 'from-blue-500 to-blue-600' },
              { role: 'teacher', icon: Bell, title: 'Teacher View', desc: 'See dismissal roster, receive notifications', color: 'from-green-500 to-green-600' },
              { role: 'office', icon: Shield, title: 'Front Office', desc: 'Manage queue, verify pickups, handle requests', color: 'from-purple-500 to-purple-600' },
              { role: 'admin', icon: Settings, title: 'Admin Panel', desc: 'Configure settings, view reports', color: 'from-orange-500 to-orange-600' },
            ].map(item => (
              <Card 
                key={item.role}
                onClick={() => setCurrentRole(item.role)}
                className="overflow-hidden hover:scale-105 transition-transform cursor-pointer"
              >
                <div className={`bg-gradient-to-r ${item.color} p-6`}>
                  <item.icon className="w-12 h-12 text-white mb-3" />
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Why Schools Choose GoPilot</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: 'Faster Dismissal', desc: 'Reduce carline time by up to 50%' },
                { icon: Shield, title: 'Enhanced Safety', desc: 'Verify every pickup, track every student' },
                { icon: MessageSquare, title: 'Real-Time Updates', desc: 'Parents know exactly when to arrive' },
              ].map((feature, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Note */}
          <p className="text-center text-white/70 mt-8">
            This is a fully interactive demo. Select a role above to explore the system.
          </p>
        </div>
      </div>
    );
  }

  // Shared Header Component
  const Header = ({ title, subtitle }) => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentRole('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
            <Home className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {emergencyMode && (
            <Badge variant="red">🚨 {emergencyMode.toUpperCase()}</Badge>
          )}
        </div>
      </div>
    </header>
  );

  // ==================== PARENT APP ====================
  if (currentRole === 'parent') {
    return <ParentApp 
      parent={selectedParent}
      students={students}
      queue={queue}
      changeRequests={changeRequests}
      onCheckIn={(method) => addToQueue(selectedParent.id, method)}
      onSubmitChange={submitChangeRequest}
      Header={Header}
    />;
  }

  // ==================== TEACHER VIEW ====================
  if (currentRole === 'teacher') {
    return <TeacherView 
      students={students}
      notifications={notifications}
      onDismiss={dismissStudent}
      queue={queue}
      Header={Header}
    />;
  }

  // ==================== FRONT OFFICE ====================
  if (currentRole === 'office') {
    return <FrontOffice 
      students={students}
      queue={queue}
      changeRequests={changeRequests}
      notifications={notifications}
      stats={stats}
      onCallStudent={callStudent}
      onDismiss={dismissStudent}
      onCompletePickup={completePickup}
      onHandleChangeRequest={handleChangeRequest}
      onReleaseBus={releaseBus}
      onReleaseWalkers={releaseWalkers}
      onAddToQueue={addToQueue}
      emergencyMode={emergencyMode}
      setEmergencyMode={setEmergencyMode}
      Header={Header}
    />;
  }

  // ==================== ADMIN PANEL ====================
  if (currentRole === 'admin') {
    return <AdminPanel 
      students={students}
      stats={stats}
      queue={queue}
      Header={Header}
    />;
  }

  return null;
}

// ==================== PARENT APP COMPONENT ====================
function ParentApp({ parent, students, queue, changeRequests, onCheckIn, onSubmitChange, Header }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);

  const myStudents = students.filter(s => parent.students.includes(s.id));
  const myQueueEntry = queue.find(q => q.parentId === parent.id);
  const myChangeRequests = changeRequests.filter(r => parent.students.includes(r.studentId));

  const handleCheckIn = (method) => {
    onCheckIn(method);
    setCheckedIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="GoPilot" subtitle={`Welcome, ${parent.name.split(' ')[0]}`} />
      
      <main className="pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Quick Status */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Today's Dismissal</h2>
              <div className="space-y-3">
                {myStudents.map(student => {
                  const typeInfo = dismissalTypes[student.dismissalType];
                  const TypeIcon = typeInfo.icon;
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{student.photo}</span>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">Grade {student.grade} • {student.teacher}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={typeInfo.color} size="sm">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        {student.changed && <Badge variant="yellow" size="sm">Changed</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Check-In Section */}
            {!checkedIn && !myQueueEntry ? (
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Ready to Pick Up?</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Check in when you arrive at school to join the pickup queue.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="primary" className="flex-col py-4" onClick={() => handleCheckIn('App')}>
                    <MapPin className="w-6 h-6 mb-1" />
                    <span>I'm Here</span>
                  </Button>
                  <Button variant="secondary" className="flex-col py-4" onClick={() => handleCheckIn('QR')}>
                    <QrCode className="w-6 h-6 mb-1" />
                    <span>Scan QR</span>
                  </Button>
                  <Button variant="secondary" className="flex-col py-4" onClick={() => handleCheckIn('SMS')}>
                    <MessageSquare className="w-6 h-6 mb-1" />
                    <span>SMS</span>
                  </Button>
                </div>
              </Card>
            ) : myQueueEntry ? (
              <Card className="p-4 border-2 border-indigo-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-indigo-600">You're Checked In!</h2>
                  <Badge variant="blue">#{myQueueEntry.position} in line</Badge>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600 mb-1">
                    {myQueueEntry.status === 'waiting' ? '~4 min' : myQueueEntry.status === 'called' ? 'NOW' : 'En Route'}
                  </p>
                  <p className="text-sm text-indigo-600">Estimated wait time</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pickup Zone</span>
                  <span className="font-semibold">Zone {myQueueEntry.zone}</span>
                </div>
                {myQueueEntry.status === 'called' && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="font-semibold text-green-800">Proceed to Zone {myQueueEntry.zone}</p>
                    <p className="text-sm text-green-600">Your children are on their way!</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-4 border-2 border-green-500">
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Check-in Successful!</p>
                  <p className="text-sm text-gray-600 mt-1">You've been added to the pickup queue.</p>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setShowChangeModal(true); setSelectedStudent(myStudents[0]); }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Change Dismissal</p>
                    <p className="text-xs text-gray-500">Request a change</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Manage Pickups</p>
                    <p className="text-xs text-gray-500">Authorized people</p>
                  </div>
                </button>
              </div>
            </Card>

            {/* Recent Activity */}
            {myChangeRequests.length > 0 && (
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Change Requests</h2>
                <div className="space-y-2">
                  {myChangeRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{request.studentName}</p>
                        <p className="text-xs text-gray-500">{request.currentType} → {request.newType}</p>
                      </div>
                      <Badge 
                        variant={request.status === 'pending' ? 'yellow' : request.status === 'approved' ? 'green' : 'red'}
                        size="sm"
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'children' && (
          <div className="p-4 space-y-4">
            <h2 className="font-semibold">My Children</h2>
            {myStudents.map(student => (
              <Card key={student.id} className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{student.photo}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <p className="text-gray-500">Grade {student.grade} • {student.teacher}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Dismissal Type</span>
                    <Badge variant={dismissalTypes[student.dismissalType].color}>
                      {dismissalTypes[student.dismissalType].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium capitalize">{student.status.replace('-', ' ')}</span>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  className="w-full mt-4"
                  onClick={() => { setSelectedStudent(student); setShowChangeModal(true); }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Change
                </Button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-4">
            <h2 className="font-semibold">Pickup History</h2>
            {[
              { date: 'Today', student: 'Emma T.', type: 'Car', time: '3:12 PM', by: 'Mom' },
              { date: 'Yesterday', student: 'Jake T.', type: 'Bus', time: '3:15 PM', by: 'Bus 42' },
              { date: 'Jan 27', student: 'Emma T.', type: 'Car', time: '2:45 PM', by: 'Grandma (Linda)' },
            ].map((entry, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{entry.student}</p>
                    <p className="text-sm text-gray-500">{entry.date} at {entry.time}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="blue" size="sm">{entry.type}</Badge>
                    <p className="text-xs text-gray-500 mt-1">{entry.by}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'children', icon: Users, label: 'Children' },
            { id: 'history', icon: Clock, label: 'History' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Change Request Modal */}
      <Modal isOpen={showChangeModal} onClose={() => setShowChangeModal(false)} title="Request Dismissal Change">
        {selectedStudent && (
          <ChangeRequestForm 
            student={selectedStudent}
            onSubmit={(newType, reason, details) => {
              onSubmitChange(selectedStudent.id, newType, reason, details);
              setShowChangeModal(false);
            }}
            onCancel={() => setShowChangeModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}

// Change Request Form Component
function ChangeRequestForm({ student, onSubmit, onCancel }) {
  const [newType, setNewType] = useState('car');
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500 mb-1">Student</p>
        <p className="font-medium">{student.name}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">Current Dismissal</p>
        <Badge variant={dismissalTypes[student.dismissalType].color}>
          {dismissalTypes[student.dismissalType].label}
        </Badge>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">New Dismissal Type</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(dismissalTypes).filter(([key]) => key !== 'afterschool').map(([key, value]) => {
            const Icon = value.icon;
            return (
              <button
                key={key}
                onClick={() => setNewType(key)}
                className={`p-3 rounded-lg border-2 text-left ${newType === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                <Icon className={`w-5 h-5 mb-1 ${newType === key ? 'text-indigo-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">{value.label}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Doctor's appointment"
          className="w-full p-3 border rounded-lg resize-none"
          rows={2}
        />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={() => onSubmit(newType, reason)}>
          Submit Request
        </Button>
      </div>
    </div>
  );
}

// ==================== TEACHER VIEW COMPONENT ====================
function TeacherView({ students, notifications, onDismiss, queue, Header }) {
  const [selectedTeacher] = useState('Mrs. Johnson');
  const [showNotifications, setShowNotifications] = useState(false);

  const myStudents = students.filter(s => s.teacher === selectedTeacher);
  const recentNotifications = notifications.filter(n => 
    n.message.includes('Called') || n.message.includes('released')
  ).slice(0, 10);

  const calledStudents = myStudents.filter(s => s.status === 'called');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Teacher Dashboard" subtitle={selectedTeacher} />
      
      {/* Alert Banner for Called Students */}
      {calledStudents.length > 0 && (
        <div className="bg-green-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="font-semibold">
                {calledStudents.length} student{calledStudents.length > 1 ? 's' : ''} called for pickup!
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="p-4 space-y-4">
        {/* Called Students - Priority */}
        {calledStudents.length > 0 && (
          <Card className="border-2 border-green-500">
            <div className="p-4 bg-green-50 border-b border-green-200">
              <h2 className="font-semibold text-green-800 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Ready for Pickup
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {calledStudents.map(student => {
                const queueEntry = queue.find(q => q.students.some(s => s.id === student.id));
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{student.photo}</span>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-green-600">Zone {queueEntry?.zone || 'A'} - {queueEntry?.parentName}</p>
                      </div>
                    </div>
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => onDismiss(queueEntry?.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Today's Roster */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold">Today's Dismissal Roster</h2>
            <p className="text-sm text-gray-500">{myStudents.length} students</p>
          </div>
          <div className="p-4">
            {/* Group by dismissal type */}
            {Object.entries(dismissalTypes).map(([type, info]) => {
              const typeStudents = myStudents.filter(s => s.dismissalType === type);
              if (typeStudents.length === 0) return null;
              const TypeIcon = info.icon;
              return (
                <div key={type} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className={`w-4 h-4 text-${info.color}-600`} />
                    <span className="text-sm font-medium text-gray-700">{info.label}</span>
                    <Badge variant={info.color} size="sm">{typeStudents.length}</Badge>
                  </div>
                  <div className="space-y-2 pl-6">
                    {typeStudents.map(student => (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          student.status === 'called' ? 'bg-green-100' :
                          student.status === 'in-transit' ? 'bg-yellow-100' :
                          student.status === 'picked-up' ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{student.photo}</span>
                          <span className={student.status === 'picked-up' ? 'text-gray-400 line-through' : ''}>
                            {student.name}
                          </span>
                          {student.changed && (
                            <Badge variant="yellow" size="sm">Changed</Badge>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          student.status === 'called' ? 'bg-green-200 text-green-800' :
                          student.status === 'in-transit' ? 'bg-yellow-200 text-yellow-800' :
                          student.status === 'picked-up' ? 'bg-gray-200 text-gray-600' : 'text-gray-500'
                        }`}>
                          {student.status === 'in-class' ? 'Waiting' : student.status.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Notifications</h2>
            <Badge variant="blue" size="sm">{recentNotifications.length}</Badge>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications yet</p>
            ) : (
              recentNotifications.map(notification => (
                <div key={notification.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'success' ? 'bg-green-500' : 
                    notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-400">
                      {notification.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

// ==================== FRONT OFFICE COMPONENT ====================
function FrontOffice({ 
  students, queue, changeRequests, notifications, stats,
  onCallStudent, onDismiss, onCompletePickup, onHandleChangeRequest,
  onReleaseBus, onReleaseWalkers, onAddToQueue,
  emergencyMode, setEmergencyMode, Header 
}) {
  const [activeTab, setActiveTab] = useState('queue');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedQueueEntry, setSelectedQueueEntry] = useState(null);
  const [showManualAdd, setShowManualAdd] = useState(false);

  const pendingRequests = changeRequests.filter(r => r.status === 'pending');
  const buses = [...new Set(students.filter(s => s.dismissalType === 'bus').map(s => s.busNumber))];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Front Office Dashboard" subtitle="Dismissal Management" />
      
      {/* Emergency Banner */}
      {emergencyMode && (
        <div className="bg-red-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">{emergencyMode.toUpperCase()} MODE ACTIVE</span>
              <span>- All dismissals paused</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEmergencyMode(null)}>
              Lift {emergencyMode}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.dismissed}</p>
            <p className="text-xs text-gray-500">Dismissed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inQueue}</p>
            <p className="text-xs text-gray-500">In Queue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inTransit}</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.waiting}</p>
            <p className="text-xs text-gray-500">Waiting</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <div className="flex gap-4">
          {[
            { id: 'queue', label: 'Pickup Queue', count: queue.length },
            { id: 'changes', label: 'Change Requests', count: pendingRequests.length },
            { id: 'buses', label: 'Buses & Walkers' },
            { id: 'alerts', label: 'Alerts', count: notifications.filter(n => n.type === 'warning').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="p-4">
        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Active Pickup Queue</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowManualAdd(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Manual Add
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => {
                    const next = queue.find(q => q.status === 'waiting');
                    if (next) onCallStudent(next.id);
                  }}
                  disabled={emergencyMode || !queue.some(q => q.status === 'waiting')}
                >
                  Call Next
                </Button>
              </div>
            </div>

            {queue.length === 0 ? (
              <Card className="p-8 text-center">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No vehicles in queue</p>
                <p className="text-sm text-gray-400">Parents will appear here when they check in</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {queue.map((entry, index) => (
                  <Card key={entry.id} className={`p-4 ${
                    entry.status === 'called' ? 'border-l-4 border-l-green-500' :
                    entry.status === 'in-transit' ? 'border-l-4 border-l-yellow-500' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{entry.parentPhoto}</span>
                            <span className="font-semibold">{entry.parentName}</span>
                            <Badge variant="blue" size="sm">{entry.checkInMethod}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {entry.students.map(s => (
                              <span key={s.id} className="text-sm text-gray-600">
                                {s.photo} {s.name} (Gr {s.grade})
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Checked in: {entry.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {entry.calledAt && ` • Called: ${entry.calledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="sm">Zone {entry.zone}</Badge>
                        {entry.status === 'waiting' && (
                          <>
                            <Button variant="success" size="sm" onClick={() => onCallStudent(entry.id)}>
                              <Bell className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                          </>
                        )}
                        {entry.status === 'called' && (
                          <Button variant="warning" size="sm" onClick={() => onDismiss(entry.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            In Transit
                          </Button>
                        )}
                        {entry.status === 'in-transit' && (
                          <Button variant="success" size="sm" onClick={() => onCompletePickup(entry.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedQueueEntry(entry); setShowVerifyModal(true); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Change Requests Tab */}
        {activeTab === 'changes' && (
          <div className="space-y-4">
            <h2 className="font-semibold">Pending Change Requests</h2>
            {pendingRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending requests</p>
              </Card>
            ) : (
              pendingRequests.map(request => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{request.studentName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={dismissalTypes[request.currentType].color} size="sm">
                          {dismissalTypes[request.currentType].label}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <Badge variant={dismissalTypes[request.newType].color} size="sm">
                          {dismissalTypes[request.newType].label}
                        </Badge>
                      </div>
                      {request.reason && (
                        <p className="text-sm text-gray-500 mt-1">Reason: {request.reason}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {request.submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" onClick={() => onHandleChangeRequest(request.id, false)}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button variant="success" size="sm" onClick={() => onHandleChangeRequest(request.id, true)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Buses & Walkers Tab */}
        {activeTab === 'buses' && (
          <div className="space-y-4">
            {/* Buses */}
            <Card className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Bus Routes
              </h2>
              <div className="space-y-3">
                {buses.map(busNumber => {
                  const busStudents = students.filter(s => s.dismissalType === 'bus' && s.busNumber === busNumber);
                  const released = busStudents.every(s => s.status === 'picked-up');
                  return (
                    <div key={busNumber} className={`flex items-center justify-between p-3 rounded-lg ${released ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div>
                        <p className="font-medium">Bus {busNumber}</p>
                        <p className="text-sm text-gray-500">{busStudents.length} students</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {released ? (
                          <Badge variant="green">Released</Badge>
                        ) : (
                          <Button variant="warning" size="sm" onClick={() => onReleaseBus(busNumber)}>
                            Release Bus
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Walkers */}
            <Card className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <PersonStanding className="w-5 h-5" />
                Walkers
              </h2>
              {(() => {
                const walkers = students.filter(s => s.dismissalType === 'walker');
                const released = walkers.every(s => s.status === 'picked-up');
                return (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${released ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-medium">{walkers.length} Walkers</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {walkers.map(s => (
                          <span key={s.id} className="text-xs bg-white px-2 py-0.5 rounded">
                            {s.photo} {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {released ? (
                      <Badge variant="green">Released</Badge>
                    ) : (
                      <Button variant="success" size="sm" onClick={onReleaseWalkers}>
                        Release Walkers
                      </Button>
                    )}
                  </div>
                );
              })()}
            </Card>

            {/* Emergency Controls */}
            <Card className="p-4 border-red-200">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Emergency Controls
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant={emergencyMode === 'lockdown' ? 'danger' : 'secondary'}
                  onClick={() => setEmergencyMode(emergencyMode === 'lockdown' ? null : 'lockdown')}
                >
                  {emergencyMode === 'lockdown' ? 'End Lockdown' : 'Lockdown'}
                </Button>
                <Button 
                  variant={emergencyMode === 'weather' ? 'warning' : 'secondary'}
                  onClick={() => setEmergencyMode(emergencyMode === 'weather' ? null : 'weather')}
                >
                  {emergencyMode === 'weather' ? 'End Delay' : 'Weather Delay'}
                </Button>
                <Button 
                  variant={emergencyMode === 'early' ? 'primary' : 'secondary'}
                  onClick={() => setEmergencyMode(emergencyMode === 'early' ? null : 'early')}
                >
                  {emergencyMode === 'early' ? 'End Early' : 'Early Release'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <div className="space-y-2">
              {notifications.slice(0, 20).map(notification => (
                <Card key={notification.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'success' ? 'bg-green-100' : 
                      notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {notification.type === 'success' ? <Check className="w-4 h-4 text-green-600" /> :
                       notification.type === 'warning' ? <AlertCircle className="w-4 h-4 text-yellow-600" /> :
                       <Bell className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {notification.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Verification Modal */}
      <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title="Verify Pickup" size="lg">
        {selectedQueueEntry && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-4xl">{selectedQueueEntry.parentPhoto}</span>
              <div>
                <p className="font-semibold text-lg">{selectedQueueEntry.parentName}</p>
                <p className="text-gray-500">Checked in via {selectedQueueEntry.checkInMethod}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Students to Pick Up</h3>
              <div className="space-y-2">
                {selectedQueueEntry.students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{student.photo}</span>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500">Grade {student.grade} • {student.teacher}</p>
                      </div>
                    </div>
                    <Badge variant="green">Authorized</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Authorized Pickups</h3>
              <div className="space-y-2">
                {initialAuthorizedPickups
                  .filter(ap => selectedQueueEntry.students.some(s => s.id === ap.studentId))
                  .filter((ap, index, self) => self.findIndex(a => a.name === ap.name) === index)
                  .map(ap => (
                    <div key={ap.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <span className="text-xl">{ap.photo}</span>
                      <div>
                        <p className="text-sm font-medium">{ap.name}</p>
                        <p className="text-xs text-gray-500">{ap.relationship}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={() => setShowVerifyModal(false)}>
                <X className="w-4 h-4 mr-2" />
                Flag Issue
              </Button>
              <Button variant="success" className="flex-1" onClick={() => { onCompletePickup(selectedQueueEntry.id); setShowVerifyModal(false); }}>
                <Check className="w-4 h-4 mr-2" />
                Verify & Release
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Add Modal */}
      <Modal isOpen={showManualAdd} onClose={() => setShowManualAdd(false)} title="Manual Queue Entry">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a parent to add to the queue:</p>
          {initialParents.map(parent => {
            const inQueue = queue.some(q => q.parentId === parent.id);
            return (
              <button
                key={parent.id}
                disabled={inQueue}
                onClick={() => { onAddToQueue(parent.id, 'Manual'); setShowManualAdd(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                  inQueue ? 'bg-gray-100 opacity-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{parent.photo}</span>
                <div>
                  <p className="font-medium">{parent.name}</p>
                  <p className="text-sm text-gray-500">
                    {students.filter(s => parent.students.includes(s.id)).map(s => s.name).join(', ')}
                  </p>
                </div>
                {inQueue && <Badge variant="blue" size="sm">In Queue</Badge>}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

// ==================== ADMIN PANEL COMPONENT ====================
function AdminPanel({ students, stats, queue, Header }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Admin Panel" subtitle="GoPilot Configuration" />

      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <div className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'reports', label: 'Reports', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium ${
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

      <main className="p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.dismissed}</p>
                    <p className="text-sm text-gray-500">Dismissed</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inQueue}</p>
                    <p className="text-sm text-gray-500">In Queue</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Timer className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3.2</p>
                    <p className="text-sm text-gray-500">Avg Wait (min)</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{students.filter(s => s.dismissalType === 'car').length}</p>
                    <p className="text-sm text-gray-500">Car Riders</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Dismissal Breakdown */}
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Dismissal Type Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(dismissalTypes).map(([type, info]) => {
                  const count = students.filter(s => s.dismissalType === type).length;
                  const percentage = Math.round((count / students.length) * 100);
                  const Icon = info.icon;
                  return (
                    <div key={type} className="flex items-center gap-4">
                      <div className="w-32 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{info.label}</span>
                      </div>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${info.color}-500 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Today's Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Change Requests</p>
                  <p className="text-xl font-bold">12 approved, 1 denied</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Manual Verifications</p>
                  <p className="text-xl font-bold">2 (resolved)</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Late Pickups</p>
                  <p className="text-xl font-bold">1</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Incidents</p>
                  <p className="text-xl font-bold text-green-600">0</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Check-In Methods</h2>
              <div className="space-y-3">
                {[
                  { id: 'app', label: 'App Check-In', desc: 'Parents use the GoPilot app', enabled: true },
                  { id: 'sms', label: 'SMS Check-In', desc: 'Parents text student code', enabled: true },
                  { id: 'qr', label: 'QR Tag Scanning', desc: 'Staff scan parent QR tags', enabled: true },
                ].map(method => (
                  <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={method.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-4">Timing Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard Dismissal Time</label>
                  <input type="time" defaultValue="15:10" className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Change Request Cutoff</label>
                  <input type="time" defaultValue="14:00" className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Pickup Threshold (minutes)</label>
                  <input type="number" defaultValue="15" className="w-full p-2 border rounded-lg" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-4">Pickup Zones</h2>
              <div className="space-y-2">
                {[
                  { zone: 'A', grades: 'K-2' },
                  { zone: 'B', grades: '3-5' },
                  { zone: 'C', grades: '6-8' },
                ].map(z => (
                  <div key={z.zone} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="purple">Zone {z.zone}</Badge>
                    <span className="text-sm">Grades {z.grades}</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Generate Reports</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Daily Summary', desc: 'Complete dismissal log for today', icon: Calendar },
                  { title: 'Weekly Analytics', desc: 'Trends and patterns', icon: BarChart3 },
                  { title: 'Change Requests', desc: 'All requests and outcomes', icon: RefreshCw },
                  { title: 'Incident Report', desc: 'Verifications and alerts', icon: AlertTriangle },
                ].map(report => (
                  <button key={report.title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
                    <report.icon className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-gray-500">{report.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-4">End of Day Report Preview</h2>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <p className="font-bold mb-2">DISMISSAL SUMMARY - January 29, 2026</p>
                <p>────────────────────────────────</p>
                <p>Total Students: {students.length}</p>
                <p>Car Riders: {students.filter(s => s.dismissalType === 'car').length}</p>
                <p>Bus Riders: {students.filter(s => s.dismissalType === 'bus').length}</p>
                <p>Walkers: {students.filter(s => s.dismissalType === 'walker').length}</p>
                <p>After-School: {students.filter(s => s.dismissalType === 'afterschool').length}</p>
                <p className="mt-2">Average Wait Time: 3.2 minutes</p>
                <p>Change Requests: 12 approved, 1 denied</p>
                <p>Incidents: 0</p>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
