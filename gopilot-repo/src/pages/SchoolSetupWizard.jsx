import React, { useState, useRef } from 'react';
import { 
  Upload, Check, X, Users, School, Bus, Car, PersonStanding, 
  Plus, Trash2, Edit, ChevronRight, ChevronDown, Search,
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, GripVertical,
  Mail, Download, RefreshCw, Settings, Eye, UserPlus, Clock
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

// Main Setup Wizard Component
export default function SchoolSetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [schoolName, setSchoolName] = useState('Lincoln Elementary');
  const [students, setStudents] = useState([]);
  const [homerooms, setHomerooms] = useState([]);
  const [importMethod, setImportMethod] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const steps = [
    { num: 1, title: 'Import Students', icon: Users },
    { num: 2, title: 'Create Homerooms', icon: School },
    { num: 3, title: 'Assign Students', icon: UserPlus },
    { num: 4, title: 'Set Dismissal', icon: Car },
    { num: 5, title: 'Review & Launch', icon: CheckCircle2 },
  ];

  // Simulate Google import
  const handleGoogleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const mockStudents = [
        { id: 1, firstName: 'Emma', lastName: 'Thompson', email: 'emma.t@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 2, firstName: 'Jake', lastName: 'Thompson', email: 'jake.t@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 3, firstName: 'Sophia', lastName: 'Martinez', email: 'sophia.m@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 4, firstName: 'Aiden', lastName: 'Chen', email: 'aiden.c@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 5, firstName: 'Mia', lastName: 'Williams', email: 'mia.w@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 6, firstName: 'Noah', lastName: 'Davis', email: 'noah.d@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 7, firstName: 'Olivia', lastName: 'Brown', email: 'olivia.b@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 8, firstName: 'Liam', lastName: 'Wilson', email: 'liam.w@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 9, firstName: 'Ava', lastName: 'Garcia', email: 'ava.g@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 10, firstName: 'Lucas', lastName: 'Miller', email: 'lucas.m@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 11, firstName: 'Isabella', lastName: 'Anderson', email: 'isabella.a@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
        { id: 12, firstName: 'Mason', lastName: 'Taylor', email: 'mason.t@lincoln.edu', grade: '', homeroom: null, dismissalType: 'car', busRoute: '' },
      ];
      setStudents(mockStudents);
      setImportMethod('google');
      setIsImporting(false);
    }, 2000);
  };

  // Handle CSV upload
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsImporting(true);
      setTimeout(() => {
        // Simulate parsing CSV
        const mockStudents = [
          { id: 1, firstName: 'Emma', lastName: 'Thompson', email: 'emma.t@lincoln.edu', grade: 'K', homeroom: null, dismissalType: 'car', busRoute: '' },
          { id: 2, firstName: 'Jake', lastName: 'Thompson', email: 'jake.t@lincoln.edu', grade: '3', homeroom: null, dismissalType: 'car', busRoute: '' },
          { id: 3, firstName: 'Sophia', lastName: 'Martinez', email: 'sophia.m@lincoln.edu', grade: '2', homeroom: null, dismissalType: 'bus', busRoute: '42' },
          { id: 4, firstName: 'Aiden', lastName: 'Chen', email: 'aiden.c@lincoln.edu', grade: '4', homeroom: null, dismissalType: 'walker', busRoute: '' },
          { id: 5, firstName: 'Mia', lastName: 'Williams', email: 'mia.w@lincoln.edu', grade: '1', homeroom: null, dismissalType: 'car', busRoute: '' },
          { id: 6, firstName: 'Noah', lastName: 'Davis', email: 'noah.d@lincoln.edu', grade: '5', homeroom: null, dismissalType: 'bus', busRoute: '15' },
        ];
        setStudents(mockStudents);
        setImportMethod('csv');
        setIsImporting(false);
      }, 1500);
    }
  };

  // Add homeroom
  const addHomeroom = (name, teacher, grade) => {
    const newHomeroom = {
      id: Date.now(),
      name,
      teacher,
      grade,
      students: []
    };
    setHomerooms([...homerooms, newHomeroom]);
  };

  // Assign student to homeroom
  const assignStudentToHomeroom = (studentId, homeroomId) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, homeroom: homeroomId } : s
    ));
  };

  // Update student dismissal
  const updateStudentDismissal = (studentId, field, value) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, [field]: value } : s
    ));
  };

  // Bulk update dismissal type
  const bulkSetDismissal = (type) => {
    setStudents(students.map(s => ({ ...s, dismissalType: type })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">GoPilot Setup</h1>
                <p className="text-sm text-gray-500">{schoolName}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Save & Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.num}>
                <button
                  onClick={() => step.num <= currentStep && setCurrentStep(step.num)}
                  className={`flex items-center gap-2 ${step.num <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.num < currentStep ? 'bg-green-500 text-white' :
                    step.num === currentStep ? 'bg-indigo-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step.num < currentStep ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${
                    step.num === currentStep ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step.num < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Step 1: Import Students */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Your Students</h2>
              <p className="text-gray-500 mt-1">Choose how you want to add students to GoPilot</p>
            </div>

            {students.length === 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Google Import */}
                <Card className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <GoogleLogo className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Import from Google Workspace</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Automatically import all student accounts from your Google Workspace for Education
                    </p>
                    <Button 
                      variant="google" 
                      size="lg" 
                      className="w-full"
                      onClick={handleGoogleImport}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <GoogleLogo className="w-5 h-5 mr-2" />
                          Sign in with Google
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* CSV Import */}
                <Card className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Import students from a spreadsheet with name, email, and optionally grade
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleCSVUpload}
                      accept=".csv,.xlsx"
                      className="hidden"
                    />
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Select File
                    </Button>
                    <button className="text-sm text-indigo-600 hover:underline mt-3 block mx-auto">
                      Download CSV template
                    </button>
                  </div>
                </Card>
              </div>
            ) : (
              /* Students Imported */
              <Card>
                <div className="p-4 border-b bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">
                          {students.length} students imported
                        </p>
                        <p className="text-sm text-green-600">
                          via {importMethod === 'google' ? 'Google Workspace' : 'CSV upload'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStudents([])}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Re-import
                    </Button>
                  </div>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {students.slice(0, 12).map(student => (
                      <div key={student.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <span>{student.firstName} {student.lastName}</span>
                      </div>
                    ))}
                    {students.length > 12 && (
                      <div className="flex items-center justify-center p-2 text-sm text-gray-500">
                        +{students.length - 12} more
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-end">
              <Button 
                variant="primary" 
                size="lg"
                disabled={students.length === 0}
                onClick={() => setCurrentStep(2)}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Create Homerooms */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Homerooms</h2>
              <p className="text-gray-500 mt-1">Add the homeroom classes for your school. Students will be assigned to these in the next step.</p>
            </div>

            <HomeroomCreator 
              homerooms={homerooms} 
              onAdd={addHomeroom}
              onRemove={(id) => setHomerooms(homerooms.filter(h => h.id !== id))}
            />

            <div className="flex justify-between">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                variant="primary" 
                size="lg"
                disabled={homerooms.length === 0}
                onClick={() => setCurrentStep(3)}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Assign Students to Homerooms */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assign Students to Homerooms</h2>
              <p className="text-gray-500 mt-1">Drag students to their homeroom or use the dropdown to assign them.</p>
            </div>

            <StudentAssignment 
              students={students}
              homerooms={homerooms}
              onAssign={assignStudentToHomeroom}
            />

            <div className="flex justify-between">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setCurrentStep(4)}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Set Dismissal Types */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set Dismissal Types</h2>
              <p className="text-gray-500 mt-1">Choose how each student goes home. You can always change this later.</p>
            </div>

            <DismissalConfiguration
              students={students}
              homerooms={homerooms}
              onUpdate={updateStudentDismissal}
              onBulkSet={bulkSetDismissal}
            />

            <div className="flex justify-between">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setCurrentStep(5)}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Launch */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review & Launch</h2>
              <p className="text-gray-500 mt-1">You're almost ready! Review your setup and launch GoPilot.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Students
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total students</span>
                    <span className="font-semibold">{students.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned to homerooms</span>
                    <span className="font-semibold">{students.filter(s => s.homeroom).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unassigned</span>
                    <span className={`font-semibold ${students.filter(s => !s.homeroom).length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {students.filter(s => !s.homeroom).length}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-600" />
                  Homerooms
                </h3>
                <div className="space-y-2">
                  {homerooms.map(hr => (
                    <div key={hr.id} className="flex justify-between text-sm">
                      <span>{hr.teacher} - {hr.grade}</span>
                      <Badge variant="blue" size="sm">
                        {students.filter(s => s.homeroom === hr.id).length} students
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-600" />
                  Dismissal Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Car className="w-4 h-4" /> Car Riders
                    </span>
                    <span className="font-semibold">{students.filter(s => s.dismissalType === 'car').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Bus className="w-4 h-4" /> Bus Riders
                    </span>
                    <span className="font-semibold">{students.filter(s => s.dismissalType === 'bus').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2">
                      <PersonStanding className="w-4 h-4" /> Walkers
                    </span>
                    <span className="font-semibold">{students.filter(s => s.dismissalType === 'walker').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> After School
                    </span>
                    <span className="font-semibold">{students.filter(s => s.dismissalType === 'afterschool').length}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Next Steps
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Send parent invitation emails</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Train staff on the dismissal dashboard</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Run a test dismissal</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-indigo-50 border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-indigo-900">Ready to Launch!</h3>
                  <p className="text-sm text-indigo-700">Your school is configured and ready to start using GoPilot.</p>
                </div>
                <Button variant="primary" size="lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Launch GoPilot
                </Button>
              </div>
            </Card>

            <div className="flex justify-start">
              <Button variant="secondary" size="lg" onClick={() => setCurrentStep(4)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Homeroom Creator Component
function HomeroomCreator({ homerooms, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [teacher, setTeacher] = useState('');
  const [grade, setGrade] = useState('K');

  const grades = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teacher.trim()) {
      onAdd(`${teacher} - Grade ${grade}`, teacher, grade);
      setTeacher('');
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Buttons */}
      <Card className="p-4">
        <p className="text-sm text-gray-600 mb-3">Quick add common grade levels:</p>
        <div className="flex flex-wrap gap-2">
          {grades.map(g => (
            <Button
              key={g}
              variant="secondary"
              size="sm"
              onClick={() => {
                setGrade(g);
                setShowForm(true);
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Grade {g}
            </Button>
          ))}
        </div>
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
                <input
                  type="text"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder="Mrs. Johnson"
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {grades.map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Homeroom
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Homeroom List */}
      {homerooms.length > 0 && (
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Homerooms ({homerooms.length})</h3>
          </div>
          <div className="divide-y">
            {homerooms.map(hr => (
              <div key={hr.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">{hr.teacher}</p>
                    <p className="text-sm text-gray-500">Grade {hr.grade}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(hr.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {homerooms.length === 0 && !showForm && (
        <Card className="p-8 text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No homerooms created yet</p>
          <p className="text-sm text-gray-400">Click a grade button above to add your first homeroom</p>
        </Card>
      )}
    </div>
  );
}

// Student Assignment Component
function StudentAssignment({ students, homerooms, onAssign, onBulkAssign }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHomeroom, setExpandedHomeroom] = useState(null);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const fileInputRef = useRef(null);

  const unassignedStudents = students.filter(s => !s.homeroom && 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate CSV parsing
      setTimeout(() => {
        setCsvPreview({
          fileName: file.name,
          rows: [
            { email: 'emma.t@lincoln.edu', homeroom: 'Mrs. Johnson', status: 'match' },
            { email: 'jake.t@lincoln.edu', homeroom: 'Mr. Roberts', status: 'match' },
            { email: 'sophia.m@lincoln.edu', homeroom: 'Mrs. Davis', status: 'match' },
            { email: 'unknown@lincoln.edu', homeroom: 'Mrs. Johnson', status: 'not_found' },
          ],
          matched: 3,
          notFound: 1
        });
      }, 500);
    }
  };

  const applyCSVAssignments = () => {
    // In real implementation, this would process the CSV and call onBulkAssign
    if (csvPreview) {
      // Simulate bulk assignment
      const assignments = csvPreview.rows
        .filter(r => r.status === 'match')
        .map(r => {
          const student = students.find(s => s.email === r.email);
          const homeroom = homerooms.find(h => h.teacher === r.homeroom);
          return student && homeroom ? { studentId: student.id, homeroomId: homeroom.id } : null;
        })
        .filter(Boolean);
      
      assignments.forEach(a => onAssign(a.studentId, a.homeroomId));
      setCsvPreview(null);
      setShowCSVUpload(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk CSV Upload Option */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Bulk Assignment</p>
            <p className="text-sm text-gray-500">Upload a CSV to assign multiple students at once</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowCSVUpload(!showCSVUpload)}>
            <Upload className="w-4 h-4 mr-2" />
            {showCSVUpload ? 'Hide' : 'Upload CSV'}
          </Button>
        </div>
        
        {showCSVUpload && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {!csvPreview ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  CSV format: <code className="bg-white px-2 py-1 rounded text-xs">student_email, homeroom_teacher</code>
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  accept=".csv"
                  className="hidden"
                />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Select CSV File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{csvPreview.fileName}</p>
                  <Badge variant={csvPreview.notFound > 0 ? 'yellow' : 'green'}>
                    {csvPreview.matched} matched, {csvPreview.notFound} not found
                  </Badge>
                </div>
                <div className="max-h-32 overflow-y-auto bg-white rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Homeroom</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.map((row, i) => (
                        <tr key={i} className={row.status === 'not_found' ? 'bg-yellow-50' : ''}>
                          <td className="p-2">{row.email}</td>
                          <td className="p-2">{row.homeroom}</td>
                          <td className="p-2">
                            {row.status === 'match' ? (
                              <Badge variant="green" size="sm">Match</Badge>
                            ) : (
                              <Badge variant="yellow" size="sm">Not Found</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={applyCSVAssignments}>
                    Apply {csvPreview.matched} Assignments
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCsvPreview(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
      {/* Unassigned Students */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Unassigned Students ({unassignedStudents.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {unassignedStudents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">All students assigned!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unassignedStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <span className="text-sm">{student.firstName} {student.lastName}</span>
                  </div>
                  <select
                    onChange={(e) => onAssign(student.id, parseInt(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                    defaultValue=""
                  >
                    <option value="" disabled>Assign to...</option>
                    {homerooms.map(hr => (
                      <option key={hr.id} value={hr.id}>{hr.teacher} (Gr {hr.grade})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Homerooms with Students */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold">Homerooms</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {homerooms.map(hr => {
            const homeroomStudents = students.filter(s => s.homeroom === hr.id);
            const isExpanded = expandedHomeroom === hr.id;
            return (
              <div key={hr.id}>
                <button
                  onClick={() => setExpandedHomeroom(isExpanded ? null : hr.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <School className="w-5 h-5 text-indigo-600" />
                    <div className="text-left">
                      <p className="font-medium">{hr.teacher}</p>
                      <p className="text-sm text-gray-500">Grade {hr.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="blue" size="sm">{homeroomStudents.length} students</Badge>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      {homeroomStudents.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">No students assigned</p>
                      ) : (
                        homeroomStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between text-sm">
                            <span>{student.firstName} {student.lastName}</span>
                            <button
                              onClick={() => onAssign(student.id, null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      </div>
    </div>
  );
}

// Dismissal Configuration Component
function DismissalConfiguration({ students, homerooms, onUpdate, onBulkSet }) {
  const [filterHomeroom, setFilterHomeroom] = useState('all');
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const fileInputRef = useRef(null);

  const dismissalTypes = [
    { id: 'car', label: 'Car', icon: Car, color: 'blue' },
    { id: 'bus', label: 'Bus', icon: Bus, color: 'yellow' },
    { id: 'walker', label: 'Walker', icon: PersonStanding, color: 'green' },
    { id: 'afterschool', label: 'After School', icon: Clock, color: 'purple' },
  ];

  const filteredStudents = students.filter(s => 
    filterHomeroom === 'all' || s.homeroom === parseInt(filterHomeroom)
  );

  const busRoutes = [...new Set(students.filter(s => s.busRoute).map(s => s.busRoute))];

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTimeout(() => {
        setCsvPreview({
          fileName: file.name,
          rows: [
            { email: 'emma.t@lincoln.edu', dismissal: 'car', bus: '', status: 'match' },
            { email: 'jake.t@lincoln.edu', dismissal: 'bus', bus: '42', status: 'match' },
            { email: 'sophia.m@lincoln.edu', dismissal: 'walker', bus: '', status: 'match' },
            { email: 'aiden.c@lincoln.edu', dismissal: 'bus', bus: '15', status: 'match' },
          ],
          count: 4
        });
      }, 500);
    }
  };

  const applyCSVDismissal = () => {
    if (csvPreview) {
      csvPreview.rows.forEach(row => {
        const student = students.find(s => s.email === row.email);
        if (student) {
          onUpdate(student.id, 'dismissalType', row.dismissal);
          if (row.bus) onUpdate(student.id, 'busRoute', row.bus);
        }
      });
      setCsvPreview(null);
      setShowCSVUpload(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">Bulk options:</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCSVUpload(!showCSVUpload)}>
              <Upload className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowBulkOptions(!showBulkOptions)}>
              {showBulkOptions ? 'Hide' : 'Set All'}
            </Button>
          </div>
        </div>
        
        {showCSVUpload && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            {!csvPreview ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  CSV format: <code className="bg-white px-2 py-1 rounded text-xs">student_email, dismissal_type, bus_route</code>
                </p>
                <p className="text-xs text-gray-500 mb-3">Dismissal types: car, bus, walker, afterschool</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  accept=".csv"
                  className="hidden"
                />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Select CSV File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{csvPreview.fileName}</p>
                  <Badge variant="green">{csvPreview.count} students</Badge>
                </div>
                <div className="max-h-32 overflow-y-auto bg-white rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Dismissal</th>
                        <th className="text-left p-2">Bus Route</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.map((row, i) => (
                        <tr key={i}>
                          <td className="p-2">{row.email}</td>
                          <td className="p-2 capitalize">{row.dismissal}</td>
                          <td className="p-2">{row.bus || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={applyCSVDismissal}>
                    Apply to {csvPreview.count} Students
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCsvPreview(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showBulkOptions && (
          <div className="flex flex-wrap gap-2">
            {dismissalTypes.map(type => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => onBulkSet(type.id)}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  Set all to {type.label}
                </Button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-600">Filter by homeroom:</label>
        <select
          value={filterHomeroom}
          onChange={(e) => setFilterHomeroom(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">All homerooms</option>
          {homerooms.map(hr => (
            <option key={hr.id} value={hr.id}>{hr.teacher} (Gr {hr.grade})</option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <Card>
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Homeroom</div>
            <div className="col-span-3">Dismissal Type</div>
            <div className="col-span-2">Bus Route</div>
          </div>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {filteredStudents.map(student => {
            const homeroom = homerooms.find(h => h.id === student.homeroom);
            return (
              <div key={student.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                <div className="col-span-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <span className="text-sm font-medium">{student.firstName} {student.lastName}</span>
                </div>
                <div className="col-span-3 text-sm text-gray-500">
                  {homeroom ? `${homeroom.teacher}` : <span className="text-yellow-600">Unassigned</span>}
                </div>
                <div className="col-span-3">
                  <select
                    value={student.dismissalType}
                    onChange={(e) => onUpdate(student.id, 'dismissalType', e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    {dismissalTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  {student.dismissalType === 'bus' ? (
                    <input
                      type="text"
                      value={student.busRoute}
                      onChange={(e) => onUpdate(student.id, 'busRoute', e.target.value)}
                      placeholder="Route #"
                      className="w-full border rounded px-2 py-1 text-sm"
                      list="busRoutes"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <datalist id="busRoutes">
          {busRoutes.map(route => (
            <option key={route} value={route} />
          ))}
        </datalist>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {dismissalTypes.map(type => {
          const Icon = type.icon;
          const count = students.filter(s => s.dismissalType === type.id).length;
          return (
            <Card key={type.id} className="p-4 text-center">
              <Icon className={`w-6 h-6 mx-auto mb-2 text-${type.color}-500`} />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-500">{type.label}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
