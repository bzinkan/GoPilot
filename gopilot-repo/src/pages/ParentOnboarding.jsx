import React, { useState } from 'react';
import { 
  Check, X, ChevronRight, Mail, Phone, User, Users, Shield,
  Car, Bus, PersonStanding, Clock, Plus, Camera, AlertCircle,
  CheckCircle2, ArrowRight, ArrowLeft, Bell, MapPin, Edit,
  Smartphone, MessageSquare, QrCode, Home
} from 'lucide-react';

// Google Logo SVG
const GoogleLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Apple Logo SVG
const AppleLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

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
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, className = '', type = 'button' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    google: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
    apple: 'bg-black text-white hover:bg-gray-900',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className} disabled:cursor-not-allowed`}>
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

// Main Parent Onboarding Component
export default function ParentOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // User state
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    photo: null,
  });
  
  // Children state
  const [children, setChildren] = useState([]);
  const [pendingChildren, setPendingChildren] = useState([]);
  
  // Authorized pickups
  const [authorizedPickups, setAuthorizedPickups] = useState([]);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    dismissalAlerts: true,
    changeConfirmations: true,
    arrivalReminders: true,
  });

  // Check-in preference
  const [checkInMethod, setCheckInMethod] = useState('app');

  const steps = [
    { num: 1, title: 'Sign In', icon: User },
    { num: 2, title: 'Link Children', icon: Users },
    { num: 3, title: 'Add Pickups', icon: Shield },
    { num: 4, title: 'Preferences', icon: Bell },
    { num: 5, title: 'Ready!', icon: CheckCircle2 },
  ];

  // Simulate Google sign in
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setUser({
        name: 'Sarah Thompson',
        email: 'sarah.thompson@gmail.com',
        phone: '',
        photo: null,
      });
      // Simulate auto-matching children by email
      setChildren([
        { id: 1, firstName: 'Emma', lastName: 'Thompson', grade: 'K', homeroom: 'Mrs. Johnson', photo: null, dismissalType: 'car', linked: true },
        { id: 2, firstName: 'Jake', lastName: 'Thompson', grade: '3', homeroom: 'Mr. Roberts', photo: null, dismissalType: 'car', linked: true },
      ]);
      setIsSignedIn(true);
      setIsLoading(false);
    }, 1500);
  };

  // Add child by code
  const handleAddChildByCode = (code) => {
    // Simulate looking up child
    setPendingChildren([...pendingChildren, {
      id: Date.now(),
      code,
      status: 'pending',
      firstName: 'Max',
      lastName: 'Thompson',
      grade: '1',
    }]);
  };

  // Add authorized pickup
  const addAuthorizedPickup = (pickup) => {
    setAuthorizedPickups([...authorizedPickups, { ...pickup, id: Date.now(), status: 'pending' }]);
  };

  // Remove authorized pickup
  const removeAuthorizedPickup = (id) => {
    setAuthorizedPickups(authorizedPickups.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <h1 className="font-bold text-gray-900">GoPilot</h1>
              <p className="text-xs text-gray-500">Lincoln Elementary</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      {currentStep > 0 && currentStep < 6 && (
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.num}>
                  <div className={`flex flex-col items-center ${step.num <= currentStep ? 'text-indigo-600' : 'text-gray-300'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.num < currentStep ? 'bg-green-500 text-white' :
                      step.num === currentStep ? 'bg-indigo-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step.num < currentStep ? <Check className="w-4 h-4" /> : step.num}
                    </div>
                    <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${step.num < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        
        {/* Step 1: Sign In */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome to GoPilot</h2>
              <p className="text-gray-500 mt-1">Sign in to manage your children's dismissal</p>
            </div>

            {!isSignedIn ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <Button 
                    variant="google" 
                    size="lg" 
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Signing in...</span>
                    ) : (
                      <>
                        <GoogleLogo className="w-5 h-5 mr-3" />
                        Continue with Google
                      </>
                    )}
                  </Button>
                  
                  <Button variant="apple" size="lg" className="w-full">
                    <AppleLogo className="w-5 h-5 mr-3" />
                    Continue with Apple
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <Button variant="secondary" size="lg" className="w-full">
                    <Mail className="w-5 h-5 mr-3" />
                    Continue with Email
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-6">
                  By continuing, you agree to GoPilot's Terms of Service and Privacy Policy
                </p>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto" />
                </div>

                {children.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Children automatically linked!</span>
                    </div>
                    <p className="text-sm text-green-600">
                      We found {children.length} {children.length === 1 ? 'child' : 'children'} registered with your email.
                    </p>
                  </div>
                )}

                <Button variant="primary" size="lg" className="w-full" onClick={() => setCurrentStep(2)}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Link Children */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Children</h2>
              <p className="text-gray-500 mt-1">Confirm linked children or add more</p>
            </div>

            {/* Linked Children */}
            {children.length > 0 && (
              <Card>
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Linked Children
                  </h3>
                </div>
                <div className="divide-y">
                  {children.map(child => (
                    <div key={child.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{child.firstName} {child.lastName}</p>
                          <p className="text-sm text-gray-500">Grade {child.grade} • {child.homeroom}</p>
                        </div>
                      </div>
                      <Badge variant="green" size="sm">Linked</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Add Another Child */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Add Another Child</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enter the student code provided by your school
              </p>
              <AddChildForm onAdd={handleAddChildByCode} />
              
              {pendingChildren.length > 0 && (
                <div className="mt-4 space-y-2">
                  {pendingChildren.map(child => (
                    <div key={child.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-yellow-600">Pending school approval</p>
                      </div>
                      <Badge variant="yellow" size="sm">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="primary" size="lg" onClick={() => setCurrentStep(3)} className="flex-1">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Authorized Pickups */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Authorized Pickups</h2>
              <p className="text-gray-500 mt-1">Who else can pick up your children?</p>
            </div>

            <Card className="p-4">
              <div className="flex items-start gap-3 text-sm text-gray-600 mb-4">
                <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p>
                  Add trusted adults who may pick up your children. They'll need to show ID 
                  and the school will verify before releasing your child.
                </p>
              </div>

              <AuthorizedPickupForm onAdd={addAuthorizedPickup} />

              {authorizedPickups.length > 0 && (
                <div className="mt-4 space-y-2">
                  {authorizedPickups.map(pickup => (
                    <div key={pickup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{pickup.name}</p>
                          <p className="text-sm text-gray-500">{pickup.relationship} • {pickup.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="yellow" size="sm">Pending</Badge>
                        <button onClick={() => removeAuthorizedPickup(pickup.id)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="primary" size="lg" onClick={() => setCurrentStep(4)} className="flex-1">
                {authorizedPickups.length === 0 ? 'Skip' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Preferences */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Preferences</h2>
              <p className="text-gray-500 mt-1">Set up notifications and check-in method</p>
            </div>

            {/* Phone Number */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-500" />
                Phone Number
              </h3>
              <p className="text-sm text-gray-500 mb-3">Required for SMS check-in and notifications</p>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border rounded-lg text-lg"
              />
            </Card>

            {/* Check-in Method */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Preferred Check-in Method</h3>
              <p className="text-sm text-gray-500 mb-4">How do you want to check in when you arrive?</p>
              
              <div className="space-y-2">
                {[
                  { id: 'app', icon: Smartphone, title: 'GoPilot App', desc: 'Tap "I\'m Here" when you arrive' },
                  { id: 'sms', icon: MessageSquare, title: 'Text Message', desc: 'Text your student code to check in' },
                  { id: 'qr', icon: QrCode, title: 'QR Code Tag', desc: 'Display tag in your car window' },
                ].map(method => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      checkInMethod === method.id ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkInMethod"
                      value={method.id}
                      checked={checkInMethod === method.id}
                      onChange={(e) => setCheckInMethod(e.target.value)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <method.icon className={`w-5 h-5 ${checkInMethod === method.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium">{method.title}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-500" />
                Notifications
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Push notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.pushEnabled}
                    onChange={(e) => setNotifications({ ...notifications, pushEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">SMS notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.smsEnabled}
                    onChange={(e) => setNotifications({ ...notifications, smsEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>
                
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium mb-2">Notify me when:</p>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.dismissalAlerts}
                        onChange={(e) => setNotifications({ ...notifications, dismissalAlerts: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Child is ready for pickup
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.changeConfirmations}
                        onChange={(e) => setNotifications({ ...notifications, changeConfirmations: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Dismissal changes are confirmed
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.arrivalReminders}
                        onChange={(e) => setNotifications({ ...notifications, arrivalReminders: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Reminder before dismissal time
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(3)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="primary" size="lg" onClick={() => setCurrentStep(5)} className="flex-1">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Ready */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">You're All Set!</h2>
              <p className="text-gray-500 mt-1">GoPilot is ready for your family</p>
            </div>

            {/* Summary */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Your Setup</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Children linked</span>
                  <span className="font-medium">{children.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Authorized pickups</span>
                  <span className="font-medium">{authorizedPickups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Check-in method</span>
                  <span className="font-medium capitalize">{checkInMethod === 'sms' ? 'SMS' : checkInMethod === 'qr' ? 'QR Code' : 'App'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Notifications</span>
                  <span className="font-medium">
                    {[
                      notifications.pushEnabled && 'Push',
                      notifications.smsEnabled && 'SMS'
                    ].filter(Boolean).join(', ') || 'Off'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <Car className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">I'm Here</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <Edit className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">Change Pickup</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <Users className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">My Children</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">History</span>
                </button>
              </div>
            </Card>

            <Button variant="primary" size="lg" className="w-full">
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// Add Child Form Component
function AddChildForm({ onAdd }) {
  const [code, setCode] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onAdd(code);
      setCode('');
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <Button variant="secondary" size="md" onClick={() => setShowForm(true)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Another Child
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Student Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-digit code"
          className="w-full px-4 py-2 border rounded-lg text-center text-lg tracking-widest font-mono"
          maxLength={6}
          autoFocus
        />
        <p className="text-xs text-gray-400 mt-1">Code provided by your school</p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" className="flex-1">
          Add Child
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Authorized Pickup Form Component
function AuthorizedPickupForm({ onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [pickup, setPickup] = useState({
    name: '',
    relationship: '',
    phone: '',
  });

  const relationships = ['Grandparent', 'Aunt/Uncle', 'Sibling (18+)', 'Family Friend', 'Nanny/Caregiver', 'Neighbor', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pickup.name && pickup.relationship && pickup.phone) {
      onAdd(pickup);
      setPickup({ name: '', relationship: '', phone: '' });
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <Button variant="secondary" size="md" onClick={() => setShowForm(true)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Authorized Pickup
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={pickup.name}
          onChange={(e) => setPickup({ ...pickup, name: e.target.value })}
          placeholder="John Smith"
          className="w-full px-3 py-2 border rounded-lg"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
        <select
          value={pickup.relationship}
          onChange={(e) => setPickup({ ...pickup, relationship: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select relationship...</option>
          {relationships.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={pickup.phone}
          onChange={(e) => setPickup({ ...pickup, phone: e.target.value })}
          placeholder="(555) 123-4567"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" className="flex-1">
          Add Person
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
