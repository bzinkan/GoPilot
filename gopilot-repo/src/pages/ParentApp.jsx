import React, { useState, useEffect } from 'react';
import { 
  Car, Bus, PersonStanding, Clock, Users, Bell, Check, X,
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Timer,
  MapPin, Home, Settings, History, User, Plus, Edit, Calendar,
  Phone, Shield, AlertCircle, Navigation, RefreshCw, Send,
  ArrowLeft, Camera, QrCode, MessageSquare, Smartphone, Coffee
} from 'lucide-react';

// Utility Components
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
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
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base', xl: 'px-8 py-4 text-lg' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all ${variants[variant]} ${sizes[size]} ${className} disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Main Parent App Component
export default function ParentApp() {
  const [currentView, setCurrentView] = useState('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInStatus, setCheckInStatus] = useState(null); // null, 'checking', 'queued', 'called', 'complete'
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChangeRequest, setShowChangeRequest] = useState(false);

  // User state
  const [user] = useState({
    name: 'Sarah Thompson',
    email: 'sarah.thompson@gmail.com',
    phone: '(555) 123-4567',
  });

  // Children state
  const [children, setChildren] = useState([
    { 
      id: 1, 
      firstName: 'Emma', 
      lastName: 'Thompson', 
      grade: 'K', 
      homeroom: 'Mrs. Johnson',
      photo: null,
      dismissalType: 'car',
      busRoute: null,
      school: 'Lincoln Elementary',
    },
    { 
      id: 2, 
      firstName: 'Jake', 
      lastName: 'Thompson', 
      grade: '3', 
      homeroom: 'Mr. Roberts',
      photo: null,
      dismissalType: 'car',
      busRoute: null,
      school: 'Lincoln Elementary',
    },
  ]);

  // Today's dismissal
  const [todayDismissal, setTodayDismissal] = useState([
    { childId: 1, type: 'car', status: 'scheduled' },
    { childId: 2, type: 'car', status: 'scheduled' },
  ]);

  // History
  const [history] = useState([
    { date: new Date(Date.now() - 86400000), children: ['Emma', 'Jake'], type: 'car', pickupTime: '3:12 PM', waitTime: '4 min' },
    { date: new Date(Date.now() - 172800000), children: ['Emma', 'Jake'], type: 'car', pickupTime: '3:08 PM', waitTime: '2 min' },
    { date: new Date(Date.now() - 259200000), children: ['Emma'], type: 'car', pickupTime: '3:15 PM', waitTime: '6 min' },
    { date: new Date(Date.now() - 345600000), children: ['Emma', 'Jake'], type: 'car', pickupTime: '3:10 PM', waitTime: '3 min' },
  ]);

  // Authorized pickups
  const [authorizedPickups] = useState([
    { id: 1, name: 'Grandma Susan', relationship: 'Grandmother', phone: '(555) 234-5678', status: 'approved' },
    { id: 2, name: 'Uncle Mike', relationship: 'Uncle', phone: '(555) 345-6789', status: 'approved' },
  ]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate check-in flow
  const handleCheckIn = () => {
    setCheckInStatus('checking');
    
    // Simulate location check
    setTimeout(() => {
      setCheckInStatus('queued');
      setQueuePosition(8);
      setEstimatedWait(6);
      
      // Simulate queue movement
      const queueInterval = setInterval(() => {
        setQueuePosition(prev => {
          if (prev <= 1) {
            clearInterval(queueInterval);
            setCheckInStatus('called');
            return 0;
          }
          return prev - 1;
        });
        setEstimatedWait(prev => Math.max(0, prev - 1));
      }, 3000);
    }, 1500);
  };

  // Cancel check-in
  const cancelCheckIn = () => {
    setCheckInStatus(null);
    setQueuePosition(null);
    setEstimatedWait(null);
  };

  // Complete pickup
  const completePickup = () => {
    setCheckInStatus('complete');
    setTimeout(() => {
      setCheckInStatus(null);
      setQueuePosition(null);
      setEstimatedWait(null);
    }, 3000);
  };

  // Get dismissal type icon
  const getDismissalIcon = (type) => {
    switch (type) {
      case 'car': return Car;
      case 'bus': return Bus;
      case 'walker': return PersonStanding;
      case 'afterschool': return Clock;
      default: return Car;
    }
  };

  const carRiderChildren = children.filter(c => c.dismissalType === 'car');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Home View */}
      {currentView === 'home' && (
        <>
          {/* Header */}
          <header className="bg-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-indigo-200 text-sm">Good afternoon,</p>
                <h1 className="text-xl font-bold">{user.name.split(' ')[0]}</h1>
              </div>
              <button 
                onClick={() => setCurrentView('settings')}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              >
                <User className="w-5 h-5" />
              </button>
            </div>

            {/* Dismissal Time */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm">Dismissal Time</p>
                  <p className="text-2xl font-bold">3:00 PM</p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-200 text-sm">Current Time</p>
                  <p className="text-2xl font-bold">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 -mt-4 pb-24">
            {/* Check-In Card */}
            {!checkInStatus && (
              <Card className="p-6 mb-4">
                <h2 className="font-semibold mb-4">Ready for Pickup?</h2>
                
                {/* Children for pickup */}
                <div className="space-y-2 mb-4">
                  {carRiderChildren.map(child => (
                    <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                        {child.firstName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{child.firstName}</p>
                        <p className="text-sm text-gray-500">Grade {child.grade} • {child.homeroom}</p>
                      </div>
                      <Badge variant="blue">
                        <Car className="w-3 h-3" />
                        Car
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="primary" 
                  size="xl" 
                  className="w-full"
                  onClick={handleCheckIn}
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  I'm Here
                </Button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Tap when you arrive at school
                </p>
              </Card>
            )}

            {/* Checking Location */}
            {checkInStatus === 'checking' && (
              <Card className="p-6 mb-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <MapPin className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="font-semibold text-lg">Confirming Location...</p>
                  <p className="text-sm text-gray-500">Please wait</p>
                </div>
              </Card>
            )}

            {/* In Queue */}
            {checkInStatus === 'queued' && (
              <Card className="p-6 mb-4 border-2 border-indigo-200 bg-indigo-50">
                <div className="text-center">
                  <Badge variant="blue" size="md" className="mb-4">In Queue</Badge>
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-4xl font-bold text-indigo-600">#{queuePosition}</span>
                  </div>
                  <p className="font-semibold text-lg">You're in line!</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Estimated wait: <span className="font-semibold">{estimatedWait} min</span>
                  </p>
                  
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-2">Picking up:</p>
                    <div className="flex justify-center gap-2">
                      {carRiderChildren.map(child => (
                        <Badge key={child.id} variant="default">{child.firstName}</Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={cancelCheckIn}>
                    Cancel Check-in
                  </Button>
                </div>
              </Card>
            )}

            {/* Called - Ready for Pickup */}
            {checkInStatus === 'called' && (
              <Card className="p-6 mb-4 border-2 border-green-400 bg-green-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-bold text-xl text-green-800">Proceed to Zone B</p>
                  <p className="text-green-600 mb-6">Your children are on their way!</p>
                  
                  <div className="bg-white rounded-xl p-4 mb-4">
                    {carRiderChildren.map(child => (
                      <div key={child.id} className="flex items-center justify-between py-2">
                        <span className="font-medium">{child.firstName}</span>
                        <Badge variant="green">On the way</Badge>
                      </div>
                    ))}
                  </div>

                  <Button variant="success" size="lg" className="w-full" onClick={completePickup}>
                    <Check className="w-5 h-5 mr-2" />
                    Confirm Pickup
                  </Button>
                </div>
              </Card>
            )}

            {/* Pickup Complete */}
            {checkInStatus === 'complete' && (
              <Card className="p-6 mb-4 bg-green-500 text-white">
                <div className="text-center py-4">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-bold text-xl">Pickup Complete!</p>
                  <p className="text-green-100">Have a great day!</p>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="p-4" onClick={() => setShowChangeRequest(true)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Edit className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Change</p>
                    <p className="text-xs text-gray-500">Today's pickup</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4" onClick={() => setCurrentView('history')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">History</p>
                    <p className="text-xs text-gray-500">Past pickups</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Children */}
            <Card className="mb-4">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">My Children</h3>
                <button className="text-indigo-600 text-sm font-medium">Manage</button>
              </div>
              <div className="divide-y">
                {children.map(child => {
                  const DismissalIcon = getDismissalIcon(child.dismissalType);
                  return (
                    <div 
                      key={child.id} 
                      className="p-4 flex items-center justify-between"
                      onClick={() => {
                        setSelectedChild(child);
                        setCurrentView('child-detail');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {child.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{child.firstName} {child.lastName}</p>
                          <p className="text-sm text-gray-500">Grade {child.grade} • {child.homeroom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={child.dismissalType === 'car' ? 'blue' : child.dismissalType === 'bus' ? 'yellow' : 'green'}>
                          <DismissalIcon className="w-3 h-3" />
                          {child.dismissalType}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Authorized Pickups */}
            <Card>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Authorized Pickups</h3>
                <button className="text-indigo-600 text-sm font-medium">
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add
                </button>
              </div>
              <div className="divide-y">
                {authorizedPickups.map(pickup => (
                  <div key={pickup.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{pickup.name}</p>
                        <p className="text-sm text-gray-500">{pickup.relationship}</p>
                      </div>
                    </div>
                    <Badge variant="green" size="sm">Approved</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
            <div className="flex items-center justify-around">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'children', icon: Users, label: 'Children' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center py-2 px-4 rounded-lg ${
                    currentView === item.id ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Change Request Modal */}
          {showChangeRequest && (
            <ChangeRequestModal
              children={children}
              onClose={() => setShowChangeRequest(false)}
              onSubmit={(changes) => {
                console.log('Changes submitted:', changes);
                setShowChangeRequest(false);
              }}
            />
          )}
        </>
      )}

      {/* History View */}
      {currentView === 'history' && (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b px-4 py-4 sticky top-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('home')} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Pickup History</h1>
            </div>
          </header>

          <main className="p-4 pb-24">
            <div className="space-y-3">
              {history.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">
                      {item.date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <Badge variant="green" size="sm">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Car className="w-4 h-4" />
                      <span>{item.children.join(', ')}</span>
                    </div>
                    <div className="text-gray-500">
                      {item.pickupTime} • {item.waitTime} wait
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
            <div className="flex items-center justify-around">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'children', icon: Users, label: 'Children' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center py-2 px-4 rounded-lg ${
                    currentView === item.id ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Children View */}
      {currentView === 'children' && (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b px-4 py-4 sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentView('home')} className="p-2 -ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-lg">My Children</h1>
              </div>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </header>

          <main className="p-4 pb-24">
            <div className="space-y-4">
              {children.map(child => {
                const DismissalIcon = getDismissalIcon(child.dismissalType);
                return (
                  <Card key={child.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-bold">
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{child.firstName} {child.lastName}</p>
                          <p className="text-gray-500">Grade {child.grade}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-t">
                          <span className="text-gray-500">School</span>
                          <span className="font-medium">{child.school}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t">
                          <span className="text-gray-500">Homeroom</span>
                          <span className="font-medium">{child.homeroom}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t">
                          <span className="text-gray-500">Dismissal</span>
                          <Badge variant="blue">
                            <DismissalIcon className="w-3 h-3" />
                            {child.dismissalType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 flex justify-end">
                      <Button variant="secondary" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
            <div className="flex items-center justify-around">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'children', icon: Users, label: 'Children' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center py-2 px-4 rounded-lg ${
                    currentView === item.id ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Settings View */}
      {currentView === 'settings' && (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b px-4 py-4 sticky top-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('home')} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Settings</h1>
            </div>
          </header>

          <main className="p-4 pb-24">
            {/* Profile */}
            <Card className="mb-4">
              <div className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Button variant="secondary" size="sm">Edit</Button>
              </div>
            </Card>

            {/* Settings List */}
            <Card>
              <div className="divide-y">
                {[
                  { icon: Bell, label: 'Notifications', value: 'On' },
                  { icon: Smartphone, label: 'Check-in Method', value: 'App' },
                  { icon: Phone, label: 'Phone Number', value: user.phone },
                  { icon: Shield, label: 'Authorized Pickups', value: '2 people' },
                  { icon: QrCode, label: 'My QR Code', value: '' },
                ].map((item, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && <span className="text-gray-500 text-sm">{item.value}</span>}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="mt-4">
              <button className="w-full p-4 flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </Card>
          </main>
        </div>
      )}
    </div>
  );
}

// Change Request Modal
function ChangeRequestModal({ children, onClose, onSubmit }) {
  const [changes, setChanges] = useState(
    children.reduce((acc, child) => {
      acc[child.id] = { type: child.dismissalType, busRoute: child.busRoute || '' };
      return acc;
    }, {})
  );
  const [note, setNote] = useState('');

  const dismissalOptions = [
    { id: 'car', label: 'Car Rider', icon: Car },
    { id: 'bus', label: 'Bus', icon: Bus },
    { id: 'walker', label: 'Walker', icon: PersonStanding },
    { id: 'afterschool', label: 'After School', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Change Today's Pickup</h2>
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {children.map(child => (
            <div key={child.id}>
              <p className="font-medium mb-3">{child.firstName}</p>
              <div className="grid grid-cols-2 gap-2">
                {dismissalOptions.map(option => {
                  const isSelected = changes[child.id].type === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setChanges(prev => ({
                        ...prev,
                        [child.id]: { ...prev[child.id], type: option.id }
                      }))}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
                        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className={isSelected ? 'font-medium' : ''}>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {changes[child.id].type === 'bus' && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">Bus Number</label>
                  <input
                    type="text"
                    value={changes[child.id].busRoute}
                    onChange={(e) => setChanges(prev => ({
                      ...prev,
                      [child.id]: { ...prev[child.id], busRoute: e.target.value }
                    }))}
                    placeholder="Enter bus number"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the school..."
              className="w-full px-4 py-2 border rounded-lg h-20"
            />
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Change Request</p>
                <p className="text-yellow-700">
                  Changes submitted after 2:30 PM require office approval.
                </p>
              </div>
            </div>
          </div>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={() => onSubmit({ changes, note })}
          >
            <Send className="w-5 h-5 mr-2" />
            Submit Change Request
          </Button>
        </div>
      </div>
    </div>
  );
}
