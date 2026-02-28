import React, { useState } from 'react';
import { 
  Check, X, RefreshCw, Settings, Users, BookOpen, Shield, 
  Link2, Unlink, AlertCircle, CheckCircle2, Clock, ChevronRight,
  Mail, UserCheck, School, Key, ExternalLink, Download
} from 'lucide-react';

// Utility Components
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
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
    google: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
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

// Google Logo SVG
const GoogleLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function GoogleWorkspaceIntegration() {
  const [connected, setConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [settings, setSettings] = useState({
    ssoEnabled: true,
    classroomSync: true,
    directorySync: false,
    guardianSync: true,
    autoSync: true,
    syncFrequency: 'daily',
  });

  const [syncStats, setSyncStats] = useState({
    lastSync: new Date(Date.now() - 1800000),
    studentsImported: 487,
    teachersImported: 32,
    guardiansImported: 412,
    classesImported: 24,
  });

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncStats(prev => ({ ...prev, lastSync: new Date() }));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center">
                <GoogleLogo className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Google Workspace for Education</h1>
                <p className="text-sm text-gray-500">Sync students, teachers, and guardians from Google</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <Badge variant="green">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <Button variant="secondary" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </>
              ) : (
                <Button variant="google">
                  <GoogleLogo className="w-4 h-4 mr-2" />
                  Connect Google Workspace
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: School },
              { id: 'classroom', label: 'Google Classroom', icon: BookOpen },
              { id: 'sso', label: 'Single Sign-On', icon: Key },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
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

      <main className="p-6 max-w-6xl mx-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Connection Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Connection Status</h2>
                <Badge variant={connected ? 'green' : 'yellow'}>
                  {connected ? 'Active' : 'Not Connected'}
                </Badge>
              </div>

              {connected ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{syncStats.studentsImported}</p>
                    <p className="text-sm text-blue-600">Students Synced</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-900">{syncStats.teachersImported}</p>
                    <p className="text-sm text-green-600">Teachers Synced</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-900">{syncStats.guardiansImported}</p>
                    <p className="text-sm text-purple-600">Guardians Linked</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <BookOpen className="w-6 h-6 text-orange-600 mb-2" />
                    <p className="text-2xl font-bold text-orange-900">{syncStats.classesImported}</p>
                    <p className="text-sm text-orange-600">Classes Imported</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <GoogleLogo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500 mb-4">Connect your Google Workspace to import student rosters</p>
                  <Button variant="google" size="lg">
                    <GoogleLogo className="w-5 h-5 mr-2" />
                    Connect Google Workspace
                  </Button>
                </div>
              )}
            </Card>

            {/* What Gets Synced */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">What Gets Synced</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Students</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Name
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Email
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Grade (from Org Unit)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Profile photo
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <X className="w-4 h-4" /> Phone (not in Google)
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <X className="w-4 h-4" /> Address (not in Google)
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-medium">Classes</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Class name
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Teacher assignment
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Student roster
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Section/period
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-medium">Guardians</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Name
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Email
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> Student link
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <X className="w-4 h-4" /> Phone (not in Google)
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <X className="w-4 h-4" /> Relationship type
                    </li>
                  </ul>
                  <p className="text-xs text-yellow-600 mt-2 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Requires Guardian feature enabled in Google Admin
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Data You'll Need to Add Manually</h4>
                <p className="text-sm text-yellow-700">
                  After syncing from Google, you'll need to add these via CSV import or manual entry:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="yellow" size="sm">Dismissal Type</Badge>
                  <Badge variant="yellow" size="sm">Bus #</Badge>
                  <Badge variant="yellow" size="sm">Parent Phone Numbers</Badge>
                  <Badge variant="yellow" size="sm">Home Address</Badge>
                  <Badge variant="yellow" size="sm">Authorized Pickups</Badge>
                  <Badge variant="yellow" size="sm">Custody Alerts</Badge>
                </div>
              </div>
            </Card>

            {/* Recent Sync Activity */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Sync Activity</h2>
              <div className="space-y-3">
                {[
                  { time: syncStats.lastSync, type: 'Auto Sync', added: 2, updated: 15, removed: 0, status: 'success' },
                  { time: new Date(Date.now() - 86400000), type: 'Manual Sync', added: 0, updated: 8, removed: 1, status: 'success' },
                  { time: new Date(Date.now() - 172800000), type: 'Initial Import', added: 487, updated: 0, removed: 0, status: 'success' },
                ].map((sync, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{sync.type}</p>
                        <p className="text-sm text-gray-500">
                          {sync.time.toLocaleDateString()} at {sync.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-green-600">+{sync.added}</span>
                      {' / '}
                      <span className="text-blue-600">~{sync.updated}</span>
                      {' / '}
                      <span className="text-red-600">-{sync.removed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Google Classroom Tab */}
        {activeTab === 'classroom' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Google Classroom Integration</h2>
                  <p className="text-sm text-gray-500">Import classes and rosters from Google Classroom</p>
                </div>
                <Badge variant={settings.classroomSync ? 'green' : 'default'}>
                  {settings.classroomSync ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Imported Classes</h3>
                <div className="border rounded-lg divide-y">
                  {[
                    { name: 'Mrs. Johnson - Kindergarten', students: 22, teacher: 'Mrs. Johnson', period: 'Homeroom' },
                    { name: 'Mr. Roberts - Grade 3', students: 24, teacher: 'Mr. Roberts', period: 'Homeroom' },
                    { name: 'Mrs. Davis - Grade 2', students: 21, teacher: 'Mrs. Davis', period: 'Homeroom' },
                    { name: 'Mrs. Clark - Grade 5', students: 25, teacher: 'Mrs. Clark', period: 'Homeroom' },
                    { name: 'Mr. Adams - Grade 4', students: 23, teacher: 'Mr. Adams', period: 'Homeroom' },
                  ].map((cls, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-gray-500">{cls.students} students • {cls.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="green" size="sm">
                          <Check className="w-3 h-3 mr-1" />
                          Synced
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Homeroom Detection</h4>
                <p className="text-sm text-blue-700">
                  GoPilot automatically detects homeroom classes based on class naming patterns. 
                  Only homeroom classes are used for dismissal assignments. You can manually 
                  designate homerooms if the automatic detection doesn't match your setup.
                </p>
              </div>
            </Card>

            {/* Guardian Summaries */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Guardian Summaries</h2>
                  <p className="text-sm text-gray-500">Parent/guardian emails from Google Classroom</p>
                </div>
                <Badge variant={settings.guardianSync ? 'green' : 'yellow'}>
                  {settings.guardianSync ? 'Enabled' : 'Requires Admin Setup'}
                </Badge>
              </div>

              {settings.guardianSync ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">Guardian sync is active</p>
                      <p className="text-sm text-green-600">412 guardians imported from Google Classroom</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Guardian emails are automatically linked to student accounts. Parents can use these 
                    emails to sign in to the GoPilot parent app via Google SSO.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Guardian Summaries not enabled</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your Google Workspace admin needs to enable Guardian Summaries in Google Classroom 
                        before we can import parent/guardian information.
                      </p>
                      <Button variant="secondary" size="sm" className="mt-3">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Setup Guide
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* SSO Tab */}
        {activeTab === 'sso' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Google Single Sign-On</h2>
                  <p className="text-sm text-gray-500">Let parents and staff sign in with their Google accounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.ssoEnabled}
                    onChange={() => setSettings(prev => ({ ...prev, ssoEnabled: !prev.ssoEnabled }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Parent SSO */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Parent Sign-In</h3>
                      <p className="text-sm text-gray-500">For the GoPilot parent app</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">How it works:</p>
                      <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                        <li>Parent opens GoPilot app</li>
                        <li>Taps "Sign in with Google"</li>
                        <li>Signs in with their email</li>
                        <li>If email matches a guardian in system, auto-linked</li>
                        <li>If not, manual student linking required</li>
                      </ol>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Parents using Google SSO</span>
                      <span className="font-medium">312 / 412 (76%)</span>
                    </div>
                  </div>
                </div>

                {/* Staff SSO */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Staff Sign-In</h3>
                      <p className="text-sm text-gray-500">For teachers and admins</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">How it works:</p>
                      <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                        <li>Staff goes to GoPilot dashboard</li>
                        <li>Clicks "Sign in with Google"</li>
                        <li>Signs in with school Google account</li>
                        <li>Role auto-assigned based on Google Admin groups</li>
                      </ol>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Staff using Google SSO</span>
                      <span className="font-medium">32 / 32 (100%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain Restriction */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Domain Restrictions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Staff domain</p>
                      <p className="text-sm text-gray-500">Only allow staff sign-in from your school domain</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-white px-2 py-1 rounded border">@lincolnelementary.edu</code>
                      <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Parent domain</p>
                      <p className="text-sm text-gray-500">Allow any Google account for parents</p>
                    </div>
                    <Badge variant="blue" size="sm">Any domain</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* SSO Preview */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Sign-In Button Preview</h2>
              <div className="flex gap-4">
                <div className="flex-1 p-6 border rounded-lg text-center">
                  <p className="text-sm text-gray-500 mb-4">Parent App</p>
                  <Button variant="google" size="lg" className="w-full max-w-xs">
                    <GoogleLogo className="w-5 h-5 mr-3" />
                    Sign in with Google
                  </Button>
                </div>
                <div className="flex-1 p-6 border rounded-lg text-center">
                  <p className="text-sm text-gray-500 mb-4">Staff Dashboard</p>
                  <Button variant="google" size="lg" className="w-full max-w-xs">
                    <GoogleLogo className="w-5 h-5 mr-3" />
                    Sign in with Google
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">Sync Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Automatic Sync</p>
                    <p className="text-sm text-gray-500">Automatically sync data from Google on a schedule</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoSync}
                    onChange={() => setSettings(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                    className="w-5 h-5 rounded"
                  />
                </label>

                {settings.autoSync && (
                  <div className="ml-4 p-4 border-l-2 border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                    <select 
                      value={settings.syncFrequency}
                      onChange={(e) => setSettings(prev => ({ ...prev, syncFrequency: e.target.value }))}
                      className="w-full max-w-xs p-2 border rounded-lg"
                    >
                      <option value="hourly">Every hour</option>
                      <option value="daily">Daily (6:00 AM)</option>
                      <option value="weekly">Weekly (Sunday 6:00 AM)</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Sync Google Classroom</p>
                    <p className="text-sm text-gray-500">Import classes and student rosters</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.classroomSync}
                    onChange={() => setSettings(prev => ({ ...prev, classroomSync: !prev.classroomSync }))}
                    className="w-5 h-5 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Sync Guardian Summaries</p>
                    <p className="text-sm text-gray-500">Import parent/guardian email addresses</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.guardianSync}
                    onChange={() => setSettings(prev => ({ ...prev, guardianSync: !prev.guardianSync }))}
                    className="w-5 h-5 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Sync Admin Directory</p>
                    <p className="text-sm text-gray-500">Import full user list from Google Admin Console</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.directorySync}
                    onChange={() => setSettings(prev => ({ ...prev, directorySync: !prev.directorySync }))}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Grade Mapping</h2>
              <p className="text-sm text-gray-500 mb-4">
                Map Google Workspace Organizational Units to grade levels in GoPilot
              </p>
              
              <div className="space-y-2">
                {[
                  { ou: '/Students/Kindergarten', grade: 'K' },
                  { ou: '/Students/Grade 1', grade: '1' },
                  { ou: '/Students/Grade 2', grade: '2' },
                  { ou: '/Students/Grade 3', grade: '3' },
                  { ou: '/Students/Grade 4', grade: '4' },
                  { ou: '/Students/Grade 5', grade: '5' },
                ].map((mapping, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm bg-white px-2 py-1 rounded border flex-1">{mapping.ou}</code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="blue">Grade {mapping.grade}</Badge>
                    <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
              
              <Button variant="secondary" size="sm" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Mapping
              </Button>
            </Card>

            <Card className="p-6 border-red-200">
              <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Disconnect Google Workspace</p>
                  <p className="text-sm text-red-600">This will stop all syncing. Student data will remain in GoPilot.</p>
                </div>
                <Button variant="danger">
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
