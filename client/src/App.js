import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import GoPilotMarketing from './pages/GoPilotMarketing';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import SchoolSetupWizard from './pages/SchoolSetupWizard';
import ParentOnboarding from './pages/ParentOnboarding';
import ParentApp from './pages/ParentApp';
import TeacherView from './pages/TeacherView';
import DismissalDashboard from './pages/DismissalDashboard';
import LinkChild from './pages/LinkChild';
import JoinSchool from './pages/JoinSchool';
import RegisterParent from './pages/RegisterParent';

// Super Admin Pages
import SuperAdminLayout from './pages/super-admin/SuperAdminLayout';
import SchoolsList from './pages/super-admin/SchoolsList';
import CreateSchool from './pages/super-admin/CreateSchool';
import SchoolDetail from './pages/super-admin/SchoolDetail';
import TrialRequests from './pages/super-admin/TrialRequests';

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_super_admin) return <Navigate to="/home" replace />;
  return children;
}

function RoleRouter() {
  const { user } = useAuth();
  const { currentRole } = useSchool();

  // Super admin goes to super admin dashboard
  if (user?.is_super_admin) return <Navigate to="/super-admin/schools" replace />;

  if (!currentRole) return <SchoolSetupWizard />;

  switch (currentRole) {
    case 'admin':
    case 'office_staff':
      return <Navigate to="/dashboard" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'parent':
      return <Navigate to="/parent" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GoPilotMarketing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/parent" element={<RegisterParent />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/home" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute><SchoolSetupWizard /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><ParentOnboarding /></ProtectedRoute>} />
      <Route path="/parent" element={<ProtectedRoute><ParentApp /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute><TeacherView /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DismissalDashboard /></ProtectedRoute>} />
      <Route path="/link" element={<ProtectedRoute><LinkChild /></ProtectedRoute>} />
      <Route path="/join/:schoolSlug" element={<JoinSchool />} />

      {/* Super Admin */}
      <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
        <Route index element={<Navigate to="schools" replace />} />
        <Route path="schools" element={<SchoolsList />} />
        <Route path="schools/new" element={<CreateSchool />} />
        <Route path="schools/:id" element={<SchoolDetail />} />
        <Route path="trial-requests" element={<TrialRequests />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <SchoolProvider>
            <AppRoutes />
          </SchoolProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
