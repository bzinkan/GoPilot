import React, { useState } from 'react';

// Pages
import GoPilotMarketing from './pages/GoPilotMarketing';
import SchoolSetupWizard from './pages/SchoolSetupWizard';
import ParentOnboarding from './pages/ParentOnboarding';
import ParentApp from './pages/ParentApp';
import TeacherView from './pages/TeacherView';
import DismissalDashboard from './pages/DismissalDashboard';
import GoPilot from './pages/GoPilot';

// For demo purposes - switch between views
const VIEWS = {
  marketing: GoPilotMarketing,
  setup: SchoolSetupWizard,
  parentOnboarding: ParentOnboarding,
  parentApp: ParentApp,
  teacher: TeacherView,
  dashboard: DismissalDashboard,
  prototype: GoPilot,
};

function App() {
  const [currentView, setCurrentView] = useState('marketing');
  const CurrentComponent = VIEWS[currentView];

  return (
    <div className="min-h-screen">
      {/* Demo Navigation - Remove in production */}
      <div className="fixed bottom-4 right-4 z-[100] bg-white rounded-lg shadow-xl border p-2">
        <p className="text-xs text-gray-500 mb-2 px-2">Demo Navigation:</p>
        <div className="flex flex-wrap gap-1">
          {Object.keys(VIEWS).map(view => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-3 py-1 text-xs rounded ${
                currentView === view 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Current View */}
      <CurrentComponent />
    </div>
  );
}

export default App;
