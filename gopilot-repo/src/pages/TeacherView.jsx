import React, { useState, useEffect } from 'react';
import { 
  Car, Bus, PersonStanding, Clock, Users, Bell, Check, X,
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Timer,
  Volume2, VolumeX, Settings, LogOut, Home, RefreshCw, User,
  AlertCircle, Send, Coffee, Hand, MapPin, Smartphone, Filter
} from 'lucide-react';

// Utility Components
const Badge = ({ children, variant = 'default', size = 'md', pulse = false }) => {
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
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variants[variant]} ${sizes[size]} ${pulse ? 'animate-pulse' : ''}`}>
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

// Main Teacher View Component
export default function TeacherView() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [filterDismissal, setFilterDismissal] = useState('all');
  const [showDismissedStudents, setShowDismissedStudents] = useState(false);

  // Teacher info
  const teacher = {
    name: 'Mrs. Johnson',
    grade: 'K',
    room: '104',
    homeroom: 'Kindergarten - Room 104',
  };

  // Students state
  const [students, setStudents] = useState([
    { id: 1, firstName: 'Emma', lastName: 'Thompson', dismissalType: 'car', status: 'called', calledAt: new Date(Date.now() - 60000), zone: 'A', guardian: 'Sarah Thompson' },
    { id: 2, firstName: 'Oliver', lastName: 'Brown', dismissalType: 'car', status: 'called', calledAt: new Date(Date.now() - 30000), zone: 'B', guardian: 'Michael Brown' },
    { id: 3, firstName: 'Mia', lastName: 'Williams', dismissalType: 'car', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 4, firstName: 'Liam', lastName: 'Garcia', dismissalType: 'bus', busRoute: '42', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 5, firstName: 'Sophia', lastName: 'Martinez', dismissalType: 'bus', busRoute: '15', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 6, firstName: 'Noah', lastName: 'Davis', dismissalType: 'walker', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 7, firstName: 'Ava', lastName: 'Miller', dismissalType: 'car', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 8, firstName: 'Lucas', lastName: 'Wilson', dismissalType: 'car', status: 'dismissed', calledAt: new Date(Date.now() - 300000), dismissedAt: new Date(Date.now() - 240000), zone: 'A', guardian: 'Tom Wilson' },
    { id: 9, firstName: 'Isabella', lastName: 'Moore', dismissalType: 'afterschool', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 10, firstName: 'Mason', lastName: 'Taylor', dismissalType: 'walker', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 11, firstName: 'Charlotte', lastName: 'Anderson', dismissalType: 'car', status: 'waiting', calledAt: null, zone: null, guardian: null },
    { id: 12, firstName: 'Ethan', lastName: 'Thomas', dismissalType: 'bus', busRoute: '42', status: 'waiting', calledAt: null, zone: null, guardian: null },
  ]);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'call', student: 'Emma Thompson', message: 'Parent arrived - Zone A', time: new Date(Date.now() - 60000), read: false },
    { id: 2, type: 'call', student: 'Oliver Brown', message: 'Parent arrived - Zone B', time: new Date(Date.now() - 30000), read: false },
  ]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate incoming calls
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly call a waiting car rider
      const waitingCarRiders = students.filter(s => s.status === 'waiting' && s.dismissalType === 'car');
      if (waitingCarRiders.length > 0 && Math.random() > 0.7) {
        const student = waitingCarRiders[Math.floor(Math.random() * waitingCarRiders.length)];
        const zone = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, status: 'called', calledAt: new Date(), zone, guardian: 'Parent' } : s
        ));
        setNotifications(prev => [{
          id: Date.now(),
          type: 'call',
          student: `${student.firstName} ${student.lastName}`,
          message: `Parent arrived - Zone ${zone}`,
          time: new Date(),
          read: false,
        }, ...prev]);
        if (soundEnabled) {
          // Play sound
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [students, soundEnabled]);

  // Dismiss student
  const dismissStudent = (id) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, status: 'dismissed', dismissedAt: new Date() } : s
    ));
    setNotifications(notifications.map(n => 
      n.student === students.find(s => s.id === id)?.firstName + ' ' + students.find(s => s.id === id)?.lastName
        ? { ...n, read: true }
        : n
    ));
  };

  // Hold student
  const holdStudent = (id, reason) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, status: 'held', holdReason: reason } : s
    ));
  };

  // Request 2 more minutes
  const request2Minutes = (id) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, status: 'delayed', delayedUntil: new Date(Date.now() + 120000) } : s
    ));
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    if (!showDismissedStudents && s.status === 'dismissed') return false;
    if (filterDismissal !== 'all' && s.dismissalType !== filterDismissal) return false;
    return true;
  });

  const calledStudents = filteredStudents.filter(s => s.status === 'called');
  const waitingStudents = filteredStudents.filter(s => s.status === 'waiting');
  const dismissedStudents = filteredStudents.filter(s => s.status === 'dismissed');

  const dismissalTypes = [
    { id: 'car', label: 'Car', icon: Car, color: 'blue' },
    { id: 'bus', label: 'Bus', icon: Bus, color: 'yellow' },
    { id: 'walker', label: 'Walker', icon: PersonStanding, color: 'green' },
    { id: 'afterschool', label: 'After School', icon: Clock, color: 'purple' },
  ];

  const getTypeIcon = (type) => {
    const found = dismissalTypes.find(t => t.id === type);
    return found ? found.icon : Car;
  };

  const getTypeColor = (type) => {
    const found = dismissalTypes.find(t => t.id === type);
    return found ? found.color : 'gray';
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{teacher.homeroom}</h1>
                  <p className="text-xs text-gray-500">{teacher.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Time */}
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Notification Bell */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Sound Toggle */}
              <Button
                variant={soundEnabled ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-600">{calledStudents.length} Called</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-600">{waitingStudents.length} Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-600">{dismissedStudents.length} Dismissed</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterDismissal}
              onChange={(e) => setFilterDismissal(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Types</option>
              {dismissalTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showDismissedStudents}
                onChange={(e) => setShowDismissedStudents(e.target.checked)}
                className="rounded"
              />
              Show dismissed
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 max-w-4xl mx-auto">
        {/* Called Students - Priority Section */}
        {calledStudents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-red-600">Students Called - Send Now!</h2>
            </div>
            <div className="space-y-3">
              {calledStudents.map(student => (
                <CalledStudentCard
                  key={student.id}
                  student={student}
                  onDismiss={() => dismissStudent(student.id)}
                  onDelay={() => request2Minutes(student.id)}
                  onHold={(reason) => holdStudent(student.id, reason)}
                  TypeIcon={getTypeIcon(student.dismissalType)}
                  typeColor={getTypeColor(student.dismissalType)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Waiting Students */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Class Roster
              <Badge variant="default">{waitingStudents.length} waiting</Badge>
            </h2>
          </div>
          
          <div className="divide-y">
            {waitingStudents.map(student => {
              const TypeIcon = getTypeIcon(student.dismissalType);
              const typeColor = getTypeColor(student.dismissalType);
              return (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <TypeIcon className={`w-4 h-4 text-${typeColor}-500`} />
                        <span className="capitalize">{student.dismissalType}</span>
                        {student.busRoute && <span>• Bus {student.busRoute}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={typeColor} size="sm">
                    <TypeIcon className="w-3 h-3" />
                    {student.dismissalType === 'bus' ? `Bus ${student.busRoute}` : student.dismissalType}
                  </Badge>
                </div>
              );
            })}
            {waitingStudents.length === 0 && (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">All students dismissed!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Dismissed Students */}
        {showDismissedStudents && dismissedStudents.length > 0 && (
          <Card className="mt-6">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Dismissed Today
                <Badge variant="green">{dismissedStudents.length}</Badge>
              </h2>
            </div>
            <div className="divide-y opacity-60">
              {dismissedStudents.map(student => (
                <div key={student.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-gray-500">
                        Dismissed at {student.dismissedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bus/Walker Announcements */}
        <Card className="mt-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Announcements</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Bus className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Bus 42 boarding at 3:15 PM</p>
                <p className="text-xs text-yellow-600">2 students from your class</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <PersonStanding className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Walker release at 3:00 PM</p>
                <p className="text-xs text-green-600">2 students from your class</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

// Called Student Card Component
function CalledStudentCard({ student, onDismiss, onDelay, onHold, TypeIcon, typeColor }) {
  const [showHoldOptions, setShowHoldOptions] = useState(false);
  const waitTime = Math.floor((Date.now() - student.calledAt) / 1000);
  const minutes = Math.floor(waitTime / 60);
  const seconds = waitTime % 60;

  return (
    <Card className="border-2 border-red-200 bg-red-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{student.firstName} {student.lastName}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-600 font-medium">Zone {student.zone}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">{student.guardian}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-red-600">
              <Timer className="w-4 h-4" />
              <span className="font-mono font-bold">{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
            <Badge variant={typeColor} size="sm">
              <TypeIcon className="w-3 h-3" />
              {student.dismissalType}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="success" size="lg" className="flex-1" onClick={onDismiss}>
            <Check className="w-5 h-5 mr-2" />
            Dismissed
          </Button>
          <Button variant="warning" size="lg" onClick={onDelay}>
            <Clock className="w-5 h-5 mr-2" />
            2 Min
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => setShowHoldOptions(!showHoldOptions)}
          >
            <Hand className="w-5 h-5" />
          </Button>
        </div>

        {showHoldOptions && (
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <p className="text-sm font-medium mb-2">Hold Reason:</p>
            <div className="flex flex-wrap gap-2">
              {['Bathroom', 'Not in class', 'Needs belongings', 'Other'].map(reason => (
                <Button
                  key={reason}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onHold(reason);
                    setShowHoldOptions(false);
                  }}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
