import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import UserDashboard from './pages/UserDashboard';
import Profile from './pages/Profile';
import WatermarkPDF from './pages/WatermarkPDF';
import ProtectPDF from './pages/ProtectPDF';
import SplitPDF from './pages/SplitPDF';
import MergePDF from './pages/MergePDF';
import AuthCallback from './pages/AuthCallback';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Tools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watermark-pdf"
          element={
            <ProtectedRoute>
              <WatermarkPDF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/protect-pdf"
          element={
            <ProtectedRoute>
              <ProtectPDF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/split-pdf"
          element={
            <ProtectedRoute>
              <SplitPDF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merge-pdf"
          element={
            <ProtectedRoute>
              <MergePDF />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

