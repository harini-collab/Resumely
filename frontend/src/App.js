import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import JobMatch from './pages/JobMatch';
import Comparator from './pages/Comparator';
import Progress from './pages/Progress';
import CareerMatch from './pages/CareerMatch';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/job-match" element={<JobMatch />} />
        <Route path="/comparator" element={<Comparator />} />
        <Route path="/progress"     element={<Progress />} />
        <Route path="/career-match" element={<CareerMatch />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f140f',
              color: '#e8ede8',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              fontSize: '0.855rem',
              fontFamily: 'Geist, Inter, system-ui, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            },
            success: { iconTheme: { primary: '#52b85a', secondary: '#0f140f' } },
            error: { iconTheme: { primary: '#c0392b', secondary: '#0f140f' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
