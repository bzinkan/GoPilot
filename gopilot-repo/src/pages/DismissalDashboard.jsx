import React, { useState, useEffect } from 'react';
import { 
  Car, Bus, PersonStanding, Clock, Users, Search, Bell, AlertTriangle,
  Check, X, ChevronRight, ChevronDown, Phone, MapPin, Play, Pause,
  Volume2, VolumeX, RefreshCw, Filter, MoreVertical, CheckCircle2,
  AlertCircle, Timer, UserCheck, Send, ArrowRight, Shield, Eye,
  Smartphone, QrCode, MessageSquare, Home, Settings, LogOut, Menu,
  Zap, TrendingUp, Calendar, Download, Plus, Edit, Trash2
} from 'lucide-react';

// Utility Components
const Badge = ({ children, variant = 'default', size = 'md', dot = false }) => {
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
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
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

// Main Dashboard Component
export default function DismissalDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dismissalActive, setDismissalActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedView, setSelectedView] = useState('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data
  const [queue, setQueue] = useState([
    { id: 1, student: 'Emma Thompson', grade: 'K', homeroom: 'Mrs. Johnson', guardian: 'Sarah Thompson', checkInTime: new Date(Date.now() - 180000), status: 'called', checkInMethod: 'app', zone: 'A' },
    { id: 2, student: 'Jake Thompson', grade: '3', homeroom: 'Mr. Roberts', guardian: 'Sarah Thompson', checkInTime: new Date(Date.now() - 180000), status: 'called', checkInMethod: 'app', zone: 'A' },
    { id: 3, student: 'Sophia Martinez', grade: '2', homeroom: 'Mrs. Davis', guardian: 'Carlos Martinez', checkInTime: new Date(Date.now() - 120000), status: 'waiting', checkInMethod: 'sms', zone: null },
    { id: 4, student: 'Aiden Chen', grade: '4', homeroom: 'Mrs. Clark', guardian: 'Lisa Chen', checkInTime: new Date(Date.now() - 90000), status: 'waiting', checkInMethod: 'qr', zone: null },
    { id: 5, student: 'Mia Williams', grade: '1', homeroom: 'Mr. Adams', guardian: 'James Williams', checkInTime: new Date(Date.now() - 60000), status: 'waiting', checkInMethod: 'app', zone: null },
    { id: 6, student: 'Noah Davis', grade: '5', homeroom: 'Mrs. Miller', guardian: 'Rachel Davis', checkInTime: new Date(Date.now() - 30000), status: 'waiting', checkInMethod: 'app', zone: null },
  ]);

  const [stats, setStats] = useState({
    totalStudents: 487,
    dismissed: 234,
    inQueue: 6,
    inTransit: 2,
    remaining: 245,
    avgWaitTime: '4:32',
  });

  const [homerooms, setHomerooms] = useState([
    { id: 1, teacher: 'Mrs. Johnson', grade: 'K', called: 12, remaining: 10, status: 'active' },
    { id: 2, teacher: 'Mr. Roberts', grade: '3', called: 8, remaining: 16, status: 'active' },
    { id: 3, teacher: 'Mrs. Davis', grade: '2', called: 15, remaining: 6, status: 'active' },
    { id: 4, teacher: 'Mrs. Clark', grade: '4', called: 10, remaining: 13, status: 'active' },
    { id: 5, teacher: 'Mr. Adams', grade: '1', called: 11, remaining: 11, status: 'active' },
    { id: 6, teacher: 'Mrs. Miller', grade: '5', called: 9, remaining: 14, status: 'active' },
  ]);

  const [busRoutes, setBusRoutes] = useState([
    { id: 1, number: '15', students: 24, status: 'boarding', departureTime: '3:15 PM' },
    { id: 2, number: '22', students: 28, status: 'waiting', departureTime: '3:15 PM' },
    { id: 3, number: '37', students: 19, status: 'waiting', departureTime: '3:20 PM' },
    { id: 4, number: '42', students: 31, status: 'waiting', departureTime: '3:20 PM' },
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'custody', student: 'Maya Johnson', message: 'Custody alert: John Johnson is NOT authorized', time: new Date(Date.now() - 300000) },
  ]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Queue actions
  const callStudent = (id) => {
    setQueue(queue.map(q => q.id === id ? { ...q, status: 'called', zone: 'B' } : q));
  };

  const markPickedUp = (id) => {
    setQueue(queue.filter(q => q.id !== id));
    setStats(prev => ({ ...prev, dismissed: prev.dismissed + 1, inQueue: prev.inQueue - 1 }));
  };

  const callNextBatch = () => {
    const waiting = queue.filter(q => q.status === 'waiting').slice(0, 3);
    setQueue(queue.map(q => 
      waiting.find(w => w.id === q.id) ? { ...q, status: 'called', zone: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] } : q
    ));
  };

  // Filter queue
  const filteredQueue = queue.filter(q => {
    if (searchTerm && !q.student.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType === 'waiting' && q.status !== 'waiting') return false;
    if (filterType === 'called' && q.status !== 'called') return false;
    return true;
  });

  const dismissalTypes = [
    { id: 'car', label: 'Car', icon: Car, color: 'blue', count: 298 },
    { id: 'bus', label: 'Bus', icon: Bus, color: 'yellow', count: 102 },
    { id: 'walker', label: 'Walker', icon: PersonStanding, color: 'green', count: 67 },
    { id: 'afterschool', label: 'After School', icon: Clock, color: 'purple', count: 20 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">GoPilot</h1>
                  <p className="text-xs text-gray-500">Lincoln Elementary</p>
                </div>
              </div>
              
              {/* Dismissal Status */}
              <div className={`ml-6 px-4 py-2 rounded-lg flex items-center gap-2 ${dismissalActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                <span className={`w-2 h-2 rounded-full ${dismissalActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className={`text-sm font-medium ${dismissalActive ? 'text-green-700' : 'text-gray-600'}`}>
                  {dismissalActive ? 'Dismissal Active' : 'Dismissal Paused'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Time */}
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant={soundEnabled ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  variant={dismissalActive ? 'warning' : 'success'}
                  size="sm"
                  onClick={() => setDismissalActive(!dismissalActive)}
                >
                  {dismissalActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {dismissalActive ? 'Pause' : 'Start'}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700 font-medium">{alerts[0].message}</span>
              <Button variant="ghost" size="sm" className="ml-auto text-red-600">
                View Details
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
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
              <p className="text-2xl font-bold text-gray-600">{stats.remaining}</p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
            <div className="border-l pl-6 text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.avgWaitTime}</p>
              <p className="text-xs text-gray-500">Avg Wait</p>
            </div>
          </div>

          {/* Dismissal Type Breakdown */}
          <div className="flex items-center gap-4">
            {dismissalTypes.map(type => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${type.color}-500`} />
                  <span className="text-sm font-medium">{type.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - View Selector */}
        <aside className="w-16 bg-white border-r flex flex-col items-center py-4 gap-2">
          {[
            { id: 'queue', icon: Users, label: 'Queue' },
            { id: 'homerooms', icon: Home, label: 'Rooms' },
            { id: 'buses', icon: Bus, label: 'Buses' },
            { id: 'walkers', icon: PersonStanding, label: 'Walkers' },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
                selectedView === view.id ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <view.icon className="w-5 h-5" />
              <span className="text-[10px]">{view.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Panel */}
        <main className="flex-1 p-4">
          {selectedView === 'queue' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Queue List */}
              <div className="col-span-2">
                <Card>
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Car Line Queue
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search student..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-1.5 border rounded-lg text-sm w-48"
                        />
                      </div>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="all">All</option>
                        <option value="waiting">Waiting</option>
                        <option value="called">Called</option>
                      </select>
                      <Button variant="primary" size="sm" onClick={callNextBatch}>
                        <Zap className="w-4 h-4 mr-1" />
                        Call Next 3
                      </Button>
                    </div>
                  </div>

                  <div className="divide-y max-h-[calc(100vh-320px)] overflow-y-auto">
                    {filteredQueue.map((item, index) => (
                      <QueueItem 
                        key={item.id} 
                        item={item} 
                        position={index + 1}
                        onCall={() => callStudent(item.id)}
                        onPickup={() => markPickedUp(item.id)}
                      />
                    ))}
                    {filteredQueue.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No students in queue</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Side Panel */}
              <div className="space-y-4">
                {/* Zones */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Pickup Zones</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['A', 'B', 'C'].map(zone => {
                      const count = queue.filter(q => q.zone === zone && q.status === 'called').length;
                      return (
                        <div key={zone} className={`p-3 rounded-lg text-center ${count > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <p className="text-2xl font-bold">{zone}</p>
                          <p className="text-xs text-gray-500">{count} waiting</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { action: 'Picked up', student: 'Lily Park', time: '2 min ago' },
                      { action: 'Called', student: 'Emma Thompson', time: '3 min ago' },
                      { action: 'Checked in', student: 'Noah Davis', time: '5 min ago' },
                      { action: 'Picked up', student: 'Oliver Brown', time: '6 min ago' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span>
                          <span className="text-gray-500">{activity.action}</span>{' '}
                          <span className="font-medium">{activity.student}</span>
                        </span>
                        <span className="text-gray-400 text-xs">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Check-in
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Find Student
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full justify-start">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Parent
                    </Button>
                    <Button variant="danger" size="sm" className="w-full justify-start">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Emergency Hold
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {selectedView === 'homerooms' && (
            <Card>
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Home className="w-5 h-5 text-indigo-600" />
                  Homeroom Status
                </h2>
                <Button variant="secondary" size="sm">
                  <Send className="w-4 h-4 mr-1" />
                  Notify All Teachers
                </Button>
              </div>
              <div className="divide-y">
                {homerooms.map(room => (
                  <div key={room.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">{room.grade}</span>
                      </div>
                      <div>
                        <p className="font-medium">{room.teacher}</p>
                        <p className="text-sm text-gray-500">Grade {room.grade}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{room.called}</p>
                        <p className="text-xs text-gray-500">Called</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-600">{room.remaining}</p>
                        <p className="text-xs text-gray-500">Remaining</p>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(room.called / (room.called + room.remaining)) * 100}%` }}
                        />
                      </div>
                      <Badge variant={room.status === 'active' ? 'green' : 'default'} dot>
                        {room.status === 'active' ? 'Active' : 'Idle'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {selectedView === 'buses' && (
            <div className="space-y-4">
              <Card>
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Bus className="w-5 h-5 text-yellow-600" />
                    Bus Dismissal
                  </h2>
                  <Button variant="success" size="sm">
                    <Send className="w-4 h-4 mr-1" />
                    Call All Bus Riders
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {busRoutes.map(bus => (
                    <div key={bus.id} className={`p-4 rounded-lg border-2 ${
                      bus.status === 'boarding' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Bus className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">Bus {bus.number}</p>
                            <p className="text-sm text-gray-500">{bus.students} students</p>
                          </div>
                        </div>
                        <Badge variant={bus.status === 'boarding' ? 'green' : 'default'}>
                          {bus.status === 'boarding' ? 'Boarding' : 'Waiting'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Departs: {bus.departureTime}</span>
                        <Button variant={bus.status === 'boarding' ? 'success' : 'primary'} size="sm">
                          {bus.status === 'boarding' ? 'Mark Departed' : 'Start Boarding'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {selectedView === 'walkers' && (
            <Card>
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <PersonStanding className="w-5 h-5 text-green-600" />
                  Walker Dismissal
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="green">{67} walkers today</Badge>
                  <Button variant="success" size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    Release All Walkers
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800">Walker release time: 3:00 PM</p>
                      <p className="text-sm text-green-600">All walkers will be released from their classrooms</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium mb-3">Walker Zones</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: 'Front Gate', count: 28, status: 'open' },
                    { name: 'Side Exit', count: 24, status: 'open' },
                    { name: 'Playground Gate', count: 15, status: 'closed' },
                  ].map(zone => (
                    <div key={zone.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{zone.name}</p>
                        <Badge variant={zone.status === 'open' ? 'green' : 'red'} size="sm">
                          {zone.status}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{zone.count}</p>
                      <p className="text-sm text-gray-500">assigned walkers</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

// Queue Item Component
function QueueItem({ item, position, onCall, onPickup }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'yellow';
      case 'called': return 'blue';
      case 'in-transit': return 'purple';
      case 'at-zone': return 'green';
      default: return 'default';
    }
  };

  const getCheckInIcon = (method) => {
    switch (method) {
      case 'app': return Smartphone;
      case 'sms': return MessageSquare;
      case 'qr': return QrCode;
      default: return Smartphone;
    }
  };

  const CheckInIcon = getCheckInIcon(item.checkInMethod);
  const waitTime = Math.floor((Date.now() - item.checkInTime) / 60000);

  return (
    <div className={`p-4 flex items-center gap-4 ${item.status === 'called' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      {/* Position */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
        {position}
      </div>

      {/* Student Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{item.student}</p>
          <Badge variant={getStatusColor(item.status)} size="sm">
            {item.status === 'called' && item.zone ? `Zone ${item.zone}` : item.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Grade {item.grade}</span>
          <span>•</span>
          <span>{item.homeroom}</span>
          <span>•</span>
          <span>{item.guardian}</span>
        </div>
      </div>

      {/* Check-in Method & Time */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-gray-400">
          <CheckInIcon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Timer className="w-4 h-4" />
          <span>{waitTime}m</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {item.status === 'waiting' && (
          <Button variant="primary" size="sm" onClick={onCall}>
            <Bell className="w-4 h-4 mr-1" />
            Call
          </Button>
        )}
        {item.status === 'called' && (
          <Button variant="success" size="sm" onClick={onPickup}>
            <Check className="w-4 h-4 mr-1" />
            Picked Up
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
